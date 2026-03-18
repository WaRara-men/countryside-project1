import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "安中・侍の足跡",
  description: "安中市の高齢者向け健康・安否確認アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}