import { useId, useMemo, useRef, useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { guessCategory, searchFields } from '@/lib/fields';
import type { SkillCategory } from '@/types';

export interface FieldValue {
  field: string;
  category: SkillCategory;
}

interface FieldPickerProps {
  value: FieldValue | null;
  onChange: (value: FieldValue | null) => void;
  label?: string;
  placeholder?: string;
}

/** Type-ahead field chooser. Suggests known fields as you type and accepts any custom field. */
export function FieldPicker({ value, onChange, label = 'Your field', placeholder = 'Search or type your field, e.g. nursing, UX, farming' }: FieldPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim();
  const results = useMemo(() => searchFields(trimmed, 7), [trimmed]);
  const exact = results.some((r) => r.label.toLowerCase() === trimmed.toLowerCase());
  const showCustom = trimmed.length >= 2 && !exact;
  const rows = [
    ...results.map((r) => ({ field: r.label, category: r.category, custom: false })),
    ...(showCustom ? [{ field: trimmed.slice(0, 60), category: guessCategory(trimmed), custom: true }] : []),
  ];

  const choose = (row: { field: string; category: SkillCategory }) => {
    onChange({ field: row.field, category: row.category });
    setQuery('');
    setOpen(false);
    setActive(0);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && open && rows[active]) {
      e.preventDefault();
      choose(rows[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>

      {value && (
        <div className="inline-flex items-center gap-2 rounded-full border border-brand-strong bg-brand/10 px-3 py-1.5 text-sm font-medium">
          <Check className="h-4 w-4 text-brand-strong" aria-hidden="true" />
          {value.field}
          <button type="button" onClick={() => onChange(null)} aria-label={`Remove ${value.field}`} className="pointer-events-auto text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => {
            setOpen(true);
            // On phones the keyboard covers the suggestions; bring the field to the top first.
            window.setTimeout(() => inputRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 250);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={value ? 'Change your field' : placeholder}
          className="pl-9 scroll-mt-20"
          maxLength={60}
          autoComplete="off"
          enterKeyHint="search"
        />
        {open && rows.length > 0 && (
          <ul id={listId} role="listbox" className="absolute z-30 mt-1 max-h-[40dvh] w-full overflow-auto overscroll-contain rounded-xl border border-border bg-background p-1 shadow-lg">
            {rows.map((row, i) => (
              <li key={`${row.custom ? 'custom:' : ''}${row.field}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(row)}
                  onMouseEnter={() => setActive(i)}
                  className={cn('pointer-events-auto flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm', i === active ? 'bg-muted' : '')}
                >
                  <span className="flex items-center gap-2">
                    {row.custom && <Plus className="h-4 w-4 text-brand-strong" aria-hidden="true" />}
                    {row.custom ? `Use "${row.field}"` : row.field}
                  </span>
                  {!row.custom && <span className="text-xs capitalize text-muted-foreground">{row.category === 'tech' ? 'Technology' : row.category}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Can&apos;t find yours? Type it and choose &ldquo;Use&rdquo;. Any field is welcome.</p>
    </div>
  );
}
