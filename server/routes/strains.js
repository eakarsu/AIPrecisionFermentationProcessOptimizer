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
    const systemPrompt = `You are a microbial genetics and strain engineering expert specializing in precision fermentation organisms (Pichia pastoris, E. coli, Aspergillus, Trichoderma, etc.). Recommend strain modifications, genetic engineering strategies, and selection approaches to improve product yield, growth rate, and robustness for industrial fermentation.`;
    const userMessage = prompt || `Analyze this strain data and recommend modifications for better yield: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    pool.query('INSERT INTO ai_analyses (user_id, endpoint, process_id, result) VALUES ($1,$2,$3,$4)', [req.user?.id, 'strains/ai-analyze', context?.id || null, analysis]).catch(() => {});
    res.json({ analysis });
  } catch (err) {
    console.error('AI analyze error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const [rows, count] = await Promise.all([
      pool.query('SELECT * FROM strains ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) FROM strains'),
    ]);
    const total = parseInt(count.rows[0].count);
    res.json({ data: rows.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM strains WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Strain not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, organism_type, source, genetic_modifications, optimal_temp, optimal_ph, growth_rate, product_yield, resistance_markers, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO strains (name, organism_type, source, genetic_modifications, optimal_temp, optimal_ph, growth_rate, product_yield, resistance_markers, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, organism_type, source, genetic_modifications, optimal_temp, optimal_ph, growth_rate, product_yield, resistance_markers, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, organism_type, source, genetic_modifications, optimal_temp, optimal_ph, growth_rate, product_yield, resistance_markers, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE strains SET name=$1, organism_type=$2, source=$3, genetic_modifications=$4, optimal_temp=$5, optimal_ph=$6, growth_rate=$7, product_yield=$8, resistance_markers=$9, status=$10, notes=$11 WHERE id=$12 RETURNING *`,
      [name, organism_type, source, genetic_modifications, optimal_temp, optimal_ph, growth_rate, product_yield, resistance_markers, status, notes, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Strain not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM strains WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Strain not found' });
    res.json({ message: 'Strain deleted', deleted: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
