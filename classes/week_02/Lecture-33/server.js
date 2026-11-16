const bcrypt = require('bcrypt');
const password = "Jack@123";
const excryptedPassword = async(password) => {
    const salt = await bcrypt.genSalt(10);
    console.log("Salt:", salt);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Hashed Password:", hashedPassword);
};