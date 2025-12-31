import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Article } from '@/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ArticleCardProps {
  article: Article;
  className?: string;
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(article.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleSave = () => {
    setSaved(!saved);
    toast({
      title: saved ? "Removed from saved" : "Article saved",
      description: saved ? "Article removed from your saved items" : "You can view it later in your profile",
    });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Share this article with others",
    });
  };

  return (
    <article className={cn("bg-card border border-border rounded-xl p-4", className)}>
      {/* Author Header */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={article.author.avatar} />
          <AvatarFallback>{article.author.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-sm">{article.author.username}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(article.createdAt, { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Article Content */}
      <h2 className="text-lg font-semibold mb-2 line-clamp-2">{article.title}</h2>
      <p className="text-muted-foreground text-sm mb-3 line-clamp-3">{article.content}</p>

      {/* Cover Image */}
      {article.coverImage && (
        <div className="rounded-lg overflow-hidden mb-3 aspect-video bg-secondary">
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {article.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1.5 px-2"
            onClick={handleLike}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-coral text-coral")} />
            <span className="text-xs">{likeCount}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 px-2">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{article.comments}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={handleSave}>
            <Bookmark className={cn("h-4 w-4", saved && "fill-foreground")} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
