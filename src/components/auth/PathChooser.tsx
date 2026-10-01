import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Rocket, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Path = 'talent' | 'employer';

interface PathChooserProps {
  onChoose: (path: Path) => void;
}

const ease = [0.16, 1, 0.3, 1] as const;
const SETTLE_MS = 750;

const PATHS: { id: Path; title: string; blurb: string; Icon: typeof Rocket; accent: string; wash: string }[] = [
  { id: 'talent', title: 'Apply as Applicant', blurb: 'Apply to jobs with a short video.', Icon: Rocket, accent: 'text-brand-strong', wash: 'bg-brand/25' },
  { id: 'employer', title: 'Hire Talent', blurb: 'Post jobs and review video applications.', Icon: ShieldCheck, accent: 'text-foreground', wash: 'bg-foreground/15' },
];

/**
 * Two large path cards, side by side on desktop. Choosing one plays a path-specific
 * effect (applicant: lift-off with a colour wash; hirer: shield pulse with ripples), then continues.
 */
export function PathChooser({ onChoose }: PathChooserProps) {
  const reduce = useReducedMotion();
  const [chosen, setChosen] = useState<Path | null>(null);

  const pick = (id: Path) => {
    if (chosen) return;
    if (reduce) {
      onChoose(id);
      return;
    }
    setChosen(id);
    window.setTimeout(() => onChoose(id), SETTLE_MS);
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
      {PATHS.map(({ id, title, blurb, Icon, accent, wash }, index) => {
        const isChosen = chosen === id;
        const isOther = chosen !== null && !isChosen;
        return (
          <motion.button
            key={id}
            type="button"
            onClick={() => pick(id)}
            disabled={chosen !== null}
            initial={{ opacity: 0, y: 24 }}
            animate={
              isOther
                ? { opacity: 0.25, scale: 0.96, filter: 'blur(3px)', y: 0 }
                : isChosen
                  ? { opacity: 1, scale: 1.04, filter: 'blur(0px)', y: 0 }
                  : { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }
            }
            transition={{ duration: 0.6, ease, delay: chosen ? 0 : index * 0.1 }}
            whileHover={chosen ? undefined : { y: -6, scale: 1.02 }}
            whileTap={chosen ? undefined : { scale: 0.98 }}
            className="neo-extruded-sm group pointer-events-auto relative overflow-hidden p-6 text-center lg:flex lg:min-h-[22rem] lg:flex-col lg:items-center lg:justify-center lg:p-10"
          >
            {/* Colour wash that floods the card on selection */}
            {isChosen && (
              <motion.span
                aria-hidden="true"
                className={cn('absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full', wash)}
                initial={{ scale: 0, opacity: 0.9 }}
                animate={{ scale: 9, opacity: 0 }}
                transition={{ duration: 0.75, ease }}
              />
            )}

            {/* Hirer: expanding ripples */}
            {isChosen && id === 'employer' &&
              [0, 0.12, 0.24].map((d) => (
                <motion.span
                  key={d}
                  aria-hidden="true"
                  className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/40"
                  initial={{ scale: 0.4, opacity: 0.8 }}
                  animate={{ scale: 4.5, opacity: 0 }}
                  transition={{ duration: 0.7, ease, delay: d }}
                />
              ))}

            <div className="relative mb-4 flex justify-center lg:mb-6">
              {/* Applicant: exhaust trail */}
              {isChosen && id === 'talent' && (
                <motion.span
                  aria-hidden="true"
                  className="absolute left-1/2 top-full h-24 w-1.5 -translate-x-1/2 origin-top rounded-full bg-gradient-to-b from-brand-strong to-transparent"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: [0, 1, 0.4], opacity: [0, 1, 0], y: [0, 0, -140] }}
                  transition={{ duration: 0.7, ease }}
                />
              )}
              <motion.div
                className="squircle-icon h-16 w-16 lg:h-24 lg:w-24"
                animate={
                  isChosen
                    ? id === 'talent'
                      ? { y: -130, x: 30, rotate: 14, scale: 0.8, opacity: 0 }
                      : { scale: [1, 1.35, 1.15], rotate: [0, -6, 0] }
                    : { y: 0, x: 0, rotate: 0, scale: 1, opacity: 1 }
                }
                transition={{ duration: id === 'talent' ? 0.7 : 0.6, ease }}
                whileHover={chosen ? undefined : { rotate: id === 'talent' ? -8 : 0, scale: 1.08 }}
              >
                <Icon className={cn('h-8 w-8 lg:h-12 lg:w-12', accent)} strokeWidth={1.5} />
              </motion.div>
            </div>

            <h3 className="relative mb-1.5 text-base font-semibold tracking-tight text-foreground lg:text-xl">{title}</h3>
            <p className="relative text-sm leading-relaxed text-muted-foreground lg:text-base">{blurb}</p>
            <p className={cn('relative mt-4 flex items-center justify-center gap-1 text-xs font-semibold lg:mt-6 lg:text-sm', id === 'talent' ? 'text-foreground' : 'text-muted-foreground')}>
              Select{' '}
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
