import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const callOpenRouterAI = async (systemPrompt, userMessage) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from AI';
};

function parseAIJson(text) {
  // Strategy 1: direct JSON parse
  try { return JSON.parse(text); } catch {}
  // Strategy 2: extract from ```json block
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch {} }
  // Strategy 3: find first { ... } block
  const brace = text.match(/\{[\s\S]*\}/);
  if (brace) { try { return JSON.parse(brace[0]); } catch {} }
  return null;
}

// Create telemetry table
const createTelemetryTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS process_telemetry (
      id SERIAL PRIMARY KEY,
      process_id INTEGER,
      recorded_at TIMESTAMP DEFAULT NOW(),
      do_pct DECIMAL,
      ph DECIMAL,
      od600 DECIMAL,
      agitation_rpm INTEGER,
      temperature_c DECIMAL,
      dissolved_o2 DECIMAL,
      co2_pct DECIMAL,
      is_anomaly BOOLEAN DEFAULT FALSE
    )
  `);
};

createTelemetryTable().catch(console.error);

// POST /api/telemetry/ingest
router.post('/ingest', async (req, res) => {
  try {
    const { process_id, readings } = req.body;
    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ error: 'readings must be a non-empty array' });
    }

    const inserted = [];
    for (const r of readings) {
      const result = await pool.query(
        `INSERT INTO process_telemetry (process_id, do_pct, ph, od600, agitation_rpm, temperature_c, dissolved_o2, co2_pct)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [process_id, r.do_pct, r.ph, r.od600, r.agitation_rpm, r.temperature_c, r.dissolved_o2, r.co2_pct]
      );
      inserted.push(result.rows[0]);
    }
    res.status(201).json({ inserted: inserted.length, records: inserted });
  } catch (err) {
    console.error('Telemetry ingest error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/telemetry/:processId
router.get('/:processId', async (req, res) => {
  try {
    const { processId } = req.params;
    const { start_date, end_date } = req.query;

    let query = 'SELECT * FROM process_telemetry WHERE process_id = $1';
    const params = [processId];

    if (start_date) {
      params.push(start_date);
      query += ` AND recorded_at >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND recorded_at <= $${params.length}`;
    }

    query += ' ORDER BY recorded_at DESC LIMIT 100';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Telemetry fetch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/telemetry/:processId/detect-anomalies
router.post('/:processId/detect-anomalies', async (req, res) => {
  try {
    const { processId } = req.params;
    const result = await pool.query(
      'SELECT * FROM process_telemetry WHERE process_id = $1 ORDER BY recorded_at DESC LIMIT 50',
      [processId]
    );
    const readings = result.rows;

    if (readings.length === 0) {
      return res.json({ anomalies: [], aiAnalysis: null, message: 'No telemetry data found' });
    }

    // Compute z-scores per metric
    const metrics = ['do_pct', 'ph', 'od600', 'agitation_rpm', 'temperature_c', 'dissolved_o2', 'co2_pct'];

    const stats = {};
    for (const m of metrics) {
      const vals = readings.map(r => parseFloat(r[m])).filter(v => !isNaN(v));
      if (vals.length === 0) { stats[m] = { mean: 0, std: 0 }; continue; }
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
      stats[m] = { mean, std: Math.sqrt(variance) };
    }

    const anomalousIds = [];
    for (const r of readings) {
      let isAnomaly = false;
      for (const m of metrics) {
        const val = parseFloat(r[m]);
        if (isNaN(val)) continue;
        const { mean, std } = stats[m];
        if (std > 0 && Math.abs(val - mean) / std > 2) {
          isAnomaly = true;
          break;
        }
      }
      if (isAnomaly) {
        anomalousIds.push(r.id);
        await pool.query('UPDATE process_telemetry SET is_anomaly = TRUE WHERE id = $1', [r.id]);
        r.is_anomaly = true;
      }
    }

    const anomalousReadings = readings.filter(r => r.is_anomaly);

    let aiAnalysis = null;
    if (anomalousReadings.length > 0) {
      const aiPrompt = `Analyze these anomalous fermentation readings. Probable cause? Return JSON: { anomaly_type: string, probable_cause: string, severity: "low"|"medium"|"high"|"critical", recommended_actions: [] }

Anomalous readings:
${JSON.stringify(anomalousReadings, null, 2)}

Statistical baselines: ${JSON.stringify(stats, null, 2)}`;

      const aiText = await callOpenRouterAI(
        'You are a fermentation process anomaly detection expert. Analyze telemetry data and return structured JSON analysis.',
        aiPrompt
      );
      aiAnalysis = parseAIJson(aiText) || { raw: aiText };
    }

    res.json({
      total_readings: readings.length,
      anomaly_count: anomalousIds.length,
      anomalous_readings: anomalousReadings,
      ai_analysis: aiAnalysis,
    });
  } catch (err) {
    console.error('Anomaly detection error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
