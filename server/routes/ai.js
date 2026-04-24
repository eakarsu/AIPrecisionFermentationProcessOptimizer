import { Router } from 'express';

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

// POST /api/ai/general-analysis
router.post('/general-analysis', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a comprehensive precision fermentation expert covering all aspects of industrial biotechnology: strain engineering, process optimization, media development, scale-up, quality control, and regulatory compliance. Provide detailed, actionable analysis for fermentation operations.`;
    const userMessage = prompt || `Provide a general fermentation analysis for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI general analysis error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/process-optimization
router.post('/process-optimization', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a cross-process optimization specialist for precision fermentation facilities. Analyze multiple concurrent fermentation processes to identify synergies, shared resource optimization, scheduling improvements, and facility-wide efficiency gains. Consider interactions between processes sharing utilities, media preparation, and downstream processing.`;
    const userMessage = prompt || `Optimize across these fermentation processes: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI process optimization error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/predictive-modeling
router.post('/predictive-modeling', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a bioprocess predictive modeling expert specializing in mechanistic and data-driven models for fermentation. Build predictive models for growth kinetics (Monod, Contois, logistic), product formation (Luedeking-Piret), substrate consumption, and yield optimization. Explain model assumptions, parameters, and limitations.`;
    const userMessage = prompt || `Build a predictive model for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI predictive modeling error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/troubleshooting
router.post('/troubleshooting', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation troubleshooting expert. Diagnose fermentation problems including low yield, slow growth, contamination, foaming, pH drift, oxygen limitation, substrate inhibition, product inhibition, and equipment failures. Provide root cause analysis and step-by-step corrective actions.`;
    const userMessage = prompt || `Troubleshoot this fermentation issue: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI troubleshooting error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/literature-search
router.post('/literature-search', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation science literature expert with deep knowledge of published research in precision fermentation, recombinant protein expression, metabolic engineering, and bioprocess engineering. Summarize relevant research findings, cite key papers and reviews, and suggest experimental approaches based on published literature.`;
    const userMessage = prompt || `Search fermentation literature for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI literature search error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/protocol-generator
router.post('/protocol-generator', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation protocol development specialist. Generate detailed, step-by-step fermentation protocols including media preparation, sterilization procedures, inoculation, process parameters, sampling schedules, harvest criteria, and downstream processing. Include safety considerations and quality checkpoints.`;
    const userMessage = prompt || `Generate a fermentation protocol for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI protocol generator error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/data-interpreter
router.post('/data-interpreter', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation data analysis expert. Interpret experimental fermentation data including growth curves, product titers, substrate consumption profiles, dissolved oxygen traces, pH trends, and off-gas analysis. Identify patterns, anomalies, phase transitions, and correlations. Provide statistical insights and visualization recommendations.`;
    const userMessage = prompt || `Interpret this fermentation data: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI data interpreter error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

// POST /api/ai/scale-up-advisor
router.post('/scale-up-advisor', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are a fermentation scale-up advisor with experience transitioning processes from lab (1-10L) to pilot (50-500L) to production scale (1000L+). Advise on scale-up criteria (constant P/V, constant kLa, constant tip speed, geometric similarity), equipment selection, process parameter translation, risk assessment, and validation strategies for precision fermentation.`;
    const userMessage = prompt || `Provide scale-up advice for: ${JSON.stringify(context)}`;
    const analysis = await callOpenRouterAI(systemPrompt, userMessage);
    res.json({ analysis });
  } catch (err) {
    console.error('AI scale-up advisor error:', err);
    res.status(500).json({ error: 'AI analysis failed' });
  }
});

export default router;
