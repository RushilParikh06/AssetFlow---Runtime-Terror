"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Tag, 
  Calendar, 
  DollarSign, 
  Loader2, 
  ShieldAlert, 
  Wrench, 
  User, 
  ArrowRightLeft, 
  CheckCircle,
  FileText,
  AlertTriangle,
  History,
  QrCode
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  url: string;
  fileType: string;
  sizeBytes: number;
}

interface Allocation {
  id: string;
  allocationDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  conditionBefore: string;
  conditionAfter: string | null;
  status: string;
  notes: string | null;
  assignedTo?: { name: string; email: string } | null;
  department?: { name: string; code: string } | null;
}

interface MaintenanceRequest {
  id: string;
  issueDescription: string;
  priority: string;
  status: string;
  createdAt: string;
  actualCost: number | null;
  requestedBy: { name: string };
  technician?: { name: string } | null;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string | null;
  status: string;
  bookedBy: { name: string };
}

interface Asset {
  id: string;
  assetTag: string;
  assetName: string;
  serialNumber: string | null;
  acquisitionDate: string;
  acquisitionCost: number;
  warrantyExpiry: string | null;
  vendor: string | null;
  condition: string;
  location: string;
  sharedBookableFlag: boolean;
  qrCode: string;
  status: string;
  category: { name: string };
  documents: Document[];
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<{
    allocations: Allocation[];
    maintenanceRequests: MaintenanceRequest[];
    bookings: Booking[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"specs" | "timeline" | "attachments">("specs");

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const [assetRes, historyRes] = await Promise.all([
        fetch(`/api/assets/${id}`),
        fetch(`/api/assets/${id}/history`)
      ]);

      const assetData = await assetRes.json();
      const historyData = await historyRes.json();

      if (assetData.success) {
        setAsset(assetData.data);
      } else {
        setError(assetData.error || "Failed to load asset specs.");
      }

      if (historyData.success) {
        setHistory(historyData.data);
      }
    } catch (err) {
      setError("An error occurred while loading asset details.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "AVAILABLE": return "green";
      case "ALLOCATED": return "blue";
      case "RESERVED": return "violet";
      case "UNDER_MAINTENANCE": return "amber";
      default: return "red";
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '12px' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent)' }} />
        <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>Retrieving asset dossier...</span>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '40px' }}>
        <ShieldAlert size={48} style={{ color: 'var(--red)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)' }}>Asset Not Found</h3>
        <p style={{ color: 'var(--text-2)', fontSize: '13px', marginTop: '6px', textAlign: 'center', maxWidth: '360px' }}>
          {error || "The requested asset record does not exist or you lack sufficient access permissions."}
        </p>
        <Link href="/assets" className="btn-primary" style={{ marginTop: '20px', textDecoration: 'none', background: 'var(--accent)', color: '#fff' }}>
          &larr; Back to Registry
        </Link>
      </div>
    );
  }

  // Combine allocations, maintenance, and bookings into a unified timeline
  const unifiedTimeline: {
    type: "allocation" | "maintenance" | "booking";
    date: Date;
    title: string;
    description: string;
    badge?: string;
  }[] = [];

  if (history) {
    history.allocations.forEach(alloc => {
      unifiedTimeline.push({
        type: "allocation",
        date: new Date(alloc.allocationDate),
        title: `Asset Allocated`,
        description: alloc.assignedTo 
          ? `Assigned to employee ${alloc.assignedTo.name} (${alloc.assignedTo.email})` 
          : `Allocated to ${alloc.department?.name || "department"}. Notes: ${alloc.notes || "None"}`,
        badge: alloc.status
      });

      if (alloc.actualReturnDate) {
        unifiedTimeline.push({
          type: "allocation",
          date: new Date(alloc.actualReturnDate),
          title: `Asset Returned`,
          description: `Returned in condition: ${alloc.conditionAfter || "Checked"}. Return Notes: ${alloc.notes || "None"}`,
          badge: "RETURNED"
        });
      }
    });

    history.maintenanceRequests.forEach(m => {
      unifiedTimeline.push({
        type: "maintenance",
        date: new Date(m.createdAt),
        title: `Maintenance Request Raised`,
        description: `Issue: ${m.issueDescription}. Priority: ${m.priority}. Technician: ${m.technician?.name || "Unassigned"}.`,
        badge: m.status
      });
    });

    history.bookings.forEach(b => {
      unifiedTimeline.push({
        type: "booking",
        date: new Date(b.startTime),
        title: `Resource Booked`,
        description: `Reserved by ${b.bookedBy.name} from ${new Date(b.startTime).toLocaleTimeString()} to ${new Date(b.endTime).toLocaleTimeString()} for: ${b.purpose || "Meeting"}`,
        badge: b.status
      });
    });
  }

  // Sort timeline chronologically descending
  unifiedTimeline.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="fade-in-up">
      {/* ─── BACK NAVIGATION ─── */}
      <Link href="/assets" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-2)', textDecoration: 'none', fontSize: '13px', fontWeight: 500, marginBottom: '20px' }}>
        <ArrowLeft size={14} /> Back to Registry
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: SPECS & TABS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Header Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  {asset.category.name}
                </span>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', marginTop: '8px', marginBottom: '4px' }}>{asset.assetName}</h1>
                <p style={{ color: 'var(--text-3)', fontSize: '13px' }}>Asset Tag ID: <strong style={{ color: 'var(--text-2)' }}>{asset.assetTag}</strong></p>
              </div>
              <span className={`status-badge ${getStatusClass(asset.status)}`}>
                <span className="sdot"></span>
                {asset.status}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--text-2)', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={14} style={{ color: 'var(--text-3)' }} />
                <span>{asset.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={14} style={{ color: 'var(--text-3)' }} />
                <span>Serial: <strong>{asset.serialNumber || "N/A"}</strong></span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="tab-nav">
              <button 
                onClick={() => setActiveTab("specs")} 
                className={`tab-nav-btn ${activeTab === "specs" ? "active" : ""}`}
              >
                Specifications
              </button>
              <button 
                onClick={() => setActiveTab("timeline")} 
                className={`tab-nav-btn ${activeTab === "timeline" ? "active" : ""}`}
              >
                Lifecycle History ({unifiedTimeline.length})
              </button>
              <button 
                onClick={() => setActiveTab("attachments")} 
                className={`tab-nav-btn ${activeTab === "attachments" ? "active" : ""}`}
              >
                Attachments ({asset.documents?.length || 0})
              </button>
            </div>

            {/* TAB CONTENT: SPECS */}
            {activeTab === "specs" && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acquisition Cost</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)' }}>${asset.acquisitionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Acquisition Date</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)' }}>{new Date(asset.acquisitionDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Condition Status</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)' }}>{asset.condition}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Warranty Expiration</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)' }}>
                    {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "No Warranty Listed"}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendor Partner</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)' }}>{asset.vendor || "N/A"}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bookable Resource</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-1)' }}>{asset.sharedBookableFlag ? "Yes — Shared resource calendar enabled" : "No — Gated allocation only"}</span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TIMELINE */}
            {activeTab === "timeline" && (
              <div>
                {unifiedTimeline.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '8px' }}>
                    <History size={32} style={{ color: 'var(--text-3)' }} />
                    <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>No timeline events recorded yet.</span>
                  </div>
                ) : (
                  <div className="timeline">
                    {unifiedTimeline.map((item, idx) => (
                      <div className="timeline-item" key={idx}>
                        <div className="timeline-dot active"></div>
                        <div className="timeline-time">
                          {item.date.toLocaleString()}
                          {item.badge && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)' }}>{item.title}</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-2)' }}>{item.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ATTACHMENTS */}
            {activeTab === "attachments" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {(!asset.documents || asset.documents.length === 0) ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: '8px' }}>
                    <FileText size={32} style={{ color: 'var(--text-3)' }} />
                    <span style={{ color: 'var(--text-2)', fontSize: '13px' }}>No documents or warranty certificates attached.</span>
                  </div>
                ) : (
                  asset.documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={18} style={{ color: 'var(--blue)' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-1)' }}>{doc.name}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>{doc.fileType.toUpperCase()} · {(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                        Download
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: QR CODE INFO */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', width: '100%', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            QR Code dossier
          </h3>
          
          <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '4px solid rgba(255,255,255,0.1)' }}>
            <QrCode size={160} style={{ color: '#000' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>QR Payload String</span>
            <code style={{ fontSize: '12.5px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--border)' }}>
              {asset.qrCode}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
