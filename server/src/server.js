import app from "./app.js"
import connectDB from "./config/db.js"

const PORT = process.env.PORT || 4000
let server

const startUp = async()=>{
   try{
    await connectDB()
    server = app.listen(PORT,(error)=>{
        if(error){
            console.error("Failed to start server:", error)
            process.exit(1)
        }

        console.log(`Keyrush server running at http://localhost:${PORT}`)
    })
   }
   catch(error){
    console.error(error)
    process.exit(1)
   }
}

startUp()