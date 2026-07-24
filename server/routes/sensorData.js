import { Router } from 'express';
import pool from '../db.js';
import { body, validationResult } from 'express-validator';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Threshold ranges for alerts
const THRESHOLDS = {
  temperature: { min: 25, max: 40 },
  ph: { min: 5.5, max: 8.5 },
  dissolved_oxygen: { min: 20, max: 100 },
  pressure: { min: 0.5, max: 3.0 },
};

function checkThresholds(data) {
  const alerts = [];
  if (data.temperature != null) {
    if (data.temperature < THRESHOLDS.temperature.min || data.temperature > THRESHOLDS.temperature.max) {
      alerts.push(`Temperature ${data.temperature}°C is out of range [${THRESHOLDS.temperature.min}-${THRESHOLDS.temperature.max}]`);
    }
  }
  if (data.ph != null) {
    if (data.ph < THRESHOLDS.ph.min || data.ph > THRESHOLDS.ph.max) {
      alerts.push(`pH ${data.ph} is out of range [${THRESHOLDS.ph.min}-${THRESHOLDS.ph.max}]`);
    }
  }
  if (data.dissolved_oxygen != null) {
    if (data.dissolved_oxygen < THRESHOLDS.dissolved_oxygen.min || data.dissolved_oxygen > THRESHOLDS.dissolved_oxygen.max) {
      alerts.push(`Dissolved oxygen ${data.dissolved_oxygen}% is out of range [${THRESHOLDS.dissolved_oxygen.min}-${THRESHOLDS.dissolved_oxygen.max}]`);
    }
  }
  if (data.pressure != null) {
    if (data.pressure < THRESHOLDS.pressure.min || data.pressure > THRESHOLDS.pressure.max) {
      alerts.push(`Pressure ${data.pressure} bar is out of range [${THRESHOLDS.pressure.min}-${THRESHOLDS.pressure.max}]`);
    }
  }
  return alerts;
}

// POST /api/fermentation-batches/:id/sensor-reading
router.post(
  '/:id/sensor-reading',
  [
    body('temperature').optional().isFloat({ min: -10, max: 200 }).withMessage('Temperature must be a valid number'),
    body('pH').optional().isFloat({ min: 0, max: 14 }).withMessage('pH must be 0-14'),
    body('dissolved_oxygen').optional().isFloat({ min: 0, max: 100 }).withMessage('Dissolved oxygen must be 0-100'),
    body('pressure').optional().isFloat({ min: 0 }).withMessage('Pressure must be non-negative'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const batchId = req.params.id;
      const { temperature, pH, dissolved_oxygen, pressure, timestamp } = req.body;

      const alerts = checkThresholds({ temperature, ph: pH, dissolved_oxygen, pressure });
      const alertTriggered = alerts.length > 0;
      const alertMessage = alerts.join('; ') || null;

      const result = await pool.query(
        `INSERT INTO sensor_readings (batch_id, temperature, ph, dissolved_oxygen, pressure, timestamp, alert_triggered, alert_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [batchId, temperature ?? null, pH ?? null, dissolved_oxygen ?? null, pressure ?? null,
          timestamp ? new Date(timestamp) : new Date(), alertTriggered, alertMessage]
      );

      res.status(201).json({
        reading: result.rows[0],
        alert_triggered: alertTriggered,
        alert_message: alertMessage,
      });
    } catch (err) {
      console.error('Sensor reading error:', err);
      res.status(500).json({ error: err.message });
    }
  }
);

// GET /api/fermentation-batches/:id/sensor-readings — paginated
router.get('/:id/sensor-readings', async (req, res) => {
  try {
    const batchId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const offset = (page - 1) * limit;

    const [rows, count] = await Promise.all([
      pool.query(
        'SELECT * FROM sensor_readings WHERE batch_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3',
        [batchId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM sensor_readings WHERE batch_id = $1', [batchId]),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
