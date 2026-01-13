import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

interface SaveGameDialogProps {
  greenTeam: { id: string; name: string; hasPaid: boolean }[];
  orangeTeam: { id: string; name: string; hasPaid: boolean }[];
  attendingPlayers: { id: string; name: string; hasPaid: boolean }[];
  onSaved?: () => void;
}

export default function SaveGameDialog({ 
  greenTeam, 
  orangeTeam, 
  attendingPlayers,
  onSaved 
}: SaveGameDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [weekDate, setWeekDate] = useState<Date>(new Date());
  const [greenScore, setGreenScore] = useState('');
  const [orangeScore, setOrangeScore] = useState('');
  const [paymentType, setPaymentType] = useState<'everyone_pays' | 'loser_pays'>('everyone_pays');
  const [scoreUnknown, setScoreUnknown] = useState(false);
  const [winner, setWinner] = useState<'green' | 'orange' | 'draw'>('green');

  const handleSave = async () => {
    // Only require scores if scoreUnknown is false
    if (!scoreUnknown && (!greenScore || !orangeScore)) {
      toast.error('Please enter scores for both teams or mark score as unknown');
      return;
    }

    if (greenTeam.length === 0 || orangeTeam.length === 0) {
      toast.error('Please select teams before saving');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from('game_log').insert({
        week_date: format(weekDate, 'yyyy-MM-dd'),
        green_team_players: greenTeam.map(p => p.name),
        orange_team_players: orangeTeam.map(p => p.name),
        green_team_score: scoreUnknown ? null : parseInt(greenScore),
        orange_team_score: scoreUnknown ? null : parseInt(orangeScore),
        attending_players: attendingPlayers.map(p => p.name),
        paid_players: attendingPlayers.filter(p => p.hasPaid).map(p => p.name),
        payment_type: paymentType,
        winner: scoreUnknown ? winner : undefined, // Only store winner if score unknown
      });

      if (error) throw error;

      toast.success('Game saved successfully!');
      setOpen(false);
      setGreenScore('');
      setOrangeScore('');
      setPaymentType('everyone_pays');
      setScoreUnknown(false);
      setWinner('green');
      onSaved?.();
    } catch (error: any) {
      toast.error('Failed to save game');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save This Week's Game
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Game Results</DialogTitle>
          <DialogDescription>
            Record the final scores and save this game to history
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Game Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !weekDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {weekDate ? format(weekDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={weekDate}
                  onSelect={(date) => date && setWeekDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="score-unknown" 
              checked={scoreUnknown}
              onCheckedChange={(checked) => setScoreUnknown(checked === true)}
            />
            <Label htmlFor="score-unknown" className="font-normal cursor-pointer">
              Score unknown - just record the winner
            </Label>
          </div>

          {scoreUnknown ? (
            <div className="space-y-2">
              <Label>Who Won?</Label>
              <RadioGroup value={winner} onValueChange={(value) => setWinner(value as 'green' | 'orange' | 'draw')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="green" id="winner-green" />
                  <Label htmlFor="winner-green" className="font-normal cursor-pointer flex items-center gap-2">
                    <div className="w-3 h-3 bg-team-a rounded-full"></div>
                    Green Team ({greenTeam.length} players)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="orange" id="winner-orange" />
                  <Label htmlFor="winner-orange" className="font-normal cursor-pointer flex items-center gap-2">
                    <div className="w-3 h-3 bg-team-b rounded-full"></div>
                    Orange Team ({orangeTeam.length} players)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="draw" id="winner-draw" />
                  <Label htmlFor="winner-draw" className="font-normal cursor-pointer">
                    Draw
                  </Label>
                </div>
              </RadioGroup>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="green-score">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-team-a rounded-full"></div>
                    Green Team
                  </div>
                </Label>
                <Input
                  id="green-score"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={greenScore}
                  onChange={(e) => setGreenScore(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {greenTeam.length} players
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orange-score">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-team-b rounded-full"></div>
                    Orange Team
                  </div>
                </Label>
                <Input
                  id="orange-score"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={orangeScore}
                  onChange={(e) => setOrangeScore(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {orangeTeam.length} players
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Payment Type</Label>
            <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as 'everyone_pays' | 'loser_pays')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="everyone_pays" id="everyone" />
                <Label htmlFor="everyone" className="font-normal cursor-pointer">
                  Everyone Pays
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="loser_pays" id="loser" />
                <Label htmlFor="loser" className="font-normal cursor-pointer">
                  Loser Pays
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="pt-2 space-y-1 text-sm text-muted-foreground">
            <p>✓ {attendingPlayers.length} players attending</p>
            <p>✓ {attendingPlayers.filter(p => p.hasPaid).length} paid</p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Game
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
