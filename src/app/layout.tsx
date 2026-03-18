import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google"; // 追加
import "./globals.css";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "700", "900"] }); // 追加

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
      <body className={noto.className}>{children}</body>
    </html>
  );
}