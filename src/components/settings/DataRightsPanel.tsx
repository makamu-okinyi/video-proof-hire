import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConvex, useMutation } from 'convex/react';
import { Download, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/admin/console/Overlays';
import { useAuth } from '@/context/AuthContext';
import { buildExportZip } from '@/lib/dataExport';

/** Data-subject rights: download a copy of my data, and delete my account. */
export function DataRightsPanel() {
  const convex = useConvex();
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  const deleteAccount = useMutation(api.account.deleteMyAccount);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isAdmin = profile?.user_type === 'admin';

  const download = async () => {
    setBusy(true);
    try {
      const data = await convex.query(api.account.exportMyData, {});
      const blob = await buildExportZip(data as Record<string, unknown>);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donjo-my-data-${new Date().toISOString().slice(0, 10)}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      requestAnimationFrame(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      toast.success('Your data has been downloaded');
    } catch {
      toast.error('Could not prepare your data. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5" data-testid="data-rights">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Get a copy of the personal data we hold about you: your profile, videos, applications, and the messages you wrote. You get a ZIP with a JSON file, CSV spreadsheets and your uploaded photos and videos.</p>
        <Button variant="outline" onClick={download} disabled={busy} className="pointer-events-auto">
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" aria-hidden="true" />}
          Download my data
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">
          Deleting your account signs you out everywhere and permanently removes your profile, videos, applications and other personal data. Messages you sent to other people are kept but blanked out. This cannot be undone.
        </p>
        {isAdmin ? (
          <p className="text-sm text-muted-foreground">Admin accounts cannot be deleted here. Ask another admin to revoke your admin access first.</p>
        ) : (
          <Button variant="destructive" onClick={() => setConfirmOpen(true)} className="pointer-events-auto">
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Delete my account
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete your account?"
        description="This permanently removes your personal data and cannot be undone. Type DELETE to confirm."
        confirmLabel="Delete my account"
        destructive
        reasonLabel="Type DELETE to confirm"
        reasonRequired
        onConfirm={async (typed) => {
          if (typed !== 'DELETE') throw new Error('Type DELETE (in capitals) to confirm.');
          await deleteAccount({ confirm: 'DELETE' });
          toast.success('Your account is being deleted.');
          await logout().catch(() => undefined);
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}
