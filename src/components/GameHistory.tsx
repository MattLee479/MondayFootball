import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Users } from 'lucide-react';
import { toast } from 'sonner';

interface GameLog {
  id: string;
  week_date: string;
  green_team_players: string[];
  orange_team_players: string[];
  green_team_score: number | null;
  orange_team_score: number | null;
  attending_players: string[];
  paid_players: string[];
  payment_type: string | null;
  created_at: string;
}

export default function GameHistory() {
  const [games, setGames] = useState<GameLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    try {
      const { data, error } = await supabase.from('game_log').select('*').order('week_date', { ascending: false });

      if (error) throw error;
      setGames(data || []);
    } catch (error: any) {
      toast.error('Failed to load game history');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Loading game history...</p>
        </CardContent>
      </Card>
    );
  }

  if (games.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trophy className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">No games saved yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Save your first game from the Team Selection tab</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {games.map((game) => {
        const greenWon =
          game.green_team_score !== null && game.orange_team_score !== null && game.green_team_score > game.orange_team_score;
        const orangeWon =
          game.green_team_score !== null && game.orange_team_score !== null && game.orange_team_score > game.green_team_score;
        const isTie =
          game.green_team_score !== null && game.orange_team_score !== null && game.green_team_score === game.orange_team_score;

        return (
          <Card key={game.id} className="overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-secondary/35">
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-base sm:text-lg">
                    {new Date(game.week_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                {game.green_team_score !== null && game.orange_team_score !== null && (
                  <div className="flex items-center gap-2">
                    <Badge variant={greenWon ? 'default' : 'outline'} className="min-w-10 justify-center px-3 py-1 text-lg">
                      {game.green_team_score}
                    </Badge>
                    <span className="text-muted-foreground">-</span>
                    <Badge variant={orangeWon ? 'default' : 'outline'} className="min-w-10 justify-center px-3 py-1 text-lg">
                      {game.orange_team_score}
                    </Badge>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-team-a/25 bg-team-a/5 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-team-a" />
                    <span className="font-semibold">Green Team</span>
                    {greenWon && <Trophy className="h-4 w-4 text-warning" />}
                  </div>
                  <div className="space-y-1 pl-1">
                    {game.green_team_players.map((player, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{player}</span>
                        {game.paid_players.includes(player) && (
                          <Badge variant="outline" className="text-xs">
                            Paid
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-team-b/25 bg-team-b/5 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full bg-team-b" />
                    <span className="font-semibold">Orange Team</span>
                    {orangeWon && <Trophy className="h-4 w-4 text-warning" />}
                  </div>
                  <div className="space-y-1 pl-1">
                    {game.orange_team_players.map((player, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{player}</span>
                        {game.paid_players.includes(player) && (
                          <Badge variant="outline" className="text-xs">
                            Paid
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{game.attending_players.length} attended</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {game.paid_players.length}/{game.attending_players.length} paid
                </Badge>
                {game.payment_type && (
                  <Badge variant="secondary" className="text-xs">
                    {game.payment_type === 'everyone_pays' ? 'Everyone Pays' : 'Loser Pays'}
                  </Badge>
                )}
                {isTie && <Badge variant="secondary">Tie Game</Badge>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
