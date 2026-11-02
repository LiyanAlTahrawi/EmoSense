import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { BoxIcon } from "lucide-react";
interface StatusScreenProps {
  icon: BoxIcon;
  eyebrow?: string;
  title: string;
  description: string;
  actions: React.ReactNode;
}
export function StatusScreen({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions
}: StatusScreenProps) {
  return <div className="flex min-h-[100dvh] w-full flex-col bg-canvas">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="focus-ring rounded-lg" aria-label="EmoSense home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-tint text-accent">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </div>
          {eyebrow && <p className="mt-6 text-sm font-medium text-accent">{eyebrow}</p>}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
        </div>
      </main>
    </div>;
}