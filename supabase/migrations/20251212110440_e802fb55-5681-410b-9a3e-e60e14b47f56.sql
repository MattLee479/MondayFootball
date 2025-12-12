-- Create current_teams table for real-time team persistence
CREATE TABLE IF NOT EXISTS public.current_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_player_ids TEXT[] NOT NULL DEFAULT '{}',
  team_b_player_ids TEXT[] NOT NULL DEFAULT '{}',
  team_size INTEGER NOT NULL DEFAULT 7,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.current_teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies - all authenticated users can view
CREATE POLICY "Authenticated users can view current teams"
  ON public.current_teams
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can modify teams
CREATE POLICY "Admins can insert current teams"
  ON public.current_teams
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update current teams"
  ON public.current_teams
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete current teams"
  ON public.current_teams
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Update players table RLS to be view-only for non-admins
DROP POLICY IF EXISTS "Authenticated users can insert players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can update players" ON public.players;
DROP POLICY IF EXISTS "Authenticated users can delete players" ON public.players;

-- Recreate with admin-only permissions
CREATE POLICY "Admins can insert players"
  ON public.players
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update players"
  ON public.players
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete players"
  ON public.players
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime for current_teams
ALTER PUBLICATION supabase_realtime ADD TABLE public.current_teams;