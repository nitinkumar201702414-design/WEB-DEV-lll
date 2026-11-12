const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    // Uniqueness policy: project names are unique across the whole app.
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, default: "", maxlength: 1000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be on or after the start date",
      },
    },
    status: { type: String, enum: ["planning", "active", "on-hold", "completed"], default: "planning" },
  },
  { timestamps: true }
);

projectSchema.index({ members: 1 });

module.exports = mongoose.model("Project", projectSchema);
