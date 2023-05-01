const { User,} = require('../dreamBackend-main/src/models/user');
const {handledimonds}=require("./src/controllers/version 2.0/users")
const {Gift}=require("./src/models")
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { testDbConnection } = require("./src/config/db");
const { headers } = require("./src/middlewares/headers");
const errorHandling = require('./src/utils/apiError');
const errorHandler = require('./src/middlewares/errorHandler');
const log = require('./src/utils/logger');

const router = require("./src/routes/index");

const app = express();
const bodyParser=require('body-parser'); 
// const db=require('./src/config/testdb')

app.use(headers);
testDbConnection();
app.use(logger("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("./src/uploads"));
app.use(cookieParser());
app.use(bodyParser.json());  

app.use("", router);

/****************** ERORR HANDLING */


// app.use((req, res, next) => {
//   if (req.session.userId) {
//     const now = Date.now();
//     const duration = now - req.session.lastActivity || 0;
//     Activity.create({
//       userId: req.session.userId,
//       duration: duration
//     });
//     req.session.lastActivity = now;
//   }
//   next();
// });

// app.use('/like', (req, res, next) => {
//   if (req.session.userId) {
//     Activity.updateOne(
//       { userId: req.session.userId },
//       { $inc: { likes: 1 } },
//       (err) => {
//         if (err) {
//           console.error('Error updating likes', err);
//           res.status(500).json({ error: 'Internal server error' });
//         } else {
//           next();
//         }
//       }
//     );
//   } else {
//     res.status(401).json({ error: 'Unauthorized' });
//   }
// });


// app.get('/total-time', async (req, res) => {
//   const userId = req.session.userId;
//   const activities = await Activity.find({ userId: userId });
//   const totalTime = activities.reduce((total, activity) => {
//     return total + activity.duration;
//   }, 0);
//   res.json({ totalTime: totalTime });
// });

// app.get('/total-likes', async (req, res) => {
//   const userId = req.session.userId;
//   const activities = await Activity.find({ userId: userId });
//   const totalLikes = activities.reduce((total, activity) => {
//     return total + activity.likes;
//   }, 0);
//   res.json({ totalLikes: totalLikes });
// });


app.use((req, res, next) => {
  log.error("*************** API NOT FOUND ***************")
  next(new errorHandling("route not found", "notFound"));
});

// error handler
app.use(errorHandler);

module.exports = app; 
