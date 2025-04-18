import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.modul.js"
import {uploadOnCloudinar} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"


const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken =user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something Went to Wrong while Generating Access and Refresh Token !!")
    }
}


const registerUser = asyncHandler (async (req, res) => {
    
    const {username, email, fullName, password } = req.body

    // console.log("username", username)
    // console.log("email", email)
    // console.log("fullName", fullName)
    // console.log("password", password)
    

    if(
        [username, email, fullName, password].some((field) => field?.trim() === "")
            // first all value field store in array and to appay some() method on array for each value field for check value field have? 
            // if value field have then apply trim() method from remove extra spaces(begining and end) 
            // then to apply trim() method then if value field is empty then return throw error field is empty 
    ){
        throw new ApiError(400, "All Fields are Required !!")
    }

    const existedUser = await User.findOne(
        {
            $or : [{username}, {email}]
        }
    )
   
    if (existedUser) {
        // throw new ApiError(409, "Username already exists!");
    
        if (existedUser.username === username) {
          throw new ApiError(409, "Username already exists!");
        } else {
          throw new ApiError(409, "Email already exists!");
        }
      }

    const avatarLocalPath = req.files?.avatar[0]?.path
        // req.body is gives express
        // req.files is give middleware and we get all details throgh multer 
        // req.files check if there an files if have then check have avatar file 
        // avatar[] have man properties like name, size, value, date, etc
        // we get avatar first property avatar[0] becouse it have path object  
        // if avatar file have then get it first value 
        // path have file orinal path with provided by cloudinary
        // after get first value then get its path

    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar File is Required ! ")
            // missingb requied fields 
            // invalid queary parameters
    }

    const avatar = await uploadOnCloudinar(avatarLocalPath)
    const coverImage = await uploadOnCloudinar(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar File is Required ! ")
    }

    const user = await User.create(
        {
            username : username.toLowerCase(),
            email,
            fullName,
            password,
            avatar : avatar.url,
            coverImage : coverImage?.url || ""
        }
    )

    const createUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createUser){
        throw new ApiError(500, "Something went to wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User Registered Successfully. ")

            // 201 The request has succeeded and a new resource has been created.
            // 200 The request was successful, and the server responded with the requested data."
    )
})


const loginUser = asyncHandler(async (req,res) => {


    const {username, email, password} =  req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required !!")
    }

    const user = await User.findOne(
        {
            $or : [{username}, {email}]
        }
    )

    if(!user){
        throw new ApiError(404, "user does not exists !")
    }

    const isPasswordValid =  await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user cradectials !")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
      );
    
      const options = {
        httpOnly: true,
        secure: true,
      };
    
      return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
          new ApiResponse(
            200,
            {
              user: loggedInUser,
              accessToken,
              refreshToken,
            },
            "User logged In SuccessFully."
          )
        );

})


const logoutUser = asyncHandler (async (req,res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken  : 1
            }
        },
        {
            new : true
        }

    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res 
    .status(200)
    .cookie("accessToken", options)
    .cookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "user logout successfully. ")
    )
})


const refreshAccessToken = asyncHandler(async(req,res) => {
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError((401, "Unauthorized Request !"))
   }

   try {
    const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET 
    )
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){
         throw new ApiError(401, "Invalid Refresh Token !")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401, "Refresh Token is Expire !")
    }
 
    const options = {
         httpOnly : true,
         secure : true
    }
 
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
 
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("accessToken", newRefreshToken,options)
    .json(
         new ApiResponse(
             200, 
             {
                 accessToken, refreshToken : newRefreshToken, 
             },
             "Access Token Refreshed."
         )
    )
   } catch (error) {
        throw new ApiError(401, error?.message || " Invalid Refresh Token !")
   }

})


const changeCurrentPassword = asyncHandler(async(req,res) => {

    const  {oldPassword, newPassword} = req.body
    
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : true})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed SuccessFully."))
})


const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "user fetched successfully."
        )
    )
})


const updateAccouuntDetails = asyncHandler(async(req,res) => {

    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All Fields are Required!")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set : 
            {
                fullName : fullName,
                email : email

                // we can also write 
                    // fullName,
                    // email
            }
        },
        {
            new : true
        }
    ).select("-password ")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account Details Updated Successfully."
        )
    )
})


