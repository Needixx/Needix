// app/terms/page.tsx
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-white/70">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="space-y-8 text-white/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Acceptance of Terms</h2>
            <p className="text-white/80">
              By accessing and using Needix (&quot;the Service&quot;), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot; or &quot;you&quot;) 
              and Needix (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. Description of Service</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                Needix is a subscription and order tracking platform that helps users:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
                <li>Track recurring subscriptions and their billing cycles</li>
                <li>Monitor and manage automatic reorders</li>
                <li>Receive reminders for upcoming payments and deliveries</li>
                <li>Analyze spending patterns and manage budgets</li>
                <li>Export and backup subscription data</li>
              </ul>
              <p className="text-white/80 mt-4">
                We offer both free and premium (&quot;Pro&quot;) versions of our service with different feature sets and limitations.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">3. User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">3.1 Account Creation</h3>
                <p className="text-white/80">
                  To use certain features of Needix, you must create an account using Google OAuth. 
                  You are responsible for maintaining the confidentiality of your account credentials 
                  and for all activities that occur under your account.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">3.2 Account Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Provide accurate and complete information during registration</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Use the service only for lawful purposes</li>
                  <li>Comply with all applicable laws and regulations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">3.3 Account Termination</h3>
                <p className="text-white/80">
                  You may terminate your account at any time through the settings page. We reserve the right 
                  to suspend or terminate accounts that violate these terms or engage in harmful activities.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. Subscription Plans and Payment</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">4.1 Free Plan</h3>
                <p className="text-white/80">
                  Our free plan includes basic subscription tracking with limitations on the number of 
                  subscriptions you can track and available features.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">4.2 Pro Plan</h3>
                <p className="text-white/80">
                  Our Pro plan is a paid subscription service that provides unlimited subscription tracking, 
                  advanced features, priority support, and additional functionality. Pro subscriptions are 
                  billed monthly or annually as selected by the user.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">4.3 Payment Processing</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>All payments are processed securely through Stripe</li>
                  <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
                  <li>Refunds are provided in accordance with our refund policy (30-day money back guarantee)</li>
                  <li>Failed payments may result in service suspension</li>
                  <li>Price changes will be communicated with at least 30 days notice</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">4.4 Cancellation</h3>
                <p className="text-white/80">
                  You may cancel your Pro subscription at any time through your billing portal. 
                  Cancellation will take effect at the end of your current billing period, and you 
                  will retain Pro features until that time.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">5. Acceptable Use Policy</h2>
            <div className="space-y-4">
              <p className="text-white/80">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
                <li>Violate any laws, regulations, or third-party rights</li>
                <li>Upload or transmit malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                <li>Interfere with or disrupt the Service or our servers</li>
                <li>Use automated scripts or bots to access the Service</li>
                <li>Share or resell your account access to third parties</li>
                <li>Reverse engineer, decompile, or attempt to extract our source code</li>
                <li>Use the Service for any illegal or unauthorized purpose</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">6. Data and Privacy</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">6.1 Your Data</h3>
                <p className="text-white/80">
                  You retain ownership of all data you input into Needix. We do not claim ownership 
                  of your subscription information, order data, or personal content.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">6.2 Data Storage</h3>
                <p className="text-white/80">
                  Your data is primarily stored locally in your browser. Pro users may optionally 
                  sync data to our secure cloud storage. We implement appropriate security measures 
                  to protect your data.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">6.3 Privacy Policy</h3>
                <p className="text-white/80">
                  Our collection, use, and protection of your personal information is governed by our 
                  Privacy Policy, which is incorporated into these Terms by reference.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">6.4 Data Backup and Export</h3>
                <p className="text-white/80">
                  You are responsible for maintaining backups of your data. We provide export functionality 
                  to help you backup your information, but we recommend regular exports to ensure data safety.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">7. Intellectual Property</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">7.1 Our Rights</h3>
                <p className="text-white/80">
                  Needix and all related trademarks, logos, and intellectual property are owned by us. 
                  The Service, including its design, functionality, and underlying technology, is protected 
                  by copyright, trademark, and other intellectual property laws.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">7.2 Your License</h3>
                <p className="text-white/80">
                  We grant you a limited, non-exclusive, non-transferable license to use the Service 
                  for your personal or business purposes in accordance with these Terms.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">7.3 Feedback</h3>
                <p className="text-white/80">
                  Any feedback, suggestions, or ideas you provide about the Service may be used by us 
                  without compensation or attribution to you.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">8. Service Availability</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                We strive to provide reliable service, but we do not guarantee uninterrupted access 
                to Needix. The Service may be temporarily unavailable due to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                <li>Scheduled maintenance and updates</li>
                <li>Emergency repairs or security patches</li>
                <li>Network or server outages beyond our control</li>
                <li>Force majeure events</li>
              </ul>
              <p className="text-white/80 mt-4">
                We will make reasonable efforts to provide advance notice of planned maintenance 
                and to minimize service disruptions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">9. Disclaimers and Limitations</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">9.1 Service Disclaimer</h3>
                <p className="text-white/80">
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                  WE DISCLAIM ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, 
                  FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">9.2 Accuracy Disclaimer</h3>
                <p className="text-white/80">
                  While we strive to provide accurate tracking and reminder functionality, we cannot 
                  guarantee the accuracy of billing dates, prices, or other subscription information. 
                  Users are responsible for verifying all information independently.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">9.3 Limitation of Liability</h3>
                <p className="text-white/80">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                  SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, 
                  DATA, OR USE, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">10. Indemnification</h2>
            <p className="text-white/80">
              You agree to indemnify, defend, and hold harmless Needix and its affiliates, officers, 
              directors, employees, and agents from and against any claims, damages, losses, and expenses, 
              including reasonable attorney fees, arising out of or relating to your use of the Service 
              or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">11. Termination</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                These Terms remain in effect until terminated by either party. We may terminate or 
                suspend your access to the Service immediately, without prior notice, if you breach these Terms.
              </p>
              <p className="text-white/80">
                Upon termination, your right to use the Service will cease immediately. Sections relating 
                to intellectual property, disclaimers, limitations of liability, and indemnification 
                will survive termination.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">12. Governing Law</h2>
            <p className="text-white/80">
              These Terms shall be interpreted and governed by the laws of the United States and the 
              state in which our company is incorporated, without regard to conflict of law provisions. 
              Any disputes arising from these Terms will be subject to the exclusive jurisdiction of 
              the courts in that jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">13. Changes to Terms</h2>
            <p className="text-white/80">
              We reserve the right to modify these Terms at any time. We will provide notice of material 
              changes by posting the updated Terms on our website and updating the &quot;Last updated&quot; date. 
              Your continued use of the Service after such changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">14. Severability</h2>
            <p className="text-white/80">
              If any provision of these Terms is found to be unenforceable or invalid, that provision 
              will be limited or eliminated to the minimum extent necessary so that the remaining Terms 
              will remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">15. Contact Information</h2>
            <div className="space-y-2 text-white/80">
              <p>If you have any questions about these Terms of Service, please contact us:</p>
              <ul className="space-y-1 ml-4">
                <li><strong>Email:</strong> <a href="mailto:legal@needix.com" className="text-blue-400 hover:underline">legal@needix.com</a></li>
                <li><strong>Support:</strong> <a href="mailto:needix2025@gmail.com" className="text-blue-400 hover:underline">needix2025@gmail.com</a></li>
                <li><strong>Website:</strong> <a href="https://needix.vercel.app" className="text-blue-400 hover:underline">needix.vercel.app</a></li>
              </ul>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/60">
            These terms are effective as of {new Date().toLocaleDateString()} and apply to all users of Needix.
          </p>
          <p className="text-white/50 mt-2">
            By using our service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </main>
  );
}