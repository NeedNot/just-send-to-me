export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto flex w-3/4 flex-col items-center gap-4 md:flex-row">
          {/* Copyright */}
          <p className="text-muted-foreground flex-1 text-sm text-nowrap">
            © {currentYear} JustSendToMe. All rights reserved.
          </p>

          {/* Navigation Links */}
          <nav className="flex flex-1 justify-center gap-6">
            {/* <Link
              to="/legal"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Legal
            </Link> */}
            {/* <Link
              to="/pricing"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Pricing
            </Link> */}
            {/* <Link
              to="/support"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Support
            </Link> */}
          </nav>

          {/* Social Icons */}
          <div className="flex flex-1 justify-end gap-4">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Follow us on X"
            >
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
