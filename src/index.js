import dotenv from "dotenv"
import connectDB from "./db/index.js"

dotenv.config(
    {
        path: "./.env"
    }
)

const PORT = process.env.PORT || 8080

connectDB()
.then(() => {
    console.log(`Server Running at port ${PORT}`);
})
.catch((error) => {
    console.log("MongoDB Connection Failed !!", error);
})