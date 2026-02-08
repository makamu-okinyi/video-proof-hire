import { useState } from 'react';
import { Play, Check, X, ChevronRight, User, Clock, Building, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassPanel } from '@/components/ui/glass-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  ventureName: string;
  founderName: string;
  tagline: string;
  stage: string;
  industry: string[];
  videoUrl?: string;
  submittedAt: string;
  status: 'pending' | 'shortlisted' | 'rejected';
}

// Mock data for demo
const mockApplications: Application[] = [
  {
    id: '1',
    ventureName: 'PayFlow Africa',
    founderName: 'Sarah Wanjiku',
    tagline: 'Instant cross-border payments for African SMEs',
    stage: 'mvp',
    industry: ['FinTech'],
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    submittedAt: '2026-02-07T10:30:00Z',
    status: 'pending',
  },
  {
    id: '2',
    ventureName: 'FarmConnect',
    founderName: 'John Ochieng',
    tagline: 'Connecting farmers directly to urban markets',
    stage: 'prototype',
    industry: ['AgriTech', 'Logistics'],
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    submittedAt: '2026-02-06T14:15:00Z',
    status: 'pending',
  },
  {
    id: '3',
    ventureName: 'EduSpark',
    founderName: 'Grace Muthoni',
    tagline: 'AI-powered tutoring for African students',
    stage: 'growth',
    industry: ['EdTech', 'AI/ML'],
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    submittedAt: '2026-02-05T09:00:00Z',
    status: 'pending',
  },
  {
    id: '4',
    ventureName: 'CleanGrid Kenya',
    founderName: 'David Kamau',
    tagline: 'Decentralized solar microgrids for rural communities',
    stage: 'mvp',
    industry: ['CleanTech', 'IoT'],
    submittedAt: '2026-02-04T16:45:00Z',
    status: 'shortlisted',
  },
  {
    id: '5',
    ventureName: 'HealthBridge',
    founderName: 'Mary Atieno',
    tagline: 'Telemedicine platform for underserved communities',
    stage: 'idea',
    industry: ['HealthTech'],
    submittedAt: '2026-02-03T11:20:00Z',
    status: 'rejected',
  },
];

interface ReviewQueueProps {
  onStatusChange?: (applicationId: string, newStatus: 'shortlisted' | 'rejected') => void;
}

export function ReviewQueue({ onStatusChange }: ReviewQueueProps) {
  const [applications, setApplications] = useState(mockApplications);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'shortlisted' | 'rejected'>('pending');

  const filteredApplications = applications.filter(app => 
    filter === 'all' ? true : app.status === filter
  );

  const handleStatusChange = (appId: string, newStatus: 'shortlisted' | 'rejected') => {
    setApplications(prev => 
      prev.map(app => 
        app.id === appId ? { ...app, status: newStatus } : app
      )
    );
    setSelectedApp(null);
    onStatusChange?.(appId, newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'shortlisted': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-white/10 text-white/60';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Review Queue</h2>
          <p className="text-sm text-white/60">Watch pitches and make decisions</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {(['pending', 'shortlisted', 'rejected', 'all'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                filter === status
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid gap-4">
        {filteredApplications.map(app => (
          <GlassPanel 
            key={app.id} 
            className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => setSelectedApp(app)}
          >
            <div className="flex items-center gap-4">
              {/* Play indicator */}
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0",
                app.videoUrl ? "bg-primary/20" : "bg-white/10"
              )}>
                {app.videoUrl ? (
                  <Play className="h-5 w-5 text-primary" />
                ) : (
                  <User className="h-5 w-5 text-white/40" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white truncate">{app.ventureName}</h3>
                  <Badge className={cn("text-xs border", getStatusColor(app.status))}>
                    {app.status}
                  </Badge>
                </div>
                <p className="text-sm text-white/60 truncate">{app.tagline}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {app.founderName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(app.submittedAt)}
                  </span>
                  <span className="capitalize">{app.stage}</span>
                </div>
              </div>

              {/* Industries */}
              <div className="hidden md:flex gap-2">
                {app.industry.slice(0, 2).map(ind => (
                  <Badge key={ind} variant="outline" className="bg-white/5 border-white/10 text-white/60">
                    {ind}
                  </Badge>
                ))}
              </div>

              <ChevronRight className="h-5 w-5 text-white/30" />
            </div>
          </GlassPanel>
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 text-white/40">
            No applications in this category
          </div>
        )}
      </div>

      {/* Review Modal */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-3xl bg-black/90 backdrop-blur-xl border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Building className="h-5 w-5 text-primary" />
              {selectedApp?.ventureName}
            </DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="space-y-6">
              {/* Video Player */}
              {selectedApp.videoUrl ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    src={selectedApp.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-white/5 rounded-xl flex items-center justify-center">
                  <div className="text-center text-white/40">
                    <User className="h-12 w-12 mx-auto mb-2" />
                    <p>No video pitch submitted</p>
                  </div>
                </div>
              )}

              {/* Venture Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-white/50">Founder</p>
                  <p className="font-medium">{selectedApp.founderName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-white/50">Stage</p>
                  <Badge className="capitalize">{selectedApp.stage}</Badge>
                </div>
                <div className="col-span-2 space-y-2">
                  <p className="text-sm text-white/50">Pitch</p>
                  <p>{selectedApp.tagline}</p>
                </div>
                <div className="col-span-2 space-y-2">
                  <p className="text-sm text-white/50">Industry</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedApp.industry.map(ind => (
                      <Badge key={ind} variant="outline">{ind}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-4 pt-4 border-t border-white/10">
                  <Button
                    variant="outline"
                    className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                    onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => handleStatusChange(selectedApp.id, 'shortlisted')}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Shortlist
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
