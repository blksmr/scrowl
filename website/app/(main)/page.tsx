import { APP_NAME, siteConfig } from "@/config/site";
import { getHomePage } from "@/lib/fumadocs";
import { getMDXComponents } from "@/mdx-components";
import Link from "next/link";

export const metadata = siteConfig;

async function getNpmVersion(): Promise<string | null> {
  try {
    const res = await fetch("https://registry.npmjs.org/domet", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data["dist-tags"]?.latest ?? null;
  } catch {
    return null;
  }
}

export default async function Page() {
  const page = getHomePage();
  const version = await getNpmVersion();

  if (!page) {
    return <div>Not found</div>;
  }

  const MDX = page.data.body;

  return (
    <article>
      <header className="flex w-full mb-6">
        <div className="flex gap-2 items-center font-medium">{APP_NAME}</div>
        {version && (
          <Link className="flex items-center ml-auto text-xs text-muted hover:text-hover no-underline" href="https://www.npmjs.com/package/domet" title="View on npm">
            v{version}
          </Link>
        )}
      </header>
      <MDX components={getMDXComponents()} />
    </article>
  );
}
