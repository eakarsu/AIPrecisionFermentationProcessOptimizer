import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import processesRoutes from './routes/processes.js';
import strainsRoutes from './routes/strains.js';
import nutrientsRoutes from './routes/nutrients.js';
import yieldsRoutes from './routes/yields.js';
import contaminationRoutes from './routes/contamination.js';
import environmentRoutes from './routes/environment.js';
import bioreactorsRoutes from './routes/bioreactors.js';
import qualityRoutes from './routes/quality.js';
import recipesRoutes from './routes/recipes.js';
import batchesRoutes from './routes/batches.js';
import costsRoutes from './routes/costs.js';
import complianceRoutes from './routes/compliance.js';
import aiRoutes from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

// JWT Auth middleware - skip for auth routes
const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/api/auth')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

app.use(authMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/processes', processesRoutes);
app.use('/api/strains', strainsRoutes);
app.use('/api/nutrients', nutrientsRoutes);
app.use('/api/yields', yieldsRoutes);
app.use('/api/contamination', contaminationRoutes);
app.use('/api/environment', environmentRoutes);
app.use('/api/bioreactors', bioreactorsRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`Fermentation Optimizer API running on port ${PORT}`);
});

export default app;
