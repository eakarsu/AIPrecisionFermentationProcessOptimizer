import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

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
import telemetryRoutes from './routes/telemetry.js';
import sensorDataRoutes from './routes/sensorData.js';
import governanceRouter from './governance/router.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
const { validateRuntime } = require('./governance/runtime.cjs');
const { createProviderGate } = require('./governance/providerGate.cjs');
validateRuntime();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Security middleware
app.use(helmet());

// Middleware
const allowedOrigins = String(process.env.CORS_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((value) => value.trim()).filter(Boolean);
app.use(cors({ origin: (origin, callback) => !origin || allowedOrigins.includes(origin) ? callback(null, true) : callback(new Error('Origin not allowed by CORS')), credentials: true }));
app.use(express.json());
app.use(createProviderGate(['/api/ai', '/api/gap', '/api/cf']));

// JWT Auth middleware - skip for auth routes
const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/api/auth') || req.path === '/api/health') {
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
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/fermentation-batches', sensorDataRoutes);
app.use('/api/governed-fermentation-batches', governanceRouter);

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


// === Custom Feature Mounts (batch_06) ===
import('./routes/customFeat01_AgenticProcessOptimization.js').then(m => app.use('/api/cf-agentic-process-optimization', m.default));
import('./routes/customFeat02_ContaminationRiskEarlyWarning.js').then(m => app.use('/api/cf-contamination-risk-early-warning', m.default));
import('./routes/customFeat03_ScaleUpProtocolGenerator.js').then(m => app.use('/api/cf-scale-up-protocol-generator', m.default));
import('./routes/customFeat04_MediaOptimizationEnsemble.js').then(m => app.use('/api/cf-media-optimization-ensemble', m.default));
import('./routes/customFeat05_CrossBatchLearning.js').then(m => app.use('/api/cf-cross-batch-learning', m.default));


// === Batch 06 Gaps & Frontend Mounts ===
app.use('/api/gap-strains-without-strain', require('./routes/gapFeat_strains_without_strain.cjs'));
app.use('/api/gap-quality-without-quality', require('./routes/gapFeat_quality_without_quality.cjs'));
app.use('/api/gap-costs-without-cost', require('./routes/gapFeat_costs_without_cost.cjs'));
app.use('/api/gap-no-real-scada-industrial-iot-integration-only-manu', require('./routes/gapFeat_no_real_scada_industrial_iot_integration_only_manu.cjs'));
app.use('/api/gap-no-integration-with-analytical-labs-hplc-mass-spec', require('./routes/gapFeat_no_integration_with_analytical_labs_hplc_mass_spec.cjs'));
app.use('/api/gap-no-integration-with-downstream-processing-purifica', require('./routes/gapFeat_no_integration_with_downstream_processing_purifica.cjs'));
app.use('/api/gap-limited-regulatory-documentation-cgmp-fda-complian', require('./routes/gapFeat_limited_regulatory_documentation_cgmp_fda_complian.cjs'));
app.use('/api/gap-no-webhooks-for-alert-delivery', require('./routes/gapFeat_no_webhooks_for_alert_delivery.cjs'));
app.use('/api/gap-no-mobile-app-for-operators', require('./routes/gapFeat_no_mobile_app_for_operators.cjs'));
app.use('/api/gap-limited-notifications-layer', require('./routes/gapFeat_limited_notifications_layer.cjs'));

app.listen(PORT, () => {
  console.log(`Fermentation Optimizer API running on port ${PORT}`);
});

export default app;
