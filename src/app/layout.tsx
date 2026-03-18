import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Yuji_Syuku } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-noto" });
const yuji = Yuji_Syuku({ subsets: ["latin"], weight: ["400"], variable: "--font-yuji" });

export const metadata: Metadata = {
  title: "安中・侍の足跡",
  description: "安中市の高齢者向け健康・安否確認アプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "安中 侍",
  },
};

export const viewport: Viewport = {
  themeColor: "#f9ab00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${noto.variable} ${yuji.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}