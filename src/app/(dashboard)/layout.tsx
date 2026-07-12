"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Building2, 
  Box, 
  ArrowRightLeft, 
  CalendarDays, 
  Wrench, 
  ClipboardCheck, 
  BarChart3, 
  Bell,
  Search,
  Settings,
  ChevronDown
} from "lucide-react";
import "./dashboard.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname?.startsWith(path) ? "active" : "";

  return (
    <div className="dashboard-layout">
      {/* ─── SIDEBAR ─── */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <Link href="/dashboard" className="sidebar-brand">
            <div className="sidebar-logo">AF</div>
            <span className="sidebar-name">AssetFlow</span>
          </Link>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-title">Overview</div>
          <Link href="/dashboard" className={`nav-item ${pathname === '/dashboard' ? 'active' : ''}`}>
            <LayoutDashboard />
            <span>Dashboard</span>
          </Link>
          <Link href="/reports" className={`nav-item ${isActive('/reports')}`}>
            <BarChart3 />
            <span>Reports & Analytics</span>
          </Link>

          <div className="nav-group-title">Core Modules</div>
          <Link href="/assets" className={`nav-item ${isActive('/assets')}`}>
            <Box />
            <span>Assets Registry</span>
          </Link>
          <Link href="/allocations" className={`nav-item ${isActive('/allocations')}`}>
            <ArrowRightLeft />
            <span>Allocations & Transfer</span>
          </Link>
          <Link href="/bookings" className={`nav-item ${isActive('/bookings')}`}>
            <CalendarDays />
            <span>Resource Booking</span>
          </Link>
          <Link href="/maintenance" className={`nav-item ${isActive('/maintenance')}`}>
            <Wrench />
            <span>Maintenance</span>
          </Link>
          <Link href="/audits" className={`nav-item ${isActive('/audits')}`}>
            <ClipboardCheck />
            <span>Audits & Compliance</span>
          </Link>

          <div className="nav-group-title">Organization</div>
          <Link href="/organization" className={`nav-item ${isActive('/organization')}`}>
            <Building2 />
            <span>Organization Setup</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">AM</div>
            <div className="user-info">
              <span className="user-name">Alex Morgan</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="dashboard-main">
        {/* ─── HEADER ─── */}
        <header className="dashboard-header">
          <div className="header-search">
            <Search />
            <input type="text" placeholder="Search assets, employees, or tags..." />
          </div>

          <div className="header-actions">
            <Link href="/notifications" className="action-btn">
              <Bell size={20} />
              <span className="badge">3</span>
            </Link>
            <button className="action-btn">
              <Settings size={20} />
            </button>
            <div className="user-profile" style={{ padding: 0 }}>
              <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '12px' }}>AM</div>
              <ChevronDown size={16} className="text-muted" style={{ marginLeft: '4px', color: 'var(--text-muted)' }} />
            </div>
          </div>
        </header>

        {/* ─── PAGE CONTENT ─── */}
        <div className="dashboard-content">
          {children}
        </div>
      </main>
    </div>
  );
}
