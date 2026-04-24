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
      model: process.env.OPENROUTER_MODEL,
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
    const systemPrompt = `You are a fermentation media specialist and biochemist. Optimize nutrient media formulations for precision fermentation, considering carbon/nitrogen ratios, trace element requirements, cost optimization, and organism-specific nutritional needs. Provide specific concentrations and formulation adjustments.`;
    const userMessage = prompt || `Optimize this nutrient media formulation: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nutrient_media ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM nutrient_media WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Nutrient media not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, base_type, carbon_source, nitrogen_source, minerals, vitamins, ph_target, sterilization_method, cost_per_liter, shelf_life_days, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO nutrient_media (name, base_type, carbon_source, nitrogen_source, minerals, vitamins, ph_target, sterilization_method, cost_per_liter, shelf_life_days, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, base_type, carbon_source, nitrogen_source, minerals, vitamins, ph_target, sterilization_method, cost_per_liter, shelf_life_days, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, base_type, carbon_source, nitrogen_source, minerals, vitamins, ph_target, sterilization_method, cost_per_liter, shelf_life_days, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE nutrient_media SET name=$1, base_type=$2, carbon_source=$3, nitrogen_source=$4, minerals=$5, vitamins=$6, ph_target=$7, sterilization_method=$8, cost_per_liter=$9, shelf_life_days=$10, status=$11, notes=$12 WHERE id=$13 RETURNING *`,
      [name, base_type, carbon_source, nitrogen_source, minerals, vitamins, ph_target, sterilization_method, cost_per_liter, shelf_life_days, status, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Nutrient media not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM nutrient_media WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Nutrient media not found' });
    res.json({ message: 'Nutrient media deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
