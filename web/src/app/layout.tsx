import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fruit Market — IFT 7100 TP3",
  description: "DApp marketplace de fruits (mouture UI, données fictives)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
