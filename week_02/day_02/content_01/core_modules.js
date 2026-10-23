// const os=require('os');

// console.log(os.platform());
// console.log(os.arch());
// console.log(os.cpus().length);
// console.log(os.homedir());
// console.log(os.totalmem()/(1024*1024*1024) + " GB");
// console.log(os.freemem()/(1024*1024) +" MB");


const path = require("path");

const filePath=path.resolve(__dirname,"core_modules.js");
console.log(filePath);
console.log(__dirname)

const joinedPath=path.join("lecture 5","Core-D","core_modules.js");
console.log(joinedPath);

const file="lecture 5/Core-D/core_modules.js"
console.log(path.basename(file));
console.log(path.extname(file));
console.log(path.dirname(file));