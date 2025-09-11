// File location: components/FAQ.tsx
// Action: Replace entire file

'use client';
import { useState } from 'react';
import Section from '@/components/ui/Section';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Needix help me save money on subscriptions?',
      a: 'Needix prevents costly subscription mistakes through:',
      bullets: [
        'Smart alerts before renewals so you can cancel unwanted services',
        'Instant notifications when prices increase',
        'Clear spending overview to identify redundant subscriptions',
        'Organized dashboard that prevents forgotten subscriptions'
      ],
      icon: '💰'
    },
    {
      q: 'Do I need to connect my bank account?',
      a: 'No, bank connection is completely optional:',
      bullets: [
        'Start by manually adding subscriptions in seconds',
        'Full functionality available without any financial connections',
        'Optional bank sync available later for automatic detection',
        'Your privacy and security are our top priorities'
      ],
      icon: '🔒'
    },
    {
      q: 'What makes Needix different from other finance apps?',
      a: 'Needix is laser-focused on subscription management:',
      bullets: [
        'Clean, simple interface designed specifically for subscriptions',
        'No bloated features or complicated budgeting tools',
        'Affordable pricing starting free, Pro at just $5/month',
        'Lightning-fast setup - add subscriptions in under 30 seconds'
      ],
      icon: '⚡'
    },
    {
      q: 'How accurate are the renewal reminders?',
      a: 'Our reminder system is designed for reliability:',
      bullets: [
        'Multiple notification channels (email, browser, mobile)',
        'Customizable reminder timing (1-30 days before renewal)',
        'Smart detection of billing cycles and renewal patterns',
        '99.9% delivery rate with backup notification systems'
      ],
      icon: '🎯'
    },
    {
      q: 'Can I track annual subscriptions and irregular billing?',
      a: 'Yes, Needix handles all subscription types:',
      bullets: [
        'Monthly, yearly, weekly, and custom billing periods',
        'One-time purchases and irregular renewals',
        'Automatic calculation of monthly cost equivalents',
        'Flexible date management for any billing schedule'
      ],
      icon: '📅'
    },
    {
      q: 'What happens if I cancel my Pro subscription?',
      a: 'Your data remains safe with flexible options:',
      bullets: [
        'Account automatically downgrades to free plan',
        'Keep access to 2 subscriptions on free tier',
        'Full data export available anytime (CSV, PDF)',
        'Reactivate Pro anytime with all data intact'
      ],
      icon: '🔄'
    },
    {
      q: 'Is my financial data secure?',
      a: 'Security is built into everything we do:',
      bullets: [
        'Bank-grade 256-bit SSL encryption for all data',
        'Optional bank connections through trusted Plaid integration',
        'No storage of sensitive payment information',
        'Regular security audits and compliance monitoring'
      ],
      icon: '🛡️'
    },
    {
      q: 'How quickly can I get started?',
      a: 'Getting started with Needix is incredibly fast:',
      bullets: [
        'Sign up with Google in under 10 seconds',
        'Add your first subscription in 30 seconds',
        'Full dashboard setup typically takes under 5 minutes',
        'Import existing subscriptions via CSV for bulk setup'
      ],
      icon: '🚀'
    }
  ];

  return (
    <Section id="faq" title="Frequently asked questions" subtitle="Everything you need to know about managing subscriptions with Needix.">
      <div className="mx-auto max-w-4xl space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="glass rounded-2xl border border-white/10 overflow-hidden animate-float"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-inset transition-all duration-300 hover:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{faq.icon}</span>
                  <h3 className="text-lg font-semibold text-white pr-4">{faq.q}</h3>
                </div>
                <div className={`transition-transform duration-300 ${
                  openIndex === index ? 'rotate-180' : 'rotate-0'
                }`}>
                  <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>
            
            {openIndex === index && (
              <div className="px-6 pb-6 animate-float">
                <div className="pl-12 space-y-4">
                  <p className="text-white/80 font-medium">{faq.a}</p>
                  <ul className="space-y-2">
                    {faq.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex} className="flex items-start gap-3">
                        <div className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                        <span className="text-white/70 leading-relaxed">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center">
        <div className="glass-strong rounded-3xl p-8 max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">Still have questions?</h3>
          <p className="text-white/70 mb-6">
            Our team is here to help you get the most out of Needix.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@needix.com"
              className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3 font-semibold text-cyan-200 hover:bg-cyan-400/20 transition-all duration-300"
            >
              📧 Email Support
            </a>
            <a 
              href="/app"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-semibold text-white hover:opacity-90 transition-all duration-300"
            >
              🚀 Try It Free
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}