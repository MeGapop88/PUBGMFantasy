import type { Metadata } from "next";
import { Archivo_Narrow, Geist } from "next/font/google";

import "./globals.css";

const archivoNarrow = Archivo_Narrow({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-archivo-narrow",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-geist",
  display: "swap",
});

/**
 * Every Material Symbol the app actually renders. Requesting the whole family
 * costs ~340kb of font; naming the glyphs cuts it to a few kb. Add to this list
 * when you add an icon — an unlisted name renders as its literal text.
 */
const ICONS = [
  "add", "apps", "arrow_back", "arrow_downward", "arrow_drop_down",
  "arrow_forward", "arrow_upward", "badge", "block", "bolt", "check_circle",
  "chevron_left", "chevron_right", "close", "compare_arrows", "dashboard", "edit_note", "emoji_events", "error",
  "expand_less", "expand_more", "filter_alt", "folder_off", "format_list_numbered", "grid_view", "groups", "how_to_vote",
  "info", "leaderboard", "lock", "lock_clock", "login", "logout", "menu",
  "military_tech", "person_add", "radio_button_checked", "save", "schedule",
  "search", "shield", "sports_esports", "table_rows", "target", "troubleshoot",
  "view_list", "vpn_key", "warning",
].join(",");

export const metadata: Metadata = {
  title: "PMGO — Tactical Protocol",
  description:
    "PUBG Mobile Global Open — Tactical Fantasy & Match Predictions Platform.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivoNarrow.variable} ${geist.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=${ICONS}&display=block`}
        />
      </head>
      <body className="min-h-screen antialiased selection:bg-primary selection:text-black">
        {children}
      </body>
    </html>
  );
}
