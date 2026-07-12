"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader2, 
  Plus, 
  ShieldAlert,
  ArrowRight,
  Lock
} from "lucide-react";

interface AuditCycle {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  _count?: { auditItems: number };
}

interface AuditItem {
  id: string;
  status: string;
  notes: string | null;
  asset: { id: string; assetTag: string; assetName: string; location: string };
  verifiedBy?: { name: string } | null;
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

export default function AuditsPage() {
  const [cycles, setCycles] = useState<AuditCycle[]>([]);
  const [activeCycle, setActiveCycle] = useState<AuditCycle | null>(null);
  const [activeItems, setActiveItems] = useState<AuditItem[]>([]);
  
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState("");

  // Create Cycle Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cycleName, setCycleName] = useState("");
  const [cycleDesc, setCycleDesc] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [createError, setCreateError] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Verification dialog state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [targetAssetId, setTargetAssetId] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("VERIFIED");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [submittingVerify, setSubmittingVerify] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [cyclesRes, assetsRes, empRes] = await Promise.all([
        fetch("/api/audits"),
        fetch("/api/assets"),
        fetch("/api/employees")
      ]);

      const cyclesData = await cyclesRes.json();
      const assetsData = await assetsRes.json();
      const empData = await empRes.json();

      if (cyclesData.success) {
        setCycles(cyclesData.data);
      } else {
        setError(cyclesData.error || "Failed to load audit cycles.");
      }

      if (assetsData.success) {
        setAssets(assetsData.data);
      }

      if (empData.success) {
        setEmployees(empData.data);
      }
    } catch (err) {
      setError("An error occurred while loading audits directory.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCycleDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const res = await fetch(`/api/audits/${id}`);
      const data = await res.json();
      if (data.success) {
        setActiveCycle(data.data);
        setActiveItems(data.data.auditItems || []);
      } else {
        alert(data.error || "Failed to fetch audit details.");
      }
    } catch (err) {
      alert("Error loading audit items.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName || selectedAssets.length === 0) {
      setCreateError("Please name the cycle and select target assets.");
      return;
    }

    try {
      setSubmittingCreate(true);
      setCreateError("");

      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cycleName,
          description: cycleDesc || null,
          startDate,
          endDate,
          assetIds: selectedAssets
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setCycleName("");
        setCycleDesc("");
        setSelectedAssets([]);
        fetchData();
      } else {
        setCreateError(data.error || "Failed to start audit cycle.");
      }
    } catch (err) {
      setCreateError("Server error starting audit.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleVerifyAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAssetId || !verificationStatus) {
      setVerifyError("Please choose a verification status.");
      return;
    }

    try {
      setSubmittingVerify(true);
      setVerifyError("");

      const res = await fetch(`/api/audits/${activeCycle!.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: targetAssetId,
          status: verificationStatus,
          notes: verificationNotes || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowVerifyModal(false);
        setTargetAssetId("");
        setVerificationNotes("");
        fetchCycleDetails(activeCycle!.id);
      } else {
        setVerifyError(data.error || "Failed to register verification.");
      }
    } catch (err) {
      setVerifyError("Server error during verification.");
    } finally {
      setSubmittingVerify(false);
    }
  };

  const handleCloseAudit = async () => {
    if (!activeCycle) return;
    if (!confirm("Are you sure you want to close this audit cycle? This action is immutable and will lock the discrepancies and update missing statuses to LOST.")) return;

    try {
      const res = await fetch(`/api/audits/${activeCycle.id}/close`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        fetchCycleDetails(activeCycle.id);
        fetchData();
      } else {
        alert(data.error || "Failed to close audit cycle.");
      }
    } catch (err) {
      alert("Error closing audit.");
    }
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssets(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "VERIFIED": return "green";
      case "DAMAGED": return "amber";
      case "MISSING": return "red";
      default: return "blue";
    }
  };

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Compliance &amp; Audits</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Schedule periodic physical inventory counts and generate discrepancy audits.</p>
        </div>
        <button className="qa-btn" onClick={() => setShowCreateModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none' }}>
          <Plus size={16} /> Create Audit Cycle
        </button>
      </div>

      {error && (
        <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Audit Cycles List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
              Audit History
            </h3>
            
            {loading ? (
              <Loader2 className="animate-spin" size={24} style={{ color: 'var(--accent)', margin: '20px auto' }} />
            ) : cycles.length === 0 ? (
              <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>No audit cycles launched.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cycles.map(c => (
                  <button
                    key={c.id}
                    onClick={() => fetchCycleDetails(c.id)}
                    style={{
                      background: activeCycle?.id === c.id ? 'rgba(255,255,255,0.06)' : 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-btn)',
                      padding: '10px 12px',
                      color: activeCycle?.id === c.id ? 'var(--text-1)' : 'var(--text-2)',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      width: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontWeight: 600 }}>{c.name}</strong>
                      <span className={`status-badge ${c.status === "CLOSED" ? "red" : "green"}`} style={{ fontSize: '9px', padding: '1px 4px' }}>
                        {c.status}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', display: 'block', marginTop: '4px' }}>
                      Range: {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Audit Details & Workspace */}
        <div>
          {loadingDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
              <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Unpacking audit items...</span>
            </div>
          ) : !activeCycle ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px', color: 'var(--text-3)' }}>
              <ClipboardCheck size={48} style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>Audit Desk</h3>
              <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
                Select an audit cycle from the history panel to view the verification desk, discrepancies, and close logs.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Active Cycle Metadata Header */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)' }}>{activeCycle.name}</h2>
                  <p style={{ color: 'var(--text-2)', fontSize: '13.5px', marginTop: '4px' }}>{activeCycle.description || "No description logged."}</p>
                </div>
                
                {activeCycle.status === "ACTIVE" ? (
                  <button 
                    onClick={handleCloseAudit}
                    style={{
                      background: 'var(--red)',
                      border: 'none',
                      borderRadius: 'var(--radius-btn)',
                      color: '#fff',
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Lock size={14} /> Lock &amp; Close Audit
                  </button>
                ) : (
                  <span className="status-badge red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Lock size={13} /> LOCKED &amp; CLOSED
                  </span>
                )}
              </div>

              {/* Workspace table */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Asset</th>
                      <th>Location</th>
                      <th>Verified By</th>
                      <th>Status</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeItems.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="asset-name">{item.asset.assetName}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{item.asset.assetTag}</span>
                          </div>
                        </td>
                        <td>{item.asset.location}</td>
                        <td>{item.verifiedBy?.name || <span style={{ color: 'var(--text-3)' }}>Unverified</span>}</td>
                        <td>
                          <span className={`status-badge ${getStatusClass(item.status)}`}>
                            <span className="sdot"></span>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.notes || "-"}</td>
                        <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                          {activeCycle.status === "ACTIVE" && (
                            <button 
                              onClick={() => {
                                setTargetAssetId(item.asset.id);
                                setShowVerifyModal(true);
                              }}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-btn)',
                                color: 'var(--text-2)',
                                padding: '4px 10px',
                                fontSize: '12px',
                                cursor: 'pointer'
                              }}
                            >
                              Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL: CREATE AUDIT CYCLE ─── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '540px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Configure Audit Cycle</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateCycle} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              {createError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <AlertTriangle size={16} />
                  <span>{createError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Audit Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Q3 Electronics Inventory Audit" 
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Annual physical count check for compliance audit" 
                  value={cycleDesc}
                  onChange={(e) => setCycleDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Select Assets to Audit (Choose multiple) *</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-btn)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {assets.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <input 
                        type="checkbox"
                        checked={selectedAssets.includes(a.id)}
                        onChange={() => toggleSelectAsset(a.id)}
                        id={`chk-${a.id}`}
                        style={{ cursor: 'pointer' }}
                      />
                      <label htmlFor={`chk-${a.id}`} style={{ cursor: 'pointer' }}>{a.assetName} ({a.assetTag})</label>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingCreate} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingCreate ? "Launching..." : "Launch Audit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VERIFY ASSET ─── */}
      {showVerifyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '440px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Submit Physical Verification</h2>
              <button onClick={() => setShowVerifyModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleVerifyAsset} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {verifyError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <AlertTriangle size={16} />
                  <span>{verifyError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Physical Condition Status *</label>
                <select 
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  className="form-input"
                  required
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="VERIFIED">Verified / Match</option>
                  <option value="DAMAGED">Damaged / Needs repair</option>
                  <option value="MISSING">Missing / Absent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Verification Notes</label>
                <textarea 
                  placeholder="e.g. Verified serial matches, location check ok."
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowVerifyModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingVerify} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingVerify ? "Submitting..." : "Submit Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
