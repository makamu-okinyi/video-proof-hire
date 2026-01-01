import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { skillsList } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export default function WriteArticle() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

    // TODO: Save to database
    toast({
      title: "Article published!",
      description: "Your article is now live",
    });
    navigate('/articles');
  };

  if (!user) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate('/articles')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Write Article</h1>
          </div>
          <Button variant="coral" size="sm" onClick={handlePublish}>
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Input
          placeholder="Article title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />
        
        <Textarea
          placeholder="Share your knowledge, experience, or insights..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] resize-none border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />

        {/* Add Cover */}
        <Button variant="outline" className="w-full">
          <Image className="h-4 w-4 mr-2" />
          Add cover image
        </Button>

        {/* Tags */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Add tags (up to 5)</p>
          <div className="flex flex-wrap gap-2">
            {skillsList.slice(0, 15).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer transition-all"
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
