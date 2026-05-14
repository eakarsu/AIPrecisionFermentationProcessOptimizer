import { Router } from 'express';
import pool from '../db.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { body, validationResult } from 'express-validator';

const router = Router();

// Ensure tables exist
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    endpoint VARCHAR(100),
    process_id INTEGER,
    result TEXT,
    result_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

pool.query(`
  CREATE TABLE IF NOT EXISTS ai_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    batch_id INTEGER,
    endpoint VARCHAR(150),
    result TEXT,
    result_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

pool.query(`
  CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL,
    temperature DECIMAL(6,2),
    ph DECIMAL(5,2),
    dissolved_oxygen DECIMAL(6,2),
    pressure DECIMAL(8,3),
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    alert_triggered BOOLEAN DEFAULT FALSE,
    alert_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(console.error);

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
      temperature: 0.7,
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

async function persistAnalysis(userId, endpoint, processId, result, resultJson) {
  try {
    await pool.query(
      'INSERT INTO ai_analyses (user_id, endpoint, process_id, result, result_json) VALUES ($1,$2,$3,$4,$5)',
      [userId, endpoint, processId || null, result, resultJson ? JSON.stringify(resultJson) : null]
    );
  } catch (err) {
    console.error('Failed to persist AI analysis:', err);
  }
}

// Apply rate limiter to all routes in this router
router.use(aiRateLimiter);

// GET /api/ai/history — paginated AI analyses for logged-in user
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    const [rows, count] = await Promise.all([
      pool.query(
        'SELECT * FROM ai_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM ai_analyses WHERE user_id = $1', [userId]),
    ]);

    res.json({
      data: rows.rows,
      total: parseInt(count.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    });
  } catch (err) {
    console.error('AI history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/ai/general-analysis
router.post('/general-analysis', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a comprehensive precision fermentation expert covering all aspects of industrial biotechnology: strain engineering, process optimization, media development, scale-up, quality control, and regulatory compliance. Provide detailed, actionable analysis for fermentation operations.`;
    const userMessage = prompt || `Provide a general fermentation analysis for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    await persistAnalysis(req.user?.id, 'general-analysis', null, analysis, null);
    res.json({ analysis });
  } catch (err) {
    console.error('AI general analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/process-optimization
router.post('/process-optimization', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a cross-process optimization specialist for precision fermentation facilities. Return ONLY valid JSON matching exactly this schema: { "optimizations": [{"parameter": string, "current_value": string, "recommended_value": string, "expected_improvement": string, "priority": "high"|"medium"|"low"}], "overall_efficiency_gain_pct": number, "critical_actions": [] }`;
    const userMessage = prompt || `Optimize across these fermentation processes and return JSON: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(analysis);
    await persistAnalysis(req.user?.id, 'process-optimization', context?.process_id, analysis, parsed);
    res.json({ analysis, parsed });
  } catch (err) {
    console.error('AI process optimization error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/predictive-modeling
router.post('/predictive-modeling', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a bioprocess predictive modeling expert. Return ONLY valid JSON matching exactly this schema: { "predictions": [{"timepoint": string, "metric": string, "predicted_value": number, "confidence_interval": string}], "model_type": string, "accuracy_estimate": number }`;
    const userMessage = prompt || `Build a predictive model and return JSON for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(analysis);
    await persistAnalysis(req.user?.id, 'predictive-modeling', context?.process_id, analysis, parsed);
    res.json({ analysis, parsed });
  } catch (err) {
    console.error('AI predictive modeling error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/troubleshooting
router.post('/troubleshooting', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation troubleshooting expert. Return ONLY valid JSON matching exactly this schema: { "root_causes": [{"cause": string, "likelihood": number, "evidence": []}], "recommended_actions": [{"action": string, "urgency": string, "expected_resolution_time": string}], "escalation_needed": boolean }`;
    const userMessage = prompt || `Troubleshoot and return JSON for this fermentation issue: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(analysis);
    await persistAnalysis(req.user?.id, 'troubleshooting', context?.process_id, analysis, parsed);
    res.json({ analysis, parsed });
  } catch (err) {
    console.error('AI troubleshooting error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/literature-search
router.post('/literature-search', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation science literature expert with deep knowledge of published research in precision fermentation, recombinant protein expression, metabolic engineering, and bioprocess engineering. Summarize relevant research findings, cite key papers and reviews, and suggest experimental approaches based on published literature.`;
    const userMessage = prompt || `Search fermentation literature for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    await persistAnalysis(req.user?.id, 'literature-search', null, analysis, null);
    res.json({ analysis });
  } catch (err) {
    console.error('AI literature search error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/protocol-generator
router.post('/protocol-generator', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation protocol development specialist. Generate detailed, step-by-step fermentation protocols including media preparation, sterilization procedures, inoculation, process parameters, sampling schedules, harvest criteria, and downstream processing. Include safety considerations and quality checkpoints.`;
    const userMessage = prompt || `Generate a fermentation protocol for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    await persistAnalysis(req.user?.id, 'protocol-generator', null, analysis, null);
    res.json({ analysis });
  } catch (err) {
    console.error('AI protocol generator error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/data-interpreter
router.post('/data-interpreter', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation data analysis expert. Interpret experimental fermentation data including growth curves, product titers, substrate consumption profiles, dissolved oxygen traces, pH trends, and off-gas analysis. Identify patterns, anomalies, phase transitions, and correlations. Provide statistical insights and visualization recommendations.`;
    const userMessage = prompt || `Interpret this fermentation data: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    await persistAnalysis(req.user?.id, 'data-interpreter', null, analysis, null);
    res.json({ analysis });
  } catch (err) {
    console.error('AI data interpreter error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/scale-up-advisor
router.post('/scale-up-advisor', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation scale-up advisor with experience transitioning processes from lab (1-10L) to pilot (50-500L) to production scale (1000L+). Advise on scale-up criteria (constant P/V, constant kLa, constant tip speed, geometric similarity), equipment selection, process parameter translation, risk assessment, and validation strategies for precision fermentation.`;
    const userMessage = prompt || `Provide scale-up advice for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    await persistAnalysis(req.user?.id, 'scale-up-advisor', null, analysis, null);
    res.json({ analysis });
  } catch (err) {
    console.error('AI scale-up advisor error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/batches/:id/ai-optimize
router.post('/batches/:id/ai-optimize', async (req, res) => {
  try {
    const batchId = req.params.id;

    const [batchRes, sensorRes] = await Promise.all([
      pool.query('SELECT * FROM batch_schedules WHERE id = $1', [batchId]),
      pool.query(
        'SELECT * FROM sensor_readings WHERE batch_id = $1 ORDER BY timestamp DESC LIMIT 100',
        [batchId]
      ),
    ]);

    if (!batchRes.rows[0]) return res.status(404).json({ error: 'Batch not found' });

    const systemPrompt = `You are a precision fermentation process optimization expert. Analyze the provided sensor readings and batch parameters to identify process improvements. Return ONLY valid JSON matching exactly this schema:
{
  "recommendations": [{"title": string, "description": string, "priority": "high"|"medium"|"low"}],
  "parameter_adjustments": [{"parameter": string, "current_value": string, "recommended_value": string, "rationale": string}],
  "expected_yield_impact": {"improvement_pct": number, "confidence": "high"|"medium"|"low", "explanation": string}
}`;

    const userMessage = `Analyze this batch and optimize the process:
Batch: ${JSON.stringify(batchRes.rows[0])}
Last 100 sensor readings: ${JSON.stringify(sensorRes.rows)}`;

    const aiResponse = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(aiResponse);

    await pool.query(
      `INSERT INTO ai_results (user_id, batch_id, endpoint, result, result_json) VALUES ($1,$2,$3,$4,$5)`,
      [req.user?.id, batchId, 'batches/ai-optimize', aiResponse, parsed ? JSON.stringify(parsed) : null]
    );

    res.json({ optimization: aiResponse, parsed, batchId });
  } catch (err) {
    console.error('AI optimize error:', err);
    res.status(500).json({ error: 'AI optimization failed' });
  }
});

// POST /api/batches/:id/ai-contamination-check
router.post('/batches/:id/ai-contamination-check', async (req, res) => {
  try {
    const batchId = req.params.id;
    const { visual_inspection_notes } = req.body;

    const [batchRes, sensorRes] = await Promise.all([
      pool.query('SELECT * FROM batch_schedules WHERE id = $1', [batchId]),
      pool.query(
        'SELECT ph, temperature, timestamp FROM sensor_readings WHERE batch_id = $1 ORDER BY timestamp DESC LIMIT 50',
        [batchId]
      ),
    ]);

    if (!batchRes.rows[0]) return res.status(404).json({ error: 'Batch not found' });

    const systemPrompt = `You are a fermentation contamination detection expert. Analyze pH trends, temperature profiles, and visual observations to assess contamination risk. Return ONLY valid JSON:
{
  "contamination_risk": "low"|"medium"|"high"|"critical",
  "confidence_score": number (0-100),
  "risk_indicators": [{"indicator": string, "severity": string, "evidence": string}],
  "probable_contaminants": [{"organism": string, "likelihood": number}],
  "recommended_actions": [string],
  "quarantine_recommended": boolean
}`;

    const userMessage = `Assess contamination risk for:
Batch: ${JSON.stringify(batchRes.rows[0])}
Recent pH/temperature trends: ${JSON.stringify(sensorRes.rows)}
Visual inspection notes: ${visual_inspection_notes || 'None provided'}`;

    const aiResponse = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(aiResponse);

    await pool.query(
      `INSERT INTO ai_results (user_id, batch_id, endpoint, result, result_json) VALUES ($1,$2,$3,$4,$5)`,
      [req.user?.id, batchId, 'batches/ai-contamination-check', aiResponse, parsed ? JSON.stringify(parsed) : null]
    );

    res.json({ assessment: aiResponse, parsed, batchId });
  } catch (err) {
    console.error('AI contamination check error:', err);
    res.status(500).json({ error: 'AI contamination check failed' });
  }
});

// POST /api/batches/:id/ai-yield-predict
router.post('/batches/:id/ai-yield-predict', async (req, res) => {
  try {
    const batchId = req.params.id;

    const [batchRes, sensorRes, historicalRes] = await Promise.all([
      pool.query('SELECT * FROM batch_schedules WHERE id = $1', [batchId]),
      pool.query(
        'SELECT * FROM sensor_readings WHERE batch_id = $1 ORDER BY timestamp DESC LIMIT 50',
        [batchId]
      ),
      pool.query(
        `SELECT bs.batch_name, bs.recipe_name, bs.start_date, bs.end_date, bs.status,
                COUNT(sr.id) as reading_count,
                AVG(sr.temperature) as avg_temp, AVG(sr.ph) as avg_ph
         FROM batch_schedules bs
         LEFT JOIN sensor_readings sr ON sr.batch_id = bs.id
         WHERE bs.id != $1
         GROUP BY bs.id ORDER BY bs.created_at DESC LIMIT 10`,
        [batchId]
      ),
    ]);

    if (!batchRes.rows[0]) return res.status(404).json({ error: 'Batch not found' });

    const systemPrompt = `You are a fermentation yield prediction specialist. Based on current process state and historical batch performance, predict the final yield. Return ONLY valid JSON:
{
  "predicted_yield": {"value": number, "unit": string},
  "yield_range": {"low": number, "high": number, "unit": string},
  "probability_distribution": [{"yield_pct_of_target": number, "probability": number}],
  "confidence": "high"|"medium"|"low",
  "key_factors": [{"factor": string, "impact": "positive"|"negative"|"neutral", "description": string}],
  "harvest_recommendation": string
}`;

    const userMessage = `Predict yield for batch:
Current batch: ${JSON.stringify(batchRes.rows[0])}
Recent sensor readings: ${JSON.stringify(sensorRes.rows)}
Historical batch performance: ${JSON.stringify(historicalRes.rows)}`;

    const aiResponse = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(aiResponse);

    await pool.query(
      `INSERT INTO ai_results (user_id, batch_id, endpoint, result, result_json) VALUES ($1,$2,$3,$4,$5)`,
      [req.user?.id, batchId, 'batches/ai-yield-predict', aiResponse, parsed ? JSON.stringify(parsed) : null]
    );

    res.json({ prediction: aiResponse, parsed, batchId });
  } catch (err) {
    console.error('AI yield predict error:', err);
    res.status(500).json({ error: 'AI yield prediction failed' });
  }
});

// POST /api/ai/generate-sop
router.post(
  '/generate-sop',
  [
    body('product_type').notEmpty().withMessage('product_type is required'),
    body('batch_size').isNumeric().withMessage('batch_size must be a number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { product_type, batch_size, target_parameters } = req.body;

      const systemPrompt = `You are a fermentation SOP (Standard Operating Procedure) development expert. Generate a comprehensive, production-ready SOP document. Return ONLY valid JSON:
{
  "sop_title": string,
  "document_id": string,
  "version": string,
  "sections": [
    {
      "title": string,
      "content": string,
      "critical_control_points": [{"ccp": string, "critical_limit": string, "monitoring": string, "corrective_action": string}]
    }
  ],
  "required_equipment": [string],
  "safety_requirements": [string],
  "quality_checkpoints": [{"checkpoint": string, "acceptance_criteria": string, "frequency": string}]
}`;

      const userMessage = `Generate a complete SOP for:
Product Type: ${product_type}
Batch Size: ${batch_size} L
Target Parameters: ${JSON.stringify(target_parameters || {})}`;

      const aiResponse = await callOpenRouterAI(systemPrompt, userMessage);
      const parsed = parseAIJson(aiResponse);

      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, result, result_json) VALUES ($1,$2,$3,$4)`,
        [req.user?.id, 'ai/generate-sop', aiResponse, parsed ? JSON.stringify(parsed) : null]
      );

      res.json({ sop: aiResponse, parsed });
    } catch (err) {
      console.error('SOP generator error:', err);
      res.status(500).json({ error: 'SOP generation failed' });
    }
  }
);

// POST /api/ai/compare-batches
router.post(
  '/compare-batches',
  [
    body('batch_id_1').isInt().withMessage('batch_id_1 must be an integer'),
    body('batch_id_2').isInt().withMessage('batch_id_2 must be an integer'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { batch_id_1, batch_id_2 } = req.body;

      const [batch1, batch2, sensors1, sensors2] = await Promise.all([
        pool.query('SELECT * FROM batch_schedules WHERE id = $1', [batch_id_1]),
        pool.query('SELECT * FROM batch_schedules WHERE id = $1', [batch_id_2]),
        pool.query('SELECT * FROM sensor_readings WHERE batch_id = $1 ORDER BY timestamp ASC', [batch_id_1]),
        pool.query('SELECT * FROM sensor_readings WHERE batch_id = $1 ORDER BY timestamp ASC', [batch_id_2]),
      ]);

      if (!batch1.rows[0]) return res.status(404).json({ error: 'Batch 1 not found' });
      if (!batch2.rows[0]) return res.status(404).json({ error: 'Batch 2 not found' });

      const systemPrompt = `You are a fermentation batch comparison expert. Compare two fermentation batches and identify what made one perform better. Return ONLY valid JSON:
{
  "winner_batch_id": number,
  "overall_comparison": string,
  "key_differences": [{"parameter": string, "batch_1_value": string, "batch_2_value": string, "impact": string}],
  "success_factors": [string],
  "improvement_recommendations": [{"for_batch_id": number, "recommendation": string, "priority": "high"|"medium"|"low"}],
  "statistical_summary": {"batch_1_score": number, "batch_2_score": number, "scoring_rationale": string}
}`;

      const userMessage = `Compare these two fermentation batches:

BATCH 1 (ID: ${batch_id_1}):
Parameters: ${JSON.stringify(batch1.rows[0])}
Sensor data (${sensors1.rows.length} readings): ${JSON.stringify(sensors1.rows.slice(0, 50))}

BATCH 2 (ID: ${batch_id_2}):
Parameters: ${JSON.stringify(batch2.rows[0])}
Sensor data (${sensors2.rows.length} readings): ${JSON.stringify(sensors2.rows.slice(0, 50))}`;

      const aiResponse = await callOpenRouterAI(systemPrompt, userMessage);
      const parsed = parseAIJson(aiResponse);

      await pool.query(
        `INSERT INTO ai_results (user_id, endpoint, result, result_json) VALUES ($1,$2,$3,$4)`,
        [req.user?.id, 'ai/compare-batches', aiResponse, parsed ? JSON.stringify(parsed) : null]
      );

      res.json({ comparison: aiResponse, parsed, batch_id_1, batch_id_2 });
    } catch (err) {
      console.error('Batch comparison error:', err);
      res.status(500).json({ error: 'Batch comparison failed' });
    }
  }
);

// POST /api/ai/strain-performance-predict — predict growth rate, yield, stress response for a strain
router.post('/strain-performance-predict', async (req, res) => {
  try {
    const { strain_id, strain_name, organism, genetic_modifications, target_product, recipe, environment } = req.body;
    const systemPrompt = `You are a strain-engineering expert for industrial fermentation. Predict performance metrics for the strain in the proposed conditions. Return ONLY valid JSON matching:
{ "growth_rate_h-1": number, "predicted_yield_g_per_l": number, "expected_titer_g_per_l": number, "stress_response": {"oxidative": "low|moderate|high", "osmotic": "low|moderate|high", "thermal": "low|moderate|high"}, "fermentation_time_h": number, "key_risks": [string], "recommendations": [string], "confidence": "low|moderate|high" }`;
    const userMessage = `Strain: ${strain_name || strain_id || 'unknown'}
Organism: ${organism || 'unknown'}
Genetic Modifications: ${JSON.stringify(genetic_modifications || [])}
Target Product: ${target_product || 'unknown'}
Recipe / Media: ${JSON.stringify(recipe || {})}
Environment / Conditions: ${JSON.stringify(environment || {})}

Predict performance and return JSON only.`;

    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(analysis);
    await persistAnalysis(req.user?.id, 'strain-performance-predict', strain_id || null, analysis, parsed);
    res.json({ analysis, parsed, strain_id });
  } catch (err) {
    console.error('strain-performance-predict error:', err);
    res.status(500).json({ error: 'AI strain prediction failed' });
  }
});

// POST /api/ai/quality-anomaly-detect — flag out-of-spec QC results
router.post('/quality-anomaly-detect', async (req, res) => {
  try {
    const { batch_id, qc_results, specs } = req.body;

    let results = qc_results;
    if (!results && batch_id) {
      try {
        const r = await pool.query(
          'SELECT id, parameter, value, units, spec_min, spec_max, status, sampled_at FROM quality_results WHERE batch_id = $1 ORDER BY sampled_at DESC LIMIT 100',
          [batch_id]
        );
        results = r.rows;
      } catch (_) { results = []; }
    }

    const systemPrompt = `You are a quality-control AI for precision fermentation. Identify out-of-spec QC results, root-cause hypotheses, and recommended corrective actions. Return ONLY valid JSON matching:
{ "anomalies": [{"parameter": string, "value": number, "spec": string, "severity": "minor|major|critical", "root_cause_hypothesis": string, "corrective_action": string}], "overall_quality_status": "pass|conditional|fail", "process_stage_concern": string, "recommendations": [string] }`;
    const userMessage = `Batch ID: ${batch_id || 'unknown'}
Specifications: ${JSON.stringify(specs || {})}

QC Results:
${(results || []).map(r => `param=${r.parameter} value=${r.value}${r.units || ''} spec=${r.spec_min ?? '?'}..${r.spec_max ?? '?'} status=${r.status || ''} at=${r.sampled_at || ''}`).join('\n') || 'No results provided'}

Return JSON only.`;

    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    const parsed = parseAIJson(analysis);
    await persistAnalysis(req.user?.id, 'quality-anomaly-detect', batch_id || null, analysis, parsed);
    res.json({ analysis, parsed, batch_id, results_analyzed: (results || []).length });
  } catch (err) {
    console.error('quality-anomaly-detect error:', err);
    res.status(500).json({ error: 'AI quality anomaly detection failed' });
  }
});

// GET /api/ai/results — paginated AI results history
router.get('/results', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    const [rows, count] = await Promise.all([
      pool.query(
        'SELECT * FROM ai_results WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM ai_results WHERE user_id = $1', [userId]),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
