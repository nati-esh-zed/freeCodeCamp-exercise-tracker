const mongoose = require('mongoose');
const exercise = require('./Exercise');

const logSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  count: Number,
  log: [exercise.schema.omit(['_id', 'username'])]
});

const logModel = mongoose.model("Log", logSchema);

module.exports = {
  schema: logSchema,
  model: logModel
};
