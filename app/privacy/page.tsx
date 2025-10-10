// app/privacy/page.tsx
export default function PrivacyPage() {
  const today = new Date().toLocaleDateString();
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <p className="text-white/70">Last updated: {today}</p>
        </div>

        <div className="space-y-8 text-white/90 leading-relaxed">
          {/* Intro */}
          <section>
            <p className="text-white/80">
              Needix (“<span className="italic">Needix</span>,” “we,” “us,” or “our”) helps you track subscriptions,
              orders, and expenses, set reminders, and (optionally) import data from your email or bank connections.
              This Privacy Policy explains what we collect, how we use it, and your choices.
            </p>
          </section>

          {/* 1. What We Collect */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">1. Information We Collect</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">1.1 Account &amp; Contact</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Name, email, and basic profile (via Google OAuth/NextAuth)</li>
                  <li>Support messages and communications you send us</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">1.2 App Data You Add</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>Subscriptions (names, prices, vendors, cadences)</li>
                  <li>Orders/expenses you enter or import</li>
                  <li>Notification and preference settings</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">1.3 Connected Sources (Optional)</h3>
                <p className="mb-2 text-white/80">
                  You may choose to connect external sources. If you do, we only request the minimum data needed to
                  provide the feature:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
                  <li>
                    <strong>Gmail (read-only)</strong> — If you enable Gmail Scan, we access receipt/confirmation emails
                    to detect potential subscriptions, orders, and expenses. We do not send, delete, or modify your
                    email. See §7 (Google API Services – Limited Use).
                  </li>
                  <li>
                    <strong>Plaid (bank connections)</strong> — If you enable Bank Sync, Plaid provides us account
                    identifiers, balances, and <em>transaction</em> data to infer recurring charges and expenses. We do
                    not receive your bank credentials. See §6 (Plaid).
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">1.4 Payments</h3>
                <p className="text-white/80">
                  We use <strong>Stripe</strong> to process Needix Pro subscriptions. Stripe stores and secures your
                  payment information; we never store full card numbers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">1.5 Technical</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>IP address, device/browser, pages viewed, referrer, timestamps</li>
                  <li>Error and performance diagnostics (e.g., Vercel Analytics)</li>
                  <li>Cookies/local storage for session and preferences</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. How We Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li><strong>Provide and improve Needix:</strong> sync, search, reminders, dashboards</li>
              <li><strong>Detect recurring charges:</strong> infer subscriptions/expenses from Gmail/Plaid imports</li>
              <li><strong>Authenticate &amp; secure:</strong> account access, fraud/abuse prevention</li>
              <li><strong>Billing &amp; entitlements:</strong> subscription status via Stripe</li>
              <li><strong>Support &amp; communications:</strong> respond to requests and product notices</li>
              <li><strong>Analytics &amp; performance:</strong> aggregate usage to improve reliability</li>
              <li><strong>Legal compliance:</strong> obligations and enforcement of terms</li>
            </ul>
          </section>

          {/* 3. Storage & Security */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">3. Data Storage and Security</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">3.1 Where Data Lives</h3>
                <p className="text-white/80">
                  Needix runs on <strong>Vercel</strong>; signed-in user data is stored in <strong>Neon Postgres</strong> via Prisma.
                  Some data is cached locally in your browser for performance.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">3.2 Security Measures</h3>
                <ul className="list-disc list-inside space-y-1 ml-4 text-white/80">
                  <li>TLS in transit; encryption at rest at our cloud providers</li>
                  <li>Principle-of-least-privilege access controls</li>
                  <li>Signed webhooks (Stripe) and OAuth state/nonce checks</li>
                  <li>Regular dependency updates and security reviews</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Sharing */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">4. Data Sharing and Disclosure</h2>
            <p className="text-white/80 mb-2">
              We do not sell your personal information. We share data only with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li><strong>Service providers</strong> (hosting, analytics, email, customer support, payments) under contract</li>
              <li><strong>Legal/safety</strong> requirements or to protect rights</li>
              <li><strong>Business transfers</strong> (e.g., merger/acquisition) with notice</li>
            </ul>
          </section>

          {/* 5. Rights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">5. Your Rights and Choices</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li><strong>Access/Export/Correction/Deletion</strong> — use in-app tools where available or email us</li>
              <li><strong>Consent management</strong> — disconnect Gmail/Plaid at any time in settings</li>
              <li><strong>Marketing</strong> — opt out of non-essential emails</li>
              <li><strong>Regional rights</strong> — we honor applicable rights under GDPR/UK GDPR and CCPA/CPRA</li>
            </ul>
            <p className="text-white/80 mt-3">
              Contact:{" "}
              <a href="mailto:privacy@needixai.com" className="text-blue-400 hover:underline">
                privacy@needixai.com
              </a>
            </p>
          </section>

          {/* 6. Plaid */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">6. Bank Connections via Plaid</h2>
            <p className="text-white/80 mb-3">
              When you connect a financial account, we use <strong>Plaid</strong> to securely link it and retrieve
              data needed for Needix features (primarily <em>Transactions</em>). By connecting an account, you authorize
              Needix to access account identifiers, balances, and transaction data to infer subscriptions/expenses and
              provide insights.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li><strong>We do not receive your bank credentials.</strong> You provide them directly to Plaid.</li>
              <li>
                <strong>Control:</strong> disconnect accounts in Needix at any time; you may also manage access via your
                financial institution and Plaid Portal.
              </li>
              <li>
                <strong>Plaid policy:</strong> Your use of Plaid is subject to{" "}
                <a
                  href="https://plaid.com/legal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  Plaid’s End User Privacy Policy
                </a>.
              </li>
            </ul>
          </section>

          {/* 7. Gmail Limited Use */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">7. Gmail Access (Google API Services – Limited Use)</h2>
            <p className="text-white/80 mb-3">
              If you enable <strong>Gmail Scan</strong>, Needix requests the <code className="bg-white/10 px-1 py-0.5 rounded">gmail.readonly</code>{" "}
              scope to parse receipts and order confirmations.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li><strong>What we access:</strong> messages likely to contain receipts/confirmations, plus relevant metadata.</li>
              <li><strong>What we don’t do:</strong> we don’t send, delete, or modify your emails.</li>
              <li>
                <strong>Limited Use:</strong> We use Gmail data only to provide the user-facing feature; we don’t transfer it to
                third parties except as necessary to provide/improve the feature, comply with law, or as part of a business transfer
                with notice; we don’t use Gmail data for ads. Human access is restricted, logged, and permitted only for security,
                abuse, compliance, or with your consent when required.
              </li>
              <li>
                <strong>Revocation &amp; deletion:</strong> you can revoke Needix’s Gmail access in your Google Account settings;
                we remove Gmail-derived data upon account deletion or request.
              </li>
            </ul>
          </section>

          {/* 8. Cookies */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">8. Cookies and Tracking</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-white/80">
              <li><strong>Essential</strong> — auth/session and security</li>
              <li><strong>Analytics</strong> — aggregate usage/performance (e.g., Vercel Analytics)</li>
              <li><strong>Preferences</strong> — theme and UI settings</li>
            </ul>
            <p className="text-white/80 mt-3">Browser controls allow you to manage cookies; blocking some may impact functionality.</p>
          </section>

          {/* 9. AI */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">9. AI Features</h2>
            <p className="text-white/80">
              Optional features may use third-party AI services (e.g., classifying receipts, generating summaries). We send only
              the minimum necessary text/fields and use outputs solely to provide the feature. We do not allow AI providers to
              train generalized models on your data.
            </p>
          </section>

          {/* 10. Retention */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">10. Data Retention</h2>
            <p className="text-white/80">
              Account data persists while your account is active. Gmail- and Plaid-derived records remain until you disconnect
              the source or delete your account, after which we purge them from application databases within a reasonable period,
              except where law requires limited retention for audit, fraud prevention, or compliance.
            </p>
          </section>

          {/* 11. International */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">11. International Data Transfers</h2>
            <p className="text-white/80">
              We operate in the United States. If you access Needix from another region, your data may be transferred to the U.S.
              We rely on appropriate safeguards and contracts with our sub-processors.
            </p>
          </section>

          {/* 12. Children */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">12. Children’s Privacy</h2>
            <p className="text-white/80">
              Needix is not directed to children under 13, and we do not knowingly collect data from them.
            </p>
          </section>

          {/* 13. Changes */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">13. Changes to This Policy</h2>
            <p className="text-white/80">
              We may update this policy. We will post updates here and revise the “Last updated” date. If changes are material,
              we will provide additional notice (e.g., in-app).
            </p>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-blue-400">14. Contact Us</h2>
            <div className="space-y-2 text-white/80">
              <p>If you have questions or requests about this policy:</p>
              <ul className="space-y-1 ml-4">
                <li>
                  <strong>Email:</strong>{" "}
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
                  <a href="https://needixai.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    needixai.com
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* Required notices (tiny footer block) */}
          <section className="rounded-lg border border-white/10 p-4 bg-white/5">
            <p className="text-sm text-white/70">
              <strong>Plaid notice:</strong> By connecting a financial account, you acknowledge Plaid’s processing as
              described in{" "}
              <a
                href="https://plaid.com/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-white"
              >
                Plaid’s End User Privacy Policy
              </a>
              .{" "}
              <strong>Google/Gmail:</strong> Gmail access complies with Google API Services User Data Policy and Limited
              Use requirements; revoke access anytime in your Google Account.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-white/60">
            This privacy policy is effective as of {today} and applies to all users of Needix.
          </p>
        </div>
      </div>
    </main>
  );
}
