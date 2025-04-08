import dotenv from "dotenv"
import connectDB from "./db/index.js"
import  {app} from "./app.js"

dotenv.config(
    {
        path: "./.env"
    }
)

const PORT = process.env.PORT || 8080


// app.listen(PORT, "0.0.0.0", () => {
//     console.log(`✅ Server Running at port ${PORT}`);
// })  

connectDB()
.then(() => {
    app.listen(PORT, (() => {
        console.log(`Server Running at port ${PORT}`);
    }))
})
.catch((error) => {
    console.log("MongoDB Connection Failed !!", error);
})