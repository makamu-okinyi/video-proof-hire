import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/layout/BottomNav';

export default function CompanyProfileSettings() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full"><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="font-semibold text-lg">Company Profile</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Company Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Company Name</Label><Input placeholder="Your company" /></div>
            <Button className="w-full">Save</Button>
          </CardContent>
        </Card>
      </main>
      <BottomNav />
    </div>
  );
}