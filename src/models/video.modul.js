import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"


const videoSchema = new mongoose.Schema(
    {
        videoFile: {
            type: String,     // we used cloudinary URL
            required: [true, "video is required to upload"],
        },
        thumbnail: {

            // The thumbnail field in your Mongoose schema is used to store the URL of a video thumbnail (preview image [backgraund image]).
            // means if we click for watching a video thare have defauild images is call thumbnail

            type: String,     // we used cloudinary URL
            required: [true, "Thumbnail is required to upload"],
        },
        title: {
            type: String,
            require: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type: Number,    //  / we used cloudinary URL to time of the video   ( cloudinary autoaticcaly gives time of duration )
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    },  
    {
        timestamps: true
    }
)


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema)