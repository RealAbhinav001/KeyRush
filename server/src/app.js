import express from "express"
import { isDbConnected } from "./config/db.js"

const app = express()



app.get("/api/health",(_req,res)=>{
    if(isDbConnected()){
        res.json({
            status:"ok",
            db:"up"
        })
    }
    else{
        res.status(503).json({
            "error": { "code": "SERVICE_UNAVAILABLE", "message": "Database is not connected" } 
        })
    }
})

app.use((req, res) => {
    res.status(404).json({
        error: `Route ${req.method} ${req.originalUrl} not found`
    })
})

export default app