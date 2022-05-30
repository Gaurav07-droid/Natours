const mongoose = require('mongoose');
const dotenv = require('dotenv');

//Uncaught Exceptions beofre any posiibility where he exception may occur
process.on('uncaughtException', (err) => {
  console.log('UNHANDLED Exception!💥 Shutting down.....');
  console.log(err.name, err);

  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

// return a promise
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection succesful!'));
// console.log(process.env);

//describing schema for our data in tour model

const port = process.env.PORT || 3000;
const server = app.listen(process.env.PORT, () => {
  console.log(`App is running on ${port}...`);
});

//unhandled process rejection hanler
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJETION!💥 Shutting down.....');

  server.close(() => {
    process.exit(1);
  });
});
