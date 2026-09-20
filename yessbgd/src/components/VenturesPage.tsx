"use client";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHero } from "@/components/PageHero";
import { useVentures } from "@/lib/dynamicContent";
import { activeVentures, upcomingVentures } from "@/data/ventures";
import { toImageSrc } from "@/lib/mediaAssets";

type SortKey = "default" | "az" | "za" | "newest" | "oldest";

export function VenturesPage() {
  const ventures = useVentures();
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [service, setService] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("default");

  // Main grid shows live ventures only; upcoming projects get their own section.
  const active = useMemo(() => activeVentures(ventures), [ventures]);
  const upcoming = useMemo(() => upcomingVentures(ventures), [ventures]);

  const categories = useMemo(
    () => Array.from(new Set(active.map((v) => v.category))).sort(),
    [active],
  );
  const services = useMemo(
    () => Array.from(new Set(active.flatMap((v) => v.services))).sort(),
    [active],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = active.filter((v) => {
      if (category !== "all" && v.category !== category) return false;
      if (service !== "all" && !v.services.includes(service)) return false;
      if (!q) return true;
      const haystack = [
        v.title,
        v.tagline,
        v.category,
        v.desc,
        ...v.features.flatMap((f) => [f.title, f.desc]),
        ...v.services,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    const byYear = (v: typeof active[number]) =>
      v.founded ? parseInt(v.founded, 10) : 0;

    if (sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "za") list = [...list].sort((a, b) => b.title.localeCompare(a.title));
    else if (sort === "newest") list = [...list].sort((a, b) => byYear(b) - byYear(a));
    else if (sort === "oldest") list = [...list].sort((a, b) => byYear(a) - byYear(b));

    return list;
  }, [query, category, service, sort, active]);

  const reset = () => {
    setQuery("");
    setCategory("all");
    setService("all");
    setSort("default");
  };

  const hasFilter = query || category !== "all" || service !== "all" || sort !== "default";

  return (
    <>
      <PageHero
        page="ventures"
        eyebrow={t("pages.ventures.eyebrow")}
        title={t("pages.ventures.title")}
        subtitle={t("pages.ventures.subtitle")}
      />
      <section className="pb-24">
        <div className="container-tight">
          {/* Filter bar */}
          <div className="mb-8 rounded-2xl border border-border bg-background/60 p-4 backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ventures, services, features…"
                  aria-label="Search ventures"
                  className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by category"
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                aria-label="Filter by service"
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">All services</option>
                {services.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                aria-label="Sort ventures"
                className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
              >
                <option value="default">Featured order</option>
                <option value="az">Name A–Z</option>
                <option value="za">Name Z–A</option>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <button
                type="button"
                onClick={reset}
                disabled={!hasFilter}
                className="h-11 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset
              </button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {active.length} ventures
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="font-display text-lg font-semibold">No ventures match your filters</p>
              <p className="mt-2 text-sm text-muted-foreground">Try clearing a filter or searching for something else.</p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((v) => {
                const Icon = v.icon;
                return (
                  <Link
                    key={v.slug}
                    to="/ventures/$slug"
                    params={{ slug: v.slug }}
                    className="group overflow-hidden rounded-2xl border border-border bg-background/60 transition-all hover:-translate-y-1 hover:shadow-glow"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={toImageSrc(v.image)}
                        alt={`${v.title} — ${v.category}`}
                        width={1536}
                        height={864}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
                      <span
                        className={`absolute left-4 top-4 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${v.color} text-primary-foreground shadow-elegant`}
                      >
                        <Icon className="h-5 w-5" strokeWidth={1.5} />
                      </span>
                      <span className="absolute right-4 top-4 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/80 backdrop-blur">
                        {v.category}
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg font-semibold">{v.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground">{v.tagline}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                        Learn more <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* UPCOMING PROJECTS — announced, not yet live */}
          {upcoming.length > 0 && (
            <div className="mt-14">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <h2 className="font-display text-xl font-semibold sm:text-2xl">{t("pages.ventures.upcomingTitle")}</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {t("pages.ventures.upcomingBadge")}
                </span>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((v) => {
                  const Icon = v.icon;
                  return (
                    <Link
                      key={v.slug}
                      to="/ventures/$slug"
                      params={{ slug: v.slug }}
                      className="group overflow-hidden rounded-2xl border border-dashed border-border bg-background/40 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <img
                          src={toImageSrc(v.image)}
                          alt={`${v.title} — ${v.category}`}
                          width={1536}
                          height={864}
                          loading="lazy"
                          className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
                        <span
                          className={`absolute left-4 top-4 inline-grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${v.color} text-primary-foreground shadow-elegant`}
                        >
                          <Icon className="h-5 w-5" strokeWidth={1.5} />
                        </span>
                        <span className="absolute right-4 top-4 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur">
                          {t("pages.ventures.upcomingBadge")}
                        </span>
                      </div>
                      <div className="p-5">
                        <h3 className="font-display text-lg font-semibold">{v.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{v.tagline}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          {t("pages.ventures.upcomingCta")} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
