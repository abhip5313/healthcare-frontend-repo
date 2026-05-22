import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// ── Animated Counter ──────────────────────────────────────────────────────────
function Counter({ end, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = performance.now();
        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * end));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Floating Pulse Orb ────────────────────────────────────────────────────────
function PulseOrb({ size, top, left, delay, opacity }) {
  return (
    <div
      style={{
        position: 'absolute', width: size, height: size,
        top, left, opacity,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, rgba(14,165,233,0.1) 60%, transparent 100%)',
        animation: `pulse-orb 4s ease-in-out ${delay} infinite`,
        pointerEvents: 'none',
      }}
    />
  );
}

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: '🏥',
      title: 'Hospital Network',
      desc: 'Access a verified network of hospitals and clinics. Find the right facility for every need, close to you.',
      color: '#0ea5e9',
    },
    {
      icon: '👨‍⚕️',
      title: 'Expert Drs & Specialists',
      desc: 'Browse specialists across every field. Read reviews, check availability, and book in seconds.',
      color: '#6366f1',
    },
    {
      icon: '📅',
      title: 'Smart Appointments',
      desc: 'Schedule, reschedule, or cancel appointments effortlessly. Get reminders and never miss a visit.',
      color: '#10b981',
    },
    {
      icon: '💊',
      title: 'Digital Prescriptions',
      desc: 'Receive and store prescriptions digitally. Share with pharmacies instantly, no paper needed.',
      color: '#f59e0b',
    },
    {
      icon: '📋',
      title: 'Medical Records',
      desc: 'All your health history in one secure place. Upload, organize, and share records with your care team.',
      color: '#ec4899',
    },
    {
      icon: '🎥',
      title: 'Video Consultations',
      desc: 'Meet your doctor face-to-face from anywhere. High-quality video calls with built-in chat support.',
      color: '#8b5cf6',
    },
  ];

  const stats = [
    { value: 500, suffix: '+', label: 'Verified Doctors' },
    { value: 120, suffix: '+', label: 'Partner Hospitals' },
    { value: 50000, suffix: '+', label: 'Patients Served' },
    { value: 98, suffix: '%', label: 'Satisfaction Rate' },
  ];

  const steps = [
    { num: '01', title: 'Create Account', desc: 'Sign up in under 2 minutes. Verify your email and you\'re ready to go.' },
    { num: '02', title: 'Find Your Doctor', desc: 'Search by specialty, location, or hospital. Filter by availability and ratings.' },
    { num: '03', title: 'Book Appointment', desc: 'Choose a time slot that works for you. In-person or video consultation.' },
    { num: '04', title: 'Get Better Care', desc: 'Attend your appointment, receive prescriptions, and track your health journey.' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'DM Sans', sans-serif; background: #020c18; color: #e2e8f0; }

        @keyframes pulse-orb {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(60px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hero-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.03em;
        }
        .gradient-text {
          background: linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #34d399 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .btn-primary-home {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 100px;
          background: linear-gradient(135deg, #0ea5e9, #6366f1);
          color: white; font-weight: 600; font-size: 1rem;
          text-decoration: none; border: none; cursor: pointer;
          transition: all 0.3s ease; box-shadow: 0 0 32px rgba(14,165,233,0.35);
          font-family: 'DM Sans', sans-serif;
        }
        .btn-primary-home:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(14,165,233,0.55);
        }
        .btn-ghost-home {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 32px; border-radius: 100px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: white; font-weight: 500; font-size: 1rem;
          text-decoration: none; cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'DM Sans', sans-serif;
          backdrop-filter: blur(8px);
        }
        .btn-ghost-home:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }
        .feature-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 32px;
          transition: all 0.4s ease;
          cursor: default;
          position: relative; overflow: hidden;
          animation: fadeUp 0.6s ease both;
        }
        .feature-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 24px 48px rgba(0,0,0,0.3);
        }
        .step-card {
          display: flex; gap: 24px; align-items: flex-start;
          padding: 32px; border-radius: 20px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.3s ease;
          animation: fadeUp 0.6s ease both;
        }
        .step-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(14,165,233,0.2);
        }
        .nav-link {
          color: rgba(255,255,255,0.65); text-decoration: none;
          font-size: 0.9rem; font-weight: 500;
          transition: color 0.2s; padding: 6px 12px; border-radius: 8px;
        }
        .nav-link:hover { color: white; background: rgba(255,255,255,0.06); }
        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: 100px;
          background: rgba(14,165,233,0.1);
          border: 1px solid rgba(14,165,233,0.2);
          color: #38bdf8; font-size: 0.8rem; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          margin-bottom: 20px;
        }
        .grid-bg {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 8s linear infinite;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 5%',
        background: scrollY > 40 ? 'rgba(2,12,24,0.92)' : 'transparent',
        backdropFilter: scrollY > 40 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 40 ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition: 'all 0.4s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '72px',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(14,165,233,0.4)',
          }}>
            <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '1.2rem', color: 'white' }}>
            Health<span style={{ color: '#38bdf8' }}>Care</span>
          </span>
        </Link>

        {/* Nav Links — desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#stats" className="nav-link">About</a>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/login" className="btn-ghost-home" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn-primary-home" style={{ padding: '10px 22px', fontSize: '0.9rem' }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section style={{
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', textAlign: 'center',
        padding: '120px 5% 80px',
        background: 'radial-gradient(ellipse 120% 80% at 50% -10%, rgba(14,165,233,0.15) 0%, transparent 70%), #020c18',
      }}>
        {/* Grid background */}
        <div className="grid-bg" />

        {/* Orbs */}
        <PulseOrb size="600px" top="-100px" left="-200px" delay="0s" opacity={0.15} />
        <PulseOrb size="400px" top="200px" left="70%" delay="1.5s" opacity={0.12} />
        <PulseOrb size="300px" top="60%" left="10%" delay="3s" opacity={0.1} />

        {/* Floating ring decoration */}
        <div style={{
          position: 'absolute', width: 500, height: 500,
          borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.12)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          animation: 'spin-slow 30s linear infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', width: 700, height: 700,
          borderRadius: '50%',
          border: '1px solid rgba(14,165,233,0.07)',
          top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          animation: 'spin-slow 50s linear infinite reverse',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 800, animation: 'fadeUp 0.8s ease both' }}>
          {/* Badge */}
          <div className="section-tag" style={{ marginBottom: 28 }}>
            <span>✦</span> India's Trusted Healthcare Platform
          </div>

          <h1 className="hero-title" style={{ color: 'white', marginBottom: 24 }}>
            Your Health,{' '}
            <span className="gradient-text">Simplified</span>
            <br />& Secure
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'rgba(226,232,240,0.65)',
            lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px',
            fontWeight: 300,
          }}>
            Connect with verified doctors, book appointments, manage prescriptions,
            and access your complete health records — all in one place.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary-home">
              Start for Free
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/login" className="btn-ghost-home">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{
            marginTop: 52, display: 'flex', gap: 32, justifyContent: 'center',
            flexWrap: 'wrap', color: 'rgba(226,232,240,0.4)', fontSize: '0.82rem', fontWeight: 500,
          }}>
            {['🔒 End-to-end encrypted', '✅ HIPAA Compliant', '⚡ Available 24/7'].map(b => (
              <span key={b}>{b}</span>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.25)', fontSize: '0.72rem', letterSpacing: '0.1em',
          animation: 'float 2s ease-in-out infinite',
        }}>
          <span>SCROLL</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section id="stats" style={{
        padding: '80px 5%', background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 40, textAlign: 'center',
        }}>
          {stats.map(({ value, suffix, label }) => (
            <div key={label}>
              <div style={{
                fontFamily: 'Bricolage Grotesque', fontSize: 'clamp(2.4rem, 5vw, 3.5rem)',
                fontWeight: 800, color: 'white', lineHeight: 1,
                background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                <Counter end={value} suffix={suffix} />
              </div>
              <div style={{ color: 'rgba(226,232,240,0.5)', fontSize: '0.9rem', marginTop: 8, fontWeight: 400 }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" style={{ padding: '100px 5%', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="section-tag">Features</div>
          <h2 style={{
            fontFamily: 'Bricolage Grotesque', fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 700, color: 'white', lineHeight: 1.15,
          }}>
            Everything you need for<br />
            <span className="gradient-text">better healthcare</span>
          </h2>
          <p style={{ color: 'rgba(226,232,240,0.5)', marginTop: 16, fontSize: '1rem', fontWeight: 300 }}>
            A complete platform built for patients, doctors, and hospitals alike.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {features.map((f, i) => (
            <div key={f.title} className="feature-card" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, marginBottom: 20,
                background: `${f.color}18`,
                border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.6rem',
              }}>
                {f.icon}
              </div>
              <h3 style={{
                fontFamily: 'Bricolage Grotesque', fontWeight: 700,
                fontSize: '1.15rem', color: 'white', marginBottom: 10,
              }}>
                {f.title}
              </h3>
              <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '0.9rem', lineHeight: 1.65, fontWeight: 300 }}>
                {f.desc}
              </p>
              <div style={{
                marginTop: 20, display: 'flex', alignItems: 'center', gap: 6,
                color: f.color, fontSize: '0.82rem', fontWeight: 600,
              }}>
                Learn more
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" style={{
        padding: '100px 5%',
        background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div className="section-tag">How It Works</div>
            <h2 style={{
              fontFamily: 'Bricolage Grotesque', fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700, color: 'white', lineHeight: 1.15,
            }}>
              Up and running in{' '}
              <span className="gradient-text">4 simple steps</span>
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.map((s, i) => (
              <div key={s.num} className="step-card" style={{ animationDelay: `${i * 0.12}s` }}>
                <div style={{
                  fontFamily: 'Bricolage Grotesque', fontSize: '2.2rem',
                  fontWeight: 800, lineHeight: 1,
                  background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  minWidth: 60,
                }}>
                  {s.num}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: '1.1rem', color: 'white', marginBottom: 6 }}>
                    {s.title}
                  </h3>
                  <p style={{ color: 'rgba(226,232,240,0.5)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 300 }}>
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        padding: '80px 5%', textAlign: 'center',
        background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(14,165,233,0.1) 0%, transparent 70%)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: 'Bricolage Grotesque', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 700, color: 'white', lineHeight: 1.2, marginBottom: 16,
          }}>
            Take control of your health today
          </h2>
          <p style={{ color: 'rgba(226,232,240,0.5)', marginBottom: 36, fontWeight: 300, fontSize: '1rem' }}>
            Join thousands of patients and doctors already using HealthCare Platform.
            Free to sign up, no credit card required.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary-home">
              Create Free Account
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link to="/login" className="btn-ghost-home">
              Already a member? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: '40px 5% 32px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, color: 'white', fontSize: '1rem' }}>
            Health<span style={{ color: '#38bdf8' }}>Care</span>
          </span>
        </div>
        <p style={{ color: 'rgba(226,232,240,0.3)', fontSize: '0.82rem' }}>
          © {new Date().getFullYear()} HealthCare Platform. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Terms', 'Support'].map(l => (
            <a key={l} href="#" style={{ color: 'rgba(226,232,240,0.35)', fontSize: '0.82rem', textDecoration: 'none' }}
               onMouseOver={e => e.target.style.color = 'rgba(226,232,240,0.7)'}
               onMouseOut={e => e.target.style.color = 'rgba(226,232,240,0.35)'}>
              {l}
            </a>
          ))}
        </div>
      </footer>
    </>
  );
}