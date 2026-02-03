import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Rocket, 
  Plus, 
  Search, 
  Filter,
  ArrowUpRight,
  Users,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Venture } from '@/types';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';

const stageColors = {
  idea: 'bg-blue-500/10 text-blue-600',
  prototype: 'bg-purple-500/10 text-purple-600',
  mvp: 'bg-amber-500/10 text-amber-600',
  growth: 'bg-green-500/10 text-green-600',
  scale: 'bg-primary/10 text-primary',
};

export default function Ventures() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [ventures, setVentures] = useState<Venture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    fetchVentures();
  }, []);

  const fetchVentures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ventures')
        .select(`
          *,
          venture_founders (
            id,
            user_id,
            role,
            title,
            is_lead,
            profiles (
              id,
              username,
              avatar
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedVentures: Venture[] = (data || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        tagline: v.tagline,
        description: v.description,
        problemStatement: v.problem_statement,
        solution: v.solution,
        marketSize: v.market_size,
        traction: v.traction,
        businessModel: v.business_model,
        stage: v.stage,
        logoUrl: v.logo_url,
        coverImageUrl: v.cover_image_url,
        pitchVideoUrl: v.pitch_video_url,
        pitchVideoThumbnail: v.pitch_video_thumbnail,
        websiteUrl: v.website_url,
        githubUrl: v.github_url,
        demoUrl: v.demo_url,
        industry: v.industry || [],
        techStack: v.tech_stack || [],
        isFundraising: v.is_fundraising,
        fundingGoal: v.funding_goal,
        fundingRaised: v.funding_raised,
        hackathonName: v.hackathon_name,
        hackathonCohort: v.hackathon_cohort,
        isActive: v.is_active,
        isFeatured: v.is_featured,
        createdAt: new Date(v.created_at),
        updatedAt: new Date(v.updated_at),
        founders: v.venture_founders,
      }));

      setVentures(transformedVentures);
    } catch (error) {
      console.error('Error fetching ventures:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVentures = ventures.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesIndustry = !selectedIndustry || v.industry.includes(selectedIndustry);
    return matchesSearch && matchesIndustry;
  });

  const featuredVentures = filteredVentures.filter(v => v.isFeatured);
  const allVentures = filteredVentures;

  const allIndustries = [...new Set(ventures.flatMap(v => v.industry))];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Venture Gallery</h1>
              <p className="text-muted-foreground text-sm">Startup Garage Nairobi</p>
            </div>
            {isAuthenticated && (
              <Button onClick={() => navigate('/apply')} className="bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Apply
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ventures..."
              className="pl-10"
            />
          </div>

          {/* Industry Filter */}
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-2">
            <Badge
              variant={!selectedIndustry ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedIndustry(null)}
            >
              All
            </Badge>
            {allIndustries.slice(0, 8).map(industry => (
              <Badge
                key={industry}
                variant={selectedIndustry === industry ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedIndustry(industry)}
              >
                {industry}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-secondary animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : ventures.length === 0 ? (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Rocket className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No ventures yet</h2>
            <p className="text-muted-foreground mb-6">
              Be the first to apply to Startup Garage Nairobi
            </p>
            <Button onClick={() => navigate('/apply')}>
              <Plus className="h-4 w-4 mr-2" />
              Apply Now
            </Button>
          </div>
        ) : (
          <>
            {/* Featured Section */}
            {featuredVentures.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Featured Ventures</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredVentures.map((venture, index) => (
                    <VentureCard key={venture.id} venture={venture} featured index={index} />
                  ))}
                </div>
              </section>
            )}

            {/* All Ventures */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">All Ventures</h2>
                <span className="text-muted-foreground text-sm">({allVentures.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allVentures.map((venture, index) => (
                  <VentureCard key={venture.id} venture={venture} index={index} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

interface VentureCardProps {
  venture: Venture;
  featured?: boolean;
  index: number;
}

function VentureCard({ venture, featured, index }: VentureCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => navigate(`/ventures/${venture.id}`)}
      className={cn(
        "venture-card cursor-pointer group",
        featured && "md:col-span-1"
      )}
    >
      {/* Cover Image or Gradient */}
      <div className={cn(
        "relative overflow-hidden",
        featured ? "h-40" : "h-32"
      )}>
        {venture.coverImageUrl ? (
          <img
            src={venture.coverImageUrl}
            alt={venture.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        
        {/* Stage Badge */}
        <Badge 
          className={cn(
            "absolute top-3 left-3 capitalize",
            stageColors[venture.stage]
          )}
        >
          {venture.stage}
        </Badge>

        {venture.isFundraising && (
          <Badge className="absolute top-3 right-3 bg-green-500 text-white">
            Fundraising
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {venture.name}
            </h3>
            <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
              {venture.tagline}
            </p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
        </div>

        {/* Industries */}
        <div className="flex flex-wrap gap-1 mt-3">
          {venture.industry.slice(0, 2).map(ind => (
            <Badge key={ind} variant="secondary" className="text-xs">
              {ind}
            </Badge>
          ))}
          {venture.industry.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{venture.industry.length - 2}
            </Badge>
          )}
        </div>

        {/* Founders Preview */}
        {venture.founders && venture.founders.length > 0 && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            <div className="flex -space-x-2">
              {venture.founders.slice(0, 3).map((founder: any) => (
                <img
                  key={founder.id}
                  src={founder.profiles?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'}
                  alt=""
                  className="h-6 w-6 rounded-full border-2 border-background object-cover"
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {venture.founders.length} founder{venture.founders.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}