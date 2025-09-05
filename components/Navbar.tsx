import DashboardLink from "@/components/DashboardLink";
import UserMenu from "@/components/UserMenu";

export default function Navbar({ minimal = false }: { minimal?: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/10 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/" className="text-lg font-semibold">Needix</a>

        {!minimal && (
          <div className="hidden gap-6 md:flex">
            <a href="/#features" className="text-white/80 hover:text-white">Features</a>
            <a href="/#pricing" className="text-white/80 hover:text-white">Pricing</a>
            <a href="/#faq" className="text-white/80 hover:text-white">FAQ</a>
          </div>
        )}

        <div className="flex items-center gap-3">
          <DashboardLink />
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
