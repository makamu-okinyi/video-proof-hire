import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { mockArticles } from '@/data/mockData';
import { Article } from '@/types';

export default function Articles() {
  const navigate = useNavigate();
  const [articles] = useState<Article[]>(mockArticles);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Articles</h1>
          <Button 
            variant="coral" 
            size="sm"
            onClick={() => navigate('/articles/write')}
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
              onClick={() => navigate('/articles/write')}
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

      <BottomNav />
    </div>
  );
}
