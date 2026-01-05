import { visit } from "unist-util-visit";
import type { Root, Text } from "mdast";

const SMALL_REGEX = /\+\+([^+]+)\+\+/g;

export function remarkSmall() {
  return (tree: Root) => {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index === undefined) return;

      const matches = [...node.value.matchAll(SMALL_REGEX)];
      if (matches.length === 0) return;

      const children: (Text | { type: "mdxJsxTextElement"; name: string; attributes: never[]; children: Text[] })[] = [];
      let lastIndex = 0;

      for (const match of matches) {
        const [full, content] = match;
        const startIndex = match.index!;

        if (startIndex > lastIndex) {
          children.push({
            type: "text",
            value: node.value.slice(lastIndex, startIndex),
          });
        }

        children.push({
          type: "mdxJsxTextElement",
          name: "small",
          attributes: [],
          children: [{ type: "text", value: content }],
        });

        lastIndex = startIndex + full.length;
      }

      if (lastIndex < node.value.length) {
        children.push({
          type: "text",
          value: node.value.slice(lastIndex),
        });
      }

      parent.children.splice(index, 1, ...children);
    });
  };
}
