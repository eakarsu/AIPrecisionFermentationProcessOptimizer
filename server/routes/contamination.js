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
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response from AI';
};

router.post('/ai-analyze', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a contamination control specialist for industrial fermentation facilities. Assess contamination risks, identify probable sources, recommend corrective and preventive actions (CAPA), and suggest detection strategies. Consider microbial, phage, cross-contamination, and chemical contamination scenarios.`;
    const userMessage = prompt || `Assess contamination risk and recommend actions for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'contamination/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contamination_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contamination_records WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { process_name, contaminant_type, detection_method, severity, action_taken, resolved, detection_date, resolution_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO contamination_records (process_name, contaminant_type, detection_method, severity, action_taken, resolved, detection_date, resolution_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [process_name, contaminant_type, detection_method, severity || 'low', action_taken, resolved || false, detection_date, resolution_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { process_name, contaminant_type, detection_method, severity, action_taken, resolved, detection_date, resolution_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE contamination_records SET process_name=$1, contaminant_type=$2, detection_method=$3, severity=$4, action_taken=$5, resolved=$6, detection_date=$7, resolution_date=$8, notes=$9 WHERE id=$10 RETURNING *`,
      [process_name, contaminant_type, detection_method, severity, action_taken, resolved, detection_date, resolution_date, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM contamination_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
