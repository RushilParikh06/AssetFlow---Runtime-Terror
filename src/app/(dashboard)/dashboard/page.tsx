"use client";

import { useState } from "react";
import { 
  Box, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRightLeft, 
  AlertTriangle,
  X,
  Plus,
  CalendarPlus,
  Ticket
} from "lucide-react";
import "../dashboard.css";

export default function DashboardPage() {
  const [showAlert, setShowAlert] = useState(true);

  // Mock data for Activity Feed
  const recentActivity = [
    {
      id: 1,
      title: <><strong>MacBook Pro M2</strong> was allocated to <strong>Sarah Jenks</strong></>,
      time: "2 hours ago",
      icon: <ArrowRightLeft size={16} />
    },
    {
      id: 2,
      title: <><strong>Projector A</strong> status changed to <strong>Maintenance</strong></>,
      time: "4 hours ago",
      icon: <AlertTriangle size={16} />
    },
    {
      id: 3,
      title: <><strong>Conference Room 1</strong> booked by <strong>David Lee</strong></>,
      time: "Yesterday, 14:30",
      icon: <Calendar size={16} />
    },
    {
      id: 4,
      title: <><strong>Dell XPS 15</strong> returned by <strong>Marketing Dept</strong></>,
      time: "Yesterday, 09:15",
      icon: <CheckCircle2 size={16} />
    }
  ];

  return (
    <div>
      <h1 className="section-title" style={{ fontSize: '24px', marginBottom: '24px' }}>Welcome back, Alex</h1>

      {/* ─── ALERT BANNER ─── */}
      {showAlert && (
        <div className="alert-banner fade-in-up">
          <div className="alert-banner-content">
            <AlertTriangle size={18} />
            <span>3 assets overdue for return — flagged for follow-up</span>
          </div>
          <button className="alert-banner-close" onClick={() => setShowAlert(false)}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* ─── QUICK ACTIONS ─── */}
      <div className="quick-actions-row fade-in-up" style={{ animationDelay: '0.1s' }}>
        <button className="qa-btn">
          <Plus />
          Register Asset
        </button>
        <button className="qa-btn">
          <CalendarPlus />
          Book Resource
        </button>
        <button className="qa-btn">
          <Ticket />
          Raise Request
        </button>
      </div>

      {/* ─── TODAY'S OVERVIEW (KPIs) ─── */}
      <h2 className="section-title fade-in-up" style={{ animationDelay: '0.15s' }}>Today&apos;s Overview</h2>
      <div className="kpi-grid fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Assets</span>
            <div className="kpi-icon" style={{ background: 'rgba(96,165,250,0.1)', color: 'var(--accent-blue)' }}>
              <Box size={18} />
            </div>
          </div>
          <div className="kpi-value">2,451</div>
          <div className="kpi-trend">
            <span className="positive">+12</span> since last month
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Allocated</span>
            <div className="kpi-icon" style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--accent-violet)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value">1,832</div>
          <div className="kpi-trend">
            <span className="positive">74.7%</span> utilization rate
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Available</span>
            <div className="kpi-icon" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--accent-green)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="kpi-value">594</div>
          <div className="kpi-trend">
            <span className="negative">-3</span> since yesterday
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Active Bookings</span>
            <div className="kpi-icon" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="kpi-value">48</div>
          <div className="kpi-trend">
            <span>For today</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Transfers</span>
            <div className="kpi-icon" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}>
              <ArrowRightLeft size={18} />
            </div>
          </div>
          <div className="kpi-value">12</div>
          <div className="kpi-trend">
            <span>Awaiting approval</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Upcoming Returns</span>
            <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#fcd34d' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="kpi-value">7</div>
          <div className="kpi-trend">
            <span>Due in next 24h</span>
          </div>
        </div>
      </div>

      {/* ─── RECENT ACTIVITY FEED ─── */}
      <h2 className="section-title fade-in-up" style={{ animationDelay: '0.25s' }}>Recent Activity</h2>
      <div className="activity-card fade-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div className="activity-item" key={activity.id}>
              <div className="activity-icon">
                {activity.icon}
              </div>
              <div className="activity-content">
                <div className="activity-title">{activity.title}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
