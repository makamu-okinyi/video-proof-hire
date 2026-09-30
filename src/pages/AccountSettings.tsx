import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PasskeysManager } from '@/components/settings/PasskeysManager';
import { ChangePasswordPanel } from '@/components/settings/ChangePasswordPanel';
import { DataRightsPanel } from '@/components/settings/DataRightsPanel';
import { LegalLinks } from '@/components/legal/LegalLinks';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AccountSettings() {
  useDocumentTitle('Account settings');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => ((window.history.state as { idx?: number } | null)?.idx ?? 0) > 0 ? navigate(-1) : navigate('/')}
            aria-label="Back"
            className="p-2 -ml-2 hover:bg-secondary rounded-full"
          >
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
            <CardDescription>Where you will see updates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              New applicants, application updates and messages appear in the notification bell at the top of the app, so nothing is sent to your email.
            </p>
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
            <ChangePasswordPanel />
          </CardContent>
        </Card>

        {/* Passkeys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5" />
              Passkeys
            </CardTitle>
            <CardDescription>Sign in with your fingerprint, face or device PIN</CardDescription>
          </CardHeader>
          <CardContent>
            <PasskeysManager />
          </CardContent>
        </Card>
        {/* Your data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Your data
            </CardTitle>
            <CardDescription>Download or delete your personal data</CardDescription>
          </CardHeader>
          <CardContent>
            <DataRightsPanel />
          </CardContent>
        </Card>
        <LegalLinks className="pt-2" />
      </main>

      <BottomNav />
    </div>
  );
}