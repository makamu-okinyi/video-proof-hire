import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { LegalLinks } from '@/components/legal/LegalLinks';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { LEGAL_EFFECTIVE_LABEL, resolveTokens, type LegalBlock, type LegalDoc } from '@/data/legal';
import { cn } from '@/lib/utils';

function Block({ block }: { block: LegalBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="leading-7 text-foreground">{resolveTokens(block.text)}</p>;
    case 'ul':
      return (
        <ul className="list-disc space-y-1.5 pl-6 leading-7">
          {block.items.map((i, k) => <li key={k}>{resolveTokens(i)}</li>)}
        </ul>
      );
    case 'ol':
      return (
        <ol className="list-decimal space-y-1.5 pl-6 leading-7">
          {block.items.map((i, k) => <li key={k}>{resolveTokens(i)}</li>)}
        </ol>
      );
    case 'defs':
      return (
        <dl className="space-y-3">
          {block.items.map((d, k) => (
            <div key={k}>
              <dt className="font-semibold text-foreground">{resolveTokens(d.term)}</dt>
              <dd className="leading-7 text-muted-foreground">{resolveTokens(d.def)}</dd>
            </div>
          ))}
        </dl>
      );
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[32rem] border-collapse text-sm">
            <caption className="sr-only">{block.caption}</caption>
            <thead className="bg-[hsl(var(--secondary))] text-left">
              <tr>{block.head.map((h) => <th key={h} scope="col" className="px-3 py-2.5 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-2.5 align-top">{resolveTokens(c)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'note':
      return <p className="rounded-xl border-l-4 border-[hsl(var(--brand-strong))] bg-[hsl(var(--muted))] px-4 py-3 text-sm leading-6">{resolveTokens(block.text)}</p>;
  }
}

/** Long-form reader for a legal document: summary, sticky contents with scrollspy, numbered sections. */
export default function LegalPage({ doc }: { doc: LegalDoc }) {
  useDocumentTitle(doc.title);
  const [active, setActive] = useState(doc.sections[0]?.id);

  useEffect(() => {
    const els = doc.sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [doc]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="no-print border-b border-border bg-background/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Donjo home"><Logo size="sm" /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Donjo
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
        <aside className="no-print mb-8 lg:mb-0">
          <nav aria-label={`${doc.title} contents`} className="lg:sticky lg:top-8">
            <details className="lg:open rounded-xl border border-border p-4 lg:border-0 lg:p-0" open>
              <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-muted-foreground lg:cursor-default">Contents</summary>
              <ol className="mt-3 space-y-0.5 text-sm">
                {doc.sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      aria-current={active === s.id ? 'true' : undefined}
                      className={cn('block rounded-lg px-2.5 py-1.5 hover:bg-accent', active === s.id ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground')}
                    >
                      {i + 1}. {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          </nav>
        </aside>

        <main>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{doc.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <p>Last updated: <time dateTime="2026-09-30">{LEGAL_EFFECTIVE_LABEL}</time></p>
            <button type="button" onClick={() => window.print()} className="no-print inline-flex items-center gap-1.5 hover:text-foreground">
              <Printer className="h-4 w-4" aria-hidden="true" /> Print
            </button>
          </div>

          <section aria-label="Summary" className="neo-subtle mt-6 rounded-2xl p-5">
            <h2 className="text-base font-semibold">In short</h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6">
              {doc.summary.map((s, i) => <li key={i}>{resolveTokens(s)}</li>)}
            </ul>
          </section>

          <div className="mt-10 space-y-10">
            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-8 space-y-4">
                <h2 className="text-xl font-semibold">
                  <a href={`#${s.id}`} className="hover:underline">{i + 1}. {s.title}</a>
                </h2>
                {s.blocks.map((b, k) => <Block key={k} block={b} />)}
              </section>
            ))}
          </div>

          <div className="no-print mt-12 border-t border-border pt-6"><LegalLinks /></div>
        </main>
      </div>
    </div>
  );
}
