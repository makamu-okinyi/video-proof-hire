import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { Check, Fingerprint, KeyRound, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { defaultDeviceLabel, isPasskeySupported } from '@/lib/webauthn';

function formatDate(ms: number | null): string {
  if (!ms) return 'Never';
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** List, add, rename and remove the signed-in user's passkeys. */
export function PasskeysManager() {
  const { registerWebAuthn } = useAuth();
  const passkeys = useQuery(api.passkeys.listMine, {});
  const renamePasskey = useMutation(api.passkeys.rename);
  const removePasskey = useMutation(api.passkeys.remove);

  const supported = isPasskeySupported();
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<Id<'passkeys'> | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState<Id<'passkeys'> | null>(null);

  const startAdd = () => {
    setNewLabel(defaultDeviceLabel());
    setAdding(true);
  };

  const handleAdd = async () => {
    setBusy(true);
    try {
      const { error } = await registerWebAuthn(newLabel);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Passkey added. You can now sign in with it.');
        setAdding(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRename = async (id: Id<'passkeys'>) => {
    try {
      await renamePasskey({ passkeyId: id, deviceLabel: editLabel });
      setEditingId(null);
      toast.success('Passkey renamed');
    } catch {
      toast.error('Could not rename this passkey.');
    }
  };

  const handleRemove = async (id: Id<'passkeys'>) => {
    try {
      await removePasskey({ passkeyId: id });
      setConfirmRemoveId(null);
      toast.success('Passkey removed');
    } catch {
      toast.error('Could not remove this passkey.');
    }
  };

  return (
    <div className="space-y-4" data-testid="passkeys-manager">
      <p className="text-sm text-muted-foreground">
        Passkeys let you sign in with your fingerprint, face or device PIN - no password to remember or leak.
      </p>

      {passkeys === undefined ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading passkeys...
        </div>
      ) : passkeys.length === 0 ? (
        <p className="neo-inset rounded-xl px-4 py-3 text-sm text-muted-foreground">
          You have not added a passkey yet.
        </p>
      ) : (
        <ul className="space-y-3" aria-label="Your passkeys">
          {passkeys.map((p) => (
            <li key={p.id} className="neo-subtle rounded-xl p-4" data-testid="passkey-item">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-brand-strong" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  {editingId === p.id ? (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleRename(p.id);
                      }}
                    >
                      <Input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        maxLength={60}
                        aria-label="Passkey name"
                        className="h-9"
                        autoFocus
                      />
                      <Button type="submit" size="icon" variant="ghost" aria-label="Save name" className="pointer-events-auto">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Cancel rename"
                        className="pointer-events-auto"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </form>
                  ) : (
                    <p className="truncate font-medium text-foreground">{p.deviceLabel}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Added {formatDate(p.createdAt)} · Last used {formatDate(p.lastUsedAt)}
                    {p.backedUp ? ' · Synced' : ''}
                  </p>
                </div>
                {editingId !== p.id && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Rename ${p.deviceLabel}`}
                      className="pointer-events-auto"
                      onClick={() => {
                        setEditingId(p.id);
                        setEditLabel(p.deviceLabel);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${p.deviceLabel}`}
                      className="pointer-events-auto text-destructive"
                      onClick={() => setConfirmRemoveId(p.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {confirmRemoveId === p.id && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm">
                  <span>Remove this passkey? You will no longer be able to sign in with it.</span>
                  <span className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" className="pointer-events-auto" onClick={() => setConfirmRemoveId(null)}>
                      Keep
                    </Button>
                    <Button type="button" size="sm" variant="destructive" className="pointer-events-auto" onClick={() => void handleRemove(p.id)}>
                      Remove
                    </Button>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!supported ? (
        <p className="text-xs text-muted-foreground">Passkeys are not supported in this browser.</p>
      ) : adding ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void handleAdd();
          }}
        >
          <label className="text-sm text-muted-foreground" htmlFor="passkey-label">
            Name this passkey
          </label>
          <Input
            id="passkey-label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            maxLength={60}
            placeholder="e.g. Work laptop"
          />
          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="pointer-events-auto rounded-full">
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
              {busy ? 'Waiting for your device...' : 'Create passkey'}
            </Button>
            <Button type="button" variant="ghost" disabled={busy} className="pointer-events-auto" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button type="button" variant="outline" className="pointer-events-auto rounded-full" onClick={startAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add a passkey
        </Button>
      )}
    </div>
  );
}
