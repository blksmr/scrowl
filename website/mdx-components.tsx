import type { MDXComponents } from "mdx/types";
import { Demo } from "@/components/Demo";

export function getMDXComponents(): MDXComponents {
  return {
    Demo,
    table: (props) => (
      <div className="table-wrapper">
        <table {...props} />
      </div>
    ),
  };
}
