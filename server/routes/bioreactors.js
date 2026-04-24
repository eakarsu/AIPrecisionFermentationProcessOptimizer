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
    const systemPrompt = `You are a bioreactor engineering and scale-up specialist. Provide recommendations for bioreactor selection, scale-up strategies (geometric similarity, constant tip speed, constant P/V, constant kLa), equipment sizing, and operational considerations for transitioning from bench to pilot to production scale.`;
    const userMessage = prompt || `Provide scale-up recommendations for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bioreactors ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bioreactors WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Bioreactor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, type, capacity_liters, material, status, current_process, installation_date, last_maintenance, location, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO bioreactors (name, type, capacity_liters, material, status, current_process, installation_date, last_maintenance, location, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, type, capacity_liters, material, status || 'available', current_process, installation_date, last_maintenance, location, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, type, capacity_liters, material, status, current_process, installation_date, last_maintenance, location, notes } = req.body;
    const result = await pool.query(
      `UPDATE bioreactors SET name=$1, type=$2, capacity_liters=$3, material=$4, status=$5, current_process=$6, installation_date=$7, last_maintenance=$8, location=$9, notes=$10 WHERE id=$11 RETURNING *`,
      [name, type, capacity_liters, material, status, current_process, installation_date, last_maintenance, location, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Bioreactor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM bioreactors WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Bioreactor not found' });
    res.json({ message: 'Bioreactor deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
