"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  History, 
  Check, 
  AlertCircle, 
  Loader2, 
  Trash2,
  Calendar,
  Globe,
  User,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface ActivityLog {
  id: string;
  action: string;
  createdAt: string;
  ipAddress: string | null;
  user?: { email: string; role: string } | null;
  newValue: any;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [errorNotifs, setErrorNotifs] = useState("");
  const [errorLogs, setErrorLogs] = useState("");
  const [activeTab, setActiveTab] = useState<"alerts" | "audit">("alerts");

  useEffect(() => {
    fetchNotifications();
    fetchLogs();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      setErrorNotifs("");
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      } else {
        setErrorNotifs(data.error || "Failed to load notifications.");
      }
    } catch (err) {
      setErrorNotifs("Failed to load notifications from server.");
    } finally {
      setLoadingNotifs(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      setErrorLogs("");
      const res = await fetch("/api/activity-logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      } else {
        setErrorLogs(data.error || "Access Denied: Only Admins can view audit logs.");
      }
    } catch (err) {
      setErrorLogs("Failed to retrieve audit trail.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const markRead = async (notificationId: string | null) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId })
      });
      const data = await res.json();
      if (data.success) {
        fetchNotifications();
      }
    } catch (err) {
      alert("Failed to mark notifications read.");
    }
  };

  const hasUnread = notifications.some(n => !n.read);

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Notifications &amp; Activity</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Monitor system events, alerts, and detailed compliance audit trails.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="qa-btn" onClick={activeTab === "alerts" ? fetchNotifications : fetchLogs} style={{ background: 'none', border: '1px solid var(--border)' }}>
            <RefreshCw size={16} />
          </button>
          
          {activeTab === "alerts" && hasUnread && (
            <button 
              className="qa-btn" 
              onClick={() => markRead(null)}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-1)', border: '1px solid var(--border)', fontSize: '12.5px', fontWeight: 600 }}
            >
              <Check size={14} style={{ color: 'var(--green)' }} /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab("alerts")} 
          className={`tab-nav-btn ${activeTab === "alerts" ? "active" : ""}`}
        >
          Notifications Center ({notifications.length})
        </button>
        <button 
          onClick={() => setActiveTab("audit")} 
          className={`tab-nav-btn ${activeTab === "audit" ? "active" : ""}`}
        >
          Compliance Audit Log ({logs.length})
        </button>
      </div>

      {activeTab === "alerts" ? (
        /* ─── TAB: NOTIFICATIONS CENTER ─── */
        loadingNotifs ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Unpacking notifications...</span>
          </div>
        ) : errorNotifs ? (
          <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
            <AlertCircle size={18} />
            <span>{errorNotifs}</span>
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px' }}>
            <Bell size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>Inbox Clean</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
              You don&apos;t have any notification alerts yet. Outstanding returns and approvals will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {notifications.map(n => (
              <div 
                key={n.id} 
                style={{ 
                  background: n.read ? 'var(--bg-surface)' : 'rgba(99,102,241,0.04)', 
                  border: '1px solid var(--border)', 
                  borderLeft: n.read ? '1px solid var(--border)' : '4px solid var(--accent)', 
                  borderRadius: 'var(--radius-card)', 
                  padding: '16px 20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 600, color: n.read ? 'var(--text-1)' : '#fff' }}>{n.title}</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>{n.message}</p>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>

                {!n.read && (
                  <button 
                    onClick={() => markRead(n.id)}
                    style={{
                      background: 'none',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-btn)',
                      color: 'var(--text-2)',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* ─── TAB: COMPLIANCE AUDIT LOG ─── */
        loadingLogs ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', gap: '12px' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
            <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Unpacking compliance audit trail...</span>
          </div>
        ) : errorLogs ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px' }}>
            <ShieldCheck size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>Access Restricted</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
              {errorLogs}
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px', color: 'var(--text-3)' }}>
            <History size={48} style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>No Logs Recorded</h3>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action Event</th>
                  <th>Responsible User</th>
                  <th>IP Address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} style={{ color: 'var(--text-3)' }} />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{log.action}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={13} style={{ color: 'var(--blue)' }} />
                        <span>{log.user?.email || "System"}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Globe size={13} style={{ color: 'var(--text-3)' }} />
                        <span>{log.ipAddress || "127.0.0.1"}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-2)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {JSON.stringify(log.newValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
