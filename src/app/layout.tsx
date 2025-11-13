// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Cadastro Seguros",
  description: "Sistema de cadastros de imóveis, pessoas e apólices.",
  icons: "/logo-tab.png",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <NavBar />
        <main>{children}</main>
      </body>
    </html>
  );
}
