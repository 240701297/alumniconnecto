# Switching to your own Supabase project

Right now AlumniHub runs on **Lovable Cloud** (a managed Supabase that Lovable provisions for you). If you want full control of the database — your own dashboard, your own billing, your own region — follow this guide to migrate to your personal Supabase project.

> ⚠️ This is a **one-way** migration. Existing user accounts and data live in the current Lovable Cloud DB and won't automatically move. If you have important data, export it first (Supabase dashboard → Database → Backups → SQL dump). For a fresh start, just skip the export.

---

## 1. Create your Supabase project

1. Sign up at https://supabase.com (free tier is fine).
2. Click **New project** → choose an org, name it "AlumniHub", pick a region close to your users, set a strong DB password.
3. Wait ~2 minutes for provisioning.

In **Project Settings → API** you'll see:
- **Project URL** — looks like `https://xxxxxxxx.supabase.co`
- **anon public key** — a long JWT
- **service_role key** — keep this secret, server-side only

---

## 2. Apply the schema

Open **SQL Editor** in your new Supabase dashboard and run this entire script:

```sql
-- ===== Enums =====
CREATE TYPE public.app_role AS ENUM ('admin', 'alumni', 'student');
CREATE TYPE public.request_status AS ENUM ('pending', 'accepted', 'rejected');

-- ===== Profiles =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  graduation_year INTEGER,
  bio TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ===== User roles =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Roles viewable by authenticated" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ===== Events =====
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by authenticated" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Announcements =====
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements viewable by authenticated" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ===== Messages =====
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users view own messages" ON public.messages FOR SELECT TO authenticated
  USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ===== Connection requests =====
CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  alumni_id UUID NOT NULL,
  message TEXT DEFAULT '',
  status public.request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students create requests" ON public.connection_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users view own requests" ON public.connection_requests FOR SELECT TO authenticated
  USING ((auth.uid() = student_id) OR (auth.uid() = alumni_id));
CREATE POLICY "Alumni update own requests" ON public.connection_requests FOR UPDATE TO authenticated USING (auth.uid() = alumni_id);

-- ===== Jobs =====
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT DEFAULT '',
  job_type TEXT NOT NULL DEFAULT 'full-time',
  description TEXT NOT NULL DEFAULT '',
  apply_link TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs viewable by authenticated" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Alumni and admins create jobs" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = posted_by AND (public.has_role(auth.uid(),'alumni') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "Posters update own jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (auth.uid() = posted_by OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Posters delete own jobs" ON public.jobs FOR DELETE TO authenticated
  USING (auth.uid() = posted_by OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, student_id)
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students create applications" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "View related applications" ON public.job_applications FOR SELECT TO authenticated
  USING (auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid())
    OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Posters update applications" ON public.job_applications FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid())
    OR public.has_role(auth.uid(),'admin'));

-- ===== Triggers =====
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER cr_touch BEFORE UPDATE ON public.connection_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_role public.app_role;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  INSERT INTO public.profiles (id, full_name, email, company, job_title, graduation_year, bio)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company',''),
    COALESCE(NEW.raw_user_meta_data->>'job_title',''),
    NULLIF(NEW.raw_user_meta_data->>'graduation_year','')::int,
    COALESCE(NEW.raw_user_meta_data->>'bio',''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, user_role);
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 3. Point the app at your project

Update the project's `.env` (Lovable will normally regenerate this — replace the values manually if you must):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...your-anon-key...
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT
```

> Lovable manages `src/integrations/supabase/client.ts` and `types.ts`. To use a different Supabase, the cleanest path is to **disconnect Lovable Cloud first** (Connectors → Lovable Cloud → Disable for new projects). For an existing Cloud-enabled project the simpler workflow is to keep using Lovable Cloud and just stop using the dashboard you don't have access to.

---

## 4. Edge functions & secrets

Deploy the three functions in `supabase/functions/` to your project:

```bash
npx supabase login
npx supabase link --project-ref YOUR-PROJECT
npx supabase functions deploy career-chat
npx supabase functions deploy match-alumni
npx supabase functions deploy claim-admin
```

Set the required secrets in **Project Settings → Edge Functions → Secrets**:
- `LOVABLE_API_KEY` → get from Lovable workspace settings (or use your own OpenAI/Gemini key by editing the functions)
- `ADMIN_SECRET_CODE` → a strong random string only your admins know

---

## 5. Recommendation

Honestly? **Stick with Lovable Cloud** for now unless you have a hard reason to leave. It's the same Supabase under the hood, but Lovable already handles secrets, type generation, edge function deploys, env vars, and auth wiring for you. The migration guide above is here for when you're ready.
