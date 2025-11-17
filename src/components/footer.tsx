import { Link } from '@tanstack/react-router';

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
            <Link
              to="/legal"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Legal
            </Link>
            <Link
              to="/"
              href="/#pricing"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Pricing
            </Link>
            <a
              href="mailto:contact@justsendto.me"
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Contact
            </a>
          </nav>

          {/* Social Icons */}
          <div className="flex flex-1 justify-end gap-4"></div>
        </div>
      </div>
    </footer>
  );
}
