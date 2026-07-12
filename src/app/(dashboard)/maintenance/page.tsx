"use client";

import { useState, useEffect } from "react";
import { 
  Wrench, 
  AlertTriangle, 
  CheckCircle, 
  User, 
  Clock, 
  DollarSign, 
  Loader2, 
  Plus,
  ArrowRight,
  ClipboardList
} from "lucide-react";

interface MaintenanceRequest {
  id: string;
  issueDescription: string;
  priority: string;
  status: string;
  createdAt: string;
  estimatedCost: number | null;
  actualCost: number | null;
  asset: { id: string; assetTag: string; assetName: string };
  requestedBy: { id: string; name: string };
  technician?: { id: string; name: string } | null;
}

interface Asset {
  id: string;
  assetTag: string;
  assetName: string;
}

interface Employee {
  id: string;
  name: string;
  employeeId: string;
}

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Raise Request Modal state
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [raiseError, setRaiseError] = useState("");
  const [submittingRaise, setSubmittingRaise] = useState(false);

  // Transition Dialog / Overlay state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState("");
  const [targetAction, setTargetAction] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [notes, setNotes] = useState("");
  const [statusError, setStatusError] = useState("");
  const [submittingStatus, setSubmittingStatus] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [reqRes, assetsRes, empRes] = await Promise.all([
        fetch("/api/maintenance"),
        fetch("/api/assets"),
        fetch("/api/employees")
      ]);

      const reqData = await reqRes.json();
      const assetsData = await assetsRes.json();
      const empData = await empRes.json();

      if (reqData.success) {
        setRequests(reqData.data);
      } else {
        setError(reqData.error || "Failed to load maintenance requests.");
      }

      if (assetsData.success) {
        setAssets(assetsData.data);
      }

      if (empData.success) {
        setEmployees(empData.data);
      }
    } catch (err) {
      setError("An error occurred while loading maintenance dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleRaiseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !issueDescription || !priority) {
      setRaiseError("Please select an asset and write an issue description.");
      return;
    }

    try {
      setSubmittingRaise(true);
      setRaiseError("");

      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedAsset,
          issueDescription,
          priority,
          estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowRaiseModal(false);
        setSelectedAsset("");
        setIssueDescription("");
        setPriority("MEDIUM");
        setEstimatedCost("");
        fetchData();
      } else {
        setRaiseError(data.error || "Failed to raise maintenance request.");
      }
    } catch (err) {
      setRaiseError("Server error raising request.");
    } finally {
      setSubmittingRaise(false);
    }
  };

  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAction === "ASSIGN_TECHNICIAN" && !selectedTechnician) {
      setStatusError("Please select a technician.");
      return;
    }
    if (targetAction === "RESOLVE" && !actualCost) {
      setStatusError("Please specify the actual repair cost.");
      return;
    }

    try {
      setSubmittingStatus(true);
      setStatusError("");

      let res
      if (targetAction === "RESOLVE") {
        res = await fetch(`/api/maintenance/${activeRequestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actualCost: parseFloat(actualCost),
            notes
          })
        });
      } else {
        res = await fetch(`/api/maintenance/${activeRequestId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: targetAction,
            technicianId: targetAction === "ASSIGN_TECHNICIAN" ? selectedTechnician : undefined,
            notes
          })
        });
      }

      const data = await res.json();
      if (data.success) {
        setShowStatusModal(false);
        setActiveRequestId("");
        setTargetAction("");
        setSelectedTechnician("");
        setActualCost("");
        setNotes("");
        fetchData();
      } else {
        setStatusError(data.error || "Failed to transition status.");
      }
    } catch (err) {
      setStatusError("Server error during state transition.");
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Group requests by column status
  const columns = [
    { label: "Pending", status: "PENDING" },
    { label: "Approved", status: "APPROVED" },
    { label: "Tech Assigned", status: "TECHNICIAN_ASSIGNED" },
    { label: "In Progress", status: "IN_PROGRESS" },
    { label: "Resolved", status: "RESOLVED" }
  ];

  const getPriorityClass = (pri: string) => {
    switch (pri.toUpperCase()) {
      case "CRITICAL": return "red";
      case "HIGH": return "amber";
      case "MEDIUM": return "blue";
      default: return "green";
    }
  };

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Maintenance Board</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Track equipment repairs, safety compliance, and technician dispatches.</p>
        </div>
        <button className="qa-btn" onClick={() => setShowRaiseModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none' }}>
          <Plus size={16} /> Raise Request
        </button>
      </div>

      {error && (
        <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Loading maintenance Kanban...</span>
        </div>
      ) : (
        /* ─── KANBAN BOARD GRID ─── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {columns.map(col => {
            const colRequests = requests.filter(r => r.status === col.status);
            return (
              <div key={col.status} style={{ background: 'rgba(10, 10, 15, 0.5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '16px', minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-1)' }}>{col.label}</h3>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--border)', color: 'var(--text-2)' }}>
                    {colRequests.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
                  {colRequests.map(req => (
                    <div key={req.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)' }}>{req.asset.assetTag}</span>
                        <span className={`status-badge ${getPriorityClass(req.priority)}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                          {req.priority}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-1)', lineHeight: 1.4 }}>{req.asset.assetName}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-2)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {req.issueDescription}
                      </p>

                      {req.technician && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)' }}>
                          <User size={11} />
                          <span>Tech: {req.technician.name}</span>
                        </div>
                      )}

                      {/* Action overlays per status */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                        {req.status === "PENDING" && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => { setActiveRequestId(req.id); setTargetAction("REJECT"); setShowStatusModal(true); }}
                              style={{ background: 'none', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Reject
                            </button>
                            <button 
                              onClick={() => { setActiveRequestId(req.id); setTargetAction("APPROVE"); handleStatusTransition({ preventDefault: () => {} } as any); }}
                              style={{ background: 'var(--green)', border: 'none', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Approve
                            </button>
                          </div>
                        )}
                        {req.status === "APPROVED" && (
                          <button 
                            onClick={() => { setActiveRequestId(req.id); setTargetAction("ASSIGN_TECHNICIAN"); setShowStatusModal(true); }}
                            style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Assign Tech
                          </button>
                        )}
                        {req.status === "TECHNICIAN_ASSIGNED" && (
                          <button 
                            onClick={() => { setActiveRequestId(req.id); setTargetAction("START"); handleStatusTransition({ preventDefault: () => {} } as any); }}
                            style={{ background: 'var(--accent)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Start Work
                          </button>
                        )}
                        {req.status === "IN_PROGRESS" && (
                          <button 
                            onClick={() => { setActiveRequestId(req.id); setTargetAction("RESOLVE"); setShowStatusModal(true); }}
                            style={{ background: 'var(--green)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Resolve Request
                          </button>
                        )}
                        {req.status === "RESOLVED" && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--green)' }}>
                            <CheckCircle size={12} /> Resolved
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {colRequests.length === 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 8px', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-3)', fontSize: '11.5px', height: '100px' }}>
                      <ClipboardList size={18} style={{ marginBottom: '6px' }} />
                      No requests here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: RAISE MAINTENANCE REQUEST ─── */}
      {showRaiseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Raise Maintenance Ticket</h2>
              <button onClick={() => setShowRaiseModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleRaiseRequest} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {raiseError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <AlertTriangle size={16} />
                  <span>{raiseError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Select Affected Asset *</label>
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="form-input"
                  required
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="">Choose Asset</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetName} ({a.assetTag})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Issue Description *</label>
                <textarea 
                  placeholder="Describe the failure, hardware damage, or system error in detail..."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  className="form-input"
                  required
                  style={{ minHeight: '100px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Priority *</label>
                  <select 
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="form-input"
                    style={{ background: '#0a0a0f', color: '#fff' }}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Estimated Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g. 150.00" 
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowRaiseModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingRaise} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingRaise ? "Raising ticket..." : "Raise Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: KANBAN TRANSITION OVERLAY ─── */}
      {showStatusModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>
                {targetAction === "ASSIGN_TECHNICIAN" ? "Assign Maintenance Tech" : targetAction === "RESOLVE" ? "Resolve Maintenance Request" : "Confirm Action"}
              </h2>
              <button onClick={() => setShowStatusModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleStatusTransition} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {statusError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <AlertTriangle size={16} />
                  <span>{statusError}</span>
                </div>
              )}

              {/* Transition field options */}
              {targetAction === "ASSIGN_TECHNICIAN" && (
                <div className="form-group">
                  <label>Choose Technician *</label>
                  <select 
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    className="form-input"
                    required
                    style={{ background: '#0a0a0f', color: '#fff' }}
                  >
                    <option value="">Choose Technician</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetAction === "RESOLVE" && (
                <div className="form-group">
                  <label>Actual Repair Cost ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="e.g. 175.50" 
                    value={actualCost}
                    onChange={(e) => setActualCost(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Operational Notes</label>
                <textarea 
                  placeholder={targetAction === "REJECT" ? "Specify rejection reason..." : "Notes on parts replaced, diagnostics, or tech notes..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowStatusModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingStatus} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingStatus ? "Processing..." : "Confirm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
