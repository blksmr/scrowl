"use client";

import dynamic from "next/dynamic";

const ModalForm = dynamic(
  () => import("@/components/examples/ModalForm").then((m) => m.ModalForm),
  { ssr: false }
);

export default function Page() {
  return <ModalForm />;
}
