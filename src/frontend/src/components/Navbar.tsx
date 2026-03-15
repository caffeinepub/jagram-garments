import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Menu, Shield, ShoppingCart, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCart, useIsAdmin } from "../hooks/useQueries";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: cartItems = [] } = useCart();
  const { data: isAdmin } = useIsAdmin();
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const isLoggedIn = loginStatus === "success" && !!identity;

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity),
    0,
  );

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Products" },
    { to: "/cart", label: "Cart" },
    { to: "/orders", label: "Orders" },
    ...(isAdmin ? [{ to: "/admin", label: "Admin" }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-forest-DEFAULT/95 backdrop-blur-md border-b border-forest-dark shadow-green-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link
            to="/"
            data-ocid="nav.link"
            className="flex flex-col leading-none group"
          >
            <span className="font-display text-xl md:text-2xl font-bold text-gold tracking-wide group-hover:text-gold-light transition-colors">
              Jagram
            </span>
            <span className="text-[10px] md:text-xs font-body tracking-[0.3em] text-gold-light/70 uppercase">
              Garments
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                data-ocid={`nav.${link.label.toLowerCase()}.link`}
                className="relative px-4 py-2 text-sm font-body font-medium text-gold-light/80 hover:text-gold transition-colors rounded-md hover:bg-forest-light/30"
                activeProps={{ className: "text-gold bg-forest-light/30" }}
              >
                {link.label === "Cart" ? (
                  <span className="flex items-center gap-1.5">
                    <ShoppingCart className="w-4 h-4" />
                    Cart
                    {cartCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1 bg-gold text-forest-dark text-[10px] font-bold">
                        {cartCount}
                      </Badge>
                    )}
                  </span>
                ) : link.label === "Admin" ? (
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Admin
                  </span>
                ) : (
                  link.label
                )}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Button
                variant="outline"
                size="sm"
                data-ocid="nav.logout.button"
                onClick={clear}
                className="hidden md:flex border-gold/40 text-gold hover:bg-gold hover:text-forest-dark transition-colors font-body"
              >
                Logout
              </Button>
            ) : (
              <Button
                size="sm"
                data-ocid="nav.login.button"
                onClick={login}
                disabled={loginStatus === "logging-in"}
                className="hidden md:flex bg-gold text-forest-dark hover:bg-gold-light font-body font-semibold"
              >
                {loginStatus === "logging-in" ? "Connecting..." : "Login"}
              </Button>
            )}

            <button
              type="button"
              className="md:hidden text-gold p-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-forest-dark border-t border-forest-light/20"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  data-ocid={`nav.mobile.${link.label.toLowerCase()}.link`}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-md text-gold-light/80 hover:text-gold hover:bg-forest-light/30 font-body font-medium transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label === "Cart" && (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      Cart
                      {cartCount > 0 && (
                        <Badge className="h-5 min-w-5 px-1 bg-gold text-forest-dark text-[10px] font-bold">
                          {cartCount}
                        </Badge>
                      )}
                    </>
                  )}
                  {link.label !== "Cart" && link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-forest-light/20">
                {isLoggedIn ? (
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="nav.mobile.logout.button"
                    onClick={() => {
                      clear();
                      setMobileOpen(false);
                    }}
                    className="w-full border-gold/40 text-gold hover:bg-gold hover:text-forest-dark font-body"
                  >
                    Logout
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    data-ocid="nav.mobile.login.button"
                    onClick={() => {
                      login();
                      setMobileOpen(false);
                    }}
                    className="w-full bg-gold text-forest-dark hover:bg-gold-light font-body font-semibold"
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
