import type { SkillCategory } from '@/types';

/**
 * A broad, searchable catalogue of fields. It can never cover every profession in the world, so the
 * picker also accepts any typed phrase as a custom field. Each entry maps to one of the four
 * platform categories (tech, design, business, other) used for filtering and analytics.
 */
export interface FieldOption {
  label: string;
  category: SkillCategory;
  /** Extra search words people might type. */
  aliases?: string[];
}

const f = (category: SkillCategory, label: string, aliases: string[] = []): FieldOption => ({ label, category, aliases });

export const FIELD_CATALOGUE: FieldOption[] = [
  // Technology
  f('tech', 'Software Engineering', ['developer', 'programmer', 'coding', 'software developer']),
  f('tech', 'Frontend Development', ['react', 'web developer', 'javascript', 'typescript', 'ui developer']),
  f('tech', 'Backend Development', ['node', 'api', 'server', 'java', 'python', 'golang']),
  f('tech', 'Full-Stack Development', ['fullstack', 'full stack']),
  f('tech', 'Mobile App Development', ['android', 'ios', 'flutter', 'kotlin', 'swift', 'react native']),
  f('tech', 'Data Science', ['data scientist', 'analytics', 'statistics']),
  f('tech', 'Data Analysis', ['data analyst', 'excel', 'sql', 'power bi', 'tableau']),
  f('tech', 'Data Engineering', ['etl', 'pipelines', 'big data', 'spark']),
  f('tech', 'Machine Learning & AI', ['ai', 'ml', 'artificial intelligence', 'deep learning', 'llm']),
  f('tech', 'Cybersecurity', ['security', 'infosec', 'pentest', 'ethical hacking']),
  f('tech', 'Cloud & DevOps', ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'sre', 'devops engineer']),
  f('tech', 'IT Support & Systems Administration', ['helpdesk', 'sysadmin', 'network', 'it technician']),
  f('tech', 'Networking & Telecommunications', ['network engineer', 'telecom', 'fiber']),
  f('tech', 'Quality Assurance & Testing', ['qa', 'tester', 'test automation']),
  f('tech', 'Blockchain & Web3', ['crypto', 'smart contracts', 'solidity']),
  f('tech', 'Game Development', ['unity', 'unreal', 'game dev']),
  f('tech', 'Embedded Systems & IoT', ['arduino', 'hardware', 'firmware', 'electronics']),
  f('tech', 'Robotics & Automation', ['mechatronics', 'drones']),
  f('tech', 'Technical Writing', ['documentation', 'docs']),
  f('tech', 'Product Management', ['product manager', 'pm', 'roadmap']),
  // Design & creative
  f('design', 'UI/UX Design', ['ux', 'ui', 'user experience', 'figma', 'product designer']),
  f('design', 'Graphic Design', ['branding', 'logo', 'illustrator', 'photoshop', 'canva']),
  f('design', 'Motion Graphics & Animation', ['after effects', 'animator', '2d', '3d']),
  f('design', 'Video Production & Editing', ['videographer', 'video editor', 'premiere', 'filmmaking', 'film']),
  f('design', 'Photography', ['photographer', 'photo editing', 'lightroom']),
  f('design', 'Content Creation', ['creator', 'influencer', 'youtube', 'tiktok', 'social media content']),
  f('design', 'Copywriting & Content Writing', ['writer', 'blogger', 'journalism', 'editor', 'author']),
  f('design', 'Music & Audio Production', ['musician', 'producer', 'sound engineering', 'singer', 'dj', 'podcast']),
  f('design', 'Fashion & Textile Design', ['fashion designer', 'tailor', 'clothing', 'garment']),
  f('design', 'Interior Design', ['interiors', 'decor', 'home staging']),
  f('design', 'Architecture', ['architect', 'cad', 'revit', 'urban planning']),
  f('design', 'Industrial & Product Design', ['product design', 'prototyping']),
  f('design', 'Illustration & Fine Art', ['artist', 'painting', 'drawing', 'sculpture']),
  f('design', 'Performing Arts', ['acting', 'actor', 'dance', 'theatre', 'comedy', 'poetry']),
  // Business
  f('business', 'Marketing', ['digital marketing', 'seo', 'brand', 'advertising']),
  f('business', 'Social Media Management', ['community manager', 'instagram', 'facebook']),
  f('business', 'Sales & Business Development', ['salesperson', 'account executive', 'b2b', 'bd']),
  f('business', 'Customer Success & Support', ['customer service', 'call centre', 'support agent']),
  f('business', 'Accounting & Bookkeeping', ['accountant', 'cpa', 'audit', 'tax', 'bookkeeper']),
  f('business', 'Finance & Banking', ['financial analyst', 'investment', 'banker', 'fintech', 'insurance']),
  f('business', 'Entrepreneurship & Startups', ['founder', 'startup', 'business owner', 'ceo']),
  f('business', 'Project Management', ['project manager', 'scrum', 'agile', 'pmp']),
  f('business', 'Operations & Supply Chain', ['logistics', 'procurement', 'warehouse', 'inventory']),
  f('business', 'Human Resources & Recruitment', ['hr', 'recruiter', 'talent acquisition']),
  f('business', 'Public Relations & Communications', ['pr', 'communications', 'media relations']),
  f('business', 'Business Analysis & Consulting', ['consultant', 'business analyst', 'strategy']),
  f('business', 'Legal & Compliance', ['lawyer', 'paralegal', 'advocate', 'law', 'regulation']),
  f('business', 'Real Estate & Property', ['realtor', 'property management', 'estate agent']),
  f('business', 'Hospitality & Tourism', ['hotel', 'travel', 'chef', 'restaurant', 'events', 'catering']),
  f('business', 'Retail & E-commerce', ['shop', 'online store', 'merchandising', 'shopify']),
  f('business', 'Administration & Office Management', ['secretary', 'receptionist', 'executive assistant', 'virtual assistant']),
  // Other
  f('other', 'Healthcare & Nursing', ['nurse', 'doctor', 'clinical', 'medicine', 'pharmacy', 'medical']),
  f('other', 'Public Health & Community Work', ['community health', 'ngo', 'social work', 'humanitarian']),
  f('other', 'Education & Teaching', ['teacher', 'tutor', 'lecturer', 'trainer', 'curriculum']),
  f('other', 'Agriculture & Agribusiness', ['farming', 'agronomy', 'horticulture', 'livestock', 'agritech']),
  f('other', 'Engineering (Civil, Mechanical, Electrical)', ['civil engineer', 'mechanical engineer', 'electrical engineer', 'construction']),
  f('other', 'Energy & Environment', ['solar', 'renewable', 'climate', 'sustainability', 'conservation']),
  f('other', 'Skilled Trades', ['plumber', 'electrician', 'carpenter', 'welder', 'mechanic', 'artisan', 'fundi']),
  f('other', 'Transport & Driving', ['driver', 'pilot', 'boda', 'delivery', 'fleet']),
  f('other', 'Beauty & Wellness', ['hair', 'barber', 'makeup', 'spa', 'fitness', 'personal trainer']),
  f('other', 'Sports & Coaching', ['athlete', 'football', 'coach', 'referee']),
  f('other', 'Science & Research', ['researcher', 'laboratory', 'biology', 'chemistry', 'physics']),
  f('other', 'Security & Safety', ['guard', 'safety officer', 'emergency']),
  f('other', 'Translation & Languages', ['translator', 'interpreter', 'linguist']),
  f('other', 'Government & Public Service', ['civil service', 'policy', 'diplomacy']),
];

