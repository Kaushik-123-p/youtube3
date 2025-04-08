import {v2 as cloudinary} from "cloudinary"
import fs from "fs"



cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY , 
    api_secret: process.env.CLOUDINARY_API_SECRET
});



const uploadOnCloudinar = async (localFilePath) => {
    try {
        if(!localFilePath){
            return null
            // return "Clod can not find right path"
        }

        const response = await cloudinary.uploader.upload(localFilePath,{
            resourse_type : "auto",
            folder : "youtube3"
        })
        
        //  file uploaded successfully on cloudinary
        console.log("file is oploaded successfully on cloudinary ", response.url);
        return response
    
    } catch (error) {
        fs.unlinkSync(localFilePath)       // remove the loccaly saved file as the upload operation is failed
    }
}

export {uploadOnCloudinar}