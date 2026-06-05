"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Products", href: "/products" },
  { label: "Warehouses", href: "/warehouses" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap');

        .nav-root {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(247, 247, 252, 0.82);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border-bottom: 1px solid rgba(234, 234, 245, 0.9);
        }

        .nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }

        /* Logo */
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .nav-logo-mark {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          flex-shrink: 0;
        }
        .nav-logo-wordmark {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Nav links */
        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.125rem;
          flex: 1;
          justify-content: center;
        }
        @media (max-width: 640px) { .nav-links { display: none; } }

        .nav-link {
          position: relative;
          padding: 0.4rem 0.875rem;
          border-radius: 8px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.845rem;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .nav-link-active {
          color: #6366f1;
          background: rgba(99, 102, 241, 0.08);
          font-weight: 600;
        }
        .nav-link-active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          border-radius: 999px;
          background: #6366f1;
        }
        .nav-link-inactive {
          color: #6b6b84;
        }
        .nav-link-inactive:hover {
          color: #0f0f1a;
          background: rgba(15, 15, 26, 0.05);
        }

        /* Right spacer to keep nav centered */
        .nav-right {
          flex-shrink: 0;
          width: 80px;
        }
      `}</style>

      <header className="nav-root">
        <div className="nav-inner">

          {/* Logo */}
          <Link href="/" className="nav-logo">
            <div className="nav-logo-mark">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="30" height="30" rx="8" fill="#0f0f1a"/>
                {/* R lettermark */}
                <text
                  x="15"
                  y="21"
                  textAnchor="middle"
                  fontFamily="'Syne', sans-serif"
                  fontWeight="800"
                  fontSize="17"
                  fill="white"
                  letterSpacing="-0.5"
                >R</text>
                {/* Indigo dot accent */}
                <circle cx="22" cy="10" r="3" fill="#6366f1"/>
              </svg>
            </div>
            <span className="nav-logo-wordmark">Reservex</span>
          </Link>

          {/* Nav Links */}
          <nav className="nav-links">
            {links.map(({ label, href }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-link ${isActive ? "nav-link-active" : "nav-link-inactive"}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Balancing spacer */}
          <div className="nav-right" />

        </div>
      </header>
    </>
  );
}