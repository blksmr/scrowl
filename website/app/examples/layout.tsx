"use client";

import { useEffect } from "react";

export default function ExamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.setAttribute("data-iframe", "");
    return () => {
      document.documentElement.removeAttribute("data-iframe");
    };
  }, []);

  return <>{children}</>;
}
