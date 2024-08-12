
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("connected to database"))
  .catch(console.error);

const options = {};

const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
}, options);

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  exercises: [exerciseSchema]
}, options);

const User = mongoose.model("User", userSchema);

app.post("/api/reset", (req, res) => {
  Exercise.deleteMany();
  User.deleteMany();
  return res.sendStatus(200);
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username });
  newUser.save()
    .then(userDoc => res.json({
      username: userDoc.username,
      _id: userDoc._id
    }))
    .catch(error => res.json({ error: error.message }));
});

app.get("/api/users", (req, res) => {
  User.find()
    .then(usersDoc => res.json(usersDoc.map(userDoc => ({
      username: userDoc.username,
      _id: userDoc._id,
    }))))
    .catch(error => res.json({ error: error.message }));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const _id = req.params._id;
  const description = req.body.description;
  const duration = req.body.duration;
  const date = req.body.date ? new Date(req.body.date) : new Date();
  const exercise = new Exercise({
    description,
    duration,
    date
  });
  // exercise.save();
  User.findById(_id)
    .then(userDoc => {
      userDoc.exercises.push(exercise);
      userDoc.save()
        .then(() => res.json({
          username: userDoc.username,
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString(),
          _id: userDoc._id
        }))
        .catch(error => res.json({ error: error.message }));
    })
    .catch(error => res.json({ error: error.message }));
});

app.get("/api/users/:_id/logs", (req, res) => {
  const _id = req.params._id;
  const from = req.query.from
    ? new Date(req.query.from)
    : null;
  const to = req.query.to
    ? new Date(req.query.to)
    : null;
  const limit = req.query.limit
    ? Number(req.query.limit)
    : null;
  let counter = limit;
  const extras = {};
  if (from) extras.from = from.toDateString();
  if (to) extras.to = to.toDateString();
  User.findById(_id)
    .select({
      username: 1,
      _id: 1,
      exercises: 1
    })
    .exec()
    .then(log => {
      const sortedExercises = log.exercises.sort((a, b) => b.date.getTime() - a.date.getTime());
      const exercises = (from || to || limit)
        ? sortedExercises.filter(exercise => {
          if (from && to && limit)
            return counter-- > 0
              && exercise.date.getTime() >= from.getTime()
              && exercise.date.getTime() <= to.getTime();
          else if (from && to)
            return exercise.date.getTime() >= from.getTime()
              && exercise.date.getTime() <= to.getTime();
          else if (from)
            return exercise.date.getTime() >= from.getTime();
          else if (limit)
            return counter-- > 0;
          return true;
        })
        : sortedExercises;
      return res.json({
        username: log.username,
        ...extras,
        count: exercises.length,
        _id: log._id,
        log: exercises.map(exercise => ({
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
        }))
      });
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


