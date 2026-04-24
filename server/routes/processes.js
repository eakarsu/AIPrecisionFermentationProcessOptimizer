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

// POST /api/processes/ai-analyze - BEFORE /:id
router.post('/ai-analyze', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are an expert fermentation process engineer specializing in precision fermentation for food proteins, enzymes, and vitamins. Analyze fermentation process parameters and suggest optimizations for yield, efficiency, and quality. Consider temperature, pH, dissolved oxygen, agitation, substrate feeding strategies, and organism-specific requirements.`;
    const userMessage = prompt || `Analyze these fermentation process parameters and suggest optimizations: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// GET /api/processes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fermentation_processes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching processes:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/processes/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fermentation_processes WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Process not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching process:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/processes
router.post('/', async (req, res) => {
  try {
    const { name, organism, substrate, target_product, temperature, ph_level, duration_hours, status, yield_percentage, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO fermentation_processes (name, organism, substrate, target_product, temperature, ph_level, duration_hours, status, yield_percentage, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, organism, substrate, target_product, temperature, ph_level, duration_hours, status || 'planned', yield_percentage, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating process:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/processes/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, organism, substrate, target_product, temperature, ph_level, duration_hours, status, yield_percentage, notes } = req.body;
    const result = await pool.query(
      `UPDATE fermentation_processes SET name=$1, organism=$2, substrate=$3, target_product=$4, temperature=$5, ph_level=$6, duration_hours=$7, status=$8, yield_percentage=$9, notes=$10 WHERE id=$11 RETURNING *`,
      [name, organism, substrate, target_product, temperature, ph_level, duration_hours, status, yield_percentage, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Process not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating process:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/processes/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fermentation_processes WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Process not found' });
    res.json({ message: 'Process deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting process:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
