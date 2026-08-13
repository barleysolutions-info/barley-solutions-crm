-- ============================================================
-- Barley Sales Hub — initial schema
-- ============================================================

-- ---------- Enums ----------

CREATE TYPE public.lead_stage AS ENUM (
  'new_lead',
  'contacted',
  'qualified',
  'kickoff',
  'proposal',
  'negotiation',
  'won',
  'lost'
);

CREATE TYPE public.lead_source AS ENUM ('cold', 'warm', 'referral');

CREATE TYPE public.activity_kind AS ENUM ('note', 'call', 'email', 'meeting', 'stage_change');

-- ---------- reps: standalone roster, NOT tied to auth.users ----------

CREATE TABLE public.reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX reps_active_idx ON public.reps (active);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reps TO authenticated;
GRANT ALL ON public.reps TO service_role;
ALTER TABLE public.reps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reps_select" ON public.reps FOR SELECT TO authenticated USING (true);
CREATE POLICY "reps_insert" ON public.reps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "reps_update" ON public.reps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reps_delete" ON public.reps FOR DELETE TO authenticated USING (true);
-- ASSUMPTION: any authenticated user can manage the roster (small trusted team).
-- Prefer deactivating (active=false) over deleting a rep who has lead history,
-- since the FKs below use ON DELETE RESTRICT.

-- ---------- leads: the pipeline ----------

CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- identity
  name TEXT NOT NULL,
  ico TEXT,
  dic TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  legal_form TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  niche TEXT,

  -- classification
  source public.lead_source NOT NULL DEFAULT 'cold',
  stage public.lead_stage NOT NULL DEFAULT 'new_lead',

  -- ownership (reps roster — NOT auth.users)
  owner_rep_id UUID REFERENCES public.reps (id) ON DELETE RESTRICT,
  sourced_by_rep_id UUID REFERENCES public.reps (id) ON DELETE RESTRICT,
  closed_by_rep_id UUID REFERENCES public.reps (id) ON DELETE RESTRICT,

  -- deal economics
  value_czk NUMERIC,             -- what Barley Solutions earns from this deal
  customer_value_czk NUMERIC,    -- whiteboard step 4 "povinné číslo do CRM": what ONE end
                                  -- customer is worth to the client's business. Required
                                  -- before leaving "kickoff" — enforced in the
                                  -- moveLeadStage server function, not a DB constraint,
                                  -- since it only becomes required conditionally on stage.

  -- outcome
  lost_reason TEXT,              -- whiteboard step 7B "povinné pole" — required before
                                  -- closing as lost, enforced server-side, not here

  -- notes / AI
  notes TEXT,
  ai_summary TEXT,

  -- follow-up (drives the TODO tab)
  next_follow_up DATE,
  follow_up_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX leads_stage_idx ON public.leads (stage);
CREATE INDEX leads_follow_up_idx ON public.leads (next_follow_up);
CREATE INDEX leads_owner_idx ON public.leads (owner_rep_id);
CREATE INDEX leads_source_idx ON public.leads (source);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Everyone on the team sees every lead — explicit requirement.
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (true);
-- ASSUMPTION (not specified by the user): any authenticated user may also
-- create/edit/delete any lead — small trusted team. Tighten to owner-only
-- later (would need a reps.user_id column mapping to auth.uid()) if needed.
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (true);

-- ---------- activities: audit trail / notes log per lead ----------

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  kind public.activity_kind NOT NULL DEFAULT 'note',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activities_lead_idx ON public.activities (lead_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO authenticated;
GRANT ALL ON public.activities TO service_role;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "activities_insert" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Author-only edit/delete keeps the audit trail honest even though leads
-- themselves are team-editable.
CREATE POLICY "activities_update" ON public.activities FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "activities_delete" ON public.activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ---------- triggers ----------

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reps_updated_at BEFORE UPDATE ON public.reps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
