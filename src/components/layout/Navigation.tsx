"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

interface NavigationProps {
  items: NavItem[];
  className?: string;
}

export function Navigation({ items, className }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("items-center space-x-1", className)}>
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.children &&
            item.children.some((child) => pathname === child.href));

        if (item.children) {
          return (
            <div key={item.href} className="relative group">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-green"
                    : "text-white hover:text-green"
                )}
              >
                {item.label}
                <ChevronDown className="ml-1 h-4 w-4 transition-transform group-hover:rotate-180" />
              </Link>

              {/* Dropdown */}
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="bg-white rounded-lg shadow-xl border py-2 min-w-[240px]">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block px-4 py-2 text-sm transition-colors",
                        pathname === child.href
                          ? "text-green bg-green/5"
                          : "text-gray-700 hover:text-green hover:bg-gray-50"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "text-green"
                : "text-white hover:text-green"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
