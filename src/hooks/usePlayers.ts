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
      const { data, error } = await supabase
        .from('players')
        .insert({ name, is_in: false, has_paid: false })
        .select()
        .single();

      if (error) throw error;

      const newPlayer: Player = {
        id: data.id,
        name: data.name,
        isIn: data.is_in,
        hasPaid: data.has_paid,
      };

      setPlayers(prev => [...prev, newPlayer]);
      toast.success('Player added');
    } catch (error: any) {
      toast.error('Failed to add player');
      console.error(error);
    }
  };

  const removePlayer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPlayers(prev => prev.filter(p => p.id !== id));
      toast.success('Player removed');
    } catch (error: any) {
      toast.error('Failed to remove player');
      console.error(error);
    }
  };

  const updatePlayer = async (id: string, updates: Partial<Player>) => {
    try {
      const dbUpdates: any = {};
      if ('isIn' in updates) dbUpdates.is_in = updates.isIn;
      if ('hasPaid' in updates) dbUpdates.has_paid = updates.hasPaid;
      if ('name' in updates) dbUpdates.name = updates.name;

      const { error } = await supabase
        .from('players')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setPlayers(prev =>
        prev.map(p => (p.id === id ? { ...p, ...updates } : p))
      );
    } catch (error: any) {
      toast.error('Failed to update player');
      console.error(error);
    }
  };

  const clearAllSelections = async () => {
    try {
      const { error } = await supabase
        .from('players')
        .update({ is_in: false, has_paid: false })
        .in('id', players.map(p => p.id));

      if (error) throw error;

      setPlayers(prev =>
        prev.map(p => ({ ...p, isIn: false, hasPaid: false }))
      );
      toast.success('All selections cleared');
    } catch (error: any) {
      toast.error('Failed to clear selections');
      console.error(error);
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
