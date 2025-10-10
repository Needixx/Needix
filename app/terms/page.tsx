// app/terms/page.tsx
export default function TermsPage() {
  const today = new Date().toLocaleDateString();
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <p className="text-white/70">Last updated: {today}</p>
        </div>

        <div className="space-y-8 text-white/90 leading-relaxed">
          {/* 1. Acceptance */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Acceptance of Terms</h2>
            <p className="text-white/80">
              These Terms of Service (“Terms”) are a legally binding agreement between you (“you,” “User”) and Needix
              (“Needix,” “we,” “us,” or “our”). By accessing or using Needix, you agree to be bound by these Terms and
              our Privacy Policy. If you do not agree, do not use the Service.
            </p>
          </section>

          {/* 2. Description */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. Description of Service</h2>
            <p className="text-white/80 mb-3">
              Needix is a subscription, order, and expense tracking application with optional features to import data
              from your email and financial accounts to help identify recurring charges and expenses. Core features
              include tracking, reminders, dashboards, insights, and (for Pro accounts) cloud sync and additional tools.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li>Track subscriptions, orders, and expenses</li>
              <li>Receive reminders and notifications</li>
              <li>Optional Gmail scanning (read-only) to parse receipts</li>
              <li>Optional bank sync via Plaid to read transactions</li>
              <li>Analytics and insights; optional AI-assisted classification/summaries</li>
            </ul>
          </section>

          {/* 3. Accounts */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">3. User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">3.1 Account Creation & Security</h3>
                <p className="text-white/80">
                  You may sign in with Google OAuth (NextAuth). You are responsible for your account credentials and all
                  activity under your account. Notify us promptly of any unauthorized access or use.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">3.2 Accuracy of Information</h3>
                <p className="text-white/80">
                  You agree to provide accurate information and maintain it up to date, including billing details for
                  Pro subscriptions.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">3.3 Termination</h3>
                <p className="text-white/80">
                  You may close your account at any time in settings. We may suspend or terminate your account for
                  violations of these Terms or for misuse, fraud, or security risks. Sections that by nature should
                  survive termination will survive (e.g., intellectual property, disclaimers, limitations of liability,
                  indemnities).
                </p>
              </div>
            </div>
          </section>

          {/* 4. Plans & Billing (Stripe) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. Subscription Plans and Payment</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">4.1 Free and Pro Plans</h3>
                <p className="text-white/80">
                  Needix offers a free tier and a paid “Pro” subscription. Plan features and limits are described in the
                  app and on our site and may change from time to time.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">4.2 Payment Processing</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Payments are processed securely by <strong>Stripe</strong>. We do not store full card numbers.</li>
                  <li>Subscriptions auto-renew until cancelled. Your access is tied to Stripe subscription status.</li>
                  <li>Failed payments may result in suspension or downgrade to the free tier.</li>
                  <li>Taxes, if applicable, will be charged based on your location and law.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">4.3 Cancellations, Proration, Refunds</h3>
                <p className="text-white/80">
                  You can cancel any time via the billing portal (Stripe Customer Portal). Cancellation takes effect at
                  the end of the current billing period. Refunds are governed by our posted refund policy and applicable
                  law. We may provide pro-rations or credits at our discretion or as required by Stripe policies.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">4.4 Price Changes</h3>
                <p className="text-white/80">
                  We may change pricing and will provide reasonable notice for recurring subscriptions as required by
                  law. Continued use after the effective date constitutes acceptance.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Third-Party Connections (Plaid & Gmail) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">5. Optional Data Connections</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">5.1 Bank Sync via Plaid</h3>
                <p className="text-white/80 mb-2">
                  If you choose to connect a financial account, Needix uses <strong>Plaid</strong> to securely facilitate
                  the connection and retrieve account data (e.g., account identifiers, balances, <em>transactions</em>)
                  to infer subscriptions/expenses and provide insights. You authorize us to obtain and use such data
                  through Plaid for the features you enable.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>You provide bank credentials directly to Plaid; Needix does not receive or store them.</li>
                  <li>You may disconnect accounts in Needix at any time; you may also manage access via your institution and Plaid Portal.</li>
                  <li>
                    Your use of Plaid is subject to{" "}
                    <a href="https://plaid.com/legal" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">
                      Plaid’s End User Privacy Policy
                    </a>.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">5.2 Gmail Scan (Google API Services – Limited Use)</h3>
                <p className="text-white/80 mb-2">
                  If you enable Gmail Scan, Needix requests read-only access (the{" "}
                  <code className="bg-white/10 px-1 py-0.5 rounded">gmail.readonly</code> scope) to parse receipts/order
                  confirmations and help identify subscriptions and expenses. We do not send, delete, or modify your
                  emails. Our access and use comply with Google’s User Data Policy and “Limited Use” requirements
                  (including restrictions on human access, transfer, and advertising use). You can revoke access in your
                  Google Account at any time.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">6. Acceptable Use</h2>
            <p className="text-white/80">You agree not to, and not to attempt to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li>Violate laws, third-party rights, or provider terms (e.g., Plaid, Google, Stripe)</li>
              <li>Upload malware or interfere with the Service, infrastructure, or other users</li>
              <li>Scrape, harvest, or misuse data in ways prohibited by connected providers</li>
              <li>Reverse engineer or attempt to access source code or protected areas</li>
              <li>Use another user’s account or share/sell access credentials</li>
              <li>Use the Service to build a competing dataset or product that infringes our IP</li>
            </ul>
          </section>

          {/* 7. Data & Privacy (tie to Privacy Policy) */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">7. Data and Privacy</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                Our collection and use of personal data are described in our Privacy Policy, which is incorporated by
                reference. By using Needix, you consent to our data practices as described there.
              </p>
              <p className="text-white/80">
                Summary: Needix runs on <strong>Vercel</strong>; your data is stored in <strong>Neon Postgres</strong> via Prisma. We use
                <strong> Stripe</strong> for billing. Optional Gmail and Plaid connections are user-initiated and can be revoked at any time.
              </p>
            </div>
          </section>

          {/* 8. AI Features */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">8. AI Features</h2>
            <p className="text-white/80">
              Some optional features may use third-party AI services (e.g., classifying receipts or generating summaries).
              We send only the minimum necessary text/fields to provide the feature and do not permit AI providers to use
              your data to train generalized models. Outputs are provided “as is” and may require your review.
            </p>
          </section>

          {/* 9. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">9. Intellectual Property</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                Needix, including its software, design, and content (excluding your data), is owned by us or our licensors
                and protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable license
                to use the Service in accordance with these Terms.
              </p>
              <p className="text-white/80">
                You may submit feedback; we may use it without restriction or compensation.
              </p>
            </div>
          </section>

          {/* 10. Availability & Changes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">10. Service Availability and Changes</h2>
            <p className="text-white/80 mb-2">
              We strive for high availability but do not guarantee uninterrupted service. Maintenance, updates, outages,
              or provider incidents (e.g., hosting, Stripe, Plaid, Google) may affect availability. We may modify or
              discontinue features with or without notice, subject to applicable law and any specific commitments we make.
            </p>
          </section>

          {/* 11. Disclaimers & Limitation */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">11. Disclaimers and Limitations of Liability</h2>
            <div className="space-y-4">
              <p className="text-white/80">
                THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS,
                IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT IDENTIFICATIONS, CLASSIFICATIONS, DATES, OR PRICING
                SUGGESTIONS WILL BE ERROR-FREE; YOU ARE RESPONSIBLE FOR VALIDATING FINANCIAL DECISIONS.
              </p>
              <p className="text-white/80">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEEDIX AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT,
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST DATA, OR
                BUSINESS INTERRUPTION, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR
                ALL CLAIMS IN THE AGGREGATE SHALL NOT EXCEED THE AMOUNTS YOU PAID TO NEEDIX IN THE 12 MONTHS PRECEDING
                THE CLAIM OR USD $50 IF YOU HAVE NOT PAID.
              </p>
            </div>
          </section>

          {/* 12. Indemnity */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">12. Indemnification</h2>
            <p className="text-white/80">
              You agree to indemnify and hold harmless Needix and its affiliates, officers, directors, employees, and
              agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys’ fees)
              arising from your misuse of the Service or violation of these Terms or applicable laws.
            </p>
          </section>

          {/* 13. Governing Law & Disputes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">13. Governing Law and Disputes</h2>
            <p className="text-white/80">
              These Terms are governed by the laws of the United States and the state where Needix is organized, without
              regard to conflict-of-law rules. Courts in that jurisdiction shall have exclusive venue. You and Needix
              waive class actions to the fullest extent permitted by law.
            </p>
          </section>

          {/* 14. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">14. Changes to These Terms</h2>
            <p className="text-white/80">
              We may update these Terms from time to time. We will post updates here and revise the “Last updated” date.
              If changes are material, we will provide additional notice (e.g., in-app). Continued use after the
              effective date constitutes acceptance.
            </p>
          </section>

          {/* 15. Severability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">15. Severability</h2>
            <p className="text-white/80">
              If any provision of these Terms is held invalid or unenforceable, the remaining provisions will remain in
              full force and effect.
            </p>
          </section>

          {/* 16. Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">16. Contact</h2>
            <div className="space-y-2 text-white/80">
              <p>Questions about these Terms?</p>
              <ul className="space-y-1 ml-4">
                <li>
                  <strong>Legal:</strong>{" "}
                  <a href="mailto:legal@needixai.com" className="text-blue-400 hover:underline">
                    legal@needixai.com
                  </a>
                </li>
                <li>
                  <strong>Privacy:</strong>{" "}
                  <a href="mailto:privacy@needixai.com" className="text-blue-400 hover:underline">
                    privacy@needixai.com
                  </a>
                </li>
                <li>
                  <strong>Support:</strong>{" "}
                  <a href="mailto:needix2025@gmail.com" className="text-blue-400 hover:underline">
                    needix2025@gmail.com
                  </a>
                </li>
                <li>
                  <strong>Website:</strong>{" "}
                  <a href="https://needixai.com" className="text-blue-400 hover:underline" target="_blank" rel="noreferrer">
                    needixai.com
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Required notices footer block (concise) */}
          <section className="rounded-lg border border-white/10 p-4 bg-white/5">
            <p className="text-sm text-white/70">
              <strong>Plaid:</strong> By connecting a financial account, you authorize Needix to obtain data from your
              financial institution(s) via Plaid and acknowledge processing as described in{" "}
              <a href="https://plaid.com/legal" target="_blank" rel="noreferrer" className="underline hover:text-white">
                Plaid’s End User Privacy Policy
              </a>
              .{" "}
              <strong>Google/Gmail:</strong> Gmail access is read-only and complies with Google API Services User Data
              Policy (Limited Use); revoke at any time in your Google Account.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/60">
            These Terms are effective as of {today} and apply to all users of Needix.
          </p>
          <p className="text-white/50 mt-2">
            By using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>
        </div>
      </div>
    </main>
  );
}
