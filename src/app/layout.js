import { Inter } from "next/font/google";
import AntdProvider from "@/components/AntdProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Slidz — Stakeholder Briefings",
  description:
    "Turn unstructured notes into scannable, stakeholder-ready briefing cards.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <AntdProvider>{children}</AntdProvider>
      </body>
    </html>
  );
}
