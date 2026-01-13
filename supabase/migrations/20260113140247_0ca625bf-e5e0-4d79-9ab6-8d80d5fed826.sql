-- Drop existing permissive policies for game_log INSERT and UPDATE
DROP POLICY IF EXISTS "Authenticated users can insert game logs" ON public.game_log;
DROP POLICY IF EXISTS "Authenticated users can update game logs" ON public.game_log;

-- Create admin-only INSERT policy
CREATE POLICY "Admins can insert game logs"
  ON public.game_log
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create admin-only UPDATE policy
CREATE POLICY "Admins can update game logs"
  ON public.game_log
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create admin-only DELETE policy (currently missing)
CREATE POLICY "Admins can delete game logs"
  ON public.game_log
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));