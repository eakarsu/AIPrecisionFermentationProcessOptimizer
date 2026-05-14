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
    const systemPrompt = `You are a fermentation production scheduling and operations expert. Optimize batch scheduling considering bioreactor availability, staff allocation, media preparation lead times, turnaround cleaning times, and production priorities. Minimize downtime and maximize facility utilization.`;
    const userMessage = prompt || `Optimize this batch schedule: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'batches/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      pool.query('SELECT * FROM batch_schedules ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM batch_schedules'),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM batch_schedules WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Batch schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { batch_name, recipe_name, bioreactor_name, start_date, end_date, priority, status, assigned_to, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO batch_schedules (batch_name, recipe_name, bioreactor_name, start_date, end_date, priority, status, assigned_to, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [batch_name, recipe_name, bioreactor_name, start_date, end_date, priority || 'medium', status || 'scheduled', assigned_to, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { batch_name, recipe_name, bioreactor_name, start_date, end_date, priority, status, assigned_to, notes } = req.body;
    const result = await pool.query(
      `UPDATE batch_schedules SET batch_name=$1, recipe_name=$2, bioreactor_name=$3, start_date=$4, end_date=$5, priority=$6, status=$7, assigned_to=$8, notes=$9 WHERE id=$10 RETURNING *`,
      [batch_name, recipe_name, bioreactor_name, start_date, end_date, priority, status, assigned_to, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Batch schedule not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM batch_schedules WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Batch schedule not found' });
    res.json({ message: 'Batch schedule deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
