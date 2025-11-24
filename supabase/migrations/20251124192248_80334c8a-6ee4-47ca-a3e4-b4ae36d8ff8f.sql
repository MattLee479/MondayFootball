-- Add payment_type column to game_log table
ALTER TABLE public.game_log 
ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'everyone_pays' CHECK (payment_type IN ('everyone_pays', 'loser_pays'));