export const BASE_CATEGORIES: { value: SkillCategory; label: string }[] = [
  { value: 'tech', label: 'Technology' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' },
];

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Levenshtein distance capped at `max`, for forgiving typos ("desgin"). */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

function scoreOption(opt: FieldOption, q: string): number {
  const label = norm(opt.label);
  const words = [label, ...(opt.aliases ?? []).map(norm)];
  let best = 0;
  for (const w of words) {
    if (w === q) best = Math.max(best, 100);
    else if (w.startsWith(q)) best = Math.max(best, 80);
    else if (w.split(' ').some((t) => t.startsWith(q))) best = Math.max(best, 65);
    else if (w.includes(q)) best = Math.max(best, 50);
    else if (q.length >= 4) {
      const close = w.split(' ').some((t) => t.length >= 4 && editDistance(t.slice(0, q.length + 1), q, 2) <= 2);
      if (close) best = Math.max(best, 30);
    }
  }
  // Multi-word queries: every word must match something.
  const parts = q.split(' ').filter(Boolean);
  if (!best && parts.length > 1) {
    const hay = words.join(' ');
    if (parts.every((p) => hay.includes(p))) best = 40;
  }
  return best;
}

/** Ranked matches for a typed query; an empty query returns the starter set. */
export function searchFields(query: string, limit = 8): FieldOption[] {
  const q = norm(query);
  if (!q) return FIELD_CATALOGUE.filter((_, i) => i % 5 === 0).slice(0, limit);
  return FIELD_CATALOGUE.map((opt) => ({ opt, score: scoreOption(opt, q) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.opt.label.localeCompare(b.opt.label))
    .slice(0, limit)
    .map((r) => r.opt);
}

/** Best-guess base category for a free-typed field, so custom fields still file correctly. */
export function guessCategory(text: string): SkillCategory {
  const hit = searchFields(text, 1)[0];
  return hit ? hit.category : 'other';
}

export function findField(label: string | null | undefined): FieldOption | undefined {
  if (!label) return undefined;
  const n = norm(label);
  return FIELD_CATALOGUE.find((o) => norm(o.label) === n);
}
