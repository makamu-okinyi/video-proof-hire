import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Building2, User, Shield, ChevronRight,
  Globe, Bell, Users, Palette, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export default function EmployerSettings() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  const settingsGroups = [
    {
      title: 'Company',
      items: [
        {
          icon: Building2,
          label: 'Company Profile',
          description: 'Logo, branding, about us',
          href: '/employer/settings/company',
          iconColor: 'text-coral',
          bgColor: 'bg-coral/10',
        },
        {
          icon: Globe,
          label: 'Online Presence',
          description: 'Website, social links, culture video',
          href: '/employer/settings/company',
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
        },
        {
          icon: Palette,
          label: 'Perks & Benefits',
          description: 'What you offer employees',
          href: '/employer/settings/company',
          iconColor: 'text-purple-500',
          bgColor: 'bg-purple-500/10',
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Personal Info',
          description: 'Name, email, avatar',
          href: '/employer/settings/account',
          iconColor: 'text-green-500',
          bgColor: 'bg-green-500/10',
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Alerts and email preferences',
          href: '/employer/settings/account',
          iconColor: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
        },
        {
          icon: Shield,
          label: 'Security',
          description: 'Password, 2FA settings',
          href: '/employer/settings/account',
          iconColor: 'text-red-500',
          bgColor: 'bg-red-500/10',
        },
        {
          icon: Users,
          label: 'Team Access',
          description: 'Manage team members',
          href: '/employer/settings/account',
          iconColor: 'text-indigo-500',
          bgColor: 'bg-indigo-500/10',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/employer')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Preview */}
        <div className="bg-gradient-to-br from-coral/10 to-coral/5 rounded-2xl p-4 flex items-center gap-4">
          {profile?.avatar ? (
            <img 
              src={profile.avatar} 
              alt="Company" 
              className="h-16 w-16 rounded-xl object-cover"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-coral/20 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-coral" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="font-semibold text-lg">{profile?.username || 'Company Name'}</h2>
            <p className="text-sm text-muted-foreground">Employer Account</p>
          </div>
          <Button variant="coral" size="sm" onClick={() => navigate('/employer/settings/company')}>
            Edit
          </Button>
        </div>

        {/* Settings Groups */}
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              {group.title}
            </h2>
            <div className="bg-secondary rounded-2xl divide-y divide-border">
              {group.items.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-background/50 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className={`h-10 w-10 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button 
          onClick={async () => {
            await logout();
            navigate('/auth');
          }}
          className="w-full flex items-center gap-4 p-4 bg-destructive/5 hover:bg-destructive/10 rounded-2xl transition-colors"
        >
          <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-destructive">Log Out</p>
            <p className="text-sm text-muted-foreground">Sign out of your account</p>
          </div>
          <ChevronRight className="h-5 w-5 text-destructive/50" />
        </button>
      </div>
    </div>
  );
}
