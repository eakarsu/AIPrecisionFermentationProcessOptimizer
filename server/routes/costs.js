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
    const systemPrompt = `You are a fermentation process economics and cost optimization expert. Analyze production costs including raw materials, labor, energy, equipment depreciation, and overhead. Identify cost reduction opportunities, economies of scale, and process efficiency improvements to maximize profit margins.`;
    const userMessage = prompt || `Analyze costs and suggest reductions for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'costs/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_analyses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cost_analyses WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Cost analysis not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { batch_name, raw_material_cost, labor_cost, energy_cost, equipment_cost, overhead_cost, total_cost, revenue, profit_margin, currency, analysis_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO cost_analyses (batch_name, raw_material_cost, labor_cost, energy_cost, equipment_cost, overhead_cost, total_cost, revenue, profit_margin, currency, analysis_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [batch_name, raw_material_cost, labor_cost, energy_cost, equipment_cost, overhead_cost, total_cost, revenue, profit_margin, currency || 'USD', analysis_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { batch_name, raw_material_cost, labor_cost, energy_cost, equipment_cost, overhead_cost, total_cost, revenue, profit_margin, currency, analysis_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE cost_analyses SET batch_name=$1, raw_material_cost=$2, labor_cost=$3, energy_cost=$4, equipment_cost=$5, overhead_cost=$6, total_cost=$7, revenue=$8, profit_margin=$9, currency=$10, analysis_date=$11, notes=$12 WHERE id=$13 RETURNING *`,
      [batch_name, raw_material_cost, labor_cost, energy_cost, equipment_cost, overhead_cost, total_cost, revenue, profit_margin, currency, analysis_date, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Cost analysis not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM cost_analyses WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Cost analysis not found' });
    res.json({ message: 'Cost analysis deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
