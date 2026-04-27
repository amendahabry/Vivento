require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
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

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/rsvp', rsvpRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/visits', visitRoutes);

// Check if user is authenticated
app.use(securityMiddleware);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invitation-images', invitationImageRoutes);

app.get('/', (req, res) => {
  res.send('Vivento RSVP Backend Running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
