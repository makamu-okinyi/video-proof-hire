import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatStage } from '@/lib/stageDisplay';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Globe,
  Play,
  Users,
  TrendingUp,
  Target,
  Lightbulb,
  Bookmark,
  Share2,
  FileText,
  Loader2,
  Building2,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const stageColors: Record<string, string> = {
  idea: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  prototype: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  mvp: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  growth: 'bg-green-500/10 text-green-600 border-green-500/20',
  scale: 'bg-primary/10 text-primary border-primary/20',
};

export default function VentureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [bookmarking, setBookmarking] = useState(false);

  const venture = useQuery(api.ventures.getVenture, id ? { ventureId: id as Id<'ventures'> } : 'skip');
  const bookmarkRow = useQuery(
    api.ventures.isVentureBookmarked,
    id && isAuthenticated ? { ventureId: id as Id<'ventures'> } : 'skip'
  );
  const isBookmarked = bookmarkRow?.action === 'bookmark';
  const loading = venture === undefined;

  const bookmarkVenture = useMutation(api.ventures.bookmarkVenture);
  const removeBookmark = useMutation(api.ventures.removeBookmark);

  useEffect(() => {
    if (venture === null || (venture && !venture.isActive)) {
      toast.error('Venture not found');
      navigate('/ventures');
    }
  }, [venture, navigate]);

  const toggleBookmark = async () => {
    if (!isAuthenticated || !user || !id) {
      toast.error('Please sign in to bookmark ventures');
      navigate('/auth');
      return;
    }

    setBookmarking(true);
    try {
      if (isBookmarked) {
        await removeBookmark({ ventureId: id as Id<'ventures'> });
        toast.success('Removed from bookmarks');
      } else {
        await bookmarkVenture({ ventureId: id as Id<'ventures'>, action: 'bookmark' });
        toast.success('Added to bookmarks');
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setBookmarking(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: venture?.name,
        text: venture?.tagline,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!venture) {
    return null;
  }

  const leadFounder = venture.founders?.find((f) => f.isLead);
  const currentDeck = venture.pitchDecks?.find((d) => d.isCurrentVersion);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBookmark}
              disabled={bookmarking}
            >
              <Bookmark
                className={cn(
                  'h-5 w-5',
                  isBookmarked && 'fill-primary text-primary'
                )}
              />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Cover Image */}
          {venture.coverImageUrl && (
            <div className="relative h-48 md:h-64 rounded-2xl overflow-hidden">
              <img
                src={venture.coverImageUrl}
                alt={venture.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}

          {/* Venture Info */}
          <div className="flex items-start gap-4">
            {venture.logoUrl ? (
              <img
                src={venture.logoUrl}
                alt={venture.name}
                className="h-16 w-16 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {venture.name}
              </h1>
              <p className="text-muted-foreground mt-1">{venture.tagline}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge
                  className={cn('capitalize', stageColors[venture.stage])}
                >
                  {formatStage(venture.stage)}
                </Badge>
                {venture.isFundraising && (
                  <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                    Fundraising
                  </Badge>
                )}
                {venture.hackathonName && (
                  <Badge variant="secondary">{venture.hackathonName}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Industry Tags */}
          {venture.industry && venture.industry.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {venture.industry.map((ind) => (
                <Badge key={ind} variant="outline">
                  {ind}
                </Badge>
              ))}
            </div>
          )}
        </motion.section>

        {/* Video Section */}
        {venture.pitchVideoUrl && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center items-center"
          >
            <Card className="w-full max-w-full md:max-w-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Pitch Video
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center w-full">
                <div className="w-full flex items-center justify-center">
                  <div className="aspect-video w-full max-w-full rounded-lg overflow-hidden bg-secondary">
                    <video
                      src={venture.pitchVideoUrl}
                      poster={venture.pitchVideoThumbnail || undefined}
                      controls
                      className="w-full h-full object-contain mx-auto"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Problem & Solution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-4"
        >
          {venture.problemStatement && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-destructive-foreground" />
                  The Problem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {venture.problemStatement}
                </p>
              </CardContent>
            </Card>
          )}

          {venture.solution && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  The Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {venture.solution}
                </p>
              </CardContent>
            </Card>
          )}
        </motion.section>

        {/* Traction & Market */}
        {(venture.traction || venture.marketSize) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Traction & Market
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {venture.traction && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Traction</h4>
                    <p className="text-muted-foreground text-sm">
                      {venture.traction}
                    </p>
                  </div>
                )}
                {venture.marketSize && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Market Size</h4>
                    <p className="text-muted-foreground text-sm">
                      {venture.marketSize}
                    </p>
                  </div>
                )}
                {venture.businessModel && (
                  <div>
                    <h4 className="font-medium text-sm mb-1">Business Model</h4>
                    <p className="text-muted-foreground text-sm">
                      {venture.businessModel}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Team */}
        {venture.founders && venture.founders.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Founding Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {venture.founders.map((founder) => (
                    <div
                      key={founder._id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50"
                    >
                      {founder.profile?.avatar
                        ? <img src={founder.profile.avatar} alt={founder.profile?.username || 'Founder'} className="h-12 w-12 rounded-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />
                        : <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0"><UserIcon className="h-6 w-6 text-muted-foreground" /></div>
                      }
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {founder.profile?.username || 'Anonymous'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {founder.title || founder.role}
                        </p>
                      </div>
                      {founder.isLead && (
                        <Badge variant="secondary" className="text-xs">
                          Lead
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Tech Stack */}
        {venture.techStack && venture.techStack.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tech Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {venture.techStack.map((tech) => (
                    <Badge key={tech} variant="outline">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Pitch Deck */}
        {currentDeck && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Pitch Deck
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  asChild
                >
                  <a
                    href={currentDeck.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{currentDeck.title}</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Links */}
        {(venture.websiteUrl ||
          venture.githubUrl ||
          venture.demoUrl) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {venture.websiteUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <a
                      href={venture.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                      Website
                    </a>
                  </Button>
                )}
                {venture.githubUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <a
                      href={venture.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                )}
                {venture.demoUrl && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    asChild
                  >
                    <a
                      href={venture.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Play className="h-4 w-4" />
                      Demo
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* CTA for Investors */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="pb-8"
        >
          <Button className="w-full h-14 text-lg" size="lg">
            Request Intro
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Double-opt-in introduction with the founding team
          </p>
        </motion.section>
      </main>
    </div>
  );
}
