
const mongoose = require('mongoose');

async function connectDb() {
  return await mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('database successfully connected');
    })
    .catch((e) => {
      console.log('database not connected');
    });
}

module.exports = {
  connectDb
};
