"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  LayoutGrid, 
  List, 
  Plus, 
  Box, 
  ChevronRight, 
  MapPin, 
  Tag, 
  Loader2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  customFields: any;
}

interface Asset {
  id: string;
  assetTag: string;
  assetName: string;
  serialNumber: string | null;
  acquisitionDate: string;
  acquisitionCost: number;
  location: string;
  status: string;
  category: Category;
}

export default function AssetsPage() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Registration Modal state
  const [showRegModal, setShowRegModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  
  // Registration Form state
  const [regName, setRegName] = useState("");
  const [regCategory, setRegCategory] = useState("");
  const [regSerial, setRegSerial] = useState("");
  const [regCost, setRegCost] = useState("");
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [regCondition, setRegCondition] = useState("NEW");
  const [regLocation, setRegLocation] = useState("");
  const [regShared, setRegShared] = useState(false);
  const [regVendor, setRegVendor] = useState("");
  const [regWarranty, setRegWarranty] = useState("");
  const [regError, setRegError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      const [assetsRes, catsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/categories")
      ]);

      const assetsData = await assetsRes.json();
      const catsData = await catsRes.json();

      if (assetsData.success) {
        setAssets(assetsData.data);
      } else {
        setError(assetsData.error || "Failed to load assets");
      }

      if (catsData.success) {
        setCategories(catsData.data);
      } else {
        // Fallback if cats endpoint wrapper varies
        setCategories(Array.isArray(catsData) ? catsData : catsData.data || []);
      }
    } catch (err) {
      setError("An error occurred while fetching registry data.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regCategory || !regDate || !regCost || !regLocation) {
      setRegError("Please fill out all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setRegError("");

      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetName: regName,
          categoryId: regCategory,
          serialNumber: regSerial || null,
          acquisitionDate: regDate,
          acquisitionCost: parseFloat(regCost),
          condition: regCondition,
          location: regLocation,
          sharedBookableFlag: regShared,
          vendor: regVendor || null,
          warrantyExpiry: regWarranty ? regWarranty : null
        })
      });

      const data = await res.json();
      if (data.success) {
        // Reset and close modal
        setShowRegModal(false);
        setWizardStep(1);
        setRegName("");
        setRegCategory("");
        setRegSerial("");
        setRegCost("");
        setRegLocation("");
        setRegShared(false);
        setRegVendor("");
        setRegWarranty("");
        // Reload list
        fetchData();
      } else {
        setRegError(data.error || "Failed to register asset");
      }
    } catch (err) {
      setRegError("Server error during registration.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Assets list
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serialNumber && asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || asset.category?.id === selectedCategory || asset.category?.name === selectedCategory;
    const matchesStatus = selectedStatus === "all" || asset.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "AVAILABLE": return "green";
      case "ALLOCATED": return "blue";
      case "RESERVED": return "violet";
      case "UNDER_MAINTENANCE": return "amber";
      default: return "red";
    }
  };

  return (
    <div className="fade-in-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="section-title" style={{ margin: 0, fontSize: '24px' }}>Asset Registry</h1>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '4px' }}>Track, organize, and assign organization-wide equipment and resources.</p>
        </div>
        <button className="qa-btn" onClick={() => setShowRegModal(true)} style={{ background: '#6366f1', color: '#fff', border: 'none' }}>
          <Plus size={16} /> Register Asset
        </button>
      </div>

      {error && (
        <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── FILTERS & TOOLBAR ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
          <div className="header-search" style={{ width: '100%', maxWidth: '360px' }}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search by tag, name, serial..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-btn)',
              padding: '0 16px',
              color: 'var(--text-1)',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select 
            value={selectedStatus} 
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-btn)',
              padding: '0 16px',
              color: 'var(--text-1)',
              fontSize: '13px',
              outline: 'none'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="RESERVED">Reserved</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-btn)', padding: '2px' }}>
            <button 
              onClick={() => setViewMode("table")}
              style={{
                background: viewMode === "table" ? 'rgba(255,255,255,0.06)' : 'none',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                color: viewMode === "table" ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer'
              }}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              style={{
                background: viewMode === "grid" ? 'rgba(255,255,255,0.06)' : 'none',
                border: 'none',
                padding: '6px 10px',
                borderRadius: '6px',
                color: viewMode === "grid" ? 'var(--text-1)' : 'var(--text-3)',
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Loading organization registry...</span>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px' }}>
          <Box size={48} style={{ color: 'var(--text-3)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>No Assets Found</h3>
          <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
            There are no assets matching your filter selection. Register a new asset to get started.
          </p>
        </div>
      ) : viewMode === "table" ? (
        /* ─── TABLE VIEW ─── */
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Location</th>
                <th>Acquisition Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map(asset => (
                <tr key={asset.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{asset.assetTag}</td>
                  <td className="asset-name">{asset.assetName}</td>
                  <td>{asset.category?.name || "Uncategorized"}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(asset.status)}`}>
                      <span className="sdot"></span>
                      {asset.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={13} style={{ color: 'var(--text-3)' }} />
                      {asset.location}
                    </div>
                  </td>
                  <td>{new Date(asset.acquisitionDate).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                    <Link href={`/assets/${asset.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--text-2)', fontSize: '13px', fontWeight: 500 }}>
                      Details <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ─── GRID VIEW ─── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredAssets.map(asset => (
            <div key={asset.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px', position: 'relative' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '3px 8px', borderRadius: '4px' }}>
                    {asset.assetTag}
                  </span>
                  <span className={`status-badge ${getStatusClass(asset.status)}`}>
                    <span className="sdot"></span>
                    {asset.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>{asset.assetName}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: 'var(--text-2)' }}>
                  <div>Category: <strong style={{ color: 'var(--text-1)' }}>{asset.category?.name || "None"}</strong></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} style={{ color: 'var(--text-3)' }} />
                    {asset.location}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                <Link href={`/assets/${asset.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--accent)', fontSize: '13px', fontWeight: 500 }}>
                  View specs <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── REGISTER ASSET MODAL ─── */}
      {showRegModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: '#0a0a0f', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }} className="fade-in-up">
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)' }}>Register New Asset</h2>
              <button 
                onClick={() => { setShowRegModal(false); setWizardStep(1); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: '18px' }}
              >
                &times;
              </button>
            </div>

            {/* Modal Progress Indicator */}
            <div style={{ display: 'flex', padding: '16px 24px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '8px', color: wizardStep >= 1 ? 'var(--text-1)' : 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: wizardStep >= 1 ? 'var(--accent)' : 'var(--border)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>1</span>
                Basic Info
              </div>
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '8px', color: wizardStep >= 2 ? 'var(--text-1)' : 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: wizardStep >= 2 ? 'var(--accent)' : 'var(--border)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>2</span>
                Acquisition Specs
              </div>
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '8px', color: wizardStep >= 3 ? 'var(--text-1)' : 'var(--text-3)', fontSize: '12px', fontWeight: 600 }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: wizardStep >= 3 ? 'var(--accent)' : 'var(--border)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>3</span>
                Location
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleRegisterAsset} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {regError && (
                <div className="alert-banner" style={{ background: 'var(--red-dim)', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--red)', marginBottom: '16px' }}>
                  <AlertCircle size={16} />
                  <span>{regError}</span>
                </div>
              )}

              {/* STEP 1: Basic Info */}
              {wizardStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Asset Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. MacBook Pro 16 M3" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="form-input" 
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value)}
                      className="form-input"
                      required
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-1)' }}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Serial Number (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. C02XN810JWD2" 
                      value={regSerial}
                      onChange={(e) => setRegSerial(e.target.value)}
                      className="form-input" 
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Acquisition Specs */}
              {wizardStep === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Acquisition Cost ($) *</label>
                      <input 
                        type="number" 
                        step="0.01"
                        placeholder="e.g. 2499.00" 
                        value={regCost}
                        onChange={(e) => setRegCost(e.target.value)}
                        className="form-input" 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Acquisition Date *</label>
                      <input 
                        type="date" 
                        value={regDate}
                        onChange={(e) => setRegDate(e.target.value)}
                        className="form-input" 
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>Vendor</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Apple Store" 
                        value={regVendor}
                        onChange={(e) => setRegVendor(e.target.value)}
                        className="form-input" 
                      />
                    </div>
                    <div className="form-group">
                      <label>Warranty Expiry</label>
                      <input 
                        type="date" 
                        value={regWarranty}
                        onChange={(e) => setRegWarranty(e.target.value)}
                        className="form-input" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Location & Condition */}
              {wizardStep === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label>Location *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Building A, Floor 3" 
                      value={regLocation}
                      onChange={(e) => setRegLocation(e.target.value)}
                      className="form-input" 
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Initial Condition</label>
                    <select 
                      value={regCondition}
                      onChange={(e) => setRegCondition(e.target.value)}
                      className="form-input"
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-1)' }}
                    >
                      <option value="NEW">New / Mint</option>
                      <option value="GOOD">Good / Used</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', padding: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="reg-shared" 
                      checked={regShared}
                      onChange={(e) => setRegShared(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label htmlFor="reg-shared" style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-1)' }}>
                      <strong>Mark as Shared Resource</strong> — Allow standard employees to book this resource in time-slots.
                    </label>
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setWizardStep(prev => Math.max(1, prev - 1))}
                  disabled={wizardStep === 1}
                  className="btn-ghost"
                  style={{ opacity: wizardStep === 1 ? 0.4 : 1 }}
                >
                  Back
                </button>

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (wizardStep === 1 && (!regName || !regCategory)) {
                        setRegError("Please fill out Name and Category.");
                        return;
                      }
                      setRegError("");
                      setWizardStep(prev => prev + 1);
                    }}
                    className="btn-primary"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{ background: 'var(--green)', color: '#fff' }}
                  >
                    {submitting ? "Registering..." : "Submit Registration"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
