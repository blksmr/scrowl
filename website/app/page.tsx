import { Logo } from "@/components/Logo";
import { getHomePage } from "@/lib/fumadocs";
import { getMDXComponents } from "@/mdx-components";
import scrowlPackage from "../../packages/scrowl/package.json";
import { APP_NAME } from "@/config/site";

export default function Page() {
  const page = getHomePage();

  if (!page) {
    return <div>Not found</div>;
  }

  const MDX = page.data.body;

  return (
    <article className="md:max-w-[680px] w-[80%] mx-auto py-32">
      <header className="flex w-full justify-between mb-6 items-center">
        <h1 className="flex gap-2 items-center">
          {APP_NAME}
        </h1>
      </header>
      <MDX components={getMDXComponents()} />
    </article>
  );
}
