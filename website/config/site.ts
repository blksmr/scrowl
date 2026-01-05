import type { Metadata } from "next";

export const APP_URL = () => {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  if (process.env.CONTEXT === "deploy-preview") {
    return process.env.DEPLOY_PRIME_URL || "http://localhost:3000";
  }
  return "https://scrowl.blksmr.com/";
};

export const APP_NAME = "domet ・ /ˈdɔ.met/";
export const APP_DESCRIPTION = "A lightweight scroll spy hook for React";
export const APP_OG_ENDPOINT = `${APP_URL()}/opengraph.png`;

export const KEYWORDS = [
  "scroll spy",
  "react hook",
  "scroll tracking",
  "table of contents",
  "navigation",
  "react",
  "typescript",
  "scroll position",
  "active section",
  "intersection observer",
];

export const createBaseMetadata = ({
  title,
  description,
}: {
  title?: string;
  description?: string;
}): Metadata => {
  const metaTitle = title || APP_NAME;
  const metaDescription = description || APP_DESCRIPTION;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: KEYWORDS,
    authors: [{ name: "blksmr" }],
    creator: "blksmr",
    icons: {
      icon: "/favicon.png",
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: APP_URL(),
      title: metaTitle,
      description: metaDescription,
      siteName: APP_NAME,
      images: [
        {
          url: `${APP_URL()}${APP_OG_ENDPOINT}`,
          width: 1200,
          height: 630,
          alt: APP_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [`${APP_URL()}${APP_OG_ENDPOINT}`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
};

export const siteConfig = createBaseMetadata({});
