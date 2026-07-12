"use client";

import { useState, useEffect, Fragment } from "react";
import {
  FileText,
  CalendarDays,
  TrendingUp,
  Activity,
  AlertCircle,
  Flag,
  ArrowUpRight,
  ArrowDownRight,
  Check
} from "lucide-react";

// Mock Data
const depts = [
  { name: 'Eng', alloc: 82, avail: 18 },
  { name: 'Design', alloc: 68, avail: 32 },
  { name: 'HR', alloc: 55, avail: 45 },
  { name: 'Finance', alloc: 60, avail: 40 },
  { name: 'Ops', alloc: 75, avail: 25 },
  { name: 'Mktg', alloc: 48, avail: 52 },
  { name: 'Ware', alloc: 90, avail: 10 },
];

const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const hours = ['8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM'];
const heatmapData = [
  [2,4,3,2,1,0,0],
  [5,8,8,6,5,1,0],
  [6,9,10,7,6,2,0],
  [5,8,9,7,5,2,1],
  [4,6,7,5,4,1,0],
  [3,5,6,4,3,1,0],
  [3,5,5,4,3,1,0],
  [2,4,4,3,2,1,0],
  [2,3,3,2,2,0,0],
  [1,2,2,1,1,0,0],
];

export default function ReportsPage() {
  const [exported, setExported] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after mount
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Reports &amp; Analytics</h1>
        <button className="generate-btn" onClick={handleExport} style={{ background: exported ? 'var(--green, #22c55e)' : '#6366f1' }}>
          {exported ? (
            <>
              <Check size={16} /> Exported!
            </>
          ) : (
            <>
              <FileText size={16} /> Export Report
            </>
          )}
        </button>
      </div>

      {/* ─── REPORT BANNER ─── */}
      <div className="report-banner fade-in-up">
        <div className="banner-left">
          <h3>Auto-generated Discrepancy Report Ready</h3>
          <p>3 assets flagged for follow-up · Laptop AF-0021 &amp; 2 others show location mismatch</p>
        </div>
        <button className="generate-btn">
          <FileText size={16} /> View Full Report
        </button>
      </div>

      {/* ─── KPI CARDS ─── */}
      <div className="kpi-grid fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Assets</span>
            <div className="kpi-icon"><Activity size={18} /></div>
          </div>
          <div className="kpi-value">2,418</div>
          <div className="kpi-delta up">
            <ArrowUpRight size={14} /> +43 this month
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Utilization Rate</span>
            <div className="kpi-icon"><TrendingUp size={18} /></div>
          </div>
          <div className="kpi-value">74<span style={{ fontSize: '18px' }}>%</span></div>
          <div className="kpi-delta up">
            <ArrowUpRight size={14} /> +6.2% vs last month
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Maintenance Events</span>
            <div className="kpi-icon"><AlertCircle size={18} /></div>
          </div>
          <div className="kpi-value">38</div>
          <div className="kpi-delta down">
            <ArrowDownRight size={14} /> -4 vs last month
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Idle Assets</span>
            <div className="kpi-icon"><CalendarDays size={18} /></div>
          </div>
          <div className="kpi-value">127</div>
          <div className="kpi-delta neutral">
            No change vs last month
          </div>
        </div>
      </div>

      {/* ─── CHART ROW ─── */}
      <div className="chart-row fade-in-up" style={{ animationDelay: '0.2s' }}>
        
        {/* Bar Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Asset Utilization by Department</div>
              <div className="card-sub">Allocated vs Available across teams</div>
            </div>
            <div className="legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: '#6366f1' }}></div>Allocated</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green, #22c55e)' }}></div>Available</div>
            </div>
          </div>
          <div className="chart-wrap">
            <div className="bar-chart">
              {depts.map((d) => (
                <div className="bar-group" key={d.name}>
                  <div className="bar-pair">
                    <div 
                      className="bar" 
                      style={{ 
                        background: '#6366f1', 
                        height: loaded ? `${(d.alloc / 100) * 150}px` : '0px',
                        transition: 'height 0.8s ease'
                      }} 
                      title={`${d.name} — Allocated: ${d.alloc}%`} 
                    />
                    <div 
                      className="bar" 
                      style={{ 
                        background: 'var(--green, #22c55e)', 
                        height: loaded ? `${(d.avail / 100) * 150}px` : '0px',
                        transition: 'height 0.8s ease 0.1s'
                      }} 
                      title={`${d.name} — Available: ${d.avail}%`} 
                    />
                  </div>
                  <div className="bar-label">{d.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Status Breakdown</div>
              <div className="card-sub">All 2,418 assets</div>
            </div>
          </div>
          <div className="prog-list">
            {[
              { name: 'Allocated', count: '1,143', pct: 47, color: '#6366f1' },
              { name: 'Available', count: '654', pct: 27, color: 'var(--green, #22c55e)' },
              { name: 'Idle (>30 days)', count: '364', pct: 15, color: 'var(--amber, #f59e0b)' },
              { name: 'Under Maintenance', count: '145', pct: 6, color: 'var(--blue, #60a5fa)' },
              { name: 'Reserved / Booked', count: '112', pct: 5, color: 'var(--violet, #a78bfa)' }
            ].map(item => (
              <div className="prog-item" key={item.name}>
                <div className="prog-top">
                  <span className="prog-name">{item.name}</span>
                  <div className="prog-meta">
                    <span className="prog-count">{item.count}</span>
                    <span className="prog-pct">{item.pct}%</span>
                  </div>
                </div>
                <div className="prog-track">
                  <div 
                    className="prog-fill" 
                    style={{ 
                      background: item.color, 
                      width: loaded ? `${item.pct}%` : '0%' 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-2)' }}>Total Asset Value</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.5px' }}>₹4.8Cr</span>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW ─── */}
      <div className="bottom-row fade-in-up" style={{ animationDelay: '0.3s' }}>
        
        {/* Data Table */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Most Used Assets</div>
              <div className="card-sub">By allocation &amp; booking frequency this month</div>
            </div>
            <a href="#" style={{ fontSize: '12px', color: 'var(--blue, #60a5fa)', textDecoration: 'none', fontWeight: 500 }}>View all &rarr;</a>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Department</th>
                <th>Uses</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><div className="asset-name">MacBook Pro 16&quot;</div><div className="asset-id">AF-1042</div></td>
                <td>Engineering</td>
                <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>28</td>
                <td><span className="status-badge violet">Allocated</span></td>
              </tr>
              <tr>
                <td><div className="asset-name">Projector BenQ</div><div className="asset-id">AF-0318</div></td>
                <td>Facilities</td>
                <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>22</td>
                <td><span className="status-badge blue">Reserved</span></td>
              </tr>
              <tr>
                <td><div className="asset-name">Dell XPS 15</div><div className="asset-id">AF-0754</div></td>
                <td>Design</td>
                <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>19</td>
                <td><span className="status-badge green">Available</span></td>
              </tr>
              <tr>
                <td><div className="asset-name">Forklift F-2</div><div className="asset-id">AF-2201</div></td>
                <td>Warehouse</td>
                <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>17</td>
                <td><span className="status-badge violet">Allocated</span></td>
              </tr>
              <tr>
                <td><div className="asset-name">HP LaserJet Pro</div><div className="asset-id">AF-0099</div></td>
                <td>HR</td>
                <td style={{ fontWeight: 600, color: 'var(--text-1)' }}>14</td>
                <td><span className="status-badge amber">Maintenance</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Heatmap */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div>
              <div className="card-title">Booking Heatmap</div>
              <div className="card-sub">Demand by day of week &amp; hour (last 4 weeks)</div>
            </div>
            <div className="legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: '#1e1e2a' }}></div>Low</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: '#6366f1' }}></div>High</div>
            </div>
          </div>
          
          <div className="heatmap-grid">
            {/* Corner */}
            <div></div>
            {/* Days row */}
            {days.map(d => <div key={d} className="hm-day-label">{d}</div>)}
            
            {/* Data rows */}
            {hours.map((hr, hi) => (
              <Fragment key={hr}>
                <div className="hm-label">{hr}</div>
                {days.map((d, di) => {
                  const val = heatmapData[hi][di];
                  const alpha = val / 10;
                  const bg = val === 0 ? 'rgba(255,255,255,0.03)' : `rgba(99,102,241,${0.1 + alpha * 0.9})`;
                  
                  return (
                    <div 
                      key={`${hr}-${d}`} 
                      className="hm-cell"
                      style={{ background: bg }}
                      title={`${d} ${hr}: ${val * 12} bookings`}
                    />
                  );
                })}
              </Fragment>
            ))}
          </div>

          <div style={{ marginTop: '16px', fontSize: '11.5px', color: 'var(--text-2)' }}>
            Peak booking window: <strong style={{ color: '#6366f1' }}>Mon–Wed, 9 AM – 12 PM</strong>
          </div>
        </div>

      </div>

      {/* ─── IDLE ASSETS ─── */}
      <div className="card fade-in-up" style={{ animationDelay: '0.4s', marginTop: '24px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Idle Assets — Due for Review / Retirement</div>
            <div className="card-sub">Assets with 0 activity for &gt;30 days · 127 total flagged</div>
          </div>
          <button 
            className="generate-btn" 
            style={{ padding: '7px 14px', fontSize: '12.5px' }} 
            onClick={() => setFlagged(true)}
          >
            {flagged ? (
              <>
                <Check size={14} /> Flagged for Review
              </>
            ) : (
              <>
                <Flag size={14} /> Flag for Review
              </>
            )}
          </button>
        </div>
        <div className="idle-list">
          <div className="idle-item">
            <div className="idle-left">
              <div className="idle-dot" style={{ background: flagged ? 'var(--red, #ef4444)' : 'var(--red, #ef4444)' }}></div>
              <div>
                <div className="idle-asset-name">Office Chair (Set of 12) — AF-0887</div>
                <div className="idle-dept">Facilities · Last used: Jun 2, 2025</div>
              </div>
            </div>
            <span className="idle-days">62 days idle</span>
          </div>
          <div className="idle-item">
            <div className="idle-left">
              <div className="idle-dot" style={{ background: flagged ? 'var(--red, #ef4444)' : 'var(--red, #ef4444)' }}></div>
              <div>
                <div className="idle-asset-name">Canon DSLR Camera — AF-1120</div>
                <div className="idle-dept">Marketing · Last used: Jun 8, 2025</div>
              </div>
            </div>
            <span className="idle-days">56 days idle</span>
          </div>
          <div className="idle-item">
            <div className="idle-left">
              <div className="idle-dot" style={{ background: flagged ? 'var(--red, #ef4444)' : 'var(--amber, #f59e0b)' }}></div>
              <div>
                <div className="idle-asset-name">Lenovo ThinkPad — AF-0443</div>
                <div className="idle-dept">Finance · Last used: Jun 15, 2025</div>
              </div>
            </div>
            <span className="idle-days">49 days idle</span>
          </div>
          <div className="idle-item">
            <div className="idle-left">
              <div className="idle-dot" style={{ background: flagged ? 'var(--red, #ef4444)' : 'var(--amber, #f59e0b)' }}></div>
              <div>
                <div className="idle-asset-name">Projector Screen — AF-0231</div>
                <div className="idle-dept">Training · Last used: Jun 20, 2025</div>
              </div>
            </div>
            <span className="idle-days">44 days idle</span>
          </div>
        </div>
      </div>

    </div>
  );
}
