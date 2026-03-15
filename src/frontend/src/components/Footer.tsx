export function Footer() {
  const year = new Date().getFullYear();
  const utm = encodeURIComponent(window.location.hostname);

  return (
    <footer className="bg-forest-dark text-gold-light/60 py-10 mt-16 border-t border-forest-light/20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-display text-xl font-bold text-gold mb-3">
              Jagram Garments
            </h3>
            <p className="text-sm font-body leading-relaxed">
              Quality Garments for Every Occasion. Bringing you the finest in
              ethnic and contemporary fashion.
            </p>
          </div>
          <div>
            <h4 className="font-body font-semibold text-gold-light mb-3 uppercase tracking-wider text-xs">
              Categories
            </h4>
            <ul className="space-y-1.5 text-sm font-body">
              <li>
                <a
                  href="/products?category=men"
                  className="hover:text-gold transition-colors"
                >
                  Men&apos;s Collection
                </a>
              </li>
              <li>
                <a
                  href="/products?category=women"
                  className="hover:text-gold transition-colors"
                >
                  Women&apos;s Collection
                </a>
              </li>
              <li>
                <a
                  href="/products?category=kids"
                  className="hover:text-gold transition-colors"
                >
                  Kids&apos; Collection
                </a>
              </li>
              <li>
                <a
                  href="/products?category=accessories"
                  className="hover:text-gold transition-colors"
                >
                  Accessories
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-body font-semibold text-gold-light mb-3 uppercase tracking-wider text-xs">
              Contact
            </h4>
            <address className="not-italic text-sm font-body space-y-1">
              <p>📍 123 Fashion Street, Mumbai - 400001</p>
              <p>📞 +91 98765 43210</p>
              <p>✉️ info@jagramgarments.com</p>
            </address>
          </div>
        </div>
        <div className="pt-6 border-t border-forest-light/20 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-body">
          <p>© {year} Jagram Garments. All rights reserved.</p>
          <p>
            Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${utm}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
