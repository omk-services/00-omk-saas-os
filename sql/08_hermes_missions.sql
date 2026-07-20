-- File: sql/08_hermes_missions.sql
-- Hermes Mission Control — Missions/Kanban board (D4 forward-only, additive).
--
-- Scope: this migration adds the `omk_saas.missions` table for the Kanban
-- board (Tasks view). Nullable columns, no NOT NULL on optional fields, no
-- trigger that touches existing rows. Reversal path:
--
--   DROP TABLE IF EXISTS omk_saas.missions;
--
-- Status column matches the 3-column Kanban: 'todo' | 'doing' | 'done'.
-- Priority is free text ('P1', 'P2', 'P3' per Hermes template).

BEGIN;

CREATE TABLE IF NOT EXISTS omk_saas.missions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid        NOT NULL REFERENCES omk_saas.organizations(id) ON DELETE CASCADE,
  agent_id   uuid                 REFERENCES omk_saas.agents(id)       ON DELETE SET NULL,
  title      text        NOT NULL,
  priority   text        NOT NULL DEFAULT 'P2',
  status     text        NOT NULL DEFAULT 'todo',
  position   int         NOT NULL DEFAULT 0,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_saas_missions_status   CHECK (status   IN ('todo','doing','done')),
  CONSTRAINT chk_saas_missions_priority CHECK (priority IN ('P1','P2','P3'))
);

CREATE INDEX IF NOT EXISTS idx_saas_missions_org_id     ON omk_saas.missions (org_id);
CREATE INDEX IF NOT EXISTS idx_saas_missions_org_status ON omk_saas.missions (org_id, status, position);
CREATE INDEX IF NOT EXISTS idx_saas_missions_agent_id   ON omk_saas.missions (agent_id);

DROP TRIGGER IF EXISTS trg_saas_missions_set_updated_at ON omk_saas.missions;
CREATE TRIGGER trg_saas_missions_set_updated_at
  BEFORE UPDATE ON omk_saas.missions
  FOR EACH ROW EXECUTE FUNCTION omk_saas.fn_set_updated_at();

COMMENT ON TABLE  omk_saas.missions                 IS 'Hermes Mission Board (Kanban). One row per mission card.';
COMMENT ON COLUMN omk_saas.missions.priority        IS 'P1 critical · P2 high (default) · P3 normal.';
COMMENT ON COLUMN omk_saas.missions.status          IS 'Kanban column: todo (default) · doing · done.';
COMMENT ON COLUMN omk_saas.missions.position        IS 'Sort position within the column. Lower = higher.';
COMMENT ON COLUMN omk_saas.missions.notes           IS 'Free-text notes / brief content.';

-- RLS follows the same pattern as other tenant tables. Org_id is injected
-- server-side by the JWT custom_access_token_hook (ADR-OMK-001).
ALTER TABLE omk_saas.missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saas_missions_select ON omk_saas.missions;
DROP POLICY IF EXISTS saas_missions_insert ON omk_saas.missions;
DROP POLICY IF EXISTS saas_missions_update ON omk_saas.missions;
DROP POLICY IF EXISTS saas_missions_delete ON omk_saas.missions;

CREATE POLICY saas_missions_select ON omk_saas.missions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM omk_saas.memberships m
      WHERE m.user_id = auth.uid()
        AND (m.org_id_ref = org_id OR m.org_id = org_id)
    )
  );

CREATE POLICY saas_missions_insert ON omk_saas.missions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM omk_saas.memberships m
      WHERE m.user_id = auth.uid()
        AND (m.org_id_ref = org_id OR m.org_id = org_id)
    )
  );

CREATE POLICY saas_missions_update ON omk_saas.missions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM omk_saas.memberships m
      WHERE m.user_id = auth.uid()
        AND (m.org_id_ref = org_id OR m.org_id = org_id)
    )
  );

CREATE POLICY saas_missions_delete ON omk_saas.missions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM omk_saas.memberships m
      WHERE m.user_id = auth.uid()
        AND (m.org_id_ref = org_id OR m.org_id = org_id)
    )
  );

COMMIT;
