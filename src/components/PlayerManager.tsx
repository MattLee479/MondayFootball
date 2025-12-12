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
  onClearAll
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
    const player = players.find(p => p.id === id);
    if (player) {
      onUpdatePlayer(id, { [field]: !player[field] });
    }
  };

  // Sort players: attending first, then by name
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.isIn && !b.isIn) return -1;
    if (!a.isIn && b.isIn) return 1;
    return a.name.localeCompare(b.name);
  });

  const attendingPlayers = players.filter(player => player.isIn);
  const paidPlayers = attendingPlayers.filter(player => player.hasPaid);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading players...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Player Roster
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {attendingPlayers.length} attending
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg">£</span>
            {paidPlayers.length} paid
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin notice for non-admins */}
        {!isAdmin && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <Lock className="h-5 w-5 text-warning" />
            <span className="text-sm text-warning">View only - Only admins can modify players</span>
          </div>
        )}

        {/* Add new player and clear all - only for admins */}
        {isAdmin && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="Enter player name..."
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
              />
              <Button onClick={addPlayer} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {players.length > 0 && (
              <Button 
                onClick={onClearAll} 
                variant="outline" 
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Clear All Selections
              </Button>
            )}
          </div>
        )}

        {/* Player list */}
        <div className="space-y-2">
          {sortedPlayers.map((player) => (
            <div
              key={player.id}
              className={`p-3 rounded-lg border transition-all ${
                player.isIn 
                  ? 'bg-success/10 border-success/20' 
                  : 'bg-card border-border'
              }`}
            >
              {/* Player name and badges row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium truncate">{player.name}</span>
                  <div className="flex gap-1 flex-shrink-0">
                    {player.isIn && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                        In
                      </Badge>
                    )}
                    {player.isIn && player.hasPaid && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                        Paid
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Remove button - only for admins */}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemovePlayer(player.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Controls row - only for admins */}
              {isAdmin && (
                <div className="flex items-center gap-4 justify-start">
                  {/* Attending toggle */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground whitespace-nowrap">In</label>
                    <Switch
                      checked={player.isIn}
                      onCheckedChange={() => togglePlayerStatus(player.id, 'isIn')}
                    />
                  </div>

                  {/* Payment toggle - only show if player is attending */}
                  {player.isIn && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground whitespace-nowrap">Paid</label>
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
            <div className="text-center py-8 text-muted-foreground">
              No players added yet. {isAdmin ? 'Add your first player above!' : 'Waiting for admin to add players.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
