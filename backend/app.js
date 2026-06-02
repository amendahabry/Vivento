require('dotenv').config();

// Validate critical environment variables before starting app
const requiredEnvVars = ['JWT_SECRET'];
const missing = requiredEnvVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in the values');
  process.exit(1);
}

// Warn about optional but recommended vars
const recommended = ['S3_BUCKET', 'S3_ACCESS_KEY_ID', 'SMTP_USER'];
const missingRecommended = recommended.filter(v => !process.env[v]);
if (missingRecommended.length > 0) {
  console.warn('WARNING: Missing recommended environment variables:', missingRecommended.join(', '));
  console.warn('Some features may not work properly');
}

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const rsvpRoutes = require('./routes/rsvp');
const contactRoutes = require('./routes/contact');
const photoRoutes = require('./routes/photo');
const eventRoutes = require('./routes/event');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const visitRoutes = require('./routes/visit');
const invitationImageRoutes = require('./routes/invitationImage');
const securityMiddleware = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-lang']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Global rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later'
});
app.use('/api/', apiLimiter);

// Strict login rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// RSVP rate limiter
const rsvpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 RSVPs per hour per IP
  message: 'Too many RSVP submissions, please try again later'
});

// Public routes (no authentication required)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/rsvp', rsvpLimiter, rsvpRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/visits', visitRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Protected routes (authentication required)
app.use(securityMiddleware);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invitation-images', invitationImageRoutes);

app.get('/', (req, res) => {
  res.send('Vivento RSVP Backend Running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
