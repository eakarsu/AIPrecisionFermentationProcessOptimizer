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
    const { data: records, prompt } = req.body;
    const systemPrompt = `You are a regulatory compliance specialist for precision fermentation and novel food ingredients. Advise on FDA GRAS requirements, EU Novel Food Regulation, GMP compliance, HACCP, labeling, allergen management, and biosafety for fermentation-derived food products.`;
    const userMessage = prompt || `Analyze these compliance records and identify risks: ${JSON.stringify(records?.slice(0, 10))}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'compliance/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_records WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { regulation_name, category, requirement, status, due_date, assigned_to, evidence, last_audit_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO compliance_records (regulation_name, category, requirement, status, due_date, assigned_to, evidence, last_audit_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [regulation_name, category, requirement, status || 'pending_review', due_date, assigned_to, evidence, last_audit_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { regulation_name, category, requirement, status, due_date, assigned_to, evidence, last_audit_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE compliance_records SET regulation_name=$1, category=$2, requirement=$3, status=$4, due_date=$5, assigned_to=$6, evidence=$7, last_audit_date=$8, notes=$9 WHERE id=$10 RETURNING *`,
      [regulation_name, category, requirement, status, due_date, assigned_to, evidence, last_audit_date, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compliance_records WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Record deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
