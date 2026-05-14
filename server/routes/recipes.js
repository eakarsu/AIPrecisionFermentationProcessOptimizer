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
    const systemPrompt = `You are a fermentation recipe development expert. Optimize fermentation recipes including strain-media pairing, process parameter selection, feeding strategies, induction timing, and step-by-step protocol design. Consider batch, fed-batch, and continuous fermentation modes.`;
    const userMessage = prompt || `Optimize this fermentation recipe: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'recipes/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recipes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Recipe not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, product_type, strain_name, media_name, fermentation_type, duration_hours, temperature, ph_level, agitation_rpm, aeration_rate, steps_json, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO recipes (name, product_type, strain_name, media_name, fermentation_type, duration_hours, temperature, ph_level, agitation_rpm, aeration_rate, steps_json, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, product_type, strain_name, media_name, fermentation_type || 'batch', duration_hours, temperature, ph_level, agitation_rpm, aeration_rate, steps_json ? JSON.stringify(steps_json) : null, status || 'draft', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, product_type, strain_name, media_name, fermentation_type, duration_hours, temperature, ph_level, agitation_rpm, aeration_rate, steps_json, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE recipes SET name=$1, product_type=$2, strain_name=$3, media_name=$4, fermentation_type=$5, duration_hours=$6, temperature=$7, ph_level=$8, agitation_rpm=$9, aeration_rate=$10, steps_json=$11, status=$12, notes=$13 WHERE id=$14 RETURNING *`,
      [name, product_type, strain_name, media_name, fermentation_type, duration_hours, temperature, ph_level, agitation_rpm, aeration_rate, steps_json ? JSON.stringify(steps_json) : null, status, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Recipe not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM recipes WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
