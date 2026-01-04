"use client";

import dynamic from "next/dynamic";

const Basic = dynamic(
  () => import("@/components/examples/Basic").then((m) => m.Basic),
  {
    ssr: false,
  },
);

export default function Page() {
  return <Basic />;
}
