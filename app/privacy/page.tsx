// app/privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-white/70">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8 text-white/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">1.1 Personal Information</h3>
                <p className="mb-2">When you create an account with Needix, we collect:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Your name and email address (via Google OAuth)</li>
                  <li>Profile information from your authentication provider</li>
                  <li>Payment information (processed securely through Stripe)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">1.2 Subscription Data</h3>
                <p className="mb-2">To provide our service, we collect and store:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Your subscription names, prices, and billing cycles</li>
                  <li>Order information including product names and prices</li>
                  <li>Reminder preferences and notification settings</li>
                  <li>App usage data to improve our service</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">1.3 Technical Information</h3>
                <p className="mb-2">We automatically collect certain technical information:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Device information and browser type</li>
                  <li>IP address and location data (for security)</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Error logs and performance metrics</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. How We Use Your Information</h2>
            <div className="space-y-4">
              <p>We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
                <li><strong>Provide our service:</strong> Track your subscriptions, send reminders, and manage your orders</li>
                <li><strong>Process payments:</strong> Handle Pro subscription billing and payment processing</li>
                <li><strong>Send notifications:</strong> Deliver renewal reminders and price change alerts</li>
                <li><strong>Improve our product:</strong> Analyze usage patterns to enhance features and user experience</li>
                <li><strong>Customer support:</strong> Respond to your questions and resolve technical issues</li>
                <li><strong>Security:</strong> Protect against fraud, abuse, and unauthorized access</li>
                <li><strong>Legal compliance:</strong> Meet our legal obligations and enforce our terms</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">3. Data Storage and Security</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">3.1 Local Storage</h3>
                <p className="text-white/80">
                  Your subscription and order data is primarily stored locally in your browser. This means
                  your data stays on your device and is not transmitted to our servers unless you explicitly 
                  sync or backup your data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">3.2 Cloud Storage (Pro Users)</h3>
                <p className="text-white/80">
                  Pro users may optionally sync their data to our secure cloud storage for backup and 
                  multi-device access. This data is encrypted at rest and in transit.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">3.3 Security Measures</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Industry-standard encryption (TLS/SSL) for all data transmission</li>
                  <li>Secure authentication via Google OAuth</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Limited access controls for our team members</li>
                  <li>Secure payment processing through Stripe (PCI DSS compliant)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. Data Sharing and Disclosure</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                We do not sell, trade, or rent your personal information to third parties. We may share 
                your information only in the following limited circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
                <li><strong>Service providers:</strong> Trusted partners who help us operate our service (hosting, payments, analytics)</li>
                <li><strong>Legal requirements:</strong> When required by law, court order, or government request</li>
                <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                <li><strong>Safety and security:</strong> To protect the rights, property, or safety of Needix, our users, or others</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">5. Your Rights and Choices</h2>
            <div className="space-y-4">
              <p className="text-white/80">You have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restriction:</strong> Limit how we process your information</li>
              </ul>
              <p className="text-white/80 mt-4">
                To exercise these rights, contact us at <a href="mailto:privacy@needix.com" className="text-blue-400 hover:underline">privacy@needix.com</a> 
                or use the data management tools in your account settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">6. Cookies and Tracking</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                We use cookies and similar tracking technologies to improve your experience:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
                <li><strong>Essential cookies:</strong> Required for basic functionality and security</li>
                <li><strong>Analytics cookies:</strong> Help us understand how you use our service</li>
                <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p className="text-white/80 mt-4">
                You can control cookies through your browser settings, but disabling certain cookies 
                may limit some functionality.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">7. International Data Transfers</h2>
            <p className="text-white/80">
              Needix is based in the United States. If you are accessing our service from outside the US, 
              your information may be transferred to, stored, and processed in the US. We ensure appropriate 
              safeguards are in place to protect your data in accordance with this privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">8. Children&apos;s Privacy</h2>
            <p className="text-white/80">
              Our service is not intended for children under 13 years of age. We do not knowingly collect 
              personal information from children under 13. If you believe we have collected information 
              from a child under 13, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">9. Changes to This Policy</h2>
            <p className="text-white/80">
              We may update this privacy policy from time to time. We will notify you of any material 
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. 
              We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">10. Contact Us</h2>
            <div className="space-y-2 text-white/80">
              <p>If you have any questions about this privacy policy, please contact us:</p>
              <ul className="space-y-1 ml-4">
                <li><strong>Email:</strong> <a href="mailto:privacy@needix.com" className="text-blue-400 hover:underline">privacy@needix.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:needix2025@gmail.com" className="text-blue-400 hover:underline">needix2025@gmail.com</a></li>
                <li><strong>Website:</strong> <a href="https://needix.vercel.app" className="text-blue-400 hover:underline">needix.vercel.app</a></li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/60">
            This privacy policy is effective as of {new Date().toLocaleDateString()} and applies to all users of Needix.
          </p>
        </div>
      </div>
    </main>
  );
}