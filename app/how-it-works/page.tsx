// app/how-it-works/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            How Needix Works
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Get complete control over your subscriptions, orders, and expenses in 3 simple steps
          </p>
        </div>

        {/* Step 1: Get Started */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xl">
              1
            </div>
            <h2 className="text-3xl font-bold">Get Started in 60 Seconds</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-purple-300">Sign Up & Access Your Dashboard</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Click &quot;Start Free Today&quot; or &quot;Dashboard&quot;</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Sign in with Google (secure & instant)</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>Access your personalized dashboard immediately</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <span>No credit card required for free plan</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-center mb-4">
                <div className="text-lg font-semibold text-white">Free Plan Includes:</div>
              </div>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• 2 subscriptions</li>
                <li>• 2 smart orders</li>
                <li>• 2 expense categories</li>
                <li>• Complete dashboard access</li>
                <li>• All essential features</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 2: Track Everything */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
              2
            </div>
            <h2 className="text-3xl font-bold">Add Your Financial Items</h2>
          </div>

          {/* Subscriptions */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <span className="text-2xl">📺</span>
              Track Subscriptions
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
                <h4 className="font-semibold mb-3 text-purple-300">Add Subscriptions</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Click &quot;+ Add Subscription&quot;</li>
                  <li>• Enter name & monthly cost</li>
                  <li>• Set next billing date</li>
                  <li>• Add cancellation link</li>
                  <li>• Organize by category</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
                <h4 className="font-semibold mb-3 text-purple-300">Never Miss Payments</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• See all upcoming renewals</li>
                  <li>• Get reminders before charges</li>
                  <li>• One-click to manage/cancel</li>
                  <li>• Track price changes</li>
                  <li>• Export your data</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-6">
                <h4 className="font-semibold mb-3 text-purple-300">Stay In Control</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• View monthly spending total</li>
                  <li>• Identify unused subscriptions</li>
                  <li>• Cancel with provided links</li>
                  <li>• Import existing data (Pro)</li>
                  <li>• Set spending alerts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Smart Orders */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <span className="text-2xl">📦</span>
              Smart Orders
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
                <h4 className="font-semibold mb-3 text-cyan-300">Set Price Targets</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Add items you buy regularly</li>
                  <li>• Set your maximum price</li>
                  <li>• Get alerts when prices drop</li>
                  <li>• Track from multiple vendors</li>
                  <li>• Never overpay again</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
                <h4 className="font-semibold mb-3 text-cyan-300">Recurring Orders</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Set up recurring purchases</li>
                  <li>• Dog food, protein, vitamins</li>
                  <li>• Get reminded when to reorder</li>
                  <li>• Track delivery schedules</li>
                  <li>• Maintain your stock levels</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
                <h4 className="font-semibold mb-3 text-cyan-300">Save Money</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Compare prices automatically</li>
                  <li>• Get notified of deals</li>
                  <li>• Track your savings</li>
                  <li>• Optimize purchase timing</li>
                  <li>• Budget for big purchases</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Expenses */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
              <span className="text-2xl">💰</span>
              Monthly Expenses
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
                <h4 className="font-semibold mb-3 text-green-300">Track Everything</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Rent/mortgage payments</li>
                  <li>• Utilities & electricity</li>
                  <li>• Car payments & insurance</li>
                  <li>• Groceries & food</li>
                  <li>• Healthcare & personal care</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
                <h4 className="font-semibold mb-3 text-green-300">Organize by Priority</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Mark essentials (rent, utilities)</li>
                  <li>• Separate discretionary spending</li>
                  <li>• Set payment reminders</li>
                  <li>• Track due dates</li>
                  <li>• Budget by category</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
                <h4 className="font-semibold mb-3 text-green-300">Budget Better</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• See total monthly spending</li>
                  <li>• Essential vs optional breakdown</li>
                  <li>• Identify areas to cut back</li>
                  <li>• Track spending trends</li>
                  <li>• Make informed decisions</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Step 3: Stay in Control */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white font-bold text-xl">
              3
            </div>
            <h2 className="text-3xl font-bold">Stay in Complete Control</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Your Unified Dashboard</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-3">
                  <span className="text-purple-400">📊</span>
                  <span>See total monthly spending across all categories</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-cyan-400">🎯</span>
                  <span>Track upcoming payments and renewals</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-400">💡</span>
                  <span>Get insights on spending patterns</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-yellow-400">⚠️</span>
                  <span>Receive alerts before price increases</span>
                </li>
              </ul>
            </div>
            
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">Take Action</h3>
              <ul className="space-y-3 text-white/80">
                <li className="flex items-center gap-3">
                  <span className="text-red-400">❌</span>
                  <span>Cancel unused subscriptions with one click</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-400">🔄</span>
                  <span>Update payment dates and amounts easily</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-orange-400">📱</span>
                  <span>Access everything from any device</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-purple-400">📈</span>
                  <span>Export data and track savings over time</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pro Features */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Ready for More?</h2>
            <p className="text-white/70">Upgrade to Pro for unlimited tracking and advanced features</p>
          </div>
          
          <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-cyan-300">Pro Features Include:</h3>
                <ul className="space-y-2 text-white/80">
                  <li>• Unlimited subscriptions, orders & expenses</li>
                  <li>• Advanced price change notifications</li>
                  <li>• CSV import/export for bulk management</li>
                  <li>• Priority email support</li>
                  <li>• Advanced analytics and insights</li>
                  <li>• Custom categories and tags</li>
                </ul>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">$5</div>
                <div className="text-white/60 mb-4">per month</div>
                <Link href="/#pricing">
                  <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500">
                    Upgrade to Pro
                  </Button>
                </Link>
                <div className="mt-3 text-sm text-white/50">
                  30-day money-back guarantee
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-white/70 mb-6">Join thousands who&apos;ve simplified their financial life with Needix</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                Start Free Today
              </Button>
            </Link>
            <Link href="/#features">
              <Button variant="outline" size="lg">
                View Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}