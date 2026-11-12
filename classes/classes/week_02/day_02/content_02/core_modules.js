const fs = require("fs");
const path = require("path");

const data= fs.readFileSync("file.txt","utf-8"); //synchronous
console.log(data);

fs.readFile("file.txt","utf-8",(err,data)=>{ // asynchronous
    if(err){
        console.log(err);
    }else{
        console.log(data);
    }
})


fs.appendFile("file.txt", "\nhello students", (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log("File updated successfully!");
    }
});


// fs.unlink("file1.txt", (err) => {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log("File deleted successfully!");
//     }
// });


// const password="NitinOP"

// // const hash=crypto.cresteHash("nitin123").update(password).digest("hex");
// // console.log(hash)

// const salt=crypto.randomBytes(16).toString("hex");
// // console.log(salt) 

// const hash=crypto.createHac("nitin123",salt).update(password).digest("hex");
// console.log(hash)


