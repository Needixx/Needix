// components/PricingTable.tsx
import Section from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import UpgradeButton from '@/components/UpgradeButton';

export default function PricingTable() {
  return (
    <Section id="pricing" title="Simple, transparent pricing" subtitle="Start free, upgrade when you're ready.">
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 relative">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-white/70 mb-4">Perfect for getting started</p>
            <div className="text-4xl font-bold mb-2">$0</div>
            <div className="text-white/60">Forever</div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">2 subscriptions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">2 smart orders</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">2 expense categories</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Basic dashboard</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Essential tracking</span>
            </div>
          </div>
          
          <Button className="w-full" variant="outline">
            Get Started Free
          </Button>
        </div>

        {/* Pro Plan */}
        <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-purple-500/10 p-8 relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <span className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </span>
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Pro</h3>
            <p className="text-white/70 mb-4">For serious financial tracking</p>
            <div className="text-4xl font-bold mb-2">$5</div>
            <div className="text-white/60">per month</div>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Unlimited subscriptions</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Unlimited smart orders</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Unlimited expenses</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Price change notifications</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">CSV import/export</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-white/90">Priority support</span>
            </div>
          </div>
          
          <UpgradeButton className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold">
            Upgrade to Pro
          </UpgradeButton>
          
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-400 text-sm">
              <span>🔥</span>
              <span>30-day money-back guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}