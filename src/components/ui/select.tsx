import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { useFieldContext } from "@/components/ui/field";

/**
 * Accessible custom Select / MultiSelect (ARIA combobox + listbox).
 *  - Keyboard: Arrow keys, Home/End, Enter/Space, Esc, Tab, type-ahead.
 *  - Searchable automatically when there are more than SEARCH_THRESHOLD options.
 *  - Rendered in a portal (never clipped); becomes a bottom sheet on small screens.
 */

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

const SEARCH_THRESHOLD = 8;
const POPOVER_MAX_HEIGHT = 288;

interface BaseProps {
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  invalid?: boolean;
  required?: boolean;
  /** Force searchable on/off (default: on when options > 8). */
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  "aria-label"?: string;
}

interface SingleProps extends BaseProps {
  multiple?: false;
  value: string;
  onValueChange: (value: string) => void;
  clearable?: boolean;
}

interface MultiProps extends BaseProps {
  multiple: true;
  values: string[];
  onValuesChange: (values: string[]) => void;
  /** Maximum number of selections. */
  max?: number;
}

type ListboxProps = SingleProps | MultiProps;

function useIsMobile() {
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return mobile;
}

function ListboxField(props: ListboxProps) {
  const { options, placeholder = "Select...", disabled, invalid, className, searchPlaceholder = "Search...", emptyText = "No matches" } = props;
  const field = useFieldContext();
  const uid = React.useId().replace(/:/g, "");
  const triggerId = props.id ?? field?.id ?? `sel-${uid}`;
  const listId = `${uid}-list`;
  const searchable = props.searchable ?? options.length > SEARCH_THRESHOLD;
  const isInvalid = invalid ?? field?.invalid ?? false;
  const mobile = useIsMobile();

  const sp = props as SingleProps;
  const mp = props as MultiProps;
  const multiple = props.multiple === true;
  const selectedValues: string[] = multiple ? mp.values : sp.value ? [sp.value] : [];

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const typeahead = React.useRef({ buffer: "", timer: 0 as number | undefined });
  const [pos, setPos] = React.useState<{ left: number; width: number; top?: number; bottom?: number; maxHeight: number }>({
    left: 0,
    width: 240,
    maxHeight: POPOVER_MAX_HEIGHT,
  });

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = React.useCallback((refocus = true) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openList = React.useCallback(() => {
    if (disabled) return;
    const firstSel = options.findIndex((o) => selectedValues.includes(o.value));
    setActive(Math.max(0, firstSel));
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, options, selectedValues.join("|")]);

  // Position the popover relative to the trigger (desktop) and keep it in view.
  const reposition = React.useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const flip = below < 200 && above > below;
    const maxHeight = Math.max(160, Math.min(POPOVER_MAX_HEIGHT, flip ? above : below));
    setPos({
      left: Math.max(8, Math.min(r.left, window.innerWidth - Math.max(r.width, 220) - 8)),
      width: Math.max(r.width, 220),
      ...(flip ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      maxHeight,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open || mobile) return;
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, mobile, reposition]);

  // Close on outside pointer; focus the search box when searchable.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      close(false);
    };
    document.addEventListener("pointerdown", onDown);
    if (searchable) requestAnimationFrame(() => searchRef.current?.focus());
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, searchable, close]);

  // Keep the active option scrolled into view.
  React.useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open, filtered.length]);

  React.useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const choose = (opt: SelectOption) => {
    if (opt.disabled) return;
    if (multiple) {
      const has = mp.values.includes(opt.value);
      if (has) mp.onValuesChange(mp.values.filter((v) => v !== opt.value));
      else if (!mp.max || mp.values.length < mp.max) mp.onValuesChange([...mp.values, opt.value]);
    } else {
      sp.onValueChange(opt.value);
      close();
    }
  };

  const runTypeahead = (char: string) => {
    const ta = typeahead.current;
    window.clearTimeout(ta.timer);
    ta.buffer += char.toLowerCase();
    ta.timer = window.setTimeout(() => (ta.buffer = ""), 600);
    const startAt = ta.buffer.length === 1 ? active + 1 : active;
    const ordered = [...filtered.slice(startAt), ...filtered.slice(0, startAt)];
    const hit = ordered.find((o) => o.label.toLowerCase().startsWith(ta.buffer) && !o.disabled);
    if (hit) setActive(filtered.indexOf(hit));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    const fromSearch = e.target === searchRef.current;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !searchable) {
        e.preventDefault();
        openList();
        runTypeahead(e.key);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
        break;
      case "Home":
        if (!fromSearch) { e.preventDefault(); setActive(0); }
        break;
      case "End":
        if (!fromSearch) { e.preventDefault(); setActive(filtered.length - 1); }
        break;
      case "PageDown":
        e.preventDefault();
        setActive((a) => Math.min(filtered.length - 1, a + 8));
        break;
      case "PageUp":
        e.preventDefault();
        setActive((a) => Math.max(0, a - 8));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[active]) choose(filtered[active]);
        break;
      case " ":
        if (!fromSearch) {
          e.preventDefault();
          if (filtered[active]) choose(filtered[active]);
        }
        break;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && !fromSearch) {
          e.preventDefault();
          runTypeahead(e.key);
        }
    }
  };

  const labelOf = (value: string) => options.find((o) => o.value === value)?.label ?? value;
  const activeId = open && filtered[active] ? `${uid}-opt-${active}` : undefined;

  const triggerContent = multiple ? (
    mp.values.length === 0 ? (
      <span className="text-[hsl(var(--field-placeholder))]">{placeholder}</span>
    ) : (
      <span className="flex flex-wrap gap-1.5">
        {mp.values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2 py-0.5 text-sm text-foreground">
            {labelOf(v)}
            {!disabled && (
              <button
                type="button"
                tabIndex={-1}
                aria-label={`Remove ${labelOf(v)}`}
                onClick={(e) => {
                  e.stopPropagation();
                  mp.onValuesChange(mp.values.filter((x) => x !== v));
                }}
                className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </span>
        ))}
      </span>
    )
  ) : sp.value ? (
    <span className="block truncate">{labelOf(sp.value)}</span>
  ) : (
    <span className="text-[hsl(var(--field-placeholder))]">{placeholder}</span>
  );

  const popover = open && (
    <>
      {mobile && <div className="fixed inset-0 z-[80] bg-black/40" aria-hidden="true" />}
      <div
        ref={popRef}
        onKeyDown={onKeyDown}
        style={
          mobile
            ? undefined
            : { position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }
        }
        className={cn(
          "z-[90] flex flex-col overflow-hidden border border-[hsl(var(--field-border))] bg-[hsl(var(--popover))] text-popover-foreground shadow-lg",
          mobile
            ? "fixed inset-x-0 bottom-0 max-h-[70dvh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
            : "rounded-xl",
        )}
      >
        {mobile && <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[hsl(var(--field-border))]" aria-hidden="true" />}
        {searchable && (
          <div className="relative border-b border-border p-2">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              ref={searchRef}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={activeId}
              aria-label={searchPlaceholder}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="done"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              placeholder={searchPlaceholder}
              className="field-control h-10 pl-9"
            />
          </div>
        )}
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          aria-multiselectable={multiple || undefined}
          aria-label={props["aria-label"] ?? placeholder}
          className="min-h-0 flex-1 overflow-y-auto p-1"
        >
          {filtered.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground" role="presentation">{emptyText}</li>}
          {filtered.map((opt, i) => {
            const selected = selectedValues.includes(opt.value);
            return (
              <li
                key={opt.value}
                id={`${uid}-opt-${i}`}
                role="option"
                data-index={i}
                aria-selected={selected}
                aria-disabled={opt.disabled || undefined}
                onMouseDown={(e) => e.preventDefault()}
                onMouseMove={() => active !== i && setActive(i)}
                onClick={() => choose(opt)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-base sm:py-2 sm:text-sm",
                  i === active && "bg-accent",
                  selected && "font-medium",
                  opt.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{opt.label}</span>
                  {opt.description && <span className="block truncate text-xs text-muted-foreground">{opt.description}</span>}
                </span>
                {selected && <Check className="h-4 w-4 shrink-0 text-[hsl(var(--brand-strong))]" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
        {mobile && (
          <div className="border-t border-border p-2">
            <button type="button" onClick={() => close()} className="h-11 w-full rounded-xl bg-secondary text-sm font-medium">
              {multiple ? "Done" : "Cancel"}
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="relative">
      <div
        ref={triggerRef}
        id={triggerId}
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={!searchable ? activeId : undefined}
        aria-invalid={isInvalid || undefined}
        aria-disabled={disabled || undefined}
        aria-required={(props.required ?? field?.required) || undefined}
        aria-describedby={field?.describedBy}
        aria-label={props["aria-label"]}
        data-open={open}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "field-control flex min-h-11 cursor-pointer items-center justify-between gap-2 text-left",
          className,
        )}
      >
        <span className="min-w-0 flex-1">{triggerContent}</span>
        {!multiple && sp.clearable && sp.value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              sp.onValueChange("");
            }}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </div>
      {props.name && !multiple && <input type="hidden" name={props.name} value={sp.value} />}
      {popover && createPortal(popover, document.body)}
    </div>
  );
}

export function Select(props: Omit<SingleProps, "multiple">) {
  return <ListboxField {...props} />;
}

export function MultiSelect(props: Omit<MultiProps, "multiple">) {
  return <ListboxField {...props} multiple />;
}
