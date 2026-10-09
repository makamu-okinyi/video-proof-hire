import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, Compass, FileText, Home, LogIn, Newspaper, ShieldCheck, Trophy } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useNoIndex } from "@/hooks/useNoIndex";
import { Button } from "@/components/ui/button";

const ease = [0.16, 1, 0.3, 1] as const;

const destinations = [
  { to: "/jobs", label: "Jobs", body: "Roles from employers hiring on proof of skill.", icon: Briefcase },
  { to: "/challenges", label: "Challenges", body: "Show real work and get noticed.", icon: Trophy },
  { to: "/feed", label: "Feed", body: "Video pitches from talent and founders.", icon: Newspaper },
  { to: "/auth", label: "Sign in or join", body: "Access your profile, applications and messages.", icon: LogIn },
];

const policies = [
  { to: "/privacy", label: "Privacy", icon: ShieldCheck },
  { to: "/terms", label: "Terms", icon: FileText },
  { to: "/cookies", label: "Cookies", icon: FileText },
];

const reasons = [
  "The link was mistyped or is out of date.",
  "The page was moved, renamed or removed.",
  "It lives in a signed-in area, and you may need to sign in first.",
];

const NotFound = () => {
  useDocumentTitle("Page not found");
  useNoIndex();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const shown = pathname.length > 80 ? `${pathname.slice(0, 77)}...` : pathname;
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease }}
        className="glass-panel w-full max-w-3xl rounded-2xl p-6 sm:p-10"
        aria-labelledby="nf-title"
        role="region"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Compass className="h-8 w-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b]">Error 404</p>
          <h1 id="nf-title" className="text-3xl font-bold tracking-tight text-[#1e293b] sm:text-5xl">
            We couldn&apos;t find that page
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-[#64748b]">
            <span className="break-all font-medium text-[#1e293b]">{shown}</span> doesn&apos;t exist on Donjo. Nothing is wrong with
            your account or connection.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link to="/"><Home className="mr-2 h-4 w-4" aria-hidden="true" />Back to home</Link>
          </Button>
          {canGoBack && (
            <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Go back
            </Button>
          )}
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-5">
          <section className="md:col-span-2" aria-labelledby="nf-why">
            <h2 id="nf-why" className="text-sm font-semibold uppercase tracking-wider text-[#1e293b]">What may have happened</h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#64748b]">
              {reasons.map((r) => (
                <li key={r} className="flex gap-2"><span aria-hidden="true">&bull;</span><span>{r}</span></li>
              ))}
            </ul>
          </section>

          <section className="md:col-span-3" aria-labelledby="nf-where">
            <h2 id="nf-where" className="text-sm font-semibold uppercase tracking-wider text-[#1e293b]">Try one of these</h2>
            <motion.ul
              className="mt-3 grid gap-3 sm:grid-cols-2"
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } } }}
            >
              {destinations.map(({ to, label, body, icon: Icon }) => (
                <motion.li key={to} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.5, ease }}>
                  <Link
                    to={to}
                    className="flex h-full flex-col gap-1 rounded-xl border border-border/50 bg-white/60 p-4 transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="flex items-center gap-2 font-semibold text-[#1e293b]"><Icon className="h-4 w-4 text-primary" aria-hidden="true" />{label}</span>
                    <span className="text-sm leading-relaxed text-[#64748b]">{body}</span>
                  </Link>
                </motion.li>
              ))}
            </motion.ul>
          </section>
        </div>

        <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border/50 pt-6 text-sm text-[#64748b]" aria-label="Legal">
          {policies.map(({ to, label }) => (
            <Link key={to} to={to} className="underline-offset-4 hover:text-[#1e293b] hover:underline">{label}</Link>
          ))}
        </nav>
      </motion.div>
    </main>
  );
};

export default NotFound;
