require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const pino = require('pino');
const cors = require('cors');

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const app = express();
const port = process.env.PORT || 3000;

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS blocked' });
  }
  next(err);
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/auth', limiter);

app.use(cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});


// Routes
const authRoutes = require('./routes/auth.route');
const courseRoutes = require('./routes/api/course.route');
const enrollmentRoutes = require('./routes/api/enrollment.route');
const studentRoutes = require('./routes/api/student.route');
const gradeRoutes = require('./routes/api/grade.route');
const auditRoutes = require('./routes/api/audit.route');
const adminRoutes = require('./routes/api/admin.route');

app.use('/api/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/audits', auditRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Development Environment
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Internal server error' : err.message;
  const stack = isProduction ? undefined : err.stack;

  res.status(err.status || 500).json({
    error: message,
    ...(stack && { stack })
  });
});

app.listen(port, '0.0.0.0', () => {
  logger.info(`Server running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
