"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const [activeKey, setActiveKey] = useState(routeKey);
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    setActiveKey(routeKey);
    setIsEntering(true);

    const frame = window.requestAnimationFrame(() => {
      setIsEntering(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [routeKey]);

  return (
    <div
      key={activeKey}
      className={`page-transition ${isEntering ? "page-transition-enter" : ""}`}
    >
      {children}
    </div>
  );
}
