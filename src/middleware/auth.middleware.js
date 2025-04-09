
import { User } from "../models/user.modul"
import { ApiError } from "../utils/ApiError"
import {asyncHandler} from "../utils/asyncHandler"
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler (async (req, _, next) => {

    try {
    
        // if don't have token
        const token =   req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401, "Unauuthorized Request !")
        }
    
        // if have token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET )
    
        const user = await User.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401, "Invalid Access Token !")
        }
    
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401, error.message || "invalid Access Token !")
    }
})


export {verifyJWT}