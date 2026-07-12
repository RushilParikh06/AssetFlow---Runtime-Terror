"use client";

import { useState, useEffect } from "react";
import { 
  ArrowRightLeft, 
  User, 
  Building2, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  AlertTriangle,
  Loader2,
  AlertCircle,
  Plus,
  RefreshCw
} from "lucide-react";

interface Allocation {
  id: string;
  allocationDate: string;
  expectedReturnDate: string | null;
  status: string;
  notes: string | null;
  conditionBefore: string;
  asset: { id: string; assetTag: string; assetName: string };
  assignedTo?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
}

interface TransferRequest {
  id: string;
  status: string;
  notes: string | null;
  createdAt: string;
  asset: { id: string; assetTag: string; assetName: string };
  requestedBy: { id: string; name: string };
  targetEmployee?: { id: string; name: string } | null;
  targetDepartment?: { id: string; name: string } | null;
}

interface Asset {
  id: string;
  assetTag: string;
  assetName: string;
  status: string;
}

interface Employee {
  id: string;
  name: string;
  employeeId: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
}

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"current" | "transfers">("current");

  // Allocate Modal state
  const [showAllocModal, setShowAllocModal] = useState(false);
  const [targetType, setTargetType] = useState<"employee" | "department">("employee");
  const [selectedAsset, setSelectedAsset] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [conditionBefore, setConditionBefore] = useState("NEW");
  const [allocNotes, setAllocNotes] = useState("");
  const [allocError, setAllocError] = useState("");
  const [submittingAlloc, setSubmittingAlloc] = useState(false);

  // Return Modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [activeReturnAllocId, setActiveReturnAllocId] = useState("");
  const [conditionAfter, setConditionAfter] = useState("GOOD");
  const [returnNotes, setReturnNotes] = useState("");
  const [returnError, setReturnError] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [allocRes, transferRes, assetsRes, empRes, deptRes] = await Promise.all([
        fetch("/api/allocations"),
        fetch("/api/allocations/transfer"),
        fetch("/api/assets"),
        fetch("/api/employees"),
        fetch("/api/departments")
      ]);

      const allocData = await allocRes.json();
      const transferData = await transferRes.json();
      const assetsData = await assetsRes.json();
      const empData = await empRes.json();
      const deptData = await deptRes.json();

      if (allocData.success) setAllocations(allocData.data);
      if (transferData.success) setTransfers(transferData.data);
      
      if (assetsData.success) {
        setAvailableAssets(assetsData.data.filter((a: any) => a.status === "AVAILABLE"));
      }
      
      if (empData.success) {
        setEmployees(empData.data);
      }
      
      if (deptData.success) {
        setDepartments(deptData.data);
      }

    } catch (err) {
      setError("Failed to fetch allocations or transfer request queues.");
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !conditionBefore) {
      setAllocError("Please select an asset and note its condition.");
      return;
    }
    if (targetType === "employee" && !selectedEmployee) {
      setAllocError("Please select an employee assignee.");
      return;
    }
    if (targetType === "department" && !selectedDept) {
      setAllocError("Please select a department assignee.");
      return;
    }

    try {
      setSubmittingAlloc(true);
      setAllocError("");

      const res = await fetch("/api/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId: selectedAsset,
          assignedToId: targetType === "employee" ? selectedEmployee : null,
          departmentId: targetType === "department" ? selectedDept : null,
          expectedReturnDate: returnDate || null,
          conditionBefore,
          notes: allocNotes || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowAllocModal(false);
        setSelectedAsset("");
        setSelectedEmployee("");
        setSelectedDept("");
        setReturnDate("");
        setAllocNotes("");
        fetchData();
      } else {
        setAllocError(data.error || "Allocation failed. Asset might be occupied.");
      }
    } catch (err) {
      setAllocError("Server error during allocation.");
    } finally {
      setSubmittingAlloc(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionAfter) {
      setReturnError("Please note checked-in condition.");
      return;
    }

    try {
      setSubmittingReturn(true);
      setReturnError("");

      const res = await fetch(`/api/allocations/${activeReturnAllocId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditionAfter,
          notes: returnNotes || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowReturnModal(false);
        setActiveReturnAllocId("");
        setReturnNotes("");
        fetchData();
      } else {
        setReturnError(data.error || "Failed to process check-in.");
      }
    } catch (err) {
      setReturnError("Server error during check-in.");
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleApproveTransfer = async (requestId: string) => {
    try {
      const res = await fetch("/api/allocations/transfer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to approve transfer.");
      }
    } catch (err) {
      alert("Error approving transfer.");
    }
  };

  const isOverdue = (expectedDate: string | null) => {
    if (!expectedDate) return false;
    return new Date(expectedDate).getTime() < new Date().getTime();
  };

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Allocations &amp; Transfers</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Manage custody check-outs and transfer handshakes across staff.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="qa-btn" onClick={fetchData} style={{ background: 'none', border: '1px solid var(--border)' }}>
            <RefreshCw size={16} />
          </button>
          <button className="qa-btn" onClick={() => setShowAllocModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none' }}>
            <Plus size={16} /> Allocate Asset
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab("current")} 
          className={`tab-nav-btn ${activeTab === "current" ? "active" : ""}`}
        >
          Active Custody List ({allocations.length})
        </button>
        <button 
          onClick={() => setActiveTab("transfers")} 
          className={`tab-nav-btn ${activeTab === "transfers" ? "active" : ""}`}
        >
          Transfer Approval Queue ({transfers.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Retrieving custody logs...</span>
        </div>
      ) : activeTab === "current" ? (
        /* ─── TAB: ACTIVE CUSTODY LIST ─── */
        allocations.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px' }}>
            <CheckCircle size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>No Active Custodies</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
              All assets are currently in the warehouse storage. Click &quot;Allocate Asset&quot; to assign equipment.
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Custody Holder</th>
                  <th>Checked Out</th>
                  <th>Expected Return</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(alloc => {
                  const overdue = isOverdue(alloc.expectedReturnDate);
                  return (
                    <tr key={alloc.id}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="asset-name">{alloc.asset.assetName}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{alloc.asset.assetTag}</span>
                        </div>
                      </td>
                      <td>
                        {alloc.assignedTo ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)' }}>
                            <User size={13} style={{ color: 'var(--blue)' }} />
                            <span>{alloc.assignedTo.name}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-2)' }}>
                            <Building2 size={13} style={{ color: 'var(--violet)' }} />
                            <span>{alloc.department?.name || "Department"}</span>
                          </div>
                        )}
                      </td>
                      <td>{new Date(alloc.allocationDate).toLocaleDateString()}</td>
                      <td>
                        {alloc.expectedReturnDate ? (
                          <span style={{ color: overdue ? 'var(--red)' : 'var(--text-2)', fontWeight: overdue ? 600 : 400 }}>
                            {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-3)' }}>Permanent check-out</span>
                        )}
                      </td>
                      <td>
                        {overdue ? (
                          <span className="status-badge red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={12} /> Overdue Return
                          </span>
                        ) : (
                          <span className="status-badge green">
                            <span className="sdot"></span> Active
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <button 
                          onClick={() => {
                            setActiveReturnAllocId(alloc.id);
                            setShowReturnModal(true);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-btn)',
                            color: 'var(--text-2)',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Check In
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* ─── TAB: TRANSFER APPROVAL QUEUE ─── */
        transfers.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px' }}>
            <ArrowRightLeft size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>Queue Empty</h3>
            <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
              No transfer handshakes are currently pending manager or department head approvals.
            </p>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Requested Asset</th>
                  <th>Initiator</th>
                  <th>Target Custody</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map(req => (
                  <tr key={req.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="asset-name">{req.asset.assetName}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{req.asset.assetTag}</span>
                      </div>
                    </td>
                    <td>{req.requestedBy.name}</td>
                    <td>
                      {req.targetEmployee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} style={{ color: 'var(--blue)' }} />
                          <span>{req.targetEmployee.name}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={13} style={{ color: 'var(--violet)' }} />
                          <span>{req.targetDepartment?.name || "Department"}</span>
                        </div>
                      )}
                    </td>
                    <td>{req.notes || "No explanation attached."}</td>
                    <td>
                      {req.status === "REQUESTED" ? (
                        <button 
                          onClick={() => handleApproveTransfer(req.id)}
                          style={{
                            background: 'var(--accent)',
                            border: 'none',
                            borderRadius: 'var(--radius-btn)',
                            color: '#fff',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Approve Handshake
                        </button>
                      ) : (
                        <span className="status-badge green">{req.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ─── MODAL: ALLOCATE ASSET ─── */}
      {showAllocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Allocate Asset Custody</h2>
              <button onClick={() => setShowAllocModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleAllocate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {allocError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <AlertCircle size={16} />
                  <span>{allocError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Select Available Asset *</label>
                <select 
                  value={selectedAsset}
                  onChange={(e) => setSelectedAsset(e.target.value)}
                  className="form-input"
                  required
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="">Choose Asset</option>
                  {availableAssets.map(a => (
                    <option key={a.id} value={a.id}>{a.assetName} ({a.assetTag})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Custody Target *</label>
                <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '4px', borderRadius: 'var(--radius-btn)' }}>
                  <button 
                    type="button"
                    onClick={() => setTargetType("employee")}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: targetType === "employee" ? 'rgba(255,255,255,0.06)' : 'none',
                      color: targetType === "employee" ? 'var(--text-1)' : 'var(--text-3)',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Employee
                  </button>
                  <button 
                    type="button"
                    onClick={() => setTargetType("department")}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: targetType === "department" ? 'rgba(255,255,255,0.06)' : 'none',
                      color: targetType === "department" ? 'var(--text-1)' : 'var(--text-3)',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Department
                  </button>
                </div>
              </div>

              {targetType === "employee" ? (
                <div className="form-group">
                  <label>Select Employee *</label>
                  <select 
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="form-input"
                    required
                    style={{ background: '#0a0a0f', color: '#fff' }}
                  >
                    <option value="">Choose Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Select Department *</label>
                  <select 
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="form-input"
                    required
                    style={{ background: '#0a0a0f', color: '#fff' }}
                  >
                    <option value="">Choose Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Expected Return Date (Optional)</label>
                <input 
                  type="date" 
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Current Asset Condition</label>
                <select 
                  value={conditionBefore}
                  onChange={(e) => setConditionBefore(e.target.value)}
                  className="form-input"
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="NEW">New / Mint</option>
                  <option value="GOOD">Good / Used</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Checkout Notes</label>
                <textarea 
                  placeholder="e.g. Sent with original packaging and power supply cable."
                  value={allocNotes}
                  onChange={(e) => setAllocNotes(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAllocModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingAlloc} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingAlloc ? "Allocating..." : "Allocate Custody"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: RETURN ASSET (CHECK IN) ─── */}
      {showReturnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Return Check-In Receipt</h2>
              <button onClick={() => setShowReturnModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleReturn} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {returnError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <AlertCircle size={16} />
                  <span>{returnError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Checked-In Condition *</label>
                <select 
                  value={conditionAfter}
                  onChange={(e) => setConditionAfter(e.target.value)}
                  className="form-input"
                  required
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="NEW">New / Mint</option>
                  <option value="GOOD">Good / Used</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                </select>
              </div>

              <div className="form-group">
                <label>Inspection Notes</label>
                <textarea 
                  placeholder="e.g. Returned clean, minor surface scratches. Power adapter matches."
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowReturnModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingReturn} className="btn-primary" style={{ background: 'var(--green)', color: '#fff' }}>
                  {submittingReturn ? "Checking In..." : "Complete Check-In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
