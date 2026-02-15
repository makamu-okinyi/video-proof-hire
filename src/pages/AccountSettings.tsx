import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { getStoredCredentialForUser } from '@/lib/webauthn';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, registerWebAuthn } = useAuth();
  const [bioLoading, setBioLoading] = useState(false);
  const hasBiometric = user ? !!getStoredCredentialForUser(user.id) : false;

  const handleEnableFingerprint = async () => {
    setBioLoading(true);
    try {
      const { error } = await registerWebAuthn();
      if (error) toast.error(error.message);
      else toast.success('Fingerprint enabled. You can sign in with it next time.');
    } finally {
      setBioLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-semibold text-lg">Account Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/profile/edit')}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifs">Email notifications</Label>
              <Switch id="email-notifs" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifs">Push notifications</Label>
              <Switch id="push-notifs" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>Manage security settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/reset-password')}>
              Change Password
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  Fingerprint / Biometric
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasBiometric ? 'Enabled — sign in with fingerprint on login' : 'Enable passwordless sign-in'}
                </p>
              </div>
              <Button
                variant={hasBiometric ? 'secondary' : 'default'}
                size="sm"
                disabled={bioLoading || hasBiometric}
                onClick={handleEnableFingerprint}
                className="pointer-events-auto"
              >
                {bioLoading ? '...' : hasBiometric ? 'Enabled' : 'Enable'}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa">Two-factor authentication</Label>
              <Switch id="2fa" />
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
    </div>
  );
}