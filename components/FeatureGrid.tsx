// components/FeatureGrid.tsx
// Purpose: Feature section without duplicating the hero headline.
// Notes: Server component, no interactivity. Clean, scannable grid.

export default function FeatureGrid() {
  const features = [
    {
      title: 'Subscription Tracking',
      emoji: '📺',
      body:
        'See every recurring charge in one place. Clear totals by vendor and category so nothing slips through.',
      points: [
        'Monthly/annual/custom cycles',
        'Auto monthly-equivalent cost',
        'Skip/adjust dates easily',
      ],
    },
    {
      title: 'Smart Orders (Auto-Reorder)',
      emoji: '📦',
      body:
        'Create simple rules to reorder on your schedule — or only when conditions are met.',
      points: ['Price-drop rules', 'Low-stock reminders', 'Vendor notes & links'],
    },
    {
      title: 'Expense Management',
      emoji: '💰',
      body:
        'Track non-subscription spend without the complexity of a full budget app.',
      points: ['Custom categories', 'CSV import/export', 'Trends & summaries'],
    },
    {
      title: 'Alerts & Notifications',
      emoji: '🔔',
      body:
        'Stay ahead of charges and changes with fast, reliable notifications.',
      points: ['Renewal reminders', 'Price change alerts', 'Email + browser + mobile'],
    },
  ];

  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-16">
      {/* Section intro (kept lightweight; no hero duplication) */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white/95">
          What Needix does for you
        </h2>
        <p className="mt-2 text-white/60">
          Track subscriptions, smart reorders, and everyday expenses — with
          alerts before you get charged again.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur transition-colors hover:bg-white/[0.06]"
          >
            <div className="mb-3 text-2xl">{f.emoji}</div>
            <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
            <p className="mb-4 text-sm leading-relaxed text-white/70">{f.body}</p>
            <ul className="space-y-2 text-sm text-white/75">
              {f.points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-cyan-400" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
