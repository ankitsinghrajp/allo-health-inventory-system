"use client";

import { useState, useEffect } from "react";

interface Warehouse {
  id: string;
  name: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch("/api/warehouses");
        if (!response.ok) {
          throw new Error(`Failed to fetch warehouses: ${response.status}`);
        }
        const data = await response.json();
        // Assuming API returns array directly or { warehouses: [...] }
        const warehousesData = Array.isArray(data) ? data : data.warehouses || [];
        setWarehouses(warehousesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching warehouses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const uniqueLocations = new Set(warehouses.map((w) => w.location)).size;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div style={{ minHeight: "100vh", background: "#f7f7fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 44, height: 44, border: "3px solid #e0e0ef", borderTopColor: "#6366f1",
              borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
            }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#9191a8", fontSize: "0.875rem", margin: 0 }}>
              Loading warehouses…
            </p>
          </div>
        </div>
      </>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700&family=DM+Sans:wght@400;500&display=swap');`}</style>
        <div style={{ minHeight: "100vh", background: "#f7f7fc", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{
            background: "#fff", borderRadius: 18, border: "1.5px solid #fecaca",
            boxShadow: "0 4px 24px rgba(220,38,38,0.08)",
            padding: "2rem", maxWidth: 400, width: "100%", textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>⚠️</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#0f0f1a", margin: "0 0 0.5rem", fontSize: "1.1rem" }}>
              Error
            </h2>
            <p style={{ color: "#6b6b84", margin: "0 0 1.25rem", fontSize: "0.875rem" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.625rem 1.5rem", background: "#6366f1", color: "#fff",
                border: "none", borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
                boxShadow: "0 2px 10px rgba(99,102,241,0.3)",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }

        .wh-page {
          min-height: 100vh;
          background: #f7f7fc;
          background-image: radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99,102,241,0.07) 0%, transparent 70%);
          padding: 2.5rem 1.25rem 4rem;
          font-family: 'DM Sans', sans-serif;
        }
        .wh-inner {
          max-width: 1160px;
          margin: 0 auto;
        }

        /* Header */
        .wh-header { margin-bottom: 2rem; }
        .wh-eyebrow {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.1em; color: #6366f1; margin: 0 0 0.35rem;
        }
        .wh-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.6rem, 3vw, 2.25rem);
          font-weight: 700; color: #0f0f1a;
          letter-spacing: -0.03em; margin: 0 0 0.4rem; line-height: 1.1;
        }
        .wh-subtitle {
          font-size: 0.875rem; color: #9191a8; margin: 0;
        }

        /* Stats grid */
        .wh-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 480px) { .wh-stats { grid-template-columns: 1fr; } }

        .stat-card {
          background: #ffffff;
          border: 1.5px solid #eaeaf5;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(15,15,40,0.05), 0 4px 12px rgba(15,15,40,0.04);
          padding: 1.375rem 1.5rem;
          display: flex; align-items: center; gap: 1rem;
        }
        .stat-icon {
          width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .stat-icon-blue {
          background: linear-gradient(135deg, #eef2ff, #e0e7ff);
          border: 1.5px solid #c7d2fe;
        }
        .stat-icon-green {
          background: linear-gradient(135deg, #f0fdf8, #d1fae5);
          border: 1.5px solid #a7f3d0;
        }
        .stat-label {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.08em; color: #9191a8; margin: 0 0 0.2rem;
        }
        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 1.875rem; font-weight: 700; color: #0f0f1a;
          letter-spacing: -0.03em; margin: 0; line-height: 1;
        }

        /* Section label */
        .wh-section-label {
          font-size: 0.75rem; font-weight: 600; color: #9191a8;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1rem;
        }

        /* Grid */
        .wh-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 900px) { .wh-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .wh-grid { grid-template-columns: 1fr; } }

        /* Warehouse card */
        .wh-card {
          background: #ffffff;
          border: 1.5px solid #eaeaf5;
          border-radius: 18px;
          box-shadow: 0 1px 3px rgba(15,15,40,0.05), 0 4px 16px rgba(15,15,40,0.04);
          overflow: hidden;
          display: flex; flex-direction: column;
          transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
        }
        .wh-card:hover {
          box-shadow: 0 4px 6px rgba(15,15,40,0.06), 0 12px 40px rgba(99,102,241,0.1);
          transform: translateY(-2px);
          border-color: #d4d4f5;
        }
        .wh-card-accent {
          height: 3px;
          background: linear-gradient(90deg, #818cf8, #6366f1);
        }
        .wh-card-body { padding: 1.375rem; flex: 1; }

        /* Card header row */
        .wh-card-name-row {
          display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1rem;
        }
        .wh-card-icon-wrap {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #eef2ff, #e0e7ff);
          border: 1.5px solid #c7d2fe;
          display: flex; align-items: center; justify-content: center;
        }
        .wh-card-name {
          font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 700; color: #0f0f1a;
          letter-spacing: -0.02em; margin: 0;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        /* Divider */
        .wh-divider { height: 1px; background: #f0f0f8; margin-bottom: 1rem; }

        /* Meta rows */
        .wh-meta-row {
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 0.625rem;
        }
        .wh-meta-row:last-child { margin-bottom: 0; }
        .wh-meta-icon {
          width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
          background: #f5f5fb; border: 1px solid #ebebf5;
          display: flex; align-items: center; justify-content: center;
        }
        .wh-meta-text {
          font-size: 0.825rem; color: #4b4b63; font-weight: 500;
        }
        .wh-meta-label {
          font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; color: #b0b0c8;
          margin-right: 0.25rem;
        }

        /* Empty state */
        .wh-empty {
          text-align: center; padding: 4rem 2rem;
          background: #fff; border-radius: 18px;
          border: 1.5px dashed #ddddf0;
          font-size: 0.9rem; color: #9191a8;
        }

        @media (max-width: 600px) {
          .wh-page { padding: 1.5rem 1rem 3rem; }
        }
      `}</style>

      <div className="wh-page">
        <div className="wh-inner">

          {/* Header */}
          <div className="wh-header">
            <p className="wh-eyebrow">Inventory Management</p>
            <h1 className="wh-title">Warehouse Management</h1>
            <p className="wh-subtitle">View all inventory fulfillment centers.</p>
          </div>

          {/* Stats */}
          <div className="wh-stats">
            <div className="stat-card">
              <div className={`stat-icon stat-icon-blue`}>
                <svg width="20" height="20" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="stat-label">Total Warehouses</p>
                <p className="stat-value">{warehouses.length}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className={`stat-icon stat-icon-green`}>
                <svg width="20" height="20" fill="none" stroke="#059669" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="stat-label">Active Locations</p>
                <p className="stat-value">{uniqueLocations}</p>
              </div>
            </div>
          </div>

          {/* Section label */}
          {warehouses.length > 0 && (
            <p className="wh-section-label">{warehouses.length} {warehouses.length === 1 ? "center" : "centers"}</p>
          )}

          {/* Cards Grid */}
          {warehouses.length === 0 ? (
            <div className="wh-empty">No warehouses found.</div>
          ) : (
            <div className="wh-grid">
              {warehouses.map((warehouse) => (
                <div key={warehouse.id} className="wh-card">
                  {/* Top accent strip */}
                  <div className="wh-card-accent" />

                  <div className="wh-card-body">
                    {/* Name row */}
                    <div className="wh-card-name-row">
                      <div className="wh-card-icon-wrap">
                        <svg width="16" height="16" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="wh-card-name">{warehouse.name}</h3>
                    </div>

                    <div className="wh-divider" />

                    {/* Location */}
                    <div className="wh-meta-row">
                      <div className="wh-meta-icon">
                        <svg width="11" height="11" fill="none" stroke="#6366f1" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="wh-meta-text">{warehouse.location}</span>
                    </div>

                    {/* Created date */}
                    <div className="wh-meta-row">
                      <div className="wh-meta-icon">
                        <svg width="11" height="11" fill="none" stroke="#9191a8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="wh-meta-text">
                        <span className="wh-meta-label">Since</span>
                        {formatDate(warehouse.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}