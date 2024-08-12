
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const app = express();

app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("connected to database"))
  .catch(console.error);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

const exerciseSchema = new mongoose.Schema({
  userId: { type: ObjectId, required: true, ref: User },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.post("/api/reset", (req, res) => {
  Exercise.deleteMany({}).catch(console.error);
  User.deleteMany({}).catch(console.error);
  return res.sendStatus(200);
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username });
  newUser.save()
    .then(userDoc => res.json({
      _id: userDoc._id,
      username: userDoc.username
    }))
    .catch(error => res.json({ error: error.message }));
});

app.get("/api/users", (req, res) => {
  User.find()
    .select({ _id: 1, username: 1 })
    .exec()
    .then(usersDoc => res.json(usersDoc))
    .catch(error => res.json({ error: error.message }));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const _id = req.params._id;
  User.findById(_id)
    .exec()
    .then((userDoc) => {
      const exercise = new Exercise({
        userId: _id,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? new Date(req.body.date) : new Date()
      });
      exercise.save()
        .then((exerciseDoc) => {
          return res.json({
            _id: exerciseDoc.userId,
            username: userDoc.username,
            description: exerciseDoc.description,
            duration: exerciseDoc.duration,
            date: exerciseDoc.date.toDateString(),
          });
        })
        .catch(error => res.json({ error: error.message }));
    })
    .catch(error => res.json({ error: error.message }));
});

app.get("/api/users/:_id/logs", (req, res) => {
  const _id = req.params._id;
  const from = req.query.from
    ? new Date(req.query.from)
    : new Date(0);
  const to = req.query.to
    ? new Date(req.query.to)
    : null;
  const limit = req.query.limit
    ? Number(req.query.limit)
    : 0;
  const extras = {};
  if (from) extras.from = from.toDateString();
  if (to) extras.to = to.toDateString();
  const dateFilter = (from && to)
    ? { $gte: from, $lte: to }
    : (from ? { $gte: from } : {});
  User.findById(_id)
    .exec()
    .then((userDoc) => {
      Exercise.find({ userId: userDoc._id })
        .sort({ date: -1 })
        .find({ date: dateFilter })
        .limit(limit)
        .exec()
        .then(exerciseDocs => {
          return res.json({
            _id: exerciseDocs.userId,
            username: userDoc.username,
            count: exerciseDocs.length,
            log: exerciseDocs.map(exerciseDoc => ({
              description: exerciseDoc.description,
              duration: exerciseDoc.duration,
              date: exerciseDoc.date.toDateString(),
            }))
          });
        })
        .catch(error => res.json({ error: error.message }));
    })
    .catch(error => res.json({ error: error.message }));
});

app.get('/', function (req, res) {
  return res.sendFile(__dirname + '/views/index.html');
});

app.use(express.static('public'));

const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('listening on port ' + listener.address().port);
});


