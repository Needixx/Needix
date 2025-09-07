// components/Hero.tsx
import { Button } from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-20 md:grid-cols-2">
      <div>
        <h1 className="text-4xl font-semibold md:text-5xl leading-tight pb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 font-bold">
            Track Everything.
          </span>
          <br />
          <span className="text-white">
            Waste Nothing.
          </span>
        </h1>
        <p className="mt-6 text-lg text-white/80 leading-relaxed">
          Take control of your subscriptions with smart tracking, price alerts, and cancellation management. 
          Stop throwing money away on forgotten services.
        </p>
        <div className="mt-8 flex gap-4 flex-wrap">
          <Button asChild className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-8 py-3">
            <a href="/app">Start Free Today</a>
          </Button>
          <Button asChild variant="ghost" className="border border-white/20 hover:bg-white/10 px-8 py-3">
            <a href="#pricing">View Pricing</a>
          </Button>
        </div>
        <div className="mt-8 space-y-3 text-white/70">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span>Track unlimited subscriptions for free</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span>Get alerts before price increases</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
            <span>Cancel unwanted services instantly</span>
          </div>
        </div>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 font-bold">N</span>
                </div>
                <span className="text-white/90 font-medium">Netflix</span>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-sm">Renews in 12 days</div>
                <div className="text-orange-400 text-sm font-medium">Price increased 15%</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 font-bold">S</span>
                </div>
                <span className="text-white/90 font-medium">Spotify</span>
              </div>
              <div className="text-right">
                <div className="text-white/60 text-sm">Renews in 3 days</div>
                <div className="text-cyan-400 text-sm font-medium">$10.99/month</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 transform hover:scale-105 transition-transform duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 font-bold">D</span>
                </div>
                <span className="text-white/90 font-medium">Dropbox</span>
              </div>
              <div className="text-right">
                <div className="text-red-400 text-sm">Unused for 45 days</div>
                <div className="text-white/60 text-sm">$11.99/month</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}