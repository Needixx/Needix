// app/blog/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Needix Blog — Save Smarter, Track Easier",
  description:
    "Practical guides to stop surprise renewals, cut waste, and automate money chores. No fluff — real tips that help.",
  openGraph: {
    title: "Needix Blog — Save Smarter, Track Easier",
    description:
      "Practical guides to stop surprise renewals, cut waste, and automate money chores.",
    url: "https://needixai.com/blog",
    siteName: "Needix",
    type: "website",
  },
};

type Post = {
  slug: string;
  title: string;
  dek: string;
  category: "Money Tips" | "Automation" | "Guides";
  date: string; // ISO date string
  readTime: string;
};

const posts: Post[] = [
  {
    slug: "why-youre-always-surprised-by-your-bank-balance",
    title: "Why You’re Always Surprised by Your Bank Balance — and How to Fix It",
    dek: "Three everyday leaks that quietly drain cash — and a 30-minute method to plug them without spreadsheets.",
    category: "Money Tips",
    date: "2025-10-13",
    readTime: "9 min read",
  },
  {
    slug: "stop-wasting-money-on-forgotten-subscriptions",
    title: "How to Stop Wasting Money on Forgotten Subscriptions",
    dek: "Find hidden recurring charges, renegotiate what you keep, and cancel the rest — calmly and cleanly.",
    category: "Guides",
    date: "2025-10-12",
    readTime: "7 min read",
  },
  {
    slug: "automating-reorders-saves-you-5-hours-a-month",
    title: "Why Automating Reorders Saves You 5 Hours a Month",
    dek: "Turn essential purchases into quiet, reliable routines — without overbuying or stockouts.",
    category: "Automation",
    date: "2025-10-11",
    readTime: "6 min read",
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function BlogIndexPage() {
  return (
    <main className="bg-white text-zinc-900">
      <section className="mx-auto max-w-5xl px-6 pt-14 pb-6">
        <p className="uppercase tracking-wide text-xs text-cyan-700/80">Blog</p>
        <h1 className="mt-2 text-4xl md:text-5xl font-extrabold">Save smarter. Track easier.</h1>
        <p className="mt-4 max-w-2xl text-lg text-zinc-600">
          Real, practical tips to stop surprise renewals, cut waste, and automate the boring money chores —
          with light, optional nudges from Needix.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-cyan-700">
                  {post.category}
                </span>
                <span>{formatDate(post.date)} · {post.readTime}</span>
              </div>

              <h2 className="mt-3 text-xl font-semibold text-zinc-900 group-hover:underline">
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              </h2>

              <p className="mt-2 text-zinc-600">{post.dek}</p>

              <div className="mt-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-cyan-700 hover:text-cyan-800 font-medium"
                >
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-3xl border border-zinc-200 bg-gradient-to-br from-purple-50 to-cyan-50 p-8 text-center">
          <h3 className="text-2xl font-bold text-zinc-900">Make surprise charges a thing of the past</h3>
          <p className="mt-2 text-zinc-700">
            Needix tracks subscriptions, flags price changes, and gives you heads-ups before renewals hit.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 px-6 py-3 font-medium text-white"
          >
            Start tracking free →
          </Link>
        </div>
      </section>
    </main>
  );
}
