import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Player } from './usePlayers';

interface CurrentTeams {
  teamA: Player[];
  teamB: Player[];
  teamSize: number;
}

export function useCurrentTeams(allPlayers: Player[]) {
  const [teams, setTeams] = useState<CurrentTeams>({
    teamA: [],
    teamB: [],
    teamSize: 7
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load current teams from database
  const loadTeams = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('current_teams')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Map player IDs to actual player objects
        const teamAPlayers = allPlayers.filter(p => 
          data.team_a_player_ids.includes(p.id)
        );
        const teamBPlayers = allPlayers.filter(p => 
          data.team_b_player_ids.includes(p.id)
        );

        setTeams({
          teamA: teamAPlayers,
          teamB: teamBPlayers,
          teamSize: data.team_size
        });
      }
    } catch (error: any) {
      console.error('Error loading teams:', error);
    } finally {
      setIsLoading(false);
    }
  }, [allPlayers]);

  // Save teams to database
  const saveTeams = useCallback(async (newTeams: { teamA: Player[]; teamB: Player[] }, teamSize: number) => {
    // Optimistically update local state first for immediate UI feedback
    setTeams({ ...newTeams, teamSize });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Not authenticated - cannot save teams');
        return;
      }

      const teamData = {
        team_a_player_ids: newTeams.teamA.map(p => p.id),
        team_b_player_ids: newTeams.teamB.map(p => p.id),
        team_size: teamSize,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      };

      // Check if a record exists
      const { data: existing, error: selectError } = await supabase
        .from('current_teams')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking existing teams:', selectError);
        throw selectError;
      }

      if (existing) {
        const { error } = await supabase
          .from('current_teams')
          .update(teamData)
          .eq('id', existing.id);
        if (error) {
          console.error('Error updating teams:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('current_teams')
          .insert(teamData);
        if (error) {
          console.error('Error inserting teams:', error);
          throw error;
        }
      }
    } catch (error: any) {
      console.error('Error saving teams:', error);
      toast.error(error.message || 'Failed to save teams - you may not have admin permissions');
    }
  }, []);

  // Clear teams
  const clearTeams = useCallback(async () => {
    try {
      const { data: existing } = await supabase
        .from('current_teams')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('current_teams')
          .update({
            team_a_player_ids: [],
            team_b_player_ids: [],
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      }

      setTeams(prev => ({ ...prev, teamA: [], teamB: [] }));
    } catch (error: any) {
      console.error('Error clearing teams:', error);
      toast.error(error.message || 'Failed to clear teams');
    }
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('current-teams-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'current_teams'
        },
        () => {
          loadTeams();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTeams]);

  // Load teams when players change
  useEffect(() => {
    if (allPlayers.length > 0) {
      loadTeams();
    }
  }, [allPlayers, loadTeams]);

  return {
    teams,
    isLoading,
    saveTeams,
    clearTeams,
    reloadTeams: loadTeams
  };
}
