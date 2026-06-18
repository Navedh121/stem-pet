// Quiet footer with original web-motif mark.
// Matches DESIGN_BRIEF §3A — "quiet, with original web-motif mark."

export default function Footer() {
  return (
    <footer className="border-t border-silk/10 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          {/* Minimal SVG web motif */}
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="10" r="8" fill="none" stroke="#AEB9D4" strokeWidth="0.8" strokeOpacity="0.4" />
            <circle cx="10" cy="10" r="4" fill="none" stroke="#AEB9D4" strokeWidth="0.8" strokeOpacity="0.3" />
            {/* 4 spokes */}
            <line x1="10" y1="2" x2="10" y2="18" stroke="#AEB9D4" strokeWidth="0.6" strokeOpacity="0.3" />
            <line x1="2" y1="10" x2="18" y2="10" stroke="#AEB9D4" strokeWidth="0.6" strokeOpacity="0.3" />
            <line x1="3.7" y1="3.7" x2="16.3" y2="16.3" stroke="#AEB9D4" strokeWidth="0.6" strokeOpacity="0.2" />
            <line x1="16.3" y1="3.7" x2="3.7" y2="16.3" stroke="#AEB9D4" strokeWidth="0.6" strokeOpacity="0.2" />
          </svg>
          <span className="font-display text-sm text-silk">STEMPet</span>
        </div>

        <p className="text-muted text-xs text-center">
          © {new Date().getFullYear()} STEMPet. Built with care for curious kids.
        </p>

        <nav className="flex gap-5 text-xs text-muted">
          <a href="/login" className="hover:text-silk transition-colors">Sign in</a>
          <a href="/signup" className="hover:text-silk transition-colors">Sign up</a>
        </nav>
      </div>
    </footer>
  );
}
