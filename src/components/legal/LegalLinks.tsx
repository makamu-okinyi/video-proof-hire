import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Row of links to the legal documents (auth screens, settings, legal pages). */
export function LegalLinks({ className }: { className?: string }) {
  return (
    <nav aria-label="Legal" className={cn('flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
      <Link to="/terms" className="hover:text-foreground hover:underline">Terms of Use</Link>
      <Link to="/privacy" className="hover:text-foreground hover:underline">Privacy Policy</Link>
      <Link to="/cookies" className="hover:text-foreground hover:underline">Cookie notice</Link>
    </nav>
  );
}
