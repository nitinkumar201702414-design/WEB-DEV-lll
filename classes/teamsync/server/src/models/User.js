const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },
    // select:false => never returned by queries unless we ask with .select("+password")
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    // Hashed refresh tokens (one per logged-in device, max 5). Never sent to the client.
    refreshTokens: { type: [String], default: [], select: false },
    profilePicture: { type: String, default: "" },
  },
  { timestamps: true }
);

// Hash the password automatically whenever it is new or changed.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// Safety net: even if password/refreshTokens are loaded, remove them from JSON output.
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
