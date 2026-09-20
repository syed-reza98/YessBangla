import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Calendar, Mail } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useInsights } from "@/lib/dynamicContent";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights & Blog — YESS Bangla" },
      { name: "description", content: "Articles, case studies and industry insights from YESS Bangla's consultants and engineers." },
      { property: "og:title", content: "Insights — YESS Bangla" },
      { property: "og:description", content: "Latest thinking on business strategy and technology in Bangladesh." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://yessbangla.com/insights" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://yessbangla.com/insights" }],
  }),
  component: Insights,
});

const categories = ["All", "Strategy", "Technology", "E-commerce", "Leadership", "IT Services", "Design"];

function Insights() {
  const insights = useInsights();
  const featured = insights[0];
  const posts = insights.slice(1);
  const { t } = useTranslation();
  return (
    <>
      <PageHero
        page="insights"
        eyebrow={t("pages.insights.eyebrow")}
        title={t("pages.insights.title")}
        subtitle={t("pages.insights.subtitle")}
      />

      <section className="pb-6">
        <div className="container-tight flex flex-wrap justify-center gap-2">
          {categories.map((c, i) => (
            <button
              key={c}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                i === 0
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "glass-card text-muted-foreground hover:text-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="py-10">
        <div className="container-tight">
          <Link
            to="/insights/$slug"
            params={{ slug: featured.slug }}
            className="group grid gap-8 overflow-hidden rounded-3xl glass-card p-8 transition-all hover:border-primary/40 hover:shadow-elegant md:grid-cols-2 md:p-10"
          >
            <div className="relative grid h-56 place-items-center overflow-hidden rounded-2xl bg-gradient-primary md:h-full">
              <div className="absolute inset-0 grid-pattern opacity-30" />
              <span className="relative font-display text-5xl font-semibold text-primary-foreground">YB</span>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-gradient-primary px-3 py-1 font-semibold text-primary-foreground">Featured</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {featured.date}</span>
                <span className="text-muted-foreground">· {featured.readTime}</span>
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold leading-snug sm:text-3xl">{featured.title}</h2>
              <p className="mt-3 text-muted-foreground">{featured.excerpt}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                Read featured article <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="py-10">
        <div className="container-tight grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              to="/insights/$slug"
              params={{ slug: p.slug }}
              className="group flex flex-col rounded-2xl glass-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full bg-secondary px-3 py-1 font-medium text-primary">{p.tag}</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" /> {p.date}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.excerpt}</p>
              <div className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                Read article <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center text-primary-foreground shadow-glow md:p-14">
            <Mail className="mx-auto h-8 w-8 opacity-90" />
            <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">Get insights in your inbox.</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Monthly perspectives on strategy, technology and design — written for leaders building in Bangladesh. No spam.
            </p>
            <form
              className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                required
                placeholder="you@company.com"
                className="flex-1 rounded-full border border-primary-foreground/30 bg-background/10 px-5 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-foreground/40"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-elegant transition-all hover:-translate-y-0.5"
              >
                Subscribe <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-6 text-xs text-primary-foreground/70">
              Or <Link to="/contact" className="underline underline-offset-4">talk to our team</Link> directly.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
