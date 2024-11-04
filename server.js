const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');

dotenv.config();

const app = express();

// const corsOptions = {
//     origin: '', // TODO Replace with your frontend's URL
//     optionsSuccessStatus: 200,
//   };

//   app.use(cors(corsOptions));

app.use(cors()); // TODO Allowing all origins for dev purposes. Remove for production
app.use(express.json());
app.use(morgan('dev')); // For logging HTTP requests, aiding in debugging
app.use(helmet()); // For setting HTTP headers to enhance security

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

app.get('/', (req, res) => {
  res.send('Virtual Garden API is running');
});

const plantsRouter = require('./routes/plants');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');

app.use('/api/plants', plantsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);

app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
