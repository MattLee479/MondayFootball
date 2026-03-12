import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export default function AppHeader() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error logging out');
    } else {
      toast.success('Logged out successfully');
      navigate('/auth');
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-white/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-team">
            <Trophy className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Monday Night Football</p>
            {user && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
        </div>

        <Button variant="outline" onClick={handleLogout} className="gap-2 text-xs sm:text-sm">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
