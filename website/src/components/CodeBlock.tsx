import { useState, useEffect, useRef } from "react";
import { getHighlighter, type Highlighter } from "shiki";

interface CodeBlockProps {
  code: string;
  lang?: "typescript" | "tsx" | "bash" | "shell";
  className?: string;
}

let highlighterPromise: Promise<Highlighter> | null = null;

const getShikiHighlighter = () => {
  if (!highlighterPromise) {
    highlighterPromise = getHighlighter({
      themes: ["github-light"],
      langs: ["typescript", "tsx", "bash", "shell"],
    });
  }
  return highlighterPromise;
};

export const CodeBlock = ({ code, lang = "typescript", className = "" }: CodeBlockProps) => {
  const [html, setHtml] = useState<string>("");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    getShikiHighlighter().then((highlighter) => {
      if (!mounted.current) return;
      const result = highlighter.codeToHtml(code, {
        lang,
        theme: "github-light",
      });
      setHtml(result);
    });
    return () => {
      mounted.current = false;
    };
  }, [code, lang]);

  if (!html) {
    return (
      <pre className={`code-block ${className}`}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
