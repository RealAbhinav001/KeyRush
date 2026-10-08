import app from "./app.js"
import connectDB, { disconnectDB } from "./config/db.js"

const PORT = process.env.PORT || 4000

const shutdownDataBase = async ()=>{
    try{
        await disconnectDB()
        console.log("Database Disconnected")
        process.exit(0)
    }
    catch(error){
        console.error("Error During Resource CleanUp: ",error)
        process.exit(1)
    }
}

let server
let isShuttingDown = false

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
    console.error("Failed to start server:",error)
    process.exit(1)
   }
}

const shutdown = async (signal)=>{
    if(isShuttingDown) return

    isShuttingDown = true
    console.log(`${signal} received. Starting graceful shutdown...`)

    if(server){
        server.close((err)=>{
           if(err){
            console.error("Error During Resource Cleanup: ",err)
            process.exit(1)
           }
           else{
            console.log('HTTP server closed. Active requests finished.');
            shutdownDataBase()
           }
        })
    }
    else{
        shutdownDataBase()
    }

    setTimeout(()=>{
            console.error("ShutDown Time Exceed.Forcing Shutdown")
            process.exit(1)
        },10000)

}

process.on("SIGINT",()=>shutdown("SIGINT"))
process.on("SIGTERM",()=>shutdown("SIGTERM"))

startUp()