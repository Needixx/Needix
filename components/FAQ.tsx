// components/FAQ.tsx
'use client';

import { useState } from 'react';
import Section from '@/components/ui/Section';

type FAQItem = {
  q: string;
  a: string;
  bullets?: string[];
  icon?: string;
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      q: 'How does Needix help me save money on subscriptions?',
      a: 'We stop “oops, it renewed” charges and surface overlaps.',
      bullets: [
        'Smart alerts before renewals so you can cancel on time',
        'Instant notifications when vendors raise prices',
        'Clear totals by vendor/category to spot redundancies',
        'A single dashboard so nothing slips through',
      ],
      icon: '💰',
    },
    {
      q: 'Do I need to connect my bank account?',
      a: 'No. You can start fully manual and add a bank later (optional).',
      bullets: [
        'Add subscriptions in seconds — no connections required',
        'Optional Plaid sync later for auto-detection',
        'All features work without bank access',
        'Your privacy and security come first',
      ],
      icon: '🔒',
    },
    {
      q: 'What makes Needix different from other finance apps?',
      a: 'It’s laser-focused, fast, and not bloated.',
      bullets: [
        'Purpose-built for subscriptions and recurring spends',
        'No complicated budgets to maintain',
        'Pro is just $5/month — priced to pay for itself',
        'Add your first subscription in under 30 seconds',
      ],
      icon: '⚡',
    },
    {
      q: 'How accurate are the renewal reminders?',
      a: 'Designed for reliability across channels.',
      bullets: [
        'Email + browser + mobile notifications',
        'Custom timing (1–30 days before)',
        'Cycle detection for monthly/annual/irregular',
        'Redundant delivery paths for 99.9% success',
      ],
      icon: '🎯',
    },
    {
      q: 'Can I track annual subscriptions and irregular billing?',
      a: 'Yes — monthly, yearly, custom cycles, and one-offs.',
      bullets: [
        'Custom periods and anchor dates',
        'Automatic monthly equivalent cost',
        'Flexible rescheduling for any billing pattern',
      ],
      icon: '📅',
    },
    {
      q: 'What happens if I cancel my Pro subscription?',
      a: 'You keep your data. We just reduce limits.',
      bullets: [
        'Downgrades to Free plan automatically',
        'Keep access to 2 subscriptions on Free',
        'Export all data anytime (CSV)',
        'Reactivate Pro and pick up where you left off',
      ],
      icon: '🔄',
    },
    {
      q: 'Is my data secure?',
      a: 'Security is built in, not bolted on.',
      bullets: [
        'TLS (SSL) everywhere, at rest encryption in our DB',
        'Optional bank links via trusted Plaid',
        'We never store your bank password',
        'Regular reviews and monitoring',
      ],
      icon: '🛡️',
    },
    {
      q: 'How fast can I get value?',
      a: 'Most users set up in minutes and cancel something in the first month.',
      bullets: [
        'Google sign-in in seconds',
        'Add first subscription in ~30 seconds',
        'Bulk import via CSV if you have many',
      ],
      icon: '🚀',
    },
  ];

  return (
    <Section
      id="faq"
      title="Frequently asked questions"
      subtitle="Everything you need to know about managing subscriptions with Needix."
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {faqs.map((faq, i) => (
          <div
            key={faq.q}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full px-6 py-5 text-left outline-none transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-cyan-500/50"
              aria-expanded={openIndex === i}
              aria-controls={`faq-panel-${i}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{faq.icon}</span>
                  <h3 className="pr-4 text-lg font-semibold text-white">{faq.q}</h3>
                </div>
                <svg
                  className={`h-5 w-5 text-cyan-400 transition-transform ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M19 9l-7 7-7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>

            {openIndex === i && (
              <div id={`faq-panel-${i}`} className="px-6 pb-6">
                <div className="space-y-4 pl-12">
                  <p className="font-medium text-white/85">{faq.a}</p>
                  {!!faq.bullets?.length && (
                    <ul className="space-y-2">
                      {faq.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-3">
                          <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                          <span className="leading-relaxed text-white/75">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="mb-3 text-2xl font-bold text-white">Still have questions?</h3>
          <p className="mb-6 text-white/70">We’ll help you get the most out of Needix.</p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="mailto:support@needix.com"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 font-semibold text-cyan-200 transition hover:bg-cyan-400/20"
            >
              📧 Email Support
            </a>
            <a
              href="/app"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              🚀 Try It Free
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
