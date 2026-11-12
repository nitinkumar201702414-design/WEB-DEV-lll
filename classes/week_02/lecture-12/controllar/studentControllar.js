const student=require("../data/studentData");


const getStudents=(req,res)=>{
    res.json(students)
}

const studentById=(req,res)=>{
    const id=req.params.rollNo;
    const student=students.find((student)=>student.rollNo===Number(id));
    if(!student){
        res.status(404).json({success:false, message:"student not found"});
    }
    res.json({success:true,student});
}

const addStudent=(req,res)=>{
    const data=req.body;
    console.log(data);
    students.push({rollNo:students.length+1,...data});
    res.json({success:true, message:"student created successfully",data});
}

const updateStudent=(req,res)=>{
    const id=req.params.rollNo;
    const data=req.body;
    const student=students.find((student)=>student.rollNo===Number(id));
    if(!student){
        res.status(404).json({success:false, message:"student not found"});
    }
    student.name=data.name;
    student.section=data.section;
    res.json({success:true,student});
}

const deleteStudent=(req,res)=>{
    const id=req.params.rollNo;
    const student=students.find((student)=>student.rollNo===Number(id));
    if(!student){
        res.status(404).json({success:false, message:"student not found"});
    }
    students.splice(students.indexOf(student),1);
    res.json({success:true, message:"student deleted successfully"});
}


module.exports={
    getStudents,
    studentById,
    addStudent,
    updateStudent,
    deleteStudent,
}