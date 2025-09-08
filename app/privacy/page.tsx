// app/privacy/page.tsx

export default function PrivacyPolicy() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="prose prose-invert max-w-none">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <p className="text-gray-300 mb-6">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
          <p className="text-gray-300 leading-relaxed">
            Welcome to Needix ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our subscription tracking application and website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          
          <h3 className="text-xl font-medium mb-3 text-cyan-400">Personal Information</h3>
          <ul className="text-gray-300 leading-relaxed space-y-2 mb-4">
            <li>• Email address (via Google OAuth authentication)</li>
            <li>• Name (via Google OAuth authentication)</li>
            <li>• Profile picture (via Google OAuth authentication)</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-cyan-400">Subscription Data</h3>
          <ul className="text-gray-300 leading-relaxed space-y-2 mb-4">
            <li>• Subscription names and services</li>
            <li>• Billing amounts and frequencies</li>
            <li>• Renewal dates</li>
            <li>• Categories and notes you add</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 text-cyan-400">Usage Information</h3>
          <ul className="text-gray-300 leading-relaxed space-y-2">
            <li>• How you interact with our application</li>
            <li>• Device information and browser type</li>
            <li>• IP address and location data</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <ul className="text-gray-300 leading-relaxed space-y-2">
            <li>• To provide and maintain our subscription tracking services</li>
            <li>• To authenticate your account and ensure security</li>
            <li>• To send renewal reminders and price alerts</li>
            <li>• To improve our application and user experience</li>
            <li>• To communicate with you about service updates</li>
            <li>• To process payments for Pro subscriptions</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Third-Party Services</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            We use the following third-party services that may collect information:
          </p>
          
          <h3 className="text-xl font-medium mb-3 text-cyan-400">Google OAuth</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            For secure authentication. Google's privacy policy applies to data they collect.
          </p>

          <h3 className="text-xl font-medium mb-3 text-cyan-400">Stripe</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            For payment processing. Stripe's privacy policy applies to payment data they process.
          </p>

          <h3 className="text-xl font-medium mb-3 text-cyan-400">Vercel</h3>
          <p className="text-gray-300 leading-relaxed">
            For hosting our application. Vercel's privacy policy applies to hosting data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p className="text-gray-300 leading-relaxed">
            We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
          <p className="text-gray-300 leading-relaxed">
            We retain your personal information only for as long as necessary to provide our services and comply with legal obligations. You may delete your account at any time, which will remove your data from our systems.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
          <p className="text-gray-300 leading-relaxed mb-4">You have the right to:</p>
          <ul className="text-gray-300 leading-relaxed space-y-2">
            <li>• Access your personal data</li>
            <li>• Update or correct your information</li>
            <li>• Delete your account and data</li>
            <li>• Export your subscription data</li>
            <li>• Withdraw consent for data processing</li>
            <li>• Object to data processing</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
          <p className="text-gray-300 leading-relaxed">
            Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">International Data Transfers</h2>
          <p className="text-gray-300 leading-relaxed">
            Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data during such transfers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Changes to This Privacy Policy</h2>
          <p className="text-gray-300 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            If you have any questions about this Privacy Policy, please contact us:
          </p>
          <ul className="text-gray-300 leading-relaxed space-y-2">
            <li>• Email: needix2025@gmail.com</li>
            <li>• Website: https://needix.vercel.app</li>
          </ul>
        </section>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-center text-gray-400 text-sm">
            This privacy policy is effective as of {new Date().toLocaleDateString()} and was last updated on {new Date().toLocaleDateString()}.
          </p>
        </div>
      </div>
    </main>
  );
}