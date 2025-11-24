import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, RotateCcw } from 'lucide-react';
import { Player } from './PlayerManager';

interface Team {
  id: 'A' | 'B';
  name: string;
  color: string;
  players: Player[];
}

interface TeamSelectorProps {
  availablePlayers: Player[];
  onTeamsChange: (teams: { teamA: Player[]; teamB: Player[] }) => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({ availablePlayers, onTeamsChange }) => {
  const [teamSize, setTeamSize] = useState<string>('7');
  const [teams, setTeams] = useState<{ A: Team; B: Team }>({
    A: {
      id: 'A',
      name: 'Green Team',
      color: 'team-a',
      players: []
    },
    B: {
      id: 'B',
      name: 'Orange Team', 
      color: 'team-b',
      players: []
    }
  });

  const unassignedPlayers = availablePlayers.filter(
    player => !teams.A.players.find(p => p.id === player.id) && 
               !teams.B.players.find(p => p.id === player.id)
  );

  useEffect(() => {
    onTeamsChange({
      teamA: teams.A.players,
      teamB: teams.B.players
    });
  }, [teams, onTeamsChange]);

  const movePlayerToTeam = (player: Player, targetTeam: 'A' | 'B') => {
    setTeams(prev => {
      // Remove player from current team
      const newTeams = {
        A: { ...prev.A, players: prev.A.players.filter(p => p.id !== player.id) },
        B: { ...prev.B, players: prev.B.players.filter(p => p.id !== player.id) }
      };

      // Add to target team
      newTeams[targetTeam].players.push(player);

      return newTeams;
    });
  };

  const removePlayerFromTeam = (player: Player) => {
    setTeams(prev => ({
      A: { ...prev.A, players: prev.A.players.filter(p => p.id !== player.id) },
      B: { ...prev.B, players: prev.B.players.filter(p => p.id !== player.id) }
    }));
  };

  const randomizeTeams = () => {
    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
    const teamSizeNum = parseInt(teamSize);
    const totalPlayers = availablePlayers.length;
    
    // Calculate team sizes - try to balance but allow for uneven numbers
    let teamASize = Math.floor(totalPlayers / 2);
    let teamBSize = totalPlayers - teamASize;
    
    // If we have a preferred team size, try to get close to it
    if (teamSizeNum <= totalPlayers / 2) {
      teamASize = Math.min(teamSizeNum, totalPlayers);
      teamBSize = Math.min(teamSizeNum, totalPlayers - teamASize);
      
      // If Team B would be too small, redistribute
      if (teamBSize < teamSizeNum - 1 && totalPlayers - teamSizeNum > 0) {
        teamASize = teamSizeNum;
        teamBSize = totalPlayers - teamSizeNum;
      }
    }

    setTeams({
      A: {
        ...teams.A,
        players: shuffled.slice(0, teamASize)
      },
      B: {
        ...teams.B,
        players: shuffled.slice(teamASize, teamASize + teamBSize)
      }
    });
  };

  const clearTeams = () => {
    setTeams({
      A: { ...teams.A, players: [] },
      B: { ...teams.B, players: [] }
    });
  };

  const teamSizeOptions = [
    { value: '5', label: '5 vs 5' },
    { value: '6', label: '6 vs 6' },
    { value: '7', label: '7 vs 7' },
    { value: '8', label: '8 vs 8' },
    { value: '9', label: '9 vs 9' },
    { value: '10', label: '10 vs 10' },
    { value: '11', label: '11 vs 11' },
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Target Team Size:</label>
              <Select value={teamSize} onValueChange={setTeamSize}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamSizeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={randomizeTeams} className="flex items-center gap-2">
                <Shuffle className="h-4 w-4" />
                Randomize Teams
              </Button>
              <Button variant="outline" onClick={clearTeams} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Clear Teams
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {availablePlayers.length} players available • Teams may be slightly unbalanced based on attendance
          </div>
        </CardContent>
      </Card>

      {/* Teams Display */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Team A */}
        <Card className="border-team-a/20">
          <CardHeader className="bg-gradient-team-a text-team-a-foreground">
            <CardTitle className="flex items-center justify-between">
              <span>{teams.A.name}</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {teams.A.players.length} players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {teams.A.players.map(player => (
              <div key={player.id} className="flex items-center justify-between p-2 rounded bg-team-a/5 border border-team-a/20">
                <span className="font-medium">{player.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlayerFromTeam(player)}
                  className="text-team-a hover:bg-team-a/10"
                >
                  Remove
                </Button>
              </div>
            ))}
            {teams.A.players.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No players assigned
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team B */}
        <Card className="border-team-b/20">
          <CardHeader className="bg-gradient-team-b text-team-b-foreground">
            <CardTitle className="flex items-center justify-between">
              <span>{teams.B.name}</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {teams.B.players.length} players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4">
            {teams.B.players.map(player => (
              <div key={player.id} className="flex items-center justify-between p-2 rounded bg-team-b/5 border border-team-b/20">
                <span className="font-medium">{player.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlayerFromTeam(player)}
                  className="text-team-b hover:bg-team-b/10"
                >
                  Remove
                </Button>
              </div>
            ))}
            {teams.B.players.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No players assigned
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {unassignedPlayers.map(player => (
                <div key={player.id} className="flex items-center justify-between p-3 rounded border">
                  <span className="font-medium">{player.name}</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => movePlayerToTeam(player, 'A')}
                      className="bg-team-a hover:bg-team-a/90 text-team-a-foreground"
                    >
                      → Green Team
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => movePlayerToTeam(player, 'B')}
                      className="bg-team-b hover:bg-team-b/90 text-team-b-foreground"
                    >
                      → Orange Team
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};