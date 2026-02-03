import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/context/AuthContext';

export default function Articles() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="font-semibold text-lg">Articles</h1>
            </div>
            {isAuthenticated && (
              <Button onClick={() => navigate('/articles/write')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Write
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search articles..."
              className="pl-10"
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Empty State */}
        <div className="text-center py-20">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No articles yet</h2>
          <p className="text-muted-foreground mb-6">
            Share your knowledge with the community
          </p>
          {isAuthenticated && (
            <Button onClick={() => navigate('/articles/write')}>
              <Plus className="h-4 w-4 mr-2" />
              Write Article
            </Button>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}