import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { getDictionary, getLocale } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";
import { createTranslate } from "@/lib/i18n/types";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * generateMetadata rather than a static export because the title and description
 * are user-facing copy, so they cannot be a constant. It is async, which a plain
 * `export const metadata` is not, and that is what lets it read the locale.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = createTranslate(await getDictionary());

  return {
    title: t("login.title"),
    description: t("login.subtitle"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const dictionary = await getDictionary();

  return (
    // lang is read from the request, not hardcoded. It drives the browser's own
    // hyphenation and spellcheck and, more visibly, what a screen reader
    // pronounces, so a Spanish page announced with an English voice is a real bug.
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={locale} dictionary={dictionary}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}