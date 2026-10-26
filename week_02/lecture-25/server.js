const express = require("express");lo
const morgan=require("morgan")
const app = express();
const PORT = 3000;

mongoose.connect("mongodb://localhost:27017/GoogleDB").them(()=>{
    console.log("Database Connected");
}).catch((err)=> {
    console.log(err);
})
app.listen(PORT,() =>{
    console.log('server is running on http://localhost:${port}');
})