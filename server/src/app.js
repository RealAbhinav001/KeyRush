import express from "express"

const app = express()



app.get("/api/health",(_req,res)=>{
    res.json({
        "status":"OK"
    })
})

app.use((req, res) => {
    res.status(404).json({
        error: `Route ${req.method} ${req.originalUrl} not found`
    })
})

export default app