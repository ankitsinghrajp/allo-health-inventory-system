import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Inventory Reservation System",
  description:
    "Arogya is a digital health platform that lets you consult certified doctors anytime through secure video calls with a smart freemium model.",
};

export default function RootLayout({ children }) {
  return (
  
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#292a2d]`}>
      
          
          <main className="min-h-screen">
            <Navbar/>
            {children}
            </main>
  
      </body>
    </html>
  );
}