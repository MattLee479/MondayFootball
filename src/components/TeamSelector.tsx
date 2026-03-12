import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Shuffle, Users, RotateCcw, Lock } from 'lucide-react';
import { Player } from './PlayerManager';

interface Team {
  id: 'A' | 'B';
  name: string;
  color: string;
  players: Player[];
}

interface TeamSelectorProps {
  availablePlayers: Player[];
  teams: { teamA: Player[]; teamB: Player[] };
  teamSize: number;
  isAdmin: boolean;
  onTeamsChange: (teams: { teamA: Player[]; teamB: Player[] }, teamSize: number) => void;
  onClearTeams: () => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  availablePlayers,
  teams: externalTeams,
  teamSize: externalTeamSize,
  isAdmin,
  onTeamsChange,
  onClearTeams,
}) => {
  const [teamSize, setTeamSize] = useState<string>(externalTeamSize.toString());
  const [teams, setTeams] = useState<{ A: Team; B: Team }>({
    A: {
      id: 'A',
      name: 'Green Team',
      color: 'team-a',
      players: externalTeams.teamA,
    },
    B: {
      id: 'B',
      name: 'Orange Team',
      color: 'team-b',
      players: externalTeams.teamB,
    },
  });

  useEffect(() => {
    setTeams({
      A: {
        id: 'A',
        name: 'Green Team',
        color: 'team-a',
        players: externalTeams.teamA,
      },
      B: {
        id: 'B',
        name: 'Orange Team',
        color: 'team-b',
        players: externalTeams.teamB,
      },
    });
    setTeamSize(externalTeamSize.toString());
  }, [externalTeams, externalTeamSize]);

  const unassignedPlayers = availablePlayers.filter(
    (player) => !teams.A.players.find((p) => p.id === player.id) && !teams.B.players.find((p) => p.id === player.id)
  );

  const movePlayerToTeam = (player: Player, targetTeam: 'A' | 'B') => {
    if (!isAdmin) return;

    const newTeams = {
      A: { ...teams.A, players: teams.A.players.filter((p) => p.id !== player.id) },
      B: { ...teams.B, players: teams.B.players.filter((p) => p.id !== player.id) },
    };
    newTeams[targetTeam].players.push(player);

    setTeams(newTeams);
    onTeamsChange({ teamA: newTeams.A.players, teamB: newTeams.B.players }, parseInt(teamSize));
  };

  const removePlayerFromTeam = (player: Player) => {
    if (!isAdmin) return;

    const newTeams = {
      A: { ...teams.A, players: teams.A.players.filter((p) => p.id !== player.id) },
      B: { ...teams.B, players: teams.B.players.filter((p) => p.id !== player.id) },
    };

    setTeams(newTeams);
    onTeamsChange({ teamA: newTeams.A.players, teamB: newTeams.B.players }, parseInt(teamSize));
  };

  const randomizeTeams = () => {
    if (!isAdmin) return;

    const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
    const teamSizeNum = parseInt(teamSize);
    const totalPlayers = availablePlayers.length;

    let teamASize = Math.floor(totalPlayers / 2);
    let teamBSize = totalPlayers - teamASize;

    if (teamSizeNum <= totalPlayers / 2) {
      teamASize = Math.min(teamSizeNum, totalPlayers);
      teamBSize = Math.min(teamSizeNum, totalPlayers - teamASize);

      if (teamBSize < teamSizeNum - 1 && totalPlayers - teamSizeNum > 0) {
        teamASize = teamSizeNum;
        teamBSize = totalPlayers - teamSizeNum;
      }
    }

    const newTeamA = shuffled.slice(0, teamASize);
    const newTeamB = shuffled.slice(teamASize, teamASize + teamBSize);

    const newTeams = {
      A: { ...teams.A, players: newTeamA },
      B: { ...teams.B, players: newTeamB },
    };

    setTeams(newTeams);
    onTeamsChange({ teamA: newTeamA, teamB: newTeamB }, teamSizeNum);
  };

  const handleClearTeams = () => {
    if (!isAdmin) return;
    onClearTeams();
  };

  const handleTeamSizeChange = (value: string) => {
    setTeamSize(value);
    onTeamsChange({ teamA: teams.A.players, teamB: teams.B.players }, parseInt(value));
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
      {!isAdmin && (
        <Card className="border-warning/25 bg-warning/5">
          <CardContent className="flex items-center gap-2 p-4">
            <Lock className="h-5 w-5 text-warning" />
            <span className="text-sm text-warning">View only - Only admins can modify teams</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b border-border/60 bg-secondary/35">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold">Target Team Size:</label>
              <Select value={teamSize} onValueChange={handleTeamSizeChange} disabled={!isAdmin}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teamSizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={randomizeTeams} className="gap-2">
                  <Shuffle className="h-4 w-4" />
                  Randomize Teams
                </Button>
                <Button variant="outline" onClick={handleClearTeams} className="gap-2">
                  <RotateCcw className="h-4 w-4" />
                  Clear Teams
                </Button>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            {availablePlayers.length} players available. Teams may be slightly unbalanced based on attendance.
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-team-a/25 overflow-hidden">
          <CardHeader className="bg-gradient-team-a text-team-a-foreground">
            <CardTitle className="flex items-center justify-between">
              <span>{teams.A.name}</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {teams.A.players.length} players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 min-h-[140px]">
            {teams.A.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl border border-team-a/20 bg-team-a/5 p-2.5">
                <span className="font-medium">{player.name}</span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayerFromTeam(player)}
                    className="text-team-a hover:bg-team-a/10"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {teams.A.players.length === 0 && <div className="py-4 text-center text-muted-foreground">No players assigned</div>}
          </CardContent>
        </Card>

        <Card className="border-team-b/25 overflow-hidden">
          <CardHeader className="bg-gradient-team-b text-team-b-foreground">
            <CardTitle className="flex items-center justify-between">
              <span>{teams.B.name}</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {teams.B.players.length} players
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 min-h-[140px]">
            {teams.B.players.map((player) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl border border-team-b/20 bg-team-b/5 p-2.5">
                <span className="font-medium">{player.name}</span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayerFromTeam(player)}
                    className="text-team-b hover:bg-team-b/10"
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
            {teams.B.players.length === 0 && <div className="py-4 text-center text-muted-foreground">No players assigned</div>}
          </CardContent>
        </Card>
      </div>

      {unassignedPlayers.length > 0 && (
        <Card>
          <CardHeader className="border-b border-border/60 bg-secondary/30">
            <CardTitle>Available Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {unassignedPlayers.map((player) => (
                <div key={player.id} className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">{player.name}</span>
                  {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => movePlayerToTeam(player, 'A')} className="bg-team-a text-team-a-foreground hover:bg-team-a/90">
                        -&gt; Green Team
                      </Button>
                      <Button size="sm" onClick={() => movePlayerToTeam(player, 'B')} className="bg-team-b text-team-b-foreground hover:bg-team-b/90">
                        -&gt; Orange Team
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
