import { useNavigate } from 'react-router-dom';
import { Settings, Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/context/AuthContext';

export default function EmployerDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {profile?.username || 'Employer'}</h1>
            <p className="text-muted-foreground">Manage your hiring</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigate('/employer/settings')}><Settings className="h-5 w-5" /></Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Card><CardContent className="pt-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Briefcase className="h-6 w-6 text-primary" /></div>
          <div><p className="text-2xl font-bold">0</p><p className="text-sm text-muted-foreground">Active Jobs</p></div>
        </CardContent></Card>
        <Button className="mt-6 w-full" onClick={() => navigate('/employer/jobs/create')}><Plus className="h-4 w-4 mr-2" />Post a Job</Button>
      </main>
      <BottomNav />
    </div>
  );
}