import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Loader2, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/AuthContext';
import { describeError } from '@/lib/errors';
import { cn } from '@/lib/utils';

// Places where an interruption would be unwelcome: sign-in, admin, mid-task creation, watching.
const HIDDEN_PREFIXES = ['/auth', '/admin', '/forgot-password', '/create', '/apply', '/watch', '/privacy', '/terms', '/cookies'];
const SESSION_KEY = 'donjo-feedback-shown';
const SHOW_DELAY_MS = 20_000;

const LABELS = ['', 'Not great', 'Could be better', 'It is okay', 'Good', 'Love it'];

/**
 * Occasional, friendly check-in asking members (never admins) how they are finding Donjo.
 * Ratings go to an admin approval queue; nothing is published automatically.
 */
export function FeedbackPrompt() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const state = useQuery(api.feedback.shouldPrompt, isAuthenticated ? {} : 'skip');
  const submit = useMutation(api.feedback.submit);
  const snooze = useMutation(api.feedback.snooze);
  const neverAsk = useMutation(api.feedback.neverAsk);

  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [allowPublic, setAllowPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const hiddenHere = HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p));
  const eligible = isAuthenticated && !hiddenHere && !!state?.show;

  useEffect(() => {
    if (!eligible) return;
    let shown = false;
    try {
      shown = sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      /* storage unavailable */
    }
    if (shown) return;
    const t = setTimeout(() => {
      setVisible(true);
      try {
        sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* ignore */
      }
    }, SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [eligible]);

  const dismiss = async () => {
    setVisible(false);
    if (!done) {
      try {
        await snooze({});
      } catch {
        /* non-critical */
      }
    }
  };

  const optOut = async () => {
    setVisible(false);
    try {
      await neverAsk({});
      toast.success('Okay, we will not ask again. You can still email us any time.');
    } catch {
      /* non-critical */
    }
  };

  const send = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      await submit({ rating, comment: comment.trim() || undefined, allowPublic: allowPublic && !!comment.trim(), displayName: state?.displayName ?? undefined });
      setDone(true);
      window.setTimeout(() => setVisible(false), 2600);
    } catch (e) {
      toast.error(describeError(e, 'Could not send your feedback. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const shown = hover || rating;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Share your experience"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-sm neo-extruded p-5 sm:left-auto sm:right-6 sm:bottom-6"
          data-testid="feedback-prompt"
        >
          <button type="button" aria-label="Close" onClick={() => void dismiss()} className="pointer-events-auto absolute right-3 top-3 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>

          {done ? (
            <div className="flex items-center gap-3 pr-4">
              <Heart className="h-6 w-6 shrink-0 text-brand-strong" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Thank you</p>
                <p className="text-sm text-muted-foreground">We appreciate your feedback. It helps us make Donjo better.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="pr-4">
                <p className="font-semibold text-foreground">Are you enjoying Donjo?</p>
                <p className="text-sm text-muted-foreground">We appreciate your feedback. How would you rate your experience?</p>
              </div>

              <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating out of 5" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => setRating(n)}
                    className="pointer-events-auto rounded p-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Star className={cn('h-7 w-7 transition-colors', n <= shown ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50')} />
                  </button>
                ))}
                {shown > 0 && <span className="ml-2 text-sm text-muted-foreground">{LABELS[shown]}</span>}
              </div>

              {rating > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 overflow-hidden">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={rating >= 4 ? 'What do you like most? (optional)' : 'What could we do better? (optional)'}
                    rows={3}
                    maxLength={600}
                    aria-label="Your comments"
                  />
                  {comment.trim() && (
                    <label className="flex items-start gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" checked={allowPublic} onChange={(e) => setAllowPublic(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--brand-strong))]" />
                      <span>Donjo may share my comment and first name on its website once the team has reviewed it. Nothing is published without your tick and our approval.</span>
                    </label>
                  )}
                  <Button size="sm" className="pointer-events-auto w-full rounded-full" onClick={() => void send()} disabled={busy}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send feedback
                  </Button>
                </motion.div>
              )}
              <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <button type="button" onClick={() => void dismiss()} className="pointer-events-auto underline hover:text-foreground">Maybe later</button>
                <button type="button" onClick={() => void optOut()} className="pointer-events-auto underline hover:text-foreground">Never ask me again</button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