const updateUserAvatar = asyncHandler(async(req,res) => {

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing!")
    }

    const avatar =  await uploadOnCloudinar(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error While uploading on avatar!")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar Image Updated Successfully."
        )
    )
})


const updateUserCoverImage = asyncHandler(async(req,res) => {

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image file is missing!")
    }

    const coverImage =  await uploadOnCloudinar(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error While uploading on cover Image!")
    }

    const user = await User.findByIdAndDelete(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res 
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover Image Updated Successfully."
        )
    )
})


const getUserChannelProfile = asyncHandler(async(req,res) => {

        // In Express.js (a Node.js framework), when a client sends a request to a server with dynamic values in the URL, 
        // you can access those values using req.params.
        // params is short for parameters — specifically, route parameters in the URL.

        // Let's say you have this route in your backend:
        // app.get('/user/:id', (req, res) => {
        //     console.log(req.params);
        //   });

        //   Now, if a user visits this URL:
        //   http://localhost:5000/user/123

    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "username is missing!")
    }

    const channel = await User.aggregate(
        [
            {
                    // match (filter) fields from user models 
                    // match is like a SQL WHERE
                $match : {
                    username : username?.toLowerCase()
                }
            },
            {
                    // perfome a join between two fields 
                    // lookup s=is like a SQL JOIN
                $lookup : {
                    from : "subscriptions",         // Collection to join
                    localField : "_id",             // Field in orders
                    foreignField : "channel",       // Field in users
                    as : "subscribers"              // Output array field
                }
            },
            {
                $lookup: {
                    from : "subscriptions",
                    localField: "_id",
                    foreignField : "subscriber",
                    as : "subscribedTo"
                }
            },
            {
                    // Adds new fields or changes existing fields in documents. 
                    // This adds a new field fullName like "kaushik prajapati" to each document.
                    // In User model have many fields in this $addFields add this fields on User model
                $addFields : {
                    subscriberrsCount : {
                        $size : "$subscribers"  //  it is a field that's why se used $
                    },
                    channelSubscribedToCount : {
                        $size  : "$subscribedTo"    //  it is a field that's why se used $
                    },
                    isSubscribed : {
                        $cond: {
                            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                $project: {
                    username : 1,
                    email : 1,
                    fullName : 1,
                    avatar : 1,
                    coverImage : 1,
                    subscriberrsCount : 1,
                    channelSubscribedToCount : 1,
                    isSubscribed : 1
                }
            }
        ]
    )

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists!")
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel fetched successfully.")
    )
})


const getWatchHistoty = asyncHandler(async(req,res) => {
    const user = await User.aggregate(
        [
            {
                $match : {
                    _id : new mongoose.Types.ObjectId(String(req.user._id))
                    // _id : new mongoose.Types.ObjectId(req.user._id)
                        // cac write like this butin this ObjectId gives waring 
                        // Warning : he signature '(inputId: number): ObjectId' of 'mongoose.Types.ObjectId' is deprecated.ts(6387)
                        // bson.d.ts(1352, 8): The declaration was marked as deprecated here.
                        // means _id is number but mongoose stores only string.
                        // that's why i used String()
                }
            },
            {
                $lookup : {
                    from : "videos",
                    localField :"watchHistory",
                    foreignField: "_id",
                    as : "watchHistory",
                    
                    pipeline : [
                        {
                            $lookup : {
                                from : "users",
                                localField : "owner",
                                foreignField : String(req.user._id),
                                as : "owner",

                                pipeline : [
                                    {
                                        $project : {
                                            username : 1,
                                            fullName : 1,
                                            avatar : 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields : {
                                owner : {
                                    $first : "$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistoty,
            "watch history fetched successfully."
        )
    )
})


export  {
            registerUser,
            loginUser,
            logoutUser,
            refreshAccessToken,
            changeCurrentPassword,
            getCurrentUser,
            updateAccouuntDetails,
            updateUserAvatar,
            updateUserCoverImage,
            getUserChannelProfile,
            getWatchHistoty    
        }