// Set timezone to Asia/Shanghai so scheduled task times match user expectations
process.env.TZ = 'Asia/Shanghai';

const express = require('express');
const cors = require('cors');
const { initDb } = require('./database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const tasksRoutes = require('./routes/tasks');
const templatesRoutes = require('./routes/templates');
const { startScheduler } = require('./scheduler');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/admin', adminRoutes);
app.use('/api/auth', tasksRoutes);
app.use('/api/auth', templatesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[Server] XYZW Auth Backend running on port ${PORT}`);
    });
    startScheduler();
  })
  .catch((err) => {
    console.error('[Server] Failed to initialize database:', err);
    process.exit(1);
  });
