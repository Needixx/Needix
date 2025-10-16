// components/blog/ArticleLayout.tsx
import Link from "next/link";
import { ReactNode } from "react";

type TocItem = { id: string; text: string };
interface ArticleLayoutProps {
  category?: string;
  title: string;
  dek: string;
  author: { name: string; role?: string };
  date: string;
  readTime: string;
  heroImageSrc?: string;
  toc?: TocItem[];
  children: ReactNode;
}

export default function ArticleLayout({
  category = "Money Tips",
  title,
  dek,
  author,
  date,
  readTime,
  heroImageSrc,
  toc = [],
  children,
}: ArticleLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 lg:px-8 bg-white text-zinc-900">
      {/* Breadcrumb */}
      <nav className="mx-auto max-w-3xl text-sm text-zinc-500 py-6">
        <Link href="/blog" className="hover:text-zinc-700 transition-colors">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{title}</span>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-3xl">
        <p className="uppercase tracking-wide text-xs text-cyan-700 font-medium">{category}</p>
        <h1 className="mt-3 text-4xl md:text-5xl font-bold leading-tight tracking-tight">{title}</h1>
        <p className="mt-4 text-xl text-zinc-700 leading-relaxed">{dek}</p>

        {/* Byline */}
        <div className="mt-6 flex items-center gap-4 text-sm text-zinc-500">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />
          <div>
            <div className="text-zinc-700 font-medium">
              {author.name}{author.role ? ` — ${author.role}` : ""}
            </div>
            <div className="flex items-center gap-2">
              <span>{date}</span>
              <span>·</span>
              <span>{readTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Optional hero image */}
      {heroImageSrc ? (
        <div className="mx-auto max-w-5xl mt-10 overflow-hidden rounded-2xl border border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImageSrc} alt="" className="w-full h-auto" />
        </div>
      ) : null}

      {/* Body + TOC */}
      <div className="relative mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,720px)_260px] gap-12 justify-center">
        {/* Article body */}
        <article
          className={[
            "prose prose-lg mx-auto max-w-none",
            // Typography
            "prose-headings:font-bold prose-headings:tracking-tight",
            "prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6",
            "prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4",
            // Body text
            "prose-p:text-zinc-700 prose-p:leading-relaxed",
            "prose-li:text-zinc-700 prose-li:leading-relaxed",
            // Links
            "prose-a:text-cyan-700 prose-a:font-medium hover:prose-a:text-cyan-800 prose-a:no-underline hover:prose-a:underline prose-a:transition-colors",
            // Emphasis
            "prose-strong:text-zinc-900 prose-strong:font-semibold",
            // Lists
            "prose-ul:my-6 prose-ol:my-6",
            // Quotes
            "prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-zinc-700 prose-blockquote:my-8",
            "prose-blockquote:not-italic prose-cite:text-sm prose-cite:text-zinc-500 prose-cite:block prose-cite:mt-2",
          ].join(" ")}
        >
          {children}
        </article>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 h-max space-y-6">
          {/* Table of Contents */}
          {toc.length > 0 && (
            <div className="rounded-xl border border-zinc-200 p-5 bg-white">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">In this article</h4>
              <ul className="space-y-2.5 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a 
                      href={`#${item.id}`} 
                      className="text-zinc-600 hover:text-cyan-700 transition-colors block py-0.5"
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Newsletter signup */}
          <div className="rounded-xl border border-zinc-200 p-5 bg-gradient-to-br from-white to-zinc-50">
            <h5 className="font-semibold text-zinc-900 mb-2">Stay informed</h5>
            <p className="text-sm text-zinc-600 mb-4">
              Get weekly insights on managing subscriptions and expenses better.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="w-full rounded-lg bg-white border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
              />
              <button 
                type="submit"
                className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
              >
                Subscribe
              </button>
            </form>
            <p className="text-xs text-zinc-500 mt-3">
              Unsubscribe anytime. No spam.
            </p>
          </div>

          {/* Quick tip */}
          <div className="rounded-xl bg-cyan-50 border border-cyan-200 p-5">
            <div className="flex gap-2 items-start">
              <span className="text-cyan-600 text-lg">💡</span>
              <div>
                <h5 className="font-semibold text-zinc-900 mb-1 text-sm">Quick tip</h5>
                <p className="text-sm text-zinc-700">
                  Set a monthly reminder to review your subscriptions. Just 5 minutes can save you hundreds.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Related Articles */}
      <section className="mx-auto max-w-5xl mt-16 mb-8">
        <h3 className="text-2xl font-bold mb-6">Continue reading</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <ArticleCard 
            href="/blog/stop-wasting-money-on-forgotten-subscriptions" 
            title="How to Stop Wasting Money on Forgotten Subscriptions"
            description="A systematic approach to finding and eliminating unnecessary recurring charges."
          />
          <ArticleCard 
            href="/blog/automating-reorders-saves-you-5-hours-a-month" 
            title="Why Automating Reorders Saves You 5 Hours a Month"
            description="Turn essential purchases into efficient, automated routines."
          />
          <ArticleCard 
            href="/blog/build-a-smarter-budget" 
            title="Build a Smarter Budget Without Spreadsheets"
            description="Modern budgeting that works with your lifestyle, not against it."
          />
        </div>
      </section>

      {/* End CTA */}
      <section className="mx-auto max-w-5xl mt-16 mb-24">
        <div className="rounded-2xl border border-zinc-200 p-8 bg-gradient-to-br from-purple-50 to-cyan-50">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold text-zinc-900 mb-3">
              Take control of your subscriptions
            </h3>
            <p className="text-lg text-zinc-700 mb-6">
              Needix helps you track, manage, and optimize all your recurring expenses in one place. 
              See what you're really spending and make informed decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="inline-block rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-3 font-semibold text-white hover:from-purple-600 hover:to-cyan-600 transition-all"
              >
                Get started free
              </Link>
              <Link
                href="/how-it-works"
                className="inline-block rounded-xl border-2 border-zinc-300 px-6 py-3 font-semibold text-zinc-700 hover:border-zinc-400 transition-colors"
              >
                Learn how it works
              </Link>
            </div>
            <p className="text-sm text-zinc-600 mt-6">
              Join thousands of users who save an average of $240/month
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ArticleCard({ 
  href, 
  title,
  description
}: { 
  href: string; 
  title: string;
  description: string;
}) {
  return (
    <Link 
      href={href} 
      className="group block rounded-xl border border-zinc-200 p-5 bg-white hover:bg-zinc-50 hover:border-zinc-300 transition-all"
    >
      <div className="h-24 w-full rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 mb-4" />
      <h4 className="font-semibold text-zinc-900 group-hover:text-cyan-700 transition-colors mb-2">
        {title}
      </h4>
      <p className="text-sm text-zinc-600 line-clamp-2">
        {description}
      </p>
      <p className="text-sm text-cyan-700 mt-3 font-medium group-hover:underline">
        Read more →
      </p>
    </Link>
  );
}