import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { Briefcase, Compass, Loader2, MapPin, Play } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FieldPicker, type FieldValue } from '@/components/profile/FieldPicker';
import { useAuth } from '@/context/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BASE_CATEGORIES, findField } from '@/lib/fields';
import type { SkillCategory } from '@/types';

const norm = (s: string) => s.toLowerCase();

/** Words from the chosen field that should appear in a job or video for it to count as a match. */
function fieldTerms(field: string): string[] {
  const known = findField(field);
  const words = [field, ...(known?.aliases ?? [])].flatMap((t) => norm(t).split(/[^a-z0-9]+/)).filter((w) => w.length >= 3);
  return Array.from(new Set(words));
}

export default function Discover() {
  useDocumentTitle('Discover');
  const { profile } = useAuth();
  const upsertProfile = useMutation(api.profiles.upsertProfile);
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<FieldValue | null>(null);
  const [category, setCategory] = useState<SkillCategory | 'all'>('all');

  // Start from the field saved on the profile.
  useEffect(() => {
    if (profile?.field && profile.skill_category) {
      setPicked({ field: profile.field, category: profile.skill_category as SkillCategory });
    }
  }, [profile?.field, profile?.skill_category]);

  const jobs = useQuery(api.jobs.getActiveJobs, { limit: 100 });
  const videos = useQuery(api.videos.getPublicVideos, { limit: 100 });

  const terms = useMemo(() => (picked ? fieldTerms(picked.field) : []), [picked]);
  const matches = (text: string) => terms.some((t) => norm(text).includes(t));

  const jobResults = (jobs ?? []).filter((j) => {
    if (picked) return matches(`${j.title} ${j.description} ${(j.skillsRequired ?? []).join(' ')}`);
    return true;
  });
  const videoResults = (videos ?? []).filter((v) => {
    if (picked) return v.skillCategory === picked.category || matches(`${v.title ?? ''} ${v.description ?? ''}`);
    return category === 'all' || v.skillCategory === category;
  });

  const saveField = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      await upsertProfile({ field: picked.field, skillCategory: picked.category });
      toast.success(`Your field is now ${picked.field}`);
    } catch {
      toast.error('Could not save your field. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const unsaved = !!picked && (picked.field !== profile?.field || picked.category !== profile?.skill_category);

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-4xl space-y-8 p-4 sm:p-6">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-charcoal sm:text-3xl">
            <Compass className="h-6 w-6" aria-hidden="true" /> Discover
          </h1>
          <p className="text-sm text-cool-grey sm:text-base">Find your field, then see the jobs and videos that match it.</p>
        </div>

        <div className="neo-extruded space-y-4 p-4 sm:p-6">
          <FieldPicker value={picked} onChange={setPicked} label="Your field" />
          {unsaved && (
            <button
              type="button"
              onClick={saveField}
              disabled={saving}
              className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Save as my field
            </button>
          )}
          {!picked && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Browse by category">
              {[{ value: 'all', label: 'Everything' }, ...BASE_CATEGORIES].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value as SkillCategory | 'all')}
                  aria-pressed={category === c.value}
                  className={`pointer-events-auto min-h-11 rounded-full border px-4 text-sm font-medium ${category === c.value ? 'border-brand-strong bg-brand/10' : 'border-border hover:bg-muted'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <section aria-labelledby="disc-jobs" className="space-y-3">
          <h2 id="disc-jobs" className="text-lg font-semibold text-charcoal">{picked ? `${picked.field} jobs` : 'Open jobs'}</h2>
          {jobs === undefined ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading jobs" />
          ) : jobResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open jobs match this field yet. <Link to="/jobs" className="font-medium underline">Browse all jobs</Link></p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {jobResults.slice(0, 6).map((j) => (
                <li key={j._id}>
                  <Link to="/jobs" className="neo-extruded-sm block h-full p-4 hover:-translate-y-0.5 transition-transform">
                    <p className="flex items-center gap-2 font-semibold text-charcoal"><Briefcase className="h-4 w-4 shrink-0" aria-hidden="true" /> <span className="truncate">{j.title}</span></p>
                    <p className="mt-1 text-sm text-cool-grey">{j.companyName ?? 'Company'}</p>
                    {j.location && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" aria-hidden="true" /> {j.location}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="disc-videos" className="space-y-3">
          <h2 id="disc-videos" className="text-lg font-semibold text-charcoal">{picked ? `${picked.field} talent videos` : 'Talent videos'}</h2>
          {videos === undefined ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading videos" />
          ) : videoResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No videos in this field yet. Be the first to post one.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {videoResults.slice(0, 9).map((v) => (
                <li key={v._id}>
                  <Link to={`/watch/${v._id}`} className="neo-extruded-sm group relative block aspect-[9/12] overflow-hidden">
                    {v.thumbnailUrl ? (
                      <img src={v.thumbnailUrl} alt={v.title ?? 'Video'} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted"><Play className="h-8 w-8 text-muted-foreground" aria-hidden="true" /></div>
                    )}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent p-2 text-xs font-medium text-white">{v.title ?? 'Untitled'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
