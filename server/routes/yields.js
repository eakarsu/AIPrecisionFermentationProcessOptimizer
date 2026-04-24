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
    const systemPrompt = `You are a fermentation yield prediction specialist with expertise in bioprocess modeling and statistical analysis. Predict fermentation yields based on process parameters, strain characteristics, and media composition. Provide confidence intervals and identify key factors affecting yield.`;
    const userMessage = prompt || `Predict yield based on these parameters and provide confidence analysis: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM yield_predictions ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM yield_predictions WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Yield prediction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { process_name, strain_name, predicted_yield, actual_yield, confidence_score, parameters_json, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO yield_predictions (process_name, strain_name, predicted_yield, actual_yield, confidence_score, parameters_json, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [process_name, strain_name, predicted_yield, actual_yield, confidence_score, parameters_json ? JSON.stringify(parameters_json) : null, status || 'pending', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { process_name, strain_name, predicted_yield, actual_yield, confidence_score, parameters_json, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE yield_predictions SET process_name=$1, strain_name=$2, predicted_yield=$3, actual_yield=$4, confidence_score=$5, parameters_json=$6, status=$7, notes=$8 WHERE id=$9 RETURNING *`,
      [process_name, strain_name, predicted_yield, actual_yield, confidence_score, parameters_json ? JSON.stringify(parameters_json) : null, status, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Yield prediction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM yield_predictions WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Yield prediction not found' });
    res.json({ message: 'Yield prediction deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
