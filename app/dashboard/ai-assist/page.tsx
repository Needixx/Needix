// app/dashboard/ai-assist/page.tsx
import AIAssist from "@/components/AIAssist";

export default function AiAssistPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-white">AI Intake (Demo)</h1>
      <p className="mb-6 text-white/70">
        Test the AI intake flow here. This posts to <code>/api/ai/intake</code> and creates
        Subscriptions, Orders, and Expenses for your signed-in user.
      </p>
      <AIAssist />
    </main>
  );
}
