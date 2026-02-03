import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/layout/BottomNav';

export default function MyShortlist() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-semibold text-lg">My Shortlist</h1>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 text-center py-20">
        <div className="h-20 w-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6"><Star className="h-10 w-10 text-amber-600" /></div>
        <h2 className="text-2xl font-bold mb-2">No shortlisted talent</h2>
        <p className="text-muted-foreground mb-6">Browse and shortlist talent</p>
        <Button onClick={() => navigate('/ventures')}><Users className="h-4 w-4 mr-2" />Browse Ventures</Button>
      </main>
      <BottomNav />
    </div>
  );
}