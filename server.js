const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

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
app.use(mongoSanitize()); // Data sanitization against NoSQL query injection
app.use(xss()); // Data sanitization against XSS

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

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 50,
  message: {
    message: 'Too many requests from this IP, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 25,
  message: {
    message: 'Too many login attempts from this IP, please try again later.'
  }
});

app.use(generalLimiter);
app.use('/api/auth', authLimiter);

app.use((err, req, res, next) => {
  console.error(err.stack);

  const response = {
    message: 'An unexpected error occurred'
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }

  res.status(500).json(response);
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
