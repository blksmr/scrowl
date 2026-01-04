import { Logo } from "@/components/Logo";
import { getHomePage } from "@/lib/fumadocs";
import { getMDXComponents } from "@/mdx-components";
import scrowlPackage from "../../packages/scrowl/package.json";

export default function Page() {
  const page = getHomePage();

  if (!page) {
    return <div>Not found</div>;
  }

  const { title } = page.data;
  const MDX = page.data.body;

  return (
    <article className="md:max-w-[640px] w-[80%] mx-auto py-32">
      <header className="flex w-full justify-between mb-6 items-center">
        <h1 className="flex gap-2 items-center">
          <Logo className="text-primary fill-primary" />
          {title}
        </h1>
        <span className="font-mono text-[10px] text-gray-500">
          v{scrowlPackage.version}
        </span>
      </header>
      <MDX components={getMDXComponents()} />
    </article>
  );
}
