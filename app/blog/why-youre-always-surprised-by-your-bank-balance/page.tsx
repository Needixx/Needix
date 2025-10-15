// app/blog/why-youre-always-surprised-by-your-bank-balance/page.tsx
import type { Metadata } from "next";
import ArticleLayout from "@/components/blog/ArticleLayout";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why You’re Always Surprised by Your Bank Balance | Needix Blog",
  description:
    "Three everyday leaks quietly drain your money—and a repeatable 30-minute method to fix them without spreadsheets.",
  openGraph: {
    title: "Why You’re Always Surprised by Your Bank Balance",
    description:
      "Subscriptions, micro-spends, and timing mismatches silently drain your cash. Here’s a practical, no-guilt way to fix it.",
    url: "https://needixai.com/blog/why-youre-always-surprised-by-your-bank-balance",
    siteName: "Needix",
    type: "article",
  },
};

export default function Page() {
  const toc = [
    { id: "pattern", text: "Why your brain misremembers spending" },
    { id: "leak1", text: "LEAK 1 — Subscriptions you don’t use" },
    { id: "leak2", text: "LEAK 2 — Micro-spends that snowball" },
    { id: "leak3", text: "LEAK 3 — Timing mismatch & surprise charges" },
    { id: "method", text: "A 30-minute method to get ahead" },
    { id: "keep", text: "What to keep vs cancel: a simple test" },
    { id: "light", text: "Lightweight automation when you’re busy" },
    { id: "next", text: "What to do next" },
  ];

  return (
    <ArticleLayout
      category="Money Tips"
      title="Why You’re Always Surprised by Your Bank Balance — and How to Fix It"
      dek="If your balance never matches your memory, you’re not alone. These are the three biggest leaks — and a repeatable 30-minute method to fix them without living in spreadsheets."
      author={{ name: "Needix Team", role: "Personal Finance" }}
      date="Oct 13, 2025"
      readTime="10–12 min read"
      heroImageSrc={undefined}
      toc={toc}
    >
      <p>
        You open your banking app and the number hits like a jump scare. You didn’t buy anything wild —
        so why is your balance lower than you expected? The answer is almost never a single big purchase.
        It’s a handful of quiet leaks that compound over time.
      </p>

      <p>
        The good news: you don’t need a new personality or a spreadsheet habit to fix this. You need
        visibility, a short monthly check-in, and a way to catch renewals before they land.
      </p>

      <h2 id="pattern">Why your brain misremembers spending</h2>
      <p>
        We overweight vivid one-time purchases and underweight routine, repeating charges. That’s
        <em> salience bias</em>. If you judge spending by memory, you’ll always feel behind. The fix isn’t
        guilt — it’s making the routine visible again.
      </p>

      {/* IMAGE SLOT 1 */}
      <figure className="not-prose my-8">
        <div className="w-full h-56 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
          {/* Replace src when you have assets */}
          {/* <img src="/images/blog/balance-pattern.png" alt="Spending pattern illustration" className="w-full h-full object-cover rounded-2xl" /> */}
          Add image: “Spending patterns” visual
        </div>
        <figcaption className="mt-2 text-sm text-zinc-500 text-center">Spending surprises come from routine, not one-offs.</figcaption>
      </figure>

      <h2 id="leak1">LEAK 1 — Subscriptions you don’t actively use</h2>
      <p>
        Trials that renewed, duplicate tools, annual software you forgot about — subscriptions are designed
        to be convenient, which makes them easy to forget. The goal isn’t “no subscriptions.” It’s
        <strong> subscriptions that still earn their place</strong>.
      </p>
      <ul>
        <li><strong>Duplicates:</strong> Two cloud storages, two music apps, overlapping TV bundles.</li>
        <li><strong>Annual landmines:</strong> Domains, licenses, memberships that bill once a year.</li>
        <li><strong>Idle tiers:</strong> Paying for “Pro” features you never touch.</li>
      </ul>
      <p>
        <strong>Practical step:</strong> Scan the last 90 days for any repeating merchant. Mark each as
        <em> Keep</em>, <em> Downgrade</em>, or <em> Cancel</em>. If you can’t recall the last time you used it,
        that’s a signal.
      </p>

      {/* IMAGE SLOT 2 */}
      <figure className="not-prose my-10">
        <div className="w-full h-56 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
          Add image: “Subscriptions list” screenshot or illustration
        </div>
        <figcaption className="mt-2 text-sm text-zinc-500 text-center">A simple list beats hunting through statements.</figcaption>
      </figure>

      <h2 id="leak2">LEAK 2 — Micro-spends that snowball</h2>
      <p>
        $3 here, $9 there. Individually harmless; together, they explain why your balance never matches
        your mental math. Think delivery fees, storage bumps, ride-roundups, and small “convenience” charges.
      </p>
      <p>
        <strong>Practical step:</strong> Group small transactions (&lt;$15) by category and set a monthly
        ceiling you’re comfortable with. It’s not a punishment; it’s a pre-decision that protects future-you.
      </p>

      {/* IMAGE SLOT 3 */}
      <figure className="not-prose my-10">
        <div className="w-full h-56 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
          Add image: “Micro-spend categories” bar chart
        </div>
        <figcaption className="mt-2 text-sm text-zinc-500 text-center">Small costs add up fastest when they’re invisible.</figcaption>
      </figure>

      <h2 id="leak3">LEAK 3 — Timing mismatch & surprise charges</h2>
      <p>
        You get paid biweekly, but bills hit random days. That mismatch creates “I thought I had more”
        moments. Late fees and overdrafts aren’t moral failures; they’re timing problems.
      </p>
      <ul>
        <li><strong>Fix the calendar:</strong> Move due dates closer to payday where possible.</li>
        <li><strong>Buffer rule:</strong> Keep one week’s fixed costs as a cushion in checking.</li>
        <li><strong>Heads-up:</strong> Get alerts 3–5 days before large or annual charges.</li>
      </ul>

      {/* IMAGE SLOT 4 */}
      <figure className="not-prose my-10">
        <div className="w-full h-56 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500">
          Add image: “Bill calendar” timeline
        </div>
        <figcaption className="mt-2 text-sm text-zinc-500 text-center">Align due dates with income to remove stress.</figcaption>
      </figure>

      <h2 id="method">A 30-minute method to get ahead (repeat monthly)</h2>
      <ol>
        <li><strong>Pull 90 days of transactions.</strong> Circle anything that repeats — monthly or annually.</li>
        <li><strong>Label each repeat merchant:</strong> Keep, Downgrade, Cancel. Be honest about actual use.</li>
        <li><strong>Bucket micro-spends:</strong> Coffee, delivery, storage, app add-ons. Pick a ceiling per bucket.</li>
        <li><strong>Set three reminders:</strong> Next big annual charge, rent/mortgage, and your highest bill.</li>
        <li><strong>One action now:</strong> Cancel one idle subscription or downgrade one plan. Momentum matters.</li>
      </ol>

      <h2 id="keep">What to keep vs cancel: a simple test</h2>
      <ul>
        <li><strong>Use test:</strong> Used it in the last 30 days? If not, calendar a check in 30 more — still no? Cancel.</li>
        <li><strong>Joy test:</strong> Would you notice if it vanished tomorrow? If no, it’s a habit, not value.</li>
        <li><strong>Cost test:</strong> Is there a cheaper tier that preserves what you actually use?</li>
      </ul>

      <h2 id="light">Lightweight automation when you’re busy</h2>
      <p>
        <Link href="/" className="font-medium">Needix</Link> connects read-only via a trusted provider, surfaces recurring
        charges, groups small spends, and sends heads-up alerts before bills hit. You still make the call;
        it just saves you the detective work every month. Think of it as visibility on autopilot.
      </p>

      <h2 id="next">What to do next</h2>
      <p>
        Pick one step you can do in five minutes: cancel a duplicate, downgrade a tier, or set one reminder.
        Then schedule a 30-minute review next month. Money clarity is a habit, not a personality.
      </p>
    </ArticleLayout>
  );
}
