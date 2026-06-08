import type { Metadata } from "next";
import { Poppins, Montserrat } from "next/font/google";
import "@/styles/globals.css";
import ThemeProvider from "@/components/ui/ThemeProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Learnify — Learn Smarter, Not Harder",
  description: "Learnify is an interactive learning platform helping students master science and mathematics through engaging tools, smart study aids, and real-time feedback.",
  keywords: ["learning platform", "education", "science", "math", "students", "interactive"],
  authors: [{ name: "Learnify Team" }],
  openGraph: {
    title: "Learnify — Learn Smarter, Not Harder",
    description: "An interactive platform helping students master science and mathematics.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        {/* ── Anti-flash: apply saved theme BEFORE first paint ── */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('learnify-theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-poppins antialiased bg-white dark:bg-slate-950 transition-colors duration-300">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
