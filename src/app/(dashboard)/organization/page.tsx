"use client";

import { useState, useEffect } from "react";
import { 
  Building2, 
  FolderTree, 
  Users, 
  Plus, 
  Check, 
  ShieldAlert, 
  Loader2, 
  UserPlus, 
  UserCheck,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: boolean;
  parentDepartment?: { name: string } | null;
  departmentHead?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  status: boolean;
  customFields: any;
}

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  status: boolean;
  department?: { name: string } | null;
  user?: { role: string } | null;
}

export default function OrganizationPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"departments" | "categories" | "employees">("departments");

  // Department Form state
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");
  const [deptParentId, setDeptParentId] = useState("");
  const [deptHeadId, setDeptHeadId] = useState("");
  const [deptError, setDeptError] = useState("");
  const [submittingDept, setSubmittingDept] = useState(false);

  // Category Form state
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catFields, setCatFields] = useState(""); // JSON format
  const [catError, setCatError] = useState("");
  const [submittingCat, setSubmittingCat] = useState(false);

  // Employee promotion state
  const [activeEmpId, setActiveEmpId] = useState("");
  const [promotionRole, setPromotionRole] = useState("EMPLOYEE");
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [submittingPromo, setSubmittingPromo] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [deptRes, catRes, empRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/categories"),
        fetch("/api/employees")
      ]);

      const deptData = await deptRes.json();
      const catData = await catRes.json();
      const empData = await empRes.json();

      if (deptData.success) setDepartments(deptData.data);
      if (catData.success) setCategories(catData.data);
      if (empData.success) setEmployees(empData.data);

    } catch (err) {
      setError("Failed to fetch setup directory catalogs.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName || !deptCode) {
      setDeptError("Name and Code are required.");
      return;
    }

    try {
      setSubmittingDept(true);
      setDeptError("");

      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: deptName,
          code: deptCode,
          description: deptDesc || null,
          parentDepartmentId: deptParentId || null,
          departmentHeadId: deptHeadId || null
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowDeptModal(false);
        setDeptName("");
        setDeptCode("");
        setDeptDesc("");
        setDeptParentId("");
        setDeptHeadId("");
        fetchData();
      } else {
        setDeptError(data.error || "Failed to create department.");
      }
    } catch (err) {
      setDeptError("Server error configuring department.");
    } finally {
      setSubmittingDept(false);
    }
  };

  const handleCreateCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName) {
      setCatError("Category Name is required.");
      return;
    }

    let parsedFields = [];
    if (catFields) {
      try {
        parsedFields = JSON.parse(catFields);
      } catch (err) {
        setCatError("Custom fields metadata must be a valid JSON array.");
        return;
      }
    }

    try {
      setSubmittingCat(true);
      setCatError("");

      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: catName,
          description: catDesc || null,
          customFields: parsedFields
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCatModal(false);
        setCatName("");
        setCatDesc("");
        setCatFields("");
        fetchData();
      } else {
        setCatError(data.error || "Failed to create category.");
      }
    } catch (err) {
      setCatError("Server error configuring category.");
    } finally {
      setSubmittingCat(false);
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingPromo(true);
      setPromoError("");

      const res = await fetch(`/api/employees/${activeEmpId}/promote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: promotionRole })
      });

      const data = await res.json();
      if (data.success) {
        setShowPromoModal(false);
        setActiveEmpId("");
        setPromotionRole("EMPLOYEE");
        fetchData();
      } else {
        setPromoError(data.error || "Promotion failed.");
      }
    } catch (err) {
      setPromoError("Server error promoting staff.");
    } finally {
      setSubmittingPromo(false);
    }
  };

  const toggleEmployeeActive = async (empId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/employees/${empId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Status update failed.");
      }
    } catch (err) {
      alert("Error toggling employee status.");
    }
  };

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Organization Setup</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Configure department hierarchy, custom asset schemas, and employee privileges.</p>
        </div>
        
        {activeTab === "departments" && (
          <button className="qa-btn" onClick={() => setShowDeptModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none' }}>
            <Plus size={16} /> Add Department
          </button>
        )}
        {activeTab === "categories" && (
          <button className="qa-btn" onClick={() => setShowCatModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none' }}>
            <Plus size={16} /> Add Category
          </button>
        )}
      </div>

      {error && (
        <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-nav" style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab("departments")} 
          className={`tab-nav-btn ${activeTab === "departments" ? "active" : ""}`}
        >
          Departments ({departments.length})
        </button>
        <button 
          onClick={() => setActiveTab("categories")} 
          className={`tab-nav-btn ${activeTab === "categories" ? "active" : ""}`}
        >
          Asset Categories ({categories.length})
        </button>
        <button 
          onClick={() => setActiveTab("employees")} 
          className={`tab-nav-btn ${activeTab === "employees" ? "active" : ""}`}
        >
          Employee Directory ({employees.length})
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Unpacking catalog systems...</span>
        </div>
      ) : activeTab === "departments" ? (
        /* ─── TAB: DEPARTMENTS ─── */
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Parent Department</th>
                <th>Department Head</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{d.code}</td>
                  <td className="asset-name">{d.name}</td>
                  <td>{d.parentDepartment?.name || <span style={{ color: 'var(--text-3)' }}>Root Department</span>}</td>
                  <td>{d.departmentHead?.name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}</td>
                  <td>
                    <span className={`status-badge ${d.status ? "green" : "red"}`}>
                      <span className="sdot"></span>
                      {d.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : activeTab === "categories" ? (
        /* ─── TAB: ASSET CATEGORIES ─── */
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Custom Schema Fields</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td className="asset-name">{c.name}</td>
                  <td>{c.description || "N/A"}</td>
                  <td>
                    {c.customFields && Array.isArray(c.customFields) && c.customFields.length > 0 ? (
                      c.customFields.map((f: any) => `${f.name} (${f.type})`).join(", ")
                    ) : (
                      <span style={{ color: 'var(--text-3)' }}>Standard inventory specs</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${c.status ? "green" : "red"}`}>
                      <span className="sdot"></span>
                      {c.status ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── TAB: EMPLOYEE DIRECTORY ─── */
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Staff Name</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>App Role</th>
                <th>Custody State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 600 }}>{emp.employeeId}</td>
                  <td className="asset-name">{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department?.name || <span style={{ color: 'var(--text-3)' }}>Unassigned</span>}</td>
                  <td>
                    <span className="status-badge blue" style={{ fontSize: '10px', fontWeight: 700 }}>
                      {emp.user?.role || "EMPLOYEE"}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => toggleEmployeeActive(emp.id, emp.status)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: emp.status ? 'var(--green)' : 'var(--text-3)' }}
                    >
                      {emp.status ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </td>
                  <td>
                    <button 
                      onClick={() => {
                        setActiveEmpId(emp.id);
                        setPromotionRole(emp.user?.role || "EMPLOYEE");
                        setShowPromoModal(true);
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
                      Promote
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL: CONFIGURE DEPARTMENT ─── */}
      {showDeptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Configure Department</h2>
              <button onClick={() => setShowDeptModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateDept} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {deptError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <ShieldAlert size={16} />
                  <span>{deptError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Department Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Engineering" 
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Department Code (Unique) *</label>
                <input 
                  type="text" 
                  placeholder="e.g. ENG" 
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Parent Department (For Hierarchy)</label>
                <select 
                  value={deptParentId}
                  onChange={(e) => setDeptParentId(e.target.value)}
                  className="form-input"
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="">None (Top-Level)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Department Head</label>
                <select 
                  value={deptHeadId}
                  onChange={(e) => setDeptHeadId(e.target.value)}
                  className="form-input"
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. System architecture and software engineering team." 
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowDeptModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingDept} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingDept ? "Configuring..." : "Add Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CONFIGURE ASSET CATEGORY ─── */}
      {showCatModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Configure Asset Category</h2>
              <button onClick={() => setShowCatModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateCat} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {catError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <ShieldAlert size={16} />
                  <span>{catError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Category Name *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Laptops / Furniture" 
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Portable computing units." 
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Custom Specifications Schema (JSON Array)</label>
                <textarea 
                  placeholder='e.g. [{"name": "RAM Size", "type": "string", "required": false}]'
                  value={catFields}
                  onChange={(e) => setCatFields(e.target.value)}
                  className="form-input"
                  style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowCatModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingCat} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingCat ? "Configuring..." : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: PROMOTE ROLE ─── */}
      {showPromoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column' }} className="fade-in-up">
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-1)' }}>Modify Employee Role</h2>
              <button onClick={() => setShowPromoModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}>&times;</button>
            </div>

            <form onSubmit={handlePromote} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {promoError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', margin: 0 }}>
                  <ShieldAlert size={16} />
                  <span>{promoError}</span>
                </div>
              )}

              <div className="form-group">
                <label>Select Application Role *</label>
                <select 
                  value={promotionRole}
                  onChange={(e) => setPromotionRole(e.target.value)}
                  className="form-input"
                  required
                  style={{ background: '#0a0a0f', color: '#fff' }}
                >
                  <option value="EMPLOYEE">Employee (Standard checkout &amp; booking)</option>
                  <option value="ASSET_MANAGER">Asset Manager (Allocates, returns &amp; registers)</option>
                  <option value="DEPARTMENT_HEAD">Department Head (Approves department custody)</option>
                  <option value="AUDITOR">Auditor (Verifies compliance cycles)</option>
                  <option value="ADMIN">Administrator (Full catalog setup &amp; promotion)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowPromoModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={submittingPromo} className="btn-primary" style={{ background: 'var(--accent)', color: '#fff' }}>
                  {submittingPromo ? "Promoting..." : "Confirm Promotion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
