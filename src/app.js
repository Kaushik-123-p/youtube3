import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app =express()

app.use(cors(
    {
        origin : process.env.CORS_ORIGIN,   // allow all and any whare to come URL
        credentials : true
    }
))


app.use(express.json({limit:"16kb"}))       // when data come the form
app.use(express.urlencoded({extended:true, limit:"16kb"}))      // when data come to the URL
app.use(express.static("public"))       // to store static data like images , svg file , documants etc..
app.use(cookieParser())     // we can access and set usrs browers coookies  throgh server 


export {app}