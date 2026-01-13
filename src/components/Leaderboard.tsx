import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface PlayerStats {
  name: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;
}

interface TeamStats {
  greenWins: number;
  orangeWins: number;
  draws: number;
  totalGames: number;
}

interface GameLog {
  green_team_players: string[];
  orange_team_players: string[];
  green_team_score: number | null;
  orange_team_score: number | null;
  winner: string | null;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats>({ greenWins: 0, orangeWins: 0, draws: 0, totalGames: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('game_log')
        .select('green_team_players, orange_team_players, green_team_score, orange_team_score, winner');

      if (error) throw error;

      // Calculate wins for each player and team stats
      const playerWins: Record<string, { wins: number; gamesPlayed: number }> = {};
      let greenWins = 0;
      let orangeWins = 0;
      let draws = 0;
      let totalGames = 0;

      (data as GameLog[] || []).forEach((game) => {
        let greenWon = false;
        let orangeWon = false;
        let isDraw = false;

        // Check if we have scores or a winner field
        if (game.green_team_score !== null && game.orange_team_score !== null) {
          greenWon = game.green_team_score > game.orange_team_score;
          orangeWon = game.orange_team_score > game.green_team_score;
          isDraw = game.green_team_score === game.orange_team_score;
          totalGames++;
        } else if (game.winner) {
          // Use winner field for games without scores
          greenWon = game.winner === 'green';
          orangeWon = game.winner === 'orange';
          isDraw = game.winner === 'draw';
          totalGames++;
        } else {
          // Skip games with no score and no winner
          return;
        }

        // Count team wins
        if (greenWon) greenWins++;
        if (orangeWon) orangeWins++;
        if (isDraw) draws++;

        // Count games and wins for green team players
        game.green_team_players.forEach((player) => {
          if (!playerWins[player]) {
            playerWins[player] = { wins: 0, gamesPlayed: 0 };
          }
          playerWins[player].gamesPlayed++;
          if (greenWon) {
            playerWins[player].wins++;
          }
        });

        // Count games and wins for orange team players
        game.orange_team_players.forEach((player) => {
          if (!playerWins[player]) {
            playerWins[player] = { wins: 0, gamesPlayed: 0 };
          }
          playerWins[player].gamesPlayed++;
          if (orangeWon) {
            playerWins[player].wins++;
          }
        });
      });

      setTeamStats({ greenWins, orangeWins, draws, totalGames });

      // Convert to array and sort by wins (descending)
      const sortedLeaderboard: PlayerStats[] = Object.entries(playerWins)
        .map(([name, stats]) => ({
          name,
          wins: stats.wins,
          gamesPlayed: stats.gamesPlayed,
          winRate: stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0,
        }))
        .sort((a, b) => {
          // Sort by wins first, then by win rate, then by games played
          if (b.wins !== a.wins) return b.wins - a.wins;
          if (b.winRate !== a.winRate) return b.winRate - a.winRate;
          return b.gamesPlayed - a.gamesPlayed;
        });

      setLeaderboard(sortedLeaderboard);
    } catch (error: any) {
      toast.error('Failed to load leaderboard');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/10 to-gray-400/5 border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/10 to-amber-600/5 border-amber-600/30';
      default:
        return '';
    }
  };

  const greenPercent = teamStats.totalGames > 0 ? (teamStats.greenWins / teamStats.totalGames) * 100 : 0;
  const orangePercent = teamStats.totalGames > 0 ? (teamStats.orangeWins / teamStats.totalGames) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No games with scores recorded yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Save games with scores to start tracking the leaderboard
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Team Win Ratio Card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Team Win Ratio</h3>
            <p className="text-xs text-muted-foreground mt-1">{teamStats.totalGames} games played</p>
          </div>
          
          {/* Win ratio bar */}
          <div className="relative h-10 sm:h-12 rounded-full overflow-hidden bg-muted flex">
            {greenPercent > 0 && (
              <div 
                className="bg-team-a flex items-center justify-center transition-all duration-500"
                style={{ width: `${greenPercent}%` }}
              >
                {greenPercent >= 15 && (
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {teamStats.greenWins}
                  </span>
                )}
              </div>
            )}
            {orangePercent > 0 && (
              <div 
                className="bg-team-b flex items-center justify-center transition-all duration-500"
                style={{ width: `${orangePercent}%` }}
              >
                {orangePercent >= 15 && (
                  <span className="text-white font-bold text-xs sm:text-sm">
                    {teamStats.orangeWins}
                  </span>
                )}
              </div>
            )}
            {teamStats.draws > 0 && (
              <div 
                className="bg-muted-foreground/30 flex items-center justify-center transition-all duration-500"
                style={{ width: `${(teamStats.draws / teamStats.totalGames) * 100}%` }}
              >
                {(teamStats.draws / teamStats.totalGames) * 100 >= 15 && (
                  <span className="text-foreground font-bold text-xs sm:text-sm">
                    {teamStats.draws}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-team-a"></div>
              <span className="font-medium">Green</span>
              <span className="text-muted-foreground">
                {teamStats.greenWins} ({greenPercent.toFixed(0)}%)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-team-b"></div>
              <span className="font-medium">Orange</span>
              <span className="text-muted-foreground">
                {teamStats.orangeWins} ({orangePercent.toFixed(0)}%)
              </span>
            </div>
            {teamStats.draws > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30"></div>
                <span className="font-medium">Draw</span>
                <span className="text-muted-foreground">
                  {teamStats.draws}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Player Leaderboard Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Player Leaderboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Players ranked by total wins on the winning team
          </p>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile-friendly table */}
          <div className="divide-y divide-border">
            {leaderboard.map((player, index) => {
              const rank = index + 1;
              return (
                <div
                  key={player.name}
                  className={`flex items-center justify-between p-4 sm:rounded-lg sm:mb-2 ${getRankBgClass(rank)} ${rank <= 3 ? 'border' : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0">
                      {getRankIcon(rank)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.gamesPlayed} game{player.gamesPlayed !== 1 ? 's' : ''} played
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        {player.wins} win{player.wins !== 1 ? 's' : ''}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {player.winRate.toFixed(0)}% rate
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
