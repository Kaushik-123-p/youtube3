import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.modul.js"
import {uploadOnCloudinar} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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

    const existedUser =  User.findOne(
        {
            $or : [{username}, {email}]
        }
    )
   
    if(existedUser){
        if(existedUser.username === username){
            throw new ApiError((409, "username already exists !!"))
        }
        else{
            throw new ApiError((409, "email already exists !!"))
        }
            // 409 is used for name exits or not 
            // mostly used check like username or email
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

    const coverImageLocalPath = req.files?.coverImage[0]?.path

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

export  {registerUser}