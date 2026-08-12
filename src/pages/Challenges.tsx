import { useState } from 'react';
import { Search, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { SubmitChallengeModal } from '@/components/challenges/SubmitChallengeModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

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
  video_prompt?: string | null;
}

export default function Challenges() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'featured'>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Convex queries — reactive, no manual refetch needed
  const challengesData = useQuery(api.challenges.getActiveChallenges, {});
  const mySubmissionsData = useQuery(api.challenges.getMySubmissions, {});

  const isLoading = challengesData === undefined;

  // Map Convex camelCase fields to the snake_case shape that ChallengeCard expects
  const challenges: Challenge[] = (challengesData ?? []).map((c) => ({
    id: c._id,
    title: c.title,
    description: c.description,
    prize_amount: c.prizeAmount ?? null,
    prize_description: c.prizeDescription ?? null,
    deadline: c.deadline ?? null,
    is_featured: c.isFeatured,
    participants_count: 0, // not tracked in Convex schema
    skills_tags: c.skillsTags ?? null,
    video_prompt: c.videoPrompt ?? null,
  }));

  // Extract submitted challenge IDs
  const userSubmissions: string[] = (mySubmissionsData ?? []).map((s) => s.challengeId as string);

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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 neo-subtle rounded-2xl flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">Challenges</h1>
              <p className="text-cool-grey text-sm">Win prizes & showcase your skills</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="neo-pressed px-4 py-3 rounded-2xl flex items-center gap-3">
          <Search className="h-5 w-5 text-cool-grey" />
          <input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none text-charcoal placeholder:text-cool-grey"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "flex-1 py-3 rounded-2xl text-sm font-medium transition-all",
              activeTab === 'all' ? "neo-pressed text-charcoal" : "neo-flat text-cool-grey"
            )}
          >
            All Challenges
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={cn(
              "flex-1 py-3 rounded-2xl text-sm font-medium transition-all flex items-center justify-center gap-2",
              activeTab === 'featured' ? "neo-pressed text-charcoal" : "neo-flat text-cool-grey"
            )}
          >
            <Star className="h-4 w-4" />
            Featured
          </button>
        </div>

        {/* Challenge List */}
        <div className="space-y-4">
          <p className="text-sm text-cool-grey">
            {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} available
          </p>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="neo-pressed px-6 py-3 rounded-2xl inline-block text-cool-grey animate-pulse">
                Loading challenges...
              </div>
            </div>
          ) : filteredChallenges.length > 0 ? (
            <div className="space-y-4">
              {filteredChallenges.map((challenge) => (
                <div key={challenge.id} className="neo-extruded rounded-3xl overflow-hidden">
                  <ChallengeCard
                    challenge={challenge}
                    hasSubmitted={userSubmissions.includes(challenge.id)}
                    onSubmit={() => handleSubmitClick(challenge)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 neo-extruded rounded-3xl">
              <Trophy className="h-12 w-12 mx-auto text-cool-grey mb-3" />
              <p className="text-cool-grey">No challenges found</p>
            </div>
          )}
        </div>

        {/* Submit Modal */}
        {selectedChallenge && (
          <SubmitChallengeModal
            isOpen={!!selectedChallenge}
            onClose={() => {
              setSelectedChallenge(null);
              // No manual refetch needed — Convex getMySubmissions updates reactively
            }}
            challenge={selectedChallenge}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
