const express=require("express");
const router=XPathExpression.Routes();
const studentControllar=require("../controllar/studentControllar"); 


///Read Operation
router.get("/students",studentControllar.getStudents)

//Read operation with id
router.get("/students/:rollNo",studentControllar.studentById)

//Create
router.post("/students",studentControllar.addStudent)

////update
router.put("/students/:rollNo",studentControllar.updateStudent)

//delete
router.delete("/students/:rollNo",studentControllar.deleteStudent)

module.exports=router