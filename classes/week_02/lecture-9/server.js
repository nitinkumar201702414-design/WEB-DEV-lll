const express=require("express")
const app = express();

app.get("/",(req,res)=>{
    res.send("hello student");
})

app.get("/contact",(req,res) =>{
res.send("hello student"):
})

app.listen(3000,()=>console.log("server is running on port 3000"));7777