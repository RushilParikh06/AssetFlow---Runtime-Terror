"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type View = "login" | "signup" | "signup-success" | "forgot" | "forgot-success";

export default function AuthPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("employee");

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = !isValidEmail(email);
    const passOk = !password;
    
    setErrors({
      loginEmail: emailOk,
      loginPassword: passOk,
    });

    if (!emailOk && !passOk) {
      // Mock login - redirect to dashboard
      router.push("/screen-3");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const nameOk = !name;
    const emailOk = !isValidEmail(email);
    const orgOk = !org;
    const passOk = password.length < 8;
    const confirmOk = password !== confirm;

    setErrors({
      signupName: nameOk,
      signupEmail: emailOk,
      signupOrg: orgOk,
      signupPassword: passOk,
      signupConfirm: confirmOk,
    });

    if (!nameOk && !emailOk && !orgOk && !passOk && !confirmOk) {
      setView("signup-success");
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    const emailOk = !isValidEmail(email);
    setErrors({ forgotEmail: emailOk });

    if (!emailOk) {
      setView("forgot-success");
    }
  };

  return (
    <>
      <div className="auth-bg"></div>

      {/* ─── NAV ─── */}
      <header className="auth-nav">
        <Link href="/" className="nav-brand">
          <div className="nav-logo">AF</div>
          <span className="nav-brand-name">AssetFlow</span>
        </Link>
        <Link href="/" className="nav-back">&larr; Back to home</Link>
      </header>

      <main className="auth-page">
        {/* ═══ LOGIN ═══ */}
        {view === "login" && (
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-avatar">AF</div>
              <h1>Welcome back</h1>
              <p>Sign in to your <span>AssetFlow</span> account</p>
            </div>

            <form className="auth-form" onSubmit={handleLogin} noValidate>
              <div className={`form-group ${errors.loginEmail ? 'has-error' : ''}`}>
                <label>Email address</label>
                <input 
                  type="email" 
                  className={`form-input ${errors.loginEmail ? 'error' : ''}`} 
                  placeholder="you@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="form-error">Please enter a valid email address</span>
              </div>

              <div className={`form-group ${errors.loginPassword ? 'has-error' : ''}`}>
                <label>Password</label>
                <div className="password-wrap">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`form-input ${errors.loginPassword ? 'error' : ''}`} 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '\u{1F648}' : '\u{1F441}'}
                  </button>
                </div>
                <span className="form-error">Password is required</span>
              </div>

              <div className="form-row">
                <span></span>
                <span className="form-link" onClick={() => setView("forgot")}>Forgot password?</span>
              </div>

              <button type="submit" className="btn-primary auth">Sign In</button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <div className="info-card">
              <h3>New here?</h3>
              <p>Create an account to start managing your organization&apos;s assets in minutes.</p>
              <button type="button" className="btn-secondary auth" onClick={() => setView("signup")}>Create Account</button>
            </div>
          </div>
        )}

        {/* ═══ SIGNUP ═══ */}
        {view === "signup" && (
          <div className="auth-card wide">
            <div className="auth-header">
              <div className="auth-avatar">+</div>
              <h1>Create your account</h1>
              <p>Join <span>AssetFlow</span> and take control of your assets</p>
            </div>

            <form className="auth-form" onSubmit={handleSignup} noValidate>
              <div className={`form-group ${errors.signupName ? 'has-error' : ''}`}>
                <label>Full name</label>
                <input 
                  type="text" 
                  className={`form-input ${errors.signupName ? 'error' : ''}`} 
                  placeholder="Alex Morgan" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <span className="form-error">Name is required</span>
              </div>

              <div className={`form-group ${errors.signupEmail ? 'has-error' : ''}`}>
                <label>Work email</label>
                <input 
                  type="email" 
                  className={`form-input ${errors.signupEmail ? 'error' : ''}`} 
                  placeholder="alex@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="form-error">Please enter a valid email address</span>
              </div>

              <div className={`form-group ${errors.signupOrg ? 'has-error' : ''}`}>
                <label>Organization name</label>
                <input 
                  type="text" 
                  className={`form-input ${errors.signupOrg ? 'error' : ''}`} 
                  placeholder="Acme Corporation" 
                  value={org}
                  onChange={(e) => setOrg(e.target.value)}
                />
                <span className="form-error">Organization name is required</span>
              </div>

              <div className={`form-group ${errors.signupPassword ? 'has-error' : ''}`}>
                <label>Password</label>
                <div className="password-wrap">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    className={`form-input ${errors.signupPassword ? 'error' : ''}`} 
                    placeholder="Min. 8 characters" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '\u{1F648}' : '\u{1F441}'}
                  </button>
                </div>
                <span className="form-error">Password must be at least 8 characters</span>
              </div>

              <div className={`form-group ${errors.signupConfirm ? 'has-error' : ''}`}>
                <label>Confirm password</label>
                <div className="password-wrap">
                  <input 
                    type={showConfirm ? "text" : "password"} 
                    className={`form-input ${errors.signupConfirm ? 'error' : ''}`} 
                    placeholder="Re-enter your password" 
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                  <button type="button" className="toggle-password" onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? '\u{1F648}' : '\u{1F441}'}
                  </button>
                </div>
                <span className="form-error">Passwords do not match</span>
              </div>

              <div className="form-group">
                <label>Role</label>
                <select className="form-input form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="auditor">Auditor</option>
                </select>
                <div className="role-note">
                  <span className="role-badge">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                  Admin roles are assigned by your organization later
                </div>
              </div>

              <button type="submit" className="btn-primary auth">Create Account</button>
            </form>

            <p className="auth-footer-link">
              Already have an account? <span onClick={() => setView("login")}>Sign in</span>
            </p>
          </div>
        )}

        {/* ═══ SIGNUP SUCCESS ═══ */}
        {view === "signup-success" && (
          <div className="auth-card">
            <div className="auth-header">
              <div className="success-icon">&#9993;</div>
              <h1>Check your inbox</h1>
              <p>We&apos;ve sent a verification link to your email</p>
            </div>

            <div className="success-note">
              Click the link in your email to verify your account, then <strong>sign in</strong> to access your dashboard.
            </div>

            <div style={{ marginTop: '24px' }}>
              <button type="button" className="btn-primary auth" onClick={() => setView("login")}>Back to Sign In</button>
            </div>
          </div>
        )}

        {/* ═══ FORGOT PASSWORD ═══ */}
        {view === "forgot" && (
          <div className="auth-card">
            <div className="auth-header">
              <div className="auth-avatar">?</div>
              <h1>Reset password</h1>
              <p>Enter your email and we&apos;ll send you a reset link</p>
            </div>

            <form className="auth-form" onSubmit={handleForgot} noValidate>
              <div className={`form-group ${errors.forgotEmail ? 'has-error' : ''}`}>
                <label>Email address</label>
                <input 
                  type="email" 
                  className={`form-input ${errors.forgotEmail ? 'error' : ''}`} 
                  placeholder="you@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <span className="form-error">Please enter a valid email address</span>
              </div>

              <button type="submit" className="btn-primary auth">Send Reset Link</button>
            </form>

            <p className="auth-footer-link">
              Remember your password? <span onClick={() => setView("login")}>Back to Sign In</span>
            </p>
          </div>
        )}

        {/* ═══ FORGOT SUCCESS ═══ */}
        {view === "forgot-success" && (
          <div className="auth-card">
            <div className="auth-header">
              <div className="success-icon">&#10003;</div>
              <h1>Check your inbox</h1>
              <p>Password reset link sent successfully</p>
            </div>

            <div className="success-note">
              If an account exists for that email, you&apos;ll receive a link to reset your password shortly.
            </div>

            <div style={{ marginTop: '24px' }}>
              <button type="button" className="btn-primary auth" onClick={() => setView("login")}>Back to Sign In</button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
