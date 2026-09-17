const express=require("express");
const morgan=require("morgan")
const app = express()
const PORT  = 3000

app.use(morgan());

// const logMiddleware=(req,res,next)=>{
//     req.data = "THis is Data From Middleware"
//     console.log("Request url:",req.url,"Method:",req.method,);
//     // res.send("aaaa")
//     next();
// }

const apiMiddlware=(req,res,next)=>{
    const API_KEY=req.query.API_KEY;
    if(API_KEY !== 1234){
        res.send("API KEY is not valid")
    }

    console.log("authnethicated")
    next();
}
// app.use(logMiddleware);
// app.use(apiMiddlware);


app.get("/",(req,res)=>{
    console.log("Request data:",req.data)
    console.log("Home Page")
    res.send("Hello from server")
})

app.get("/weather-data",apiMiddlware,(req,res)=>{
    console.log("Weather Data")
    res.json({
        city: "Delhi",
        weather: "sunny",
        Temp: 32

    })
})
app.listen(PORT,()=>console.log("server is running on port 3000"))