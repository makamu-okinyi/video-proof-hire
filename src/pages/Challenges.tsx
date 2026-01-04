import { useState, useEffect } from 'react';
import { Search, Trophy, Sparkles, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { SubmitChallengeModal } from '@/components/challenges/SubmitChallengeModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Challenge {
  id: string;
  title: string;
  description: string;
  prize_amount: number | null;
  prize_description: string | null;
  deadline: string | null;
  is_featured: boolean;
  participants_count: number;
  skills_tags: string[] | null;
}

export default function Challenges() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'featured'>('all');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    fetchChallenges();
    if (user) {
      fetchUserSubmissions();
    }
  }, [user]);

  const fetchChallenges = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      setChallenges(data);
    }
    setIsLoading(false);
  };

  const fetchUserSubmissions = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('challenge_submissions')
      .select('challenge_id')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserSubmissions(data.map(s => s.challenge_id));
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'featured' && challenge.is_featured);
    return matchesSearch && matchesTab;
  });

  const handleSubmitClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            Challenges
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'featured')} className="mt-3">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">All Challenges</TabsTrigger>
            <TabsTrigger value="featured" className="flex-1">
              <Sparkles className="h-3 w-3 mr-1" />
              Featured
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Challenge List */}
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} available
        </p>
        
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading challenges...
          </div>
        ) : filteredChallenges.length > 0 ? (
          filteredChallenges.map((challenge) => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge}
              hasSubmitted={userSubmissions.includes(challenge.id)}
              onSubmit={() => handleSubmitClick(challenge)}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No challenges found</p>
          </div>
        )}
      </div>

      {/* Submit Modal */}
      {selectedChallenge && (
        <SubmitChallengeModal
          isOpen={!!selectedChallenge}
          onClose={() => {
            setSelectedChallenge(null);
            fetchUserSubmissions();
          }}
          challenge={selectedChallenge}
        />
      )}

      <BottomNav />
    </div>
  );
}