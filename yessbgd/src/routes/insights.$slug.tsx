import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, Clock, User, Twitter, Facebook, Linkedin, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { PageHero } from "@/components/PageHero";
import { getInsight, insights } from "@/data/insights";
import { useInsight, useInsights } from "@/lib/dynamicContent";

export const Route = createFileRoute("/insights/$slug")({
  head: ({ params }) => {
    const post = getInsight(params.slug);
    const title = post ? `${post.title} — YESS Bangla Insights` : "Article — YESS Bangla";
    const description = post?.excerpt ?? "Read the latest insight from YESS Bangla.";
    const url = post ? `https://yessbangla.com/insights/${post.slug}` : "https://yessbangla.com/insights";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(post ? [
          { property: "article:published_time", content: post.date },
          { property: "article:author", content: post.author.name },
          { property: "article:section", content: post.tag },
        ] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: post ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          author: { "@type": "Person", name: post.author.name },
          datePublished: post.date,
          articleSection: post.tag,
          mainEntityOfPage: url,
        }),
      }] : undefined,
    };
  },
  loader: ({ params }) => {
    const post = getInsight(params.slug);
    if (!post) throw notFound();
    return { post };
  },
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
  component: InsightDetail,
});

function NotFound() {
  return (
    <PageHero
      eyebrow="404"
      title="Article not found."
      subtitle={<Link to="/insights" className="text-primary underline underline-offset-4">Back to all insights</Link>}
    />
  );
}

function ErrorView({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <PageHero
      eyebrow="Error"
      title="Something went wrong."
      subtitle={
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="text-primary underline underline-offset-4"
        >
          Try again — {error.message}
        </button>
      }
    />
  );
}

function InsightDetail() {
  const { post: staticPost } = Route.useLoaderData() as { post: NonNullable<ReturnType<typeof getInsight>> };
  const allInsights = useInsights();
  const post = useInsight(staticPost.slug) ?? staticPost;
  const related = allInsights.filter((p) => p.slug !== post.slug).slice(0, 3);
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = encodeURIComponent(post.title);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <>
      <section className="relative overflow-hidden pt-16 pb-10 md:pt-24">
        <div className="orb h-[420px] w-[420px] -top-32 -left-24" style={{ background: "oklch(0.82 0.14 188 / 0.5)" }} />
        <div className="orb h-[360px] w-[360px] -top-20 right-0" style={{ background: "oklch(0.85 0.16 28 / 0.4)", animationDelay: "-8s" }} />
        <div className="container-tight relative max-w-3xl">
          <Link to="/insights" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
            <ArrowLeft className="h-4 w-4" /> All insights
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs">
            <span className="rounded-full bg-gradient-primary px-3 py-1 font-semibold text-primary-foreground">{post.tag}</span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {post.date}</span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {post.readTime}</span>
          </div>
          <h1 className="hero-fade mt-4 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            {post.title}
          </h1>
          <p className="hero-fade mt-5 text-lg text-muted-foreground" style={{ animationDelay: "60ms" }}>
            {post.excerpt}
          </p>
          <div className="mt-8 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-primary-foreground">
              <User className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{post.author.name}</div>
              <div className="text-xs text-muted-foreground">{post.author.role}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="container-tight max-w-3xl">
          <article className="prose-custom">
            {post.content.map((block, i) => (
              <div key={i} className="mt-8 first:mt-0">
                {block.heading && (
                  <h2 className="font-display text-2xl font-semibold tracking-tight">{block.heading}</h2>
                )}
                <p className={`leading-relaxed text-foreground/85 ${block.heading ? "mt-3" : ""}`}>
                  {block.body}
                </p>
              </div>
            ))}
          </article>

          <div className="mt-12 rounded-2xl glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-sm font-semibold">Share this article</span>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
                >
                  <Twitter className="h-3.5 w-3.5" /> Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
                >
                  <Facebook className="h-3.5 w-3.5" /> Facebook
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
                >
                  <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                </a>
                <button
                  onClick={onCopy}
                  className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs font-semibold transition-all hover:-translate-y-0.5"
                >
                  <LinkIcon className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container-tight">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Related articles</h2>
            <Link to="/insights" className="text-sm font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {related.map((p) => (
              <Link
                key={p.slug}
                to="/insights/$slug"
                params={{ slug: p.slug }}
                className="group flex flex-col rounded-2xl glass-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elegant"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1 font-medium text-primary">{p.tag}</span>
                  <span className="text-muted-foreground">{p.readTime}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-2.5">
                  Read article <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="container-tight">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center text-primary-foreground shadow-glow md:p-14">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Want results like this for your business?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Tell us your goals — we'll send back a written proposal within 1–3 business days.
            </p>
            <Link to="/contact" className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-elegant transition-all hover:-translate-y-0.5">
              Start a conversation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
