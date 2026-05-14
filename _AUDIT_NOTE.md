# Audit Note — AIPrecisionFermentationProcessOptimizer

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_06.md` section #29.

## Original Recommendations

### Gaps — AI Counterparts
- `/strain-performance-predict` (added)
- `/quality-anomaly-detect` (added)
- `/cost-optimization`

### Gaps — Non-AI Features
- SCADA/IIoT integration
- Analytical lab integration (HPLC, mass spec)
- Downstream processing
- cGMP/FDA compliance documentation

### Custom Feature Suggestions
1. Agentic process optimization (real-time)
2. Contamination risk early warning
3. Scale-up protocol generator (already exists as `/scale-up-advisor`)
4. Media optimization ensemble
5. Cross-batch learning

## Implemented (Mechanical)
- `POST /api/ai/strain-performance-predict` — added in `server/routes/ai.js`. Predicts growth rate, yield, titer, stress response, fermentation time, risks. Persists via `persistAnalysis`.
- `POST /api/ai/quality-anomaly-detect` — added in `server/routes/ai.js`. Pulls QC results by `batch_id` (or accepts inline) and returns flagged anomalies with severity and corrective actions.

Both follow existing ESM `callOpenRouterAI`/`parseAIJson`/`persistAnalysis` style.

## Backlog (deferred)

### NEEDS-CREDS / NEW-DEPS
- SCADA/IIoT (OPC-UA, MQTT brokers).
- HPLC/mass-spec lab data integration.

### NEEDS-PRODUCT-DECISION
- `/cost-optimization` — needs cost-per-component data model.
- cGMP/FDA documentation templates.
- Cross-batch ML model storage (separate from prompt-based AI).

### TOO-RISKY
- Agentic real-time process control (safety/regulatory).
- Media optimization ensemble (real ML training pipeline outside this scope).

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS — FE already wired.
- **Stack:** Vite-React (client) + Express (server).
- `client/src/App.jsx` routes 24 pages including the dedicated AI pages: `AICenterPage`, `OptimizationPage`, `ContaminationRiskPage`, `YieldPredictionPage`, `SOPGeneratorPage`, `BatchComparisonPage`, `AIHistoryPage`, plus the two apply-pass-2 additions `StrainPerformancePredictPage` (`/strain-performance-predict`) and `QualityAnomalyDetectPage` (`/quality-anomaly-detect`).
- JWT/auth flows through `api.js` (`localStorage.getItem('token')`).
- All backend AI endpoints in `server/routes/ai.js` are reachable from the FE.

## Apply pass 4 (mechanical backlog)

SKIPPED. The remaining backlog item `/cost-optimization` is NEEDS-PRODUCT-DECISION (depends on a cost-per-component data model). All other items are TOO-RISKY (agentic real-time control, ensemble training pipeline) or NEEDS-CREDS (SCADA/IIoT, HPLC/mass-spec). The two missing AI counterparts in the original audit (`/strain-performance-predict`, `/quality-anomaly-detect`) were already implemented in apply pass 2.
