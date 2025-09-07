// components/Hero.tsx
import { Button } from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-20 md:grid-cols-2 lg:py-32">
      {/* Content */}
      <div className="relative z-10">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
          Track, Save, Never Overpay
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            Never run out.
          </span>
          <br />
          <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
            Never overpay.
          </span>
        </h1>
        
        <p className="mt-6 text-xl text-gray-300 leading-relaxed">
          Track subscriptions and auto‑reorder essentials from one 
          <span className="font-semibold text-purple-300"> beautiful dashboard</span>.
        </p>
        
        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25 transform hover:scale-105 transition-all duration-200">
            <a href="/app">Get Started Free</a>
          </Button>
          <Button asChild variant="ghost" className="border-gray-600 hover:border-purple-400 hover:bg-purple-500/10">
            <a href="#pricing">See Pricing</a>
          </Button>
        </div>
        
        <div className="mt-10 space-y-3">
          {[
            "Smart reminders before renewals",
            "Predictive reorders with price protection",
            "Beautiful, mobile‑first design"
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-3 text-gray-300">
              <div className="h-5 w-5 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Demo */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl"></div>
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-sm text-gray-400">Needix Dashboard</div>
          </div>
          
          <div className="space-y-3">
            {[
              { name: "Netflix Premium", days: 12, color: "from-red-500 to-red-600" },
              { name: "Spotify Premium", days: 18, color: "from-green-500 to-green-600" },
              { name: "Coffee Beans", days: 3, color: "from-amber-500 to-orange-600", type: "reorder" }
            ].map((item, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${item.color}`}></div>
                    <span className="font-medium text-white">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">
                      {item.type === 'reorder' ? 'Reorder' : 'Renews'} in {item.days} days
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-4 border border-purple-400/20">
            <div className="text-sm text-purple-300 font-medium">Monthly Total</div>
            <div className="text-2xl font-bold text-white">$47.97</div>
            <div className="text-xs text-gray-400">↓ $12.50 saved this month</div>
          </div>
        </div>
      </div>
    </section>
  );
}