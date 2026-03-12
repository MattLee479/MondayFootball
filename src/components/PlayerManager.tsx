import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Loader2, Lock } from 'lucide-react';

export interface Player {
  id: string;
  name: string;
  isIn: boolean;
  hasPaid: boolean;
}

interface PlayerManagerProps {
  players: Player[];
  isLoading?: boolean;
  isAdmin: boolean;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: string) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onClearAll: () => void;
}

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  isLoading = false,
  isAdmin,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
  onClearAll,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');

  const addPlayer = () => {
    if (newPlayerName.trim() && isAdmin) {
      onAddPlayer(newPlayerName.trim());
      setNewPlayerName('');
    }
  };

  const togglePlayerStatus = (id: string, field: 'isIn' | 'hasPaid') => {
    if (!isAdmin) return;
    const player = players.find((p) => p.id === id);
    if (player) {
      onUpdatePlayer(id, { [field]: !player[field] });
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isIn && !b.isIn) return -1;
    if (!a.isIn && b.isIn) return 1;
    return a.name.localeCompare(b.name);
  });

  const attendingPlayers = players.filter((player) => player.isIn);
  const paidPlayers = attendingPlayers.filter((player) => player.hasPaid);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading players...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-secondary/35">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Player Roster
        </CardTitle>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {attendingPlayers.length} attending
          </div>
          <div className="flex items-center gap-1">
            <span className="font-semibold">GBP</span>
            {paidPlayers.length} paid
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isAdmin && (
          <div className="flex items-center gap-2 rounded-xl border border-warning/25 bg-warning/10 p-3">
            <Lock className="h-5 w-5 text-warning" />
            <span className="text-sm text-warning">View only - Only admins can modify players</span>
          </div>
        )}

        {isAdmin && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter player name..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              />
              <Button onClick={addPlayer} size="sm" className="px-4">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {players.length > 0 && (
              <Button
                onClick={onClearAll}
                variant="outline"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Clear All Selections
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`rounded-xl border p-3 transition-all ${
                player.isIn
                  ? 'border-success/25 bg-success/10 shadow-sm'
                  : 'border-border/70 bg-card/70 hover:bg-secondary/40'
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="truncate font-medium">{player.name}</span>
                  <div className="flex shrink-0 gap-1">
                    {player.isIn && (
                      <Badge variant="outline" className="border-success/25 bg-success/10 text-xs text-success">
                        In
                      </Badge>
                    )}
                    {player.isIn && player.hasPaid && (
                      <Badge variant="outline" className="border-warning/25 bg-warning/10 text-xs text-warning">
                        Paid
                      </Badge>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePlayer(player.id)}
                    className="ml-2 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center justify-start gap-4">
                  <div className="flex items-center gap-2">
                    <label className="whitespace-nowrap text-sm text-muted-foreground">In</label>
                    <Switch
                      checked={player.isIn}
                      onCheckedChange={() => togglePlayerStatus(player.id, 'isIn')}
                    />
                  </div>

                  {player.isIn && (
                    <div className="flex items-center gap-2">
                      <label className="whitespace-nowrap text-sm text-muted-foreground">Paid</label>
                      <Switch
                        checked={player.hasPaid}
                        onCheckedChange={() => togglePlayerStatus(player.id, 'hasPaid')}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {players.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No players added yet. {isAdmin ? 'Add your first player above!' : 'Waiting for admin to add players.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

