import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "Inventory Reservation System",
  description:
    "",
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