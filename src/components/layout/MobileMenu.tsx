"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
}

export function MobileMenu({ isOpen, onClose, items }: MobileMenuProps) {
  const pathname = usePathname();

  // Close menu when route changes
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-navy z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <Link href="/" className="text-white font-bold text-xl" onClick={onClose}>
                  AFJ<span className="text-green">.</span> Limited
                </Link>
                <button
                  onClick={onClose}
                  className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-4">
                {items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.children &&
                      item.children.some((child) => pathname === child.href));

                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center justify-between px-6 py-3 text-lg transition-colors",
                          isActive
                            ? "text-green bg-white/5"
                            : "text-white hover:text-green hover:bg-white/5"
                        )}
                      >
                        {item.label}
                        {item.children && (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </Link>

                      {/* Child Items */}
                      {item.children && (
                        <div className="bg-white/5">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              className={cn(
                                "block px-10 py-2 text-base transition-colors",
                                pathname === child.href
                                  ? "text-green"
                                  : "text-white/80 hover:text-green"
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 space-y-4">
                <Button asChild className="w-full" size="lg">
                  <Link href="/book-now" onClick={onClose}>
                    Book Now
                  </Link>
                </Button>

                <div className="space-y-2 text-white/80 text-sm">
                  <a
                    href="tel:+441216891000"
                    className="flex items-center hover:text-green transition-colors"
                  >
                    <Phone className="h-4 w-4 mr-3" />
                    0121 689 1000
                  </a>
                  <a
                    href="mailto:info@afjltd.co.uk"
                    className="flex items-center hover:text-green transition-colors"
                  >
                    <Mail className="h-4 w-4 mr-3" />
                    info@afjltd.co.uk
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
