import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PlayerManager } from '@/components/PlayerManager';
import { usePlayers } from '@/hooks/usePlayers';
import { useUserRole } from '@/hooks/useUserRole';
import { useCurrentTeams } from '@/hooks/useCurrentTeams';
import { TeamSelector } from '@/components/TeamSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Trophy, Clock, History, Shield } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import GameHistory from '@/components/GameHistory';
import SaveGameDialog from '@/components/SaveGameDialog';
import type { User, Session } from '@supabase/supabase-js';
import type { Player } from '@/hooks/usePlayers';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { 
    players, 
    isLoading: playersLoading,
    addPlayer,
    removePlayer,
    updatePlayer,
    clearAllSelections,
    reloadPlayers
  } = usePlayers();
  
  const attendingPlayers = players.filter(player => player.isIn);
  const { teams, saveTeams, clearTeams } = useCurrentTeams(attendingPlayers);

  // Auth check
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Enhanced clear all that also clears teams
  const handleClearAll = async () => {
    await clearAllSelections();
    await clearTeams();
  };

  const paidPlayers = attendingPlayers.filter(player => player.hasPaid);
  const unpaidPlayers = attendingPlayers.filter(player => !player.hasPaid);

  if (isLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Header */}
      <div className="bg-gradient-primary text-primary-foreground py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Trophy className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Monday Night Football</h1>
            {isAdmin && (
              <Badge className="bg-white/20 text-white">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <Calendar className="h-4 w-4" />
              <span>Weekly Session Tracker</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <Users className="h-4 w-4" />
              <span>{attendingPlayers.length} Playing</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4" />
              <span>{paidPlayers.length}/{attendingPlayers.length} Paid</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">{attendingPlayers.length}</div>
              <div className="text-sm text-muted-foreground">Players Attending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">{paidPlayers.length}</div>
              <div className="text-sm text-muted-foreground">Players Paid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">{unpaidPlayers.length}</div>
              <div className="text-sm text-muted-foreground">Still Need to Pay</div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Status Alert */}
        {unpaidPlayers.length > 0 && (
          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Payment Reminder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Still waiting for payment from:
              </p>
              <div className="flex flex-wrap gap-2">
                {unpaidPlayers.map(player => (
                  <Badge key={player.id} variant="outline" className="border-warning/50 text-warning">
                    {player.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players">Manage Players</TabsTrigger>
            <TabsTrigger value="teams">Team Selection</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="players" className="space-y-4">
            <PlayerManager 
              players={players}
              isLoading={playersLoading}
              isAdmin={isAdmin}
              onAddPlayer={addPlayer}
              onRemovePlayer={removePlayer}
              onUpdatePlayer={updatePlayer}
              onClearAll={handleClearAll}
            />
          </TabsContent>
          
          <TabsContent value="teams" className="space-y-4">
            <TeamSelector 
              availablePlayers={attendingPlayers}
              teams={{ teamA: teams.teamA, teamB: teams.teamB }}
              teamSize={teams.teamSize}
              isAdmin={isAdmin}
              onTeamsChange={saveTeams}
              onClearTeams={clearTeams}
            />
            
            {/* Save Game Button - only for admins */}
            {isAdmin && teams.teamA.length > 0 && teams.teamB.length > 0 && (
              <SaveGameDialog
                greenTeam={teams.teamA}
                orangeTeam={teams.teamB}
                attendingPlayers={attendingPlayers}
                onSaved={reloadPlayers}
              />
            )}
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <GameHistory />
          </TabsContent>
        </Tabs>

        {/* Current Teams Summary */}
        {(teams.teamA.length > 0 || teams.teamB.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Current Teams
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-team-a rounded-full"></div>
                    <span className="font-medium">Green Team ({teams.teamA.length})</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {teams.teamA.map(player => (
                      <div key={player.id} className="text-sm text-muted-foreground">
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-team-b rounded-full"></div>
                    <span className="font-medium">Orange Team ({teams.teamB.length})</span>
                  </div>
                  <div className="pl-6 space-y-1">
                    {teams.teamB.map(player => (
                      <div key={player.id} className="text-sm text-muted-foreground">
                        {player.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
