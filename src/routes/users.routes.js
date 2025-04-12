import {Router} from  "express"
import {    loginUser, 
            logoutUser, 
            registerUser,
            refreshAccessToken, 
            changeCurrentPassword, 
            getCurrentUser, 
            updateAccouuntDetails, 
            updateUserAvatar, 
            updateUserCoverImage, 
            getUserChannelProfile, 
            getWatchHistoty 
        } 
        from "../controllers/user.controller.js"
import {upload} from "../middleware/multer.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js"


const router = Router()

// http://localhost:8080/api/v1/users/register
router.route("/register").post(
    upload.fields(
        [
            {
                name : "avatar",
                maxCount: 1
            },
            {
                name : "coverImage",
                maxCount : 1
            }
        ]
    ),
    registerUser
)

router.route("/login").post(loginUser)

// Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/update-account").patch(verifyJWT,updateAccouuntDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT,getWatchHistoty)


export default router