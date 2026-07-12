"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".fade-in-up").forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ─── NAVBAR ─── */}
      <div className="navbar-wrap">
        <nav>
          <Link href="#" className="nav-brand">
            <div className="nav-logo">AF</div>
            <span className="nav-brand-name">AssetFlow</span>
          </Link>
          <div className="nav-links">
            <Link href="#features">Features</Link>
            <Link href="#how-it-works">How It Works</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#contact">Contact</Link>
          </div>
          <div className="nav-actions">
            <Link href="/login" className="btn-ghost">Sign In</Link>
            <Link href="/login" className="btn-primary">Get Started</Link>
          </div>
        </nav>
      </div>

      {/* ─── HERO ─── */}
      <section className="hero">
        <div className="hero-badge">
          <span className="dot"></span>
          Enterprise Asset Management, Simplified
        </div>

        <h1 className="hero-title">
          <span className="line1">Smarter Assets.</span>
          <span className="line2">Smarter Decisions.</span>
        </h1>

        <p className="hero-sub">
          AI-powered <span>enterprise asset management</span> that predicts maintenance, prevents allocation conflicts, and gives complete visibility across your organization.
        </p>

        <div className="hero-cta">
          <Link href="/login" className="btn-hero-primary">Start Managing &rarr;</Link>
          <Link href="#features" className="btn-hero-secondary">View Features</Link>
        </div>
      </section>

      {/* ─── TRUSTED BY ─── */}
      <section className="trusted fade-in-up">
        <p className="trusted-label">Trusted by industry leaders</p>
        <div className="trusted-logos">
          <div className="trusted-logo"><div className="logo-icon">T</div>TechCorp</div>
          <div className="trusted-logo"><div className="logo-icon">N</div>NovaMed</div>
          <div className="trusted-logo"><div className="logo-icon">I</div>InfraCore</div>
          <div className="trusted-logo"><div className="logo-icon">B</div>BuildMax</div>
          <div className="trusted-logo"><div className="logo-icon">G</div>GlobalOps</div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="features" id="features">
        <div className="section-header fade-in-up">
          <h2>Everything you need to manage assets</h2>
          <p>Built for modern operations teams. <span>Powerful tools</span> that help you track, allocate, and scale your asset base faster than ever.</p>
        </div>

        <div className="features-grid">
          {/* Card 1: Real-time tracking */}
          <div className="feature-card fade-in-up" style={{ transitionDelay: '0.05s' }}>
            <div className="card-dots"><span></span><span></span><span></span><span></span></div>
            <div className="card-icon">&#128225;</div>
            <h3>Real-time Asset Tracking</h3>
            <p>Monitor the <span>status, location,</span> and health of every asset across all departments in real-time.</p>
            <div className="metrics-row">
              <div className="metric"><div className="val">2.4k</div><div className="lbl">Assets Tracked</div></div>
              <div className="metric"><div className="val">98%</div><div className="lbl">Uptime</div></div>
              <div className="metric"><div className="val">12ms</div><div className="lbl">Latency</div></div>
              <div className="metric"><div className="val">100%</div><div className="lbl">Audit Coverage</div></div>
            </div>
          </div>

          {/* Card 2: Smart Allocation */}
          <div className="feature-card fade-in-up" style={{ transitionDelay: '0.1s' }}>
            <div className="card-icon">&#9889;</div>
            <h3>Smart Allocation Engine</h3>
            <p>Zero double-allocations. Our conflict-detection <span>engine</span> prevents duplicate assignments before they happen.</p>
            <div className="status-badge">
              <span className="sdot"></span>
              No conflicts detected
            </div>
            <div className="mini-bars">
              <div className="mini-bar" style={{ height: '30%' }}></div>
              <div className="mini-bar" style={{ height: '55%' }}></div>
              <div className="mini-bar active" style={{ height: '80%' }}></div>
              <div className="mini-bar" style={{ height: '65%' }}></div>
              <div className="mini-bar active" style={{ height: '100%' }}></div>
              <div className="mini-bar" style={{ height: '72%' }}></div>
              <div className="mini-bar" style={{ height: '45%' }}></div>
              <div className="mini-bar active" style={{ height: '90%' }}></div>
              <div className="mini-bar" style={{ height: '60%' }}></div>
            </div>
          </div>

          {/* Card 3: Booking Engine */}
          <div className="feature-card fade-in-up" style={{ transitionDelay: '0.15s' }}>
            <div className="card-icon">&#128197;</div>
            <h3>Booking Engine</h3>
            <p>Reserve shared assets with automatic <span>overlap prevention</span>. No scheduling conflicts, ever.</p>
            <div className="kbd-row">
              <div className="kbd">&#8984; Book</div>
              <div className="kbd">&#8984; Check</div>
              <div className="kbd">&#8984; Release</div>
            </div>
          </div>

          {/* Card 4: Maintenance */}
          <div className="feature-card fade-in-up" style={{ transitionDelay: '0.2s' }}>
            <div className="card-icon">&#128295;</div>
            <h3>Maintenance Workflows</h3>
            <p>Create, approve, and track maintenance requests with role-based <span>approval chains</span> built in.</p>
            <div className="status-badge" style={{ background: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.2)', color: '#60a5fa', marginTop: '20px' }}>
              <span className="sdot" style={{ background: '#60a5fa' }}></span>
              3 requests pending approval
            </div>
          </div>

          {/* Card 5: Audit Trails (wide) */}
          <div className="feature-card wide fade-in-up" style={{ transitionDelay: '0.25s' }}>
            <div className="card-icon">&#128269;</div>
            <h3>Immutable Audit Trails</h3>
            <p style={{ maxWidth: '520px' }}>Every action — every allocation, transfer, and maintenance update — is logged immutably. Full <span>compliance</span> and accountability at every step.</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 20px', minWidth: '140px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Asset Allocated</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>MacBook Pro #42 &#8594; Design Team</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 20px', minWidth: '140px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Maintenance Done</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Server Rack #7 &#8212; Serviced</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 20px', minWidth: '140px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Booking Created</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Projector B &#8594; Floor 3</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 20px', minWidth: '140px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Role Promoted</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>alex@corp.io &#8594; Admin</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header fade-in-up">
          <h2>Get started in minutes</h2>
          <p>Three simple steps to have your entire asset inventory under control.</p>
        </div>
        <div className="steps">
          <div className="step fade-in-up" style={{ transitionDelay: '0.05s' }}>
            <div className="step-number">01</div>
            <h3>Register Your Assets</h3>
            <p>Import or manually add every asset — hardware, furniture, vehicles — with rich metadata, categories, and departments.</p>
          </div>
          <div className="step fade-in-up" style={{ transitionDelay: '0.12s' }}>
            <div className="step-number">02</div>
            <h3>Allocate &amp; Book</h3>
            <p>Assign assets to employees or book shared resources. Our engine prevents conflicts automatically before they occur.</p>
          </div>
          <div className="step fade-in-up" style={{ transitionDelay: '0.18s' }}>
            <div className="step-number">03</div>
            <h3>Audit &amp; Report</h3>
            <p>Every action is logged. Generate compliance reports, track asset lifecycles, and stay audit-ready at all times.</p>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="pricing" id="pricing">
        <div className="section-header fade-in-up">
          <h2>Simple, transparent pricing</h2>
          <p>Start free. Scale as your organization grows.</p>
        </div>
        <div className="pricing-cards">
          <div className="pricing-card fade-in-up" style={{ transitionDelay: '0.05s' }}>
            <div className="plan-name">Starter</div>
            <div className="plan-price"><sup>$</sup>0</div>
            <div className="plan-period">Free forever</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>Up to 100 assets</li>
              <li>5 team members</li>
              <li>Basic allocation engine</li>
              <li>Audit logs (30 days)</li>
            </ul>
            <button className="btn-plan">Get Started Free</button>
          </div>
          <div className="pricing-card highlighted fade-in-up" style={{ transitionDelay: '0.1s' }}>
            <div className="plan-name">Enterprise</div>
            <div className="plan-price"><sup>$</sup>49</div>
            <div className="plan-period">per seat / month</div>
            <div className="plan-divider"></div>
            <ul className="plan-features">
              <li>Unlimited assets</li>
              <li>Unlimited members</li>
              <li>Smart conflict engine</li>
              <li>Full audit trails</li>
              <li>Maintenance workflows</li>
              <li>Priority support</li>
            </ul>
            <button className="btn-plan">Start Free Trial</button>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="cta-section" id="contact">
        <div className="cta-box fade-in-up">
          <h2>Ready to take control of your assets?</h2>
          <p>Join hundreds of organizations that trust AssetFlow to manage their entire asset lifecycle — from registration to retirement.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn-hero-primary">Start for Free &rarr;</Link>
            <Link href="#contact" className="btn-hero-secondary">Book a Demo</Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer>
        <Link href="#" className="footer-brand">
          <div className="footer-logo">AF</div>
          <span className="footer-name">AssetFlow</span>
        </Link>
        <div className="footer-links">
          <Link href="#">Features</Link>
          <Link href="#">Pricing</Link>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
        </div>
        <p className="footer-copy">&copy; 2026 AssetFlow &middot; Runtime Terror</p>
      </footer>
    </>
  );
}
