-- Create channels table
CREATE TABLE IF NOT EXISTS public.channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Channels policies (everyone can read channels)
CREATE POLICY "Anyone can view channels"
  ON public.channels
  FOR SELECT
  USING (true);

-- Messages policies
CREATE POLICY "Anyone can view messages"
  ON public.messages
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default channels
INSERT INTO public.channels (name, description) VALUES
  ('general', 'General discussion'),
  ('announcements', 'Important announcements'),
  ('web-dev', 'Web development discussions'),
  ('ai-ml', 'AI and Machine Learning'),
  ('mobile-dev', 'Mobile development'),
  ('blockchain', 'Blockchain and Web3'),
  ('design', 'UI/UX Design'),
  ('career-advice', 'Career tips and advice'),
  ('random', 'Random chat')
ON CONFLICT (name) DO NOTHING;

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;