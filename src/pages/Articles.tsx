import { useState } from 'react';
import { PenSquare, X, Image, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { useAuth } from '@/context/AuthContext';
import { mockArticles, skillsList } from '@/data/mockData';
import { Article } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Articles() {
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 5) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePublish = () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing content",
        description: "Please add a title and content to your article",
        variant: "destructive",
      });
      return;
    }

    const newArticle: Article = {
      id: `article-${Date.now()}`,
      author: user!,
      title: title.trim(),
      content: content.trim(),
      tags: selectedTags,
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: new Date(),
    };

    setArticles([newArticle, ...articles]);
    setShowCompose(false);
    setTitle('');
    setContent('');
    setSelectedTags([]);
    
    toast({
      title: "Article published!",
      description: "Your article is now live",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Articles</h1>
          <Button 
            variant="coral" 
            size="sm"
            onClick={() => setShowCompose(true)}
          >
            <PenSquare className="h-4 w-4 mr-2" />
            Write
          </Button>
        </div>
      </header>

      {/* Articles Feed */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No articles yet</p>
            <Button 
              variant="coral" 
              className="mt-4"
              onClick={() => setShowCompose(true)}
            >
              Write the first article
            </Button>
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        )}
      </main>

      {/* Compose Dialog */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto sm:max-w-lg mx-auto p-4 sm:p-6 rounded-t-xl sm:rounded-xl fixed bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 left-0 right-0 sm:left-1/2 sm:-translate-x-1/2">
          <DialogHeader>
            <DialogTitle>Write Article</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Article title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-medium"
            />
            
            <Textarea
              placeholder="Share your knowledge, experience, or insights..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] resize-none"
            />

            {/* Tags */}
            <div>
              <p className="text-sm font-medium mb-2">Add tags (up to 5)</p>
              <div className="flex flex-wrap gap-2">
                {skillsList.slice(0, 12).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="ghost" size="sm">
                <Image className="h-4 w-4 mr-2" />
                Add cover
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCompose(false)}>
                  Cancel
                </Button>
                <Button variant="coral" onClick={handlePublish}>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
