"use client";

import dynamic from "next/dynamic";

const DynamicOffset = dynamic(
  () => import("@/components/examples/DynamicOffset").then((m) => m.DynamicOffset),
  { ssr: false }
);

export default function Page() {
  return <DynamicOffset />;
}
