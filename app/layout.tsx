import type { Metadata, Viewport } from "next";
import { Geist_Mono, Zen_Maru_Gothic } from "next/font/google";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";
import "./globals.css";

const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const basePath = process.env.GITHUB_PAGES === "true" ? "/baby" : "";

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: `${basePath}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: `${basePath}/icon-192.png?v=20260802`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${basePath}/icon-512.png?v=20260802`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: `${basePath}/apple-touch-icon.png?v=20260802`,
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f7f3ee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${zenMaruGothic.variable} ${geistMono.variable} h-full`}
    >
      <head>
        {/* iOS のホーム画面起動で Safari 枠を消すために明示 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
        <link
          rel="apple-touch-icon"
          href={`${basePath}/apple-touch-icon.png?v=20260802`}
        />
        <link
          rel="manifest"
          href={`${basePath}/manifest.webmanifest?v=20260802`}
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden overscroll-none">
        {children}
      </body>
    </html>
  );
}
