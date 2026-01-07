"use client";

import dynamic from "next/dynamic";

const Playground = dynamic(
  () => import("@/components/examples/Playground").then((m) => m.Playground),
  {
    ssr: false,
  },
);

export default function Page() {
  return <Playground />;
}
