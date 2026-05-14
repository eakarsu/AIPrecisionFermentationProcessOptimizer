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
    const systemPrompt = `You are a quality assurance specialist for fermentation-derived food ingredients and biopharmaceuticals. Assess product quality, suggest analytical methods, interpret test results, recommend corrective actions for out-of-spec results, and advise on quality system improvements (GMP, HACCP, ISO 22000).`;
    const userMessage = prompt || `Assess quality and suggest improvements for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'quality/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quality_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quality_records WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Quality record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { batch_id, product_name, test_type, test_result, specification_min, specification_max, unit, passed, tested_by, test_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO quality_records (batch_id, product_name, test_type, test_result, specification_min, specification_max, unit, passed, tested_by, test_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [batch_id, product_name, test_type, test_result, specification_min, specification_max, unit, passed !== undefined ? passed : true, tested_by, test_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { batch_id, product_name, test_type, test_result, specification_min, specification_max, unit, passed, tested_by, test_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE quality_records SET batch_id=$1, product_name=$2, test_type=$3, test_result=$4, specification_min=$5, specification_max=$6, unit=$7, passed=$8, tested_by=$9, test_date=$10, notes=$11 WHERE id=$12 RETURNING *`,
      [batch_id, product_name, test_type, test_result, specification_min, specification_max, unit, passed, tested_by, test_date, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Quality record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM quality_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Quality record not found' });
    res.json({ message: 'Quality record deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
