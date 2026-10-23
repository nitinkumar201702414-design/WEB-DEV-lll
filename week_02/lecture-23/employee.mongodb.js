use("GoogleDB")

db.employee.insert([
    {
        empID:102,
        Name: "Nitin",
        salary: 115000,
        department: "HR",
        contact: 88765432,
        age: 25
    },{
        empID:103,
        Name: "Daksh",
        salary: 95000,
        department: "IT",
        contact: 98755432,
        age: 25
    },{
        empID:104,
        Name: "Happy",
        salary: 65000,
        department: "Finance",
        contact: 98765432,
        age: 25
    },{
        empID:105,
        Name: "Mohit",
        salary: 75000,
        department: "Finance",
        contact: 98765432,
        age: 25
    },
])

// db.employee.updateMany(
//         {},
//         {
//             $location: "Delhi"
//         },
// )

// db.employee.aggregate(
//         [
//                 {
//                         $match: { department: "Finance" }
//                 }
//                 ,{
//                         $project: {
//                                 Name: 1,
//                                 salary: 1
//                         }
//                 }
//                 ,{
//                         $group: {
//                                 _id: "$location",
//                                 totalSalary: { $sum: "$salary" }
//                         }
//                 }
//                 ,{
//                         $sort: { totalSalary: -1 }
//                 }
//                 ,{
//                         $limit: 1
//                 }
//                 ,{
//                         $count: 'totalSalary'
//                 }

//         ]
// )


// db.employee.getIndexes()
// db.employee.find({_id: ObjectId("6adb1d6e4785381c27a8ce69")})

// db.employee.createIndexes({contact: 1})

// db.employee.getIndexes()