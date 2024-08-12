
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { connectDb } = require("./db");
const { user, exercise, log } = require("./db/models");

const { default: mongoose } = require('mongoose');
const model = mongoose.model("", null);
model.find()

const app = express();

connectDb();

app.use(cors({ optionsSuccessStatus: 200 })); // some legacy browsers choke on 204
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  const newUser = new user.model({ username });
  newUser.save()
    .then(userDoc => {
      const _id = userDoc._id;
      const newLog = new log.model({
        username,
        count: 0,
        _id,
        log: []
      });
      newLog.save();
      return res.json(userDoc);
    })
    .catch(error => res.status(500).json({ error: error.message }));
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const _id = req.params._id;
  const description = req.body.description || '';
  const duration = req.body.duration || 1;
  const date = req.body.date || new Date.toDateString();
  log.model.findById(_id)
    .then((logDoc) => {
      const { _id, username } = logDoc;
      const newExercise = new exercise.model({
        _id, username, description, duration, date
      });
      // newExercise.save();
      logDoc.log.push(newExercise);
      logDoc.count++;
      logDoc.save();
      return res.json({ _id, username, description, duration, date });
    })
    .catch(error => res.status(500).json({ error: error.message }));
});

app.get("/api/users/:_id/logs", (req, res) => {
  const _id = req.params._id;
  const { from, to, limit } = req.query;
  log.model.findById(_id)
    .then(logDoc => {
      const counter = limit;
      const exerciseDocs = [];
      for (let exerciseDoc of logDoc.log) {
        if (from && to && limit) {
          if (counter-- > 0
            && new Date(exerciseDoc.date).getTime() >= new Date(from).getTime()
            && new Date(exerciseDoc.date).getTime() <= new Date(to).getTime())
            exerciseDocs.push(exerciseDoc);
        } else if (from && to) {
          if (new Date(exerciseDoc.date).getTime() >= new Date(from).getTime()
            && new Date(exerciseDoc.date).getTime() <= new Date(to).getTime())
            exerciseDocs.push(exerciseDoc);
        } else if (from) {
          if (new Date(exerciseDoc.date).getTime() >= new Date(from).getTime())
            exerciseDocs.push(exerciseDoc);
        } else
          exerciseDocs.push(exerciseDoc);
      }
      // for (exerciseDoc of exerciseDocs)
      //   exerciseDoc.date = new Date(exerciseDoc.date).toDateString();
      if (from || to || limit)
        logDoc.log = exerciseDocs;
      logDoc.log = logDoc.log.map(exerciseDoc => ({
        description: exerciseDoc.description,
        duration: exerciseDoc.duration,
        date: new Date(exerciseDoc.date).toDateString()
      }));
      return res.json(logDoc);
    })
    .catch(error => res.status(500).json({ error: error.message }));
});


app.get("/api/users", (req, res) => {
  user.model.find({})
    .then(userDocs => res.json(userDocs))
    .catch(error => res.status(500).json({ error: error.message }));
});

app.get("/api/reset", (req, res) => {
  log.model.deleteMany({})
    .catch(error => res.status(500).json({ error: error.message }));
  exercise.model.deleteMany({})
    .catch(error => res.status(500).json({ error: error.message }));
  user.model.deleteMany({}).then(() => res.sendStatus(200))
    .catch(error => res.status(500).json({ error: error.message }));
});

app.get('/', function (req, res) {
  return res.sendFile(__dirname + '/views/index.html');
});

app.use(express.static('public'));

const listener = app.listen(process.env.PORT || 3000, function () {
  console.log('listening on port ' + listener.address().port);
});


