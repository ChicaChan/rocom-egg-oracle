import Link from "next/link";
import { Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-b border-border/40 backdrop-blur-sm bg-background/60 sticky top-0 z-40">
      <div className="container mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            🥚
          </span>
          <span className="font-semibold tracking-tight">Rocom Egg Oracle</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            · 洛克王国世界孵蛋反查
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <a
              href="https://github.com/ChicaChan/rocom-egg-oracle"
              target="_blank"
              rel="noreferrer"
            >
              <Code className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
