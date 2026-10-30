const express = require("express");
const mongoose=require("mongoose");
const Employee=require("./employee.model.js")
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/api/employee", async(req,res)=> {
    try{
        const employee = await Employee.find();
        res.json(employee);
    }catch(err){
        res.status(500).json({success: false, message: err.message});
    }
});




app.post("/api/employee", async(req,res)=> {
    console.log(req.body);
    try{
        const employee = await Employee.find();
        const employeeData = await Employee.create({empId: 100+(employee.length+1),...req.body});
        res.status(201).json(employeeData);

    } catch(err){
        res.status(500).json({message: err.message});
    }

})

app.put("/api/employee/:id", async(req,res)=> {
    try{
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if(!employee) {
            return res.status(404).json({success: false, message: "Employee not found"});
        }
        res.json(employee);
    } catch(err){
        res.status(500).json({success: false, message: err.message});
    }
})

app.delete("/api/employee/:id", async(req,res)=> {
    try{
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if(!employee) {
            return res.status(404).json({success: false, message: "Employee not found"});
        }
        res.json({success: true, message: "Employee deleted successfully"});
    } catch(err){
        res.status(500).json({success: false, message: err.message});
    }

})




mongoose.connect("mongodb://localhost:27017/GoogleDB").then(()=>{
    console.log("Database Connected");
}).catch((err)=> {
    console.log(err);
});
app.listen(PORT,() =>{
    console.log(`server is running on http://localhost:${PORT}`);
});