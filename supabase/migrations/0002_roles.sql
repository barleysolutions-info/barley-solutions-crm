-- ============================================================
-- Roles: admin / sales, for the /admin user-management page
-- ============================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'sales');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

-- Every authenticated user can see who has which role (needed for the "Uživatelé"
-- nav item / admin page gating); only admins can grant/revoke (enforced in the
-- admin server functions via has_role(), not by an INSERT/UPDATE/DELETE policy
-- here — writes go through supabaseAdmin, which bypasses RLS by design).
CREATE POLICY "user_roles_select" ON public.user_roles FOR SELECT TO authenticated USING (true);

-- Every existing user gets 'sales'; the oldest account also becomes 'admin'.
-- Relevant the first time this migration runs against a project that already
-- has signed-up users; a no-op on a brand-new project.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'sales'::public.app_role FROM auth.users
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users ORDER BY created_at ASC LIMIT 1
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'sales')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();
