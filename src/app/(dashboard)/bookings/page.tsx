"use client";

import { useState, useEffect } from "react";
import { 
  CalendarDays, 
  Clock, 
  MapPin, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Loader2, 
  Plus, 
  Trash2,
  CalendarRange
} from "lucide-react";

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: string;
  resource: { id: string; assetTag: string; assetName: string; location: string };
  bookedBy: { id: string; name: string };
}

interface Resource {
  id: string;
  assetTag: string;
  assetName: string;
  location: string;
  category: { name: string };
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [selectedResource, setSelectedResource] = useState("all");

  // Booking Modal state
  const [showBookModal, setShowBookModal] = useState(false);
  const [targetResource, setTargetResource] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [purpose, setPurpose] = useState("");
  const [bookError, setBookError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [bookingsRes, assetsRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/assets")
      ]);

      const bookingsData = await bookingsRes.json();
      const assetsData = await assetsRes.json();

      if (bookingsData.success) {
        setBookings(bookingsData.data);
      } else {
        setError(bookingsData.error || "Failed to load bookings.");
      }

      if (assetsData.success) {
        // Filter assets that are marked as shared bookable resources
        setResources(assetsData.data.filter((a: any) => a.sharedBookableFlag));
      }
    } catch (err) {
      setError("An error occurred while loading booking logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetResource || !startDate || !startTime || !endTime) {
      setBookError("Please select a resource and time range.");
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${startDate}T${endTime}:00`);

    if (startDateTime.getTime() >= endDateTime.getTime()) {
      setBookError("Start time must be before end time.");
      return;
    }

    try {
      setSubmitting(true);
      setBookError("");

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: targetResource,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          purpose
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowBookModal(false);
        setTargetResource("");
        setPurpose("");
        fetchData();
      } else {
        setBookError(data.error || "Overlap conflict detected. Resource is booked.");
      }
    } catch (err) {
      setBookError("Server error during booking request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this resource booking?")) return;

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to cancel booking.");
      }
    } catch (err) {
      alert("Error cancelling booking.");
    }
  };

  const filteredBookings = bookings.filter(b => {
    return selectedResource === "all" || b.resource.id === selectedResource;
  });

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Resource Booking</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Book shared equipment, conference rooms, vehicles, and assets.</p>
        </div>
        <button className="qa-btn" onClick={() => setShowBookModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none' }}>
          <Plus size={16} /> Book Resource
        </button>
      </div>

      {error && (
        <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── FILTERS & GRID LAYOUT ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT PANEL: Resources List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
              Shared Resources
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                onClick={() => setSelectedResource("all")}
                style={{
                  background: selectedResource === "all" ? 'rgba(255,255,255,0.06)' : 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-btn)',
                  padding: '8px 12px',
                  color: selectedResource === "all" ? 'var(--text-1)' : 'var(--text-2)',
                  fontSize: '13px',
                  fontWeight: 500,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                All Resources
              </button>
              {resources.map(res => (
                <button 
                  key={res.id}
                  onClick={() => setSelectedResource(res.id)}
                  style={{
                    background: selectedResource === res.id ? 'rgba(255,255,255,0.06)' : 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-btn)',
                    padding: '8px 12px',
                    color: selectedResource === res.id ? 'var(--text-1)' : 'var(--text-2)',
                    fontSize: '13px',
                    fontWeight: 500,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{res.assetName}</span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>{res.location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Booking logs / Schedule grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Loading schedule grid...</span>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px' }}>
              <CalendarRange size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>No Reservations Found</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
                There are no active booking reservations scheduled for this resource selection.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredBookings.map(b => {
                const start = new Date(b.startTime);
                const end = new Date(b.endTime);
                return (
                  <div key={b.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase' }}>
                          {start.toLocaleString('default', { month: 'short' })}
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-1)' }}>{start.getDate()}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>
                          {b.resource.assetName} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)' }}>({b.resource.assetTag})</span>
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: 'var(--text-2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} style={{ color: 'var(--text-3)' }} />
                            <span>{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={13} style={{ color: 'var(--text-3)' }} />
                            <span>{b.resource.location}</span>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                          Reserved by <strong style={{ color: 'var(--text-2)' }}>{b.bookedBy.name}</strong> for: <em>{b.purpose || "Meeting"}</em>
                        </div>
                      </div>
                    </div>

                    <div>
                      {b.status === "UPCOMING" || b.status === "ONGOING" ? (
                        <button 
                          onClick={() => handleCancelBooking(b.id)}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 'var(--radius-btn)',
                            color: 'var(--red)',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Trash2 size={13} /> Cancel
                        </button>
                      ) : (
                        <span className="status-badge red">{b.status}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: CREATE BOOKING ─── */}
      {showBookModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Reserve Shared Resource</h2>
              <button onClick={() => setShowBookModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateBooking} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bookError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <AlertTriangle size={16} />
                  <span>{bookError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Select Resource *</label>
                <select 
                  value={targetResource}
                  onChange={(e) => setTargetResource(e.target.value)}
                  className="form-input"
                  required
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="">Choose Resource</option>
                  {resources.map(res => (
                    <option key={res.id} value={res.id}>{res.assetName} ({res.location})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Purpose of Reservation</label>
                <input 
                  type="text" 
                  placeholder="e.g. Planning session / Client demo" 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowBookModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
