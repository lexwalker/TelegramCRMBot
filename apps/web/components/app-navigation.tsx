"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  glyph: "grid" | "list" | "calendar" | "team";
};

type AppNavigationProps = {
  items: NavItem[];
};

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function Glyph({ glyph, active }: { glyph: NavItem["glyph"]; active: boolean }) {
  const tone = active
    ? "bg-[linear-gradient(180deg,rgba(104,123,255,0.34),rgba(79,97,214,0.18))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_10px_24px_rgba(50,72,230,0.22)]"
    : "bg-white/10 text-white";

  if (glyph === "grid") {
    return (
      <div className={`grid h-10 w-10 grid-cols-2 gap-1 rounded-2xl p-2 ${tone}`}>
        <span className="rounded-[6px] bg-current/90" />
        <span className="rounded-[6px] bg-current/70" />
        <span className="rounded-[6px] bg-current/70" />
        <span className="rounded-[6px] bg-current/90" />
      </div>
    );
  }

  if (glyph === "list") {
    return (
      <div className={`flex h-10 w-10 flex-col justify-center gap-1 rounded-2xl px-2.5 ${tone}`}>
        <span className="h-1 rounded-full bg-current/90" />
        <span className="h-1 rounded-full bg-current/70" />
        <span className="h-1 rounded-full bg-current/90" />
      </div>
    );
  }

  if (glyph === "calendar") {
    return (
      <div className={`relative h-10 w-10 rounded-2xl ${tone}`}>
        <span className="absolute left-2 right-2 top-2 h-1 rounded-full bg-current/85" />
        <span className="absolute left-2 bottom-2 top-5 rounded-md border border-current/60" />
        <span className="absolute right-2 bottom-2 top-5 rounded-md border border-current/60" />
      </div>
    );
  }

  return (
    <div className={`relative h-10 w-10 rounded-2xl ${tone}`}>
      <span className="absolute left-[7px] top-[8px] h-3.5 w-3.5 rounded-full bg-current/90" />
      <span className="absolute right-[7px] top-[8px] h-3.5 w-3.5 rounded-full bg-current/65" />
      <span className="absolute bottom-[8px] left-[8px] right-[8px] h-3 rounded-full bg-current/85" />
    </div>
  );
}

export function AppNavigation({ items }: AppNavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2.5">
      {items.map((item) => {
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`group flex flex-col items-center gap-2.5 rounded-[1.5rem] border px-3 py-3 text-center transition duration-200 ${
              isActive
                ? "border-[rgba(117,134,255,0.32)] bg-[linear-gradient(180deg,rgba(93,110,255,0.18),rgba(26,31,57,0.92))] text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                : "border-white/8 bg-transparent text-white/70 hover:border-white/12 hover:bg-white/6 hover:text-white"
            }`}
          >
            <Glyph glyph={item.glyph} active={isActive} />
            <span className="text-[11px] font-medium tracking-[0.06em]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
