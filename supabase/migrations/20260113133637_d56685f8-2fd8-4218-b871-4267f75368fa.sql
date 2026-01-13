-- Add winner column to game_log table for games where score is unknown
ALTER TABLE public.game_log 
ADD COLUMN IF NOT EXISTS winner text;