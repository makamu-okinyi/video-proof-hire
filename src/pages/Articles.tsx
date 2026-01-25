import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface ArticleData {
  id: string;
  title: string;
  content: string;
  cover_image: string | null;
  tags: string[] | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  created_at: string;
  author_id: string;
  author: {
    id: string;
    username: string | null;
    avatar: string | null;
    is_verified: boolean;
  } | null;
}

export default function Articles() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select(`
          id,
          title,
          content,
          cover_image,
          tags,
          likes_count,
          comments_count,
          views_count,
          created_at,
          author_id,
          profiles!articles_author_id_fkey (
            id,
            username,
            avatar,
            is_verified
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        // If table doesn't exist yet, just set empty array
        setArticles([]);
        return;
      }

      // Transform data
      const transformedArticles = (data || []).map(article => ({
        ...article,
        author: article.profiles as ArticleData['author'],
      }));

      setArticles(transformedArticles);
    } catch (error) {
      console.error('Error:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  // Transform for ArticleCard component
  const transformArticle = (article: ArticleData) => ({
    id: article.id,
    author: {
      id: article.author?.id || article.author_id,
      username: article.author?.username || 'user',
      email: '',
      userType: 'talent' as const,
      avatar: article.author?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      skills: [],
      skillCategory: 'other' as const,
      isVerified: article.author?.is_verified || false,
      createdAt: new Date(),
    },
    title: article.title,
    content: article.content,
    coverImage: article.cover_image || undefined,
    tags: article.tags || [],
    likes: article.likes_count,
    comments: article.comments_count,
    views: article.views_count,
    createdAt: new Date(article.created_at),
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <h1 className="text-xl font-bold">Articles</h1>
          {user && (
            <Button 
              variant="coral" 
              size="sm"
              onClick={() => navigate('/articles/write')}
            >
              <PenSquare className="h-4 w-4 mr-2" />
              Write
            </Button>
          )}
        </div>
      </header>

      {/* Articles Feed */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">No articles yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Share your knowledge and experiences with the community
            </p>
            {user && (
              <Button 
                variant="coral" 
                onClick={() => navigate('/articles/write')}
              >
                <PenSquare className="h-4 w-4 mr-2" />
                Write the first article
              </Button>
            )}
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCard key={article.id} article={transformArticle(article)} />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
