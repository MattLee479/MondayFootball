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
import { Calendar, Users, Trophy, Clock, History, Shield, Medal, Sparkles } from 'lucide-react';
import AppHeader from '@/components/AppHeader';
import GameHistory from '@/components/GameHistory';
import Leaderboard from '@/components/Leaderboard';
import SaveGameDialog from '@/components/SaveGameDialog';
import type { User } from '@supabase/supabase-js';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
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
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
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
    <div className="min-h-screen pb-10">
      <AppHeader />

      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-6">
        <section className="surface-card hero-glow relative overflow-hidden p-6 sm:p-8">
          <div className="pointer-events-none absolute -left-14 -top-14 h-40 w-40 rounded-full bg-team-a/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-team-b/20 blur-2xl" />

          <div className="relative flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-team">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="subtle-label">Weekly Match Organizer</p>
                  <h1 className="text-3xl font-extrabold sm:text-4xl">Monday Night Football</h1>
                </div>
              </div>
              {isAdmin && (
                <Badge className="border-primary/25 bg-primary/15 text-primary">
                  <Shield className="mr-1 h-3 w-3" />
                  Admin Access
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
              <Badge variant="secondary" className="gap-1.5 py-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Weekly session tracker
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5">
                <Users className="h-3.5 w-3.5" />
                {attendingPlayers.length} playing tonight
              </Badge>
              <Badge variant="secondary" className="gap-1.5 py-1.5">
                <Clock className="h-3.5 w-3.5" />
                {paidPlayers.length}/{attendingPlayers.length} paid
              </Badge>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="overflow-hidden">
            <CardContent className="flex min-h-[112px] items-center justify-between p-5">
              <div>
                <p className="subtle-label">Players In</p>
                <p className="mt-2 text-3xl font-extrabold text-success">{attendingPlayers.length}</p>
              </div>
              <div className="rounded-xl bg-success/15 p-3 text-success">
                <Users className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="flex min-h-[112px] items-center justify-between p-5">
              <div>
                <p className="subtle-label">Paid</p>
                <p className="mt-2 text-3xl font-extrabold text-warning">{paidPlayers.length}</p>
              </div>
              <div className="rounded-xl bg-warning/15 p-3 text-warning">
                <Sparkles className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="flex min-h-[112px] items-center justify-between p-5">
              <div>
                <p className="subtle-label">Unpaid</p>
                <p className="mt-2 text-3xl font-extrabold text-destructive">{unpaidPlayers.length}</p>
              </div>
              <div className="rounded-xl bg-destructive/15 p-3 text-destructive">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </section>

        {unpaidPlayers.length > 0 && (
          <Card className="border-warning/25 bg-warning/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-warning">
                <Clock className="h-5 w-5" />
                Payment Reminder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">Still waiting for payment from:</p>
              <div className="flex flex-wrap gap-2">
                {unpaidPlayers.map(player => (
                  <Badge key={player.id} variant="outline" className="border-warning/50 bg-white/60 text-warning">
                    {player.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
            <TabsTrigger value="players" className="gap-2 py-2.5 text-xs sm:text-sm">
              <Users className="h-4 w-4" />
              Players
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2 py-2.5 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2 py-2.5 text-xs sm:text-sm">
              <Medal className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 py-2.5 text-xs sm:text-sm">
              <History className="h-4 w-4" />
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

            {isAdmin && teams.teamA.length > 0 && teams.teamB.length > 0 && (
              <SaveGameDialog
                greenTeam={teams.teamA}
                orangeTeam={teams.teamB}
                attendingPlayers={attendingPlayers}
                onSaved={reloadPlayers}
              />
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <GameHistory />
          </TabsContent>
        </Tabs>

        {(teams.teamA.length > 0 || teams.teamB.length > 0) && (
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-border/60 bg-secondary/30">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Current Teams
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-team-a/25 bg-team-a/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-team-a" />
                  <span className="font-semibold">Green Team ({teams.teamA.length})</span>
                </div>
                <div className="space-y-1.5">
                  {teams.teamA.map(player => (
                    <p key={player.id} className="text-sm text-muted-foreground">{player.name}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-team-b/25 bg-team-b/5 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3.5 w-3.5 rounded-full bg-team-b" />
                  <span className="font-semibold">Orange Team ({teams.teamB.length})</span>
                </div>
                <div className="space-y-1.5">
                  {teams.teamB.map(player => (
                    <p key={player.id} className="text-sm text-muted-foreground">{player.name}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;
