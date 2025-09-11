// components/FeatureGrid.tsx
import Section from '@/components/ui/Section';

export default function FeatureGrid() {
  const features = [
    { 
      title: '📊 Track Everything in One Place', 
      desc: 'Add Netflix, Spotify, iCloud, and more. See exactly what you\'re paying and when renewals happen.',
      icon: '📊'
    },
    { 
      title: '🚨 Smart Price Alerts', 
      desc: 'Get notified before renewals and when prices increase. Never get surprised by unexpected charges.',
      icon: '🚨'
    },
    { 
      title: '💸 Find Hidden Money Drains', 
      desc: 'Spot unused services costing you hundreds per year. Cancel what you don\'t use with one click.',
      icon: '💸'
    },
    { 
      title: '🔒 Privacy-First Design', 
      desc: 'Your data stays yours. No bank connections required - add subscriptions manually with full control.',
      icon: '🔒'
    },
  ];

  return (
    <Section id="features" title="Stop Wasting Money on Forgotten Subscriptions" subtitle="Take back control with smart tracking and instant cancellation.">
      <div className="grid gap-6 md:grid-cols-2">
        {features.map((f) => (
          <div 
            key={f.title} 
            className="group rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/10 animate-slide-up"
          >
            <div className="mb-4 text-4xl">{f.icon}</div>
            <h3 className="mb-3 text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors">
              {f.title}
            </h3>
            <p className="text-white/70 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}