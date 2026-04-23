import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fruit Market",
  description: "Marché de fruits : annonces, achats et avis sur la blockchain.",
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
