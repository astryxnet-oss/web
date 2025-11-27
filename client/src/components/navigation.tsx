import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Code2, Plus, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./theme-toggle";

interface NavigationProps {
  onSubmitClick: () => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function Navigation({ onSubmitClick, searchQuery = "", onSearchChange }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [location, navigate] = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    } else if (localSearch.trim()) {
      navigate(`/browse?q=${encodeURIComponent(localSearch.trim())}`);
    }
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/category/discord", label: "Discord" },
    { href: "/category/minecraft", label: "Minecraft" },
    { href: "/category/gaming", label: "Gaming" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0" data-testid="link-home">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <Code2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl hidden sm:inline">FreeCodeHub</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={location === link.href ? "bg-accent" : ""}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search codes..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9 h-9"
                data-testid="input-nav-search"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="link-admin" title="Admin Dashboard">
                <Shield className="h-5 w-5" />
                <span className="sr-only">Admin</span>
              </Button>
            </Link>
            <Button
              onClick={onSubmitClick}
              className="hidden sm:flex"
              data-testid="button-submit-code"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Code
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsOpen(!isOpen)}
              data-testid="button-mobile-menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="lg:hidden pb-4 space-y-2">
            <form onSubmit={handleSearchSubmit} className="md:hidden mb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search codes..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-mobile-search"
                />
              </div>
            </form>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${location === link.href ? "bg-accent" : ""}`}
                  onClick={() => setIsOpen(false)}
                  data-testid={`link-mobile-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <Button
              onClick={() => {
                onSubmitClick();
                setIsOpen(false);
              }}
              className="w-full sm:hidden"
              data-testid="button-mobile-submit"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Code
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
