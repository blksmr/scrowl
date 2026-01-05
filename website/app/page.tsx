import { Logo } from "@/components/Logo";
import { getHomePage } from "@/lib/fumadocs";
import { getMDXComponents } from "@/mdx-components";
import { APP_NAME } from "@/config/site";

export default function Page() {
  const page = getHomePage();

  if (!page) {
    return <div>Not found</div>;
  }

  const MDX = page.data.body;

  return (
    <article className="md:max-w-[680px] w-11/12 mx-auto py-24 md:py-32">
      <header className="flex w-full justify-between mb-6 items-center">
        <h1 className="flex gap-2 items-center">
          {APP_NAME}
        </h1>
      </header>
      <MDX components={getMDXComponents()} />
    </article>
  );
}
