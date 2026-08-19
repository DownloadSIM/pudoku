// /src/components/Footer.tsx (Lines 4 to 71)
export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 w-full border-t border-ink/10 bg-card/95 backdrop-blur-sm py-3 shadow-md">
      {/* Changed justify-between to justify-center and added gap-6 to center everything */}
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-6 px-4">
        {/* BUY DATA Link (replacing GAMES) */}
        <a
          href="https://www.downloadsim.com"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-ink transition-colors"
          rel="noopener noreferrer"
        >
          BUY DATA
        </a>

        {/* Four Social Media Icons via Simple Icons CDN */}
        <div className="flex items-center gap-4">
          <a
            href="https://tiktok.com/@downloadsim"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="text-muted-foreground hover:text-ink transition-colors"
          >
            <img
              src="https://cdn.simpleicons.org/tiktok"
              alt="TikTok"
              className="size-6 opacity-70 hover:opacity-100 transition-opacity"
            />
          </a>
          <a
            href="https://youtube.com/@downloadsim"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            className="text-muted-foreground hover:text-ink transition-colors"
          >
            <img
              src="https://cdn.simpleicons.org/youtube"
              alt="YouTube"
              className="size-6 opacity-70 hover:opacity-100 transition-opacity"
            />
          </a>
          <a
            href="https://facebook.com/downloadsim.company"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="text-muted-foreground hover:text-ink transition-colors"
          >
            <img
              src="https://cdn.simpleicons.org/facebook"
              alt="Facebook"
              className="size-6 opacity-70 hover:opacity-100 transition-opacity"
            />
          </a>
          <a
            href="https://instagram.com/downloadsim"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-muted-foreground hover:text-ink transition-colors"
          >
            <img
              src="https://cdn.simpleicons.org/instagram"
              alt="Instagram"
              className="size-6 opacity-70 hover:opacity-100 transition-opacity"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
