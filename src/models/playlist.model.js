import mongoose, { Types } from "mongoose"

const playlistSchema =  new mongoose.Schema(
  {
    name :{
      type : String,
      require : true
    },
    description :{
      type : String,
      require : true
    },
    video : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
      },
    ],
    owner :  {
      type : mongoose.Schema.Types.ObjectId,
      ref : "User"
    }
  },
  {
    timestamps:true
  }
)


export const Plyalist = mongoose.model("Plyalist", playlistSchema)