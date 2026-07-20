-- File: sql/07_hermes_agent_root.sql
-- Mission Control — Hermes Agent Root (D4 forward-only, additive).
--
-- Scope: this migration ONLY adds NULLABLE columns to omk_saas.agents so the
-- AgentRootView (Hermes Mission Control template) can surface richer runtime
-- telemetry. No CHECK constraints are tightened, no NOT NULLs are added, no
-- existing rows are rewritten. Reversal path:
--
--   ALTER TABLE omk_saas.agents
--     DROP COLUMN IF EXISTS hermes_code,
--     DROP COLUMN IF EXISTS channel,
--     DROP COLUMN IF EXISTS state,
--     DROP COLUMN IF EXISTS current_task,
--     DROP COLUMN IF EXISTS load_pct,
--     DROP COLUMN IF EXISTS tokens_today,
--     DROP COLUMN IF EXISTS tasks_today,
--     DROP COLUMN IF EXISTS success_pct,
--     DROP COLUMN IF EXISTS default_model;
--
-- Source-of-truth shape (UI-side): see src/lib/types.ts HerAgentMeta.
-- These columns are agent-runtime telemetry, populated by an ingest pipeline
-- (Phase 2 — out of scope this migration). Until then, AgentRootView derives
-- sane placeholders from existing status/name.

BEGIN;

-- Hermes-style identifier (e.g. "A-00"). Optional UI-only.
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS hermes_code text;

-- Comms channel reference. Free-form text (matches Hermes template).
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS channel text;

-- Live runtime state. Hermes vocabulary (THINKING/EXECUTING/IDLE/RETRY/...).
-- No CHECK constraint to avoid breakage when new states are added.
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS state text;

-- Human-readable description of what the agent is currently working on.
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS current_task text;

-- Live load percentage 0-100. Populated by ingest pipeline.
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS load_pct int;

-- Token consumption rolling 24h. Bigint to keep room for long-horizon growth.
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS tokens_today bigint;

-- Tasks completed in the last 24h.
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS tasks_today int;

-- Success-rate percentage 0-100, two decimals.
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS success_pct numeric(5,2);

-- Default LLM model (free text — "claude-sonnet-4.5", "gemini-2.5-pro", ...).
ALTER TABLE omk_saas.agents
  ADD COLUMN IF NOT EXISTS default_model text;

-- Helpful for mission control queries that sort by load desc + state.
CREATE INDEX IF NOT EXISTS idx_saas_agents_org_load
  ON omk_saas.agents (org_id, load_pct DESC NULLS LAST)
  WHERE load_pct IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_saas_agents_org_state
  ON omk_saas.agents (org_id, state)
  WHERE state IS NOT NULL;

COMMENT ON COLUMN omk_saas.agents.hermes_code      IS 'Hermes-style identifier (e.g. A-00). UI label only.';
COMMENT ON COLUMN omk_saas.agents.channel           IS 'Comms channel reference (telegram / #scout / ...).';
COMMENT ON COLUMN omk_saas.agents.state              IS 'Live runtime state. Hermes vocab (THINKING/EXECUTING/IDLE/RETRY/...).';
COMMENT ON COLUMN omk_saas.agents.current_task       IS 'Free-text description of the work the agent is doing right now.';
COMMENT ON COLUMN omk_saas.agents.load_pct           IS 'Live load percentage 0-100. Populated by ingest pipeline.';
COMMENT ON COLUMN omk_saas.agents.tokens_today       IS 'Rolling 24h token consumption. Populated by ingest pipeline.';
COMMENT ON COLUMN omk_saas.agents.tasks_today        IS 'Tasks completed in the last 24h. Populated by ingest pipeline.';
COMMENT ON COLUMN omk_saas.agents.success_pct        IS 'Success-rate percentage 0-100. Populated by ingest pipeline.';
COMMENT ON COLUMN omk_saas.agents.default_model      IS 'Default LLM model for this agent (free text).';

COMMIT;
