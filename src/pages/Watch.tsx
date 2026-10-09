import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, User } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function Watch() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const result = useQuery(
    api.videos.getWatchable,
    videoId && isAuthenticated ? { videoId: videoId as Id<'videos'> } : 'skip'
  );
  const video = result?.status === 'ok' ? result.video : null;
  useDocumentTitle(video?.title || 'Watch');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate('/auth', { replace: true });
  }, [authLoading, isAuthenticated, navigate]);

  const goBack = () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate('/');
  };

  const backButton = (
    <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2 gap-2">
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );

  if (authLoading || (isAuthenticated && result === undefined)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading video...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!result || result.status !== 'ok') {
    const forbidden = result?.status === 'forbidden';
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-4">{backButton}</div>
        <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-semibold">{forbidden ? 'This video is private' : 'Video not found'}</h1>
          <p className="text-sm text-muted-foreground">
            {forbidden
              ? 'Only the owner, and employers the owner has applied to, can watch it.'
              : 'It may have been deleted or the link is wrong.'}
          </p>
        </div>
      </div>
    );
  }

  const { uploader } = result;
  const uploaderName = uploader.username || uploader.fullName || 'Unknown user';

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="max-w-3xl mx-auto px-4 py-4">{backButton}</div>
      <main className="max-w-3xl mx-auto px-4 space-y-4">
        <div className="overflow-hidden rounded-2xl bg-black">
          <video
            key={video!._id}
            src={video!.videoUrl}
            poster={video!.thumbnailUrl}
            controls
            playsInline
            preload="metadata"
            className="mx-auto max-h-[75vh] w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold">{video!.title || 'Untitled video'}</h1>
            {video!.isPrivate && (
              <Badge variant="secondary" className="shrink-0 gap-1">
                <Lock className="h-3 w-3" /> Private
              </Badge>
            )}
          </div>
          {video!.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{video!.description}</p>
          )}
        </div>

        <Link
          to={`/user/${uploader.userId}`}
          className="flex items-center gap-3 rounded-2xl border border-border p-3 transition-colors hover:bg-muted/50"
        >
          {uploader.avatar ? (
            <img src={uploader.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </span>
          )}
          <span className="text-sm font-medium">{uploaderName}</span>
        </Link>
      </main>
    </div>
  );
}
