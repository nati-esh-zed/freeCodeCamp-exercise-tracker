const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  description: String,
  duration: Number,
  date: String
});

// exerciseSchema.virtual('date').get((exerciseDoc) => {
//   return exerciseDoc.date.toDateString();
// });

const exerciseModel = mongoose.model("Exercise", exerciseSchema);

module.exports = {
  schema: exerciseSchema,
  model: exerciseModel
};
