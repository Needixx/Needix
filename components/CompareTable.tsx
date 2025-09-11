// components/CompareTable.tsx
import Section from '@/components/ui/Section';

export default function CompareTable() {
  const comparisons = [
    {
      category: 'Without Needix',
      items: [
        'Forgotten subscriptions costing $47/month',
        'Surprise price increases',
        'Manual tracking in spreadsheets',
        'Missing cancellation deadlines',
        'No spending insights'
      ]
    },
    {
      category: 'With Needix Pro',
      items: [
        'Smart alerts prevent wasted money',
        'Price change notifications',
        'Automated tracking & reminders',
        'One-click cancellation links',
        'Detailed spending analytics'
      ]
    }
  ];

  return (
    <Section 
      title="Stop Losing Money on Forgotten Subscriptions" 
      subtitle="The average person wastes $573 per year on subscriptions they forgot about or don't use."
    >
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {comparisons.map((comparison, index) => (
          <div 
            key={comparison.category}
            className={`rounded-3xl border p-8 backdrop-blur-sm transition-all duration-300 ${
              index === 0 
                ? 'border-red-500/30 bg-red-500/5' 
                : 'border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-600/10'
            }`}
          >
            <div className="text-center mb-6">
              <h3 className={`text-xl font-semibold mb-2 ${
                index === 0 ? 'text-red-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500'
              }`}>
                {comparison.category}
              </h3>
              {index === 0 && (
                <div className="text-3xl font-bold text-red-400 mb-2">
                  -$573/year
                </div>
              )}
              {index === 1 && (
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
                  +$573/year saved
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              {comparison.items.map((item, itemIndex) => (
                <div key={itemIndex} className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                    index === 0 ? 'bg-red-500/20' : 'bg-cyan-500/20'
                  }`}>
                    {index === 0 ? (
                      <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm leading-relaxed ${
                    index === 0 ? 'text-white/70' : 'text-white/90'
                  }`}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/20 px-4 py-2">
          <span className="text-orange-400">💡</span>
          <span className="text-white/80 text-sm">
            Needix Pro pays for itself by preventing just one forgotten subscription
          </span>
        </div>
      </div>
    </Section>
  );
}