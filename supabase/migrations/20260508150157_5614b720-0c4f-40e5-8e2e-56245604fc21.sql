-- Jobs table
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

CREATE POLICY "Jobs viewable by authenticated"
  ON public.jobs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Alumni and admins create jobs"
  ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = posted_by AND (
      public.has_role(auth.uid(), 'alumni') OR public.has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Posters update own jobs"
  ON public.jobs FOR UPDATE TO authenticated
  USING (auth.uid() = posted_by OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Posters delete own jobs"
  ON public.jobs FOR DELETE TO authenticated
  USING (auth.uid() = posted_by OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER jobs_touch_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Job applications
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

CREATE POLICY "Students create applications"
  ON public.job_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "View related applications"
  ON public.job_applications FOR SELECT TO authenticated
  USING (
    auth.uid() = student_id
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Posters update applications"
  ON public.job_applications FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- Seed a few jobs (will only insert if at least one alumni profile exists)
INSERT INTO public.jobs (posted_by, title, company, location, job_type, description, apply_link)
SELECT id, 'Software Engineer Intern', COALESCE(NULLIF(company,''), 'Tech Corp'), 'Remote', 'internship',
  'Join our team for a 12-week internship working on production systems. Strong fundamentals in JS/Python required.',
  'https://example.com/apply'
FROM public.profiles
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role = 'alumni')
LIMIT 1;