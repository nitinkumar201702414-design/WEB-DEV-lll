use("GoogleDB")

// //create opreation 1 INsert 2 insert many
// db.employee.insert(
//     {
        // empID:102,
        // Name: "Nitin",
        // salary: 65000,
        // department: "HR",
        // contact: 98765432,
        // age: 25
//     }
// )

// db.employee.insertOne(
//     {
//         empID:102,
//         Name: "Nitin",
//         salary: 65000,
//         department: "HR",
//         contact: 98765432,
//         age: 25
//     }
// )

// db.employee.insertMany(
//     {
//         empID:103,
//         Name: "Daksh",
//         salary: 65000,
//         department: "IT",
//         contact: 98765432,
//         age: 25
//     },
//        {
//         empID:103,
//         Name: "Happy",
//         salary: 65000,
//         department: "IT",
//         contact: 98765432,
//         age: 25

//     },
//        {
//         empID:102,
//         Name: "Nitin",
//         salary: 65000,
//         department: "HR",
//         contact: 98765432,
//         age: 25
//     },
// )



////read opreation 1 find() 2 findOne() 

// db.employee.find() -- all

//db.employee.findOne() -- only so.1 first

//db.employee.find((department: "IT")) -- conducation all find it

//db.employee.findOne((department: "IT")) -- conducation find only first 


//// Update optreation 1. updateOne() 2. updateMAny()

// db.employee.updateOne(
//     {_id: Object('vornir4098ugui84g)}, -- conducation
//     {
//         $set:{
//             age:28,
//             salary:9000000
//         }
//     } -- change value

// )


// db.employee.updateMany( --- change all IT1 value
//     {department: "IT"}, -- conducation
//     {
//         $set:{
//             salary:9000000
//         }
//     } -- change value
// )


/// delete operation 1. deleteOne() 2. deleteMany()

// db.employee.deleteOne(
//     {_id: Object('vornir4098ugui84g)} --  conducation for data delete 
// )

// db.employee.deleteMany(
//     {department: "IT"} -- conducation for all IT data delete
// )


//db.employee.find(
//     {department: "IT", age:($gte:25)}
//  
// )

// db.employee.find(
//     {
//         $or:{
//             {department: "IT"},
//             {age:{$gte:25}}

//         }

//     }

// )

// db.employee.find()  //-- full data show
// db.employee.find({department:"IT"},{Name:1,_id:0}).  -- only IT department data show

// db.employee.find().skip(0).limit(2)  //-- only 2 data show

//db.employee.find().sort({salary:-1})  //-- salary sort by desc
//db.employee.find().sort({salary:1})  //-- salary sort by asc