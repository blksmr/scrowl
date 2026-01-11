import { APP_NAME, siteConfig } from "@/config/site";
import { getHomePage } from "@/lib/fumadocs";
import { getMDXComponents } from "@/mdx-components";
import packageJson from "../../../packages/domet/package.json";
import Link from "next/link";
import { GitHubLogoIcon } from "@radix-ui/react-icons";

export const metadata = siteConfig;

export default function Page() {
  const page = getHomePage();

  if (!page) {
    return <div>Not found</div>;
  }

  const MDX = page.data.body;

  return (
    <article>
      <header className="flex w-full mb-6">
        <div className="flex gap-2 items-center font-medium">{APP_NAME}</div>
        <Link className="flex items-center ml-auto text-xs text-text-muted hover:text-text-hover no-underline" href={`https://www.npmjs.com/package/domet`} title="View on npm">
        <GitHubLogoIcon className="inline-block size-3 mr-1" />
          {packageJson.version}
        </Link>
      </header>
      <MDX components={getMDXComponents()} />
    </article>
  );
}
