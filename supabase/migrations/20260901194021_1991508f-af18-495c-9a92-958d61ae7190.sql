CREATE TABLE public.sync_state (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  device_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_state TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_state TO authenticated;
GRANT ALL ON public.sync_state TO service_role;

ALTER TABLE public.sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "App devices can read sync state" ON public.sync_state FOR SELECT USING (true);
CREATE POLICY "App devices can insert sync state" ON public.sync_state FOR INSERT WITH CHECK (true);
CREATE POLICY "App devices can update sync state" ON public.sync_state FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.sync_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_state;