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
        <Link href="/blog" className="hover:text-zinc-700">Blog</Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700">{title}</span>
      </nav>

      {/* Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="uppercase tracking-wide text-xs text-cyan-700">{category}</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-extrabold leading-tight">{title}</h1>
        <p className="mt-4 text-xl text-zinc-700">{dek}</p>

        {/* Byline */}
        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-zinc-500">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500" />
          <div>
            <div className="text-zinc-700">
              {author.name}{author.role ? ` — ${author.role}` : ""}
            </div>
            <div>{date} · {readTime}</div>
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

      {/* Body + TOC (centered reading column) */}
      <div className="relative mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,780px)_280px] gap-12 justify-center">
               {/* Article body */}
        <article
          className={[
            // Base typography
            "prose prose-lg mx-auto max-w-none",
            // ➜ Center all text in the reading column
            "text-center prose-headings:text-center prose-p:text-center prose-ul:text-center prose-ol:text-center",
            // Larger, bolder section headers
            "prose-h2:text-5xl md:prose-h2:text-6xl prose-h2:font-extrabold prose-h2:tracking-tight prose-h2:mt-12 prose-h2:mb-4",
            "prose-h3:text-3xl md:prose-h3:text-4xl prose-h3:font-bold prose-h3:mt-10",
            // Airy line-height + spacing
            "prose-p:text-zinc-800 prose-li:text-zinc-800",
            "prose-p:leading-9 prose-li:leading-9",
            "prose-p:my-6 prose-ul:my-6 prose-ol:my-6",
            // Center lists nicely (bullets inside)
            "prose-ul:list-inside prose-ol:list-inside",
            // Links / quote
            "prose-a:text-cyan-700 hover:prose-a:text-cyan-800",
            "prose-blockquote:border-l-cyan-300 prose-blockquote:text-zinc-900",
          ].join(" ")}
        >

          {children}

          {/* Inline CTA (optional) */}
          <div className="not-prose mt-16 rounded-2xl p-6 bg-gradient-to-r from-purple-50 to-cyan-50 border border-zinc-200 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold mb-2 text-zinc-900">
              Put this on autopilot with Needix
            </h3>
            <p className="text-zinc-700 mb-4">
              Track subscriptions and get proactive alerts before charges hit. Cancel in time, avoid surprises.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-5 py-2.5 font-medium text-white"
            >
              Start tracking free →
            </Link>
          </div>
        </article>

        {/* Sticky TOC */}
        <aside className="lg:sticky lg:top-24 h-max">
          <div className="rounded-2xl border border-zinc-200 p-4 bg-white">
            <h4 className="text-sm font-semibold mb-2 text-zinc-800">On this page</h4>
            <ul className="space-y-2 text-sm">
              {toc.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} className="text-zinc-600 hover:text-cyan-700">
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter card */}
          <div className="mt-6 rounded-2xl border border-zinc-200 p-5 bg-white">
            <h5 className="font-semibold text-zinc-900">Get money-saving tips</h5>
            <p className="text-sm text-zinc-600 mt-1">One helpful email per week. No spam.</p>
            <form className="mt-3 flex gap-2">
              <input
                type="email"
                required
                placeholder="you@email.com"
                className="w-full rounded-xl bg-white border border-zinc-300 px-3 py-2 outline-none focus:border-cyan-500"
              />
              <button className="rounded-xl px-4 py-2 bg-zinc-900 text-white hover:bg-zinc-800">Join</button>
            </form>
          </div>
        </aside>
      </div>

      {/* Pullquote */}
      <section className="mx-auto max-w-3xl mt-16">
        <figure className="rounded-2xl border border-zinc-200 p-6 bg-white">
          <blockquote className="text-3xl md:text-4xl text-zinc-900">
            “Awareness is the foundation of financial confidence. You can’t control what you don’t see.”
          </blockquote>
        </figure>
      </section>

      {/* Related */}
      <section className="mx-auto max-w-5xl mt-16">
        <h3 className="text-2xl font-bold mb-4 text-center">Keep reading</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ArticleCard href="/blog/stop-wasting-money-on-forgotten-subscriptions" title="Stop wasting money on forgotten subscriptions" />
          <ArticleCard href="/blog/automating-reorders-saves-you-5-hours-a-month" title="Automating reorders saves you 5 hours a month" />
          <ArticleCard href="/blog/build-a-smarter-budget" title="Build a smarter budget without cutting what you love" />
        </div>
      </section>

      {/* End CTA */}
      <section className="mx-auto max-w-5xl mt-18 mb-24 rounded-3xl border border-zinc-200 p-8 text-center bg-gradient-to-br from-purple-50 to-cyan-50">
        <h3 className="text-3xl font-bold text-zinc-900">Make surprise charges a thing of the past</h3>
        <p className="mt-2 text-zinc-700">Needix tracks, alerts, and helps you cancel in minutes.</p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-3 font-medium text-white"
        >
          Start tracking free →
        </Link>
      </section>
    </main>
  );
}

function ArticleCard({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-zinc-200 p-5 bg-white hover:bg-zinc-50">
      <div className="h-28 w-full rounded-xl bg-gradient-to-br from-purple-100 to-cyan-100 mb-3" />
      <h4 className="font-semibold text-zinc-900">{title}</h4>
      <p className="text-sm text-cyan-700 mt-1">Read more →</p>
    </Link>
  );
}
