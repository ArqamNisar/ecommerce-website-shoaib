import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chatbot/ChatWidget";

export const metadata: Metadata = {
  title: "TechHaven — Premium Electronics & Gadgets Store",
  description:
    "Shop the latest electronics, smart watches, earbuds, TV boxes, soundbars, and more at TechHaven. Premium quality, unbeatable prices, and fast shipping.",
  keywords:
    "electronics, gadgets, earbuds, smart watches, TV boxes, soundbars, mobile accessories, online shopping",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="page-content">{children}</main>
        <Footer />
        <ChatWidget />
      </body>
    </html>
  );
}
