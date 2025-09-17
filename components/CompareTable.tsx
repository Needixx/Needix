// components/CompareTable.tsx
import Section from '@/components/ui/Section';

export default function CompareTable() {
  const comparisons = [
    {
      category: 'Without Needix',
      subtitle: 'The struggle is real',
      items: [
        'Forgotten subscriptions drain your wallet',
        'Surprise price increases catch you off-guard',
        'Manual tracking in messy spreadsheets',
        'Missing cancellation deadlines costs money',
        'No visibility into your total spending',
        'Overpaying for things you barely use',
        'Stress about where your money goes'
      ]
    },
    {
      category: 'With Needix',
      subtitle: 'Financial peace of mind',
      items: [
        'Smart alerts prevent wasted money',
        'Get notified before price increases',
        'Automated tracking across all categories',
        'One-click cancellation links save time',
        'Complete spending visibility dashboard',
        'Price targets help you save on orders',
        'Confidence in your financial decisions'
      ]
    }
  ];

  return (
    <Section 
      title="Take Control of Your Financial Life" 
      subtitle="Stop letting subscriptions and expenses control you. Get the visibility and tools you need to make smart money decisions."
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
              <p className={`text-sm ${
                index === 0 ? 'text-red-300/70' : 'text-cyan-300/70'
              }`}>
                {comparison.subtitle}
              </p>
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
            Most people save money in their first month by discovering forgotten subscriptions
          </span>
        </div>
      </div>
    </Section>
  );
}