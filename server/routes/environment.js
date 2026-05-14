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
    const systemPrompt = `You are a bioprocess environmental control engineer. Optimize bioreactor environmental parameters including temperature, pH, dissolved oxygen, agitation, aeration, pressure, and foam control. Provide PID tuning recommendations, cascade control strategies, and alarm threshold optimization.`;
    const userMessage = prompt || `Optimize these environmental control parameters: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'environment/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environment_controls ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environment_controls WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Control record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { bioreactor_id, parameter_name, set_value, actual_value, unit, tolerance, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO environment_controls (bioreactor_id, parameter_name, set_value, actual_value, unit, tolerance, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [bioreactor_id, parameter_name, set_value, actual_value, unit, tolerance, status || 'normal', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { bioreactor_id, parameter_name, set_value, actual_value, unit, tolerance, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE environment_controls SET bioreactor_id=$1, parameter_name=$2, set_value=$3, actual_value=$4, unit=$5, tolerance=$6, status=$7, notes=$8, last_updated=NOW() WHERE id=$9 RETURNING *`,
      [bioreactor_id, parameter_name, set_value, actual_value, unit, tolerance, status, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Control record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM environment_controls WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Control record not found' });
    res.json({ message: 'Control record deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
