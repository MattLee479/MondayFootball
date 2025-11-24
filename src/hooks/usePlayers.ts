import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Player {
  id: string;
  name: string;
  isIn: boolean;
  hasPaid: boolean;
}

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Verify Supabase configuration on mount
  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    console.log('Supabase Configuration Check:', {
      url: supabaseUrl,
      hasKey: !!supabaseKey,
      keyLength: supabaseKey?.length || 0
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('CRITICAL: Missing Supabase environment variables!');
      toast.error('Configuration error. Please check environment variables.');
    }
  }, []);

  // Load players from Supabase
  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (error) throw error;

      const formattedPlayers: Player[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        isIn: p.is_in,
        hasPaid: p.has_paid,
      }));

      setPlayers(formattedPlayers);
    } catch (error: any) {
      toast.error('Failed to load players');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPlayer = async (name: string) => {
    try {
      // Ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const { data, error } = await supabase
        .from('players')
        .insert({ name, is_in: false, has_paid: false })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      const newPlayer: Player = {
        id: data.id,
        name: data.name,
        isIn: data.is_in,
        hasPaid: data.has_paid,
      };

      setPlayers(prev => [...prev, newPlayer]);
      toast.success('Player added');
    } catch (error: any) {
      console.error('Add player error details:', error);
      toast.error(error.message || 'Failed to add player');
    }
  };

  const removePlayer = async (id: string) => {
    try {
      // Ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      setPlayers(prev => prev.filter(p => p.id !== id));
      toast.success('Player removed');
    } catch (error: any) {
      console.error('Remove player error details:', error);
      toast.error(error.message || 'Failed to remove player');
    }
  };

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      // Ensure we have a valid session before updating
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const dbUpdates: any = {};
      if ('isIn' in updates) dbUpdates.is_in = updates.isIn;
      if ('hasPaid' in updates) dbUpdates.has_paid = updates.hasPaid;
      if ('name' in updates) dbUpdates.name = updates.name;

      const { error } = await supabase
        .from('players')
        .update(dbUpdates)
        .eq('id', id);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      setPlayers(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updates } : p))
      );
    } catch (error: any) {
      console.error('Update player error details:', error);
      toast.error(error.message || 'Failed to update player');
    }
  };

  const clearAllSelections = async () => {
    try {
      // Ensure we have a valid session before updating
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated. Please log in again.');
      }

      const { error } = await supabase
        .from('players')
        .update({ is_in: false, has_paid: false })
        .in('id', players.map(p => p.id));

      if (error) {
        console.error('Supabase clear all error:', error);
        throw error;
      }

      setPlayers(prev =>
        prev.map(p => ({ ...p, isIn: false, hasPaid: false }))
      );
      toast.success('All selections cleared');
    } catch (error: any) {
      console.error('Clear selections error details:', error);
      toast.error(error.message || 'Failed to clear selections');
    }
  };

  return {
    players,
    isLoading,
    addPlayer,
    removePlayer,
    updatePlayer,
    clearAllSelections,
    reloadPlayers: loadPlayers,
  };
}
