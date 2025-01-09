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

// Rate Limiting
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

// CORS configuration
// const corsOptions = {
//     origin: process.env.FRONTEND_URL, // TODO Replace with your frontend's URL
//     optionsSuccessStatus: 200,
//   };

//   app.use(cors(corsOptions));

app.set('trust proxy', 1); // TODO remove after development
app.use(cors()); // TODO Allowing all origins for dev purposes. Remove for production

// Middleware Setup
app.use(express.json());
app.use(morgan('dev')); // For logging HTTP requests, aiding in debugging
app.use(
  // For setting HTTP headers to enhance security
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1y
      includeSubDomains: true,
      preload: true
    }
  })
);

// Data Sanitization against NoSQL Injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// HTTPS Enforcement (in production)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (req.secure) {
      next();
    } else {
      res.redirect(`https://${req.headers.host}${req.url}`);
    }
  });
}

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

function connectDB() {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((err) => {
      console.error('MongoDB connection error:', err);
    });
}

connectDB();

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send('Virtual Garden API is running');
});

// Import routes
const plantsRouter = require('./routes/plants');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const healthRouter = require('./routes/health');

// Use routes
app.use('/api/plants', plantsRouter);
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/health', healthRouter);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  const response = {
    message: 'An unexpected error occurred.'
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = err.message;
    response.stack = err.stack;
  }

  res.status(500).json(response);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  connectDB();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(
    `Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});
