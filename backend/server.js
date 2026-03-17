require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan('dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 60000, max: 100, message: { error: 'Too many requests' } });
app.use('/api/', limiter);

app.use('/api/ai', require('./routes/ai'));
app.use('/api/validate', require('./routes/validate'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/services', require('./routes/services'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Init DB then start server
db.init().then(() => {
  app.listen(PORT, () => console.log(`\n🚀 CSC Co-Pilot API → http://localhost:${PORT}\n`));
}).catch(err => {
  console.error('DB init failed:', err);
  process.exit(1);
});

module.exports = app;
