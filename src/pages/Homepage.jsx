import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from 'react-router-dom';
import HeroFeatureImage from '../assets/logo.jpeg';

const Homepage = () => {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    about: false,
    features: false,
    workflow: false,
    whyChoose: false,
    vision: false,
    contact: false
  });

  const [activeSection, setActiveSection] = useState('hero');
  const observerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const navigate = useNavigate();

  // Advanced color palette with gradients
  const colors = {
  // 🔵 Primary Blues
  primary: '#38bdf8',        // Light Blue (main highlight color)
  primaryDark: '#0a1f44',    // Deep Dark Blue
  primaryLight: '#bae6fd',   // Very Light Blue accents

  // 🔷 Secondary / Accent Blues
  secondary: '#60a5fa',      // Medium Blue
  accent: '#2563eb',         // Strong Blue for buttons & focus states

  // ✅ Status Colors
  success: '#10b981',        // Green (unchanged – good UX)
  warning: '#f59e0b',        // Orange for warnings

  // ⚫ Neutral Colors
  light: '#f8fafc',          // Soft light background
  dark: '#020617',           // Very dark blue (text / background)
  white: '#ffffff',
  gray: '#64748b',           // Neutral gray text

  // 🌈 Gradients (Dark Blue + Light Blue)
  gradientHero: 'linear-gradient(135deg, #0a1f44 0%, #38bdf8 100%)',
  gradientNav: 'linear-gradient(90deg, #020617 0%, #2563eb 100%)',
  gradientCard: 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
  gradientAccent: 'linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)'
};


  // Particle system for hero background
  const ParticleBackground = () => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      let animationId;

      const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      };

      class Particle {
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.size = Math.random() * 2 + 1;
          this.speedX = Math.random() * 0.5 - 0.25;
          this.speedY = Math.random() * 0.5 - 0.25;
          this.color = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
        }

        update() {
          this.x += this.speedX;
          this.y += this.speedY;

          if (this.x > canvas.width) this.x = 0;
          if (this.x < 0) this.x = canvas.width;
          if (this.y > canvas.height) this.y = 0;
          if (this.y < 0) this.y = canvas.height;
        }

        draw() {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const initParticles = () => {
        particlesRef.current = [];
        for (let i = 0; i < 50; i++) {
          particlesRef.current.push(new Particle());
        }
      };

      const animateParticles = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particlesRef.current.forEach(particle => {
          particle.update();
          particle.draw();
        });

        // Draw connections
        particlesRef.current.forEach((a, i) => {
          particlesRef.current.slice(i + 1).forEach(b => {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - distance / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          });
        });

        animationId = requestAnimationFrame(animateParticles);
      };

      resizeCanvas();
      initParticles();
      animateParticles();

      window.addEventListener('resize', resizeCanvas);

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resizeCanvas);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      />
    );
  };

  // Enhanced scroll animations
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[data-section]');
      const scrollPos = window.scrollY + 100;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
          setActiveSection(sectionId);
        }
      });
    };

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({
              ...prev,
              [entry.target.dataset.section]: true
            }));
          }
        });
      },
      { 
        threshold: 0.3,
        rootMargin: '-50px 0px -50px 0px'
      }
    );

    const sections = document.querySelectorAll('[data-section]');
    sections.forEach(section => observerRef.current.observe(section));

    window.addEventListener('scroll', handleScroll);
    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener('scroll', handleScroll);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Smooth scroll with offset for fixed navbar
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  // Advanced animation styles
  const styles = {
    hero: {
      background: colors.gradientHero,
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    },
    navbar: {
      background: colors.gradientNav,
      backdropFilter: 'blur(20px)',
      borderBottom: `1px solid rgba(255,255,255,0.1)`,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    card: {
      background: colors.gradientCard,
      border: `1px solid rgba(255,255,255,0.2)`,
      borderRadius: '20px',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)'
    },
    cardHover: {
      transform: 'translateY(-15px) scale(1.02)',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
      borderColor: 'rgba(255,255,255,0.3)'
    },
    gradientText: {
      background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    },
    floatingAnimation: {
      animation: 'float 6s ease-in-out infinite'
    },
    glowEffect: {
      filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
    }
  };

  // Enhanced feature data with icons and colors
  const features = [
    {
      icon: '⚡',
      title: 'Automated Claim Processing',
      description: 'Reduce manual workload and turnaround time with intelligent automation',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: '90% Faster'
    },
    {
      icon: '🧠',
      title: 'Smart Policy Management',
      description: 'Centralized control for HR and administrators with real-time updates',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      stats: 'AI Powered'
    },
    {
      icon: '👁️',
      title: 'Employee Transparency',
      description: 'Real-time claim tracking and instant notifications for all stakeholders',
      gradient: 'linear-gradient(135deg,#667eea 0%, #764ba2 100%)',
      stats: '100% Visible'
    },
    {
      icon: '🛡️',
      title: 'AI-Powered Fraud Detection',
      description: 'Identify anomalies before they impact finances with machine learning',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      stats: '99% Accurate'
    },
    {
      icon: '📊',
      title: 'Analytics & Insights',
      description: 'Data-driven decisions with comprehensive visual dashboards',
      gradient: 'linear-gradient(135deg,#667eea 0%, #764ba2 100%)',
      stats: 'Real-time Data'
    },
    {
      icon: '🔧',
      title: 'Custom Workflows',
      description: 'Tailored processes that match your organizational structure',
      gradient: 'linear-gradient(135deg,#43e97b 0%, #38f9d7 100%)',
      stats: 'Flexible'
    }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'hidden', background: colors.light }}>
      {/* Enhanced Navigation Bar */}
 {/* ✨ Enhanced Navigation Bar with Distinct Branding and Contrast */}
<nav 
  className="navbar navbar-expand-lg fixed-top"
  style={{
    top: '15px',
    margin: '0 20px',
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    zIndex: 1000
  }}
>
  <div className="container-fluid px-4">
    {/* 🔹 Brand Logo with Authentication Shield Symbol */}
    <a 
      className="navbar-brand d-flex align-items-center" 
      href="#" 
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        width: '38px',
        height: '38px',
        background: 'linear-gradient(135deg, #00b4d8, #00f5d4)',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: '12px',
        boxShadow: '0 0 15px rgba(0, 245, 212, 0.4)'
      }}>
        {/* Shield Authentication Icon */}
        <svg 
          width="22" 
          height="22" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          <path d="M9 12l2 2 4-4"></path>
        </svg>
      </div>
      <span style={{ fontSize: '1.6rem', letterSpacing: '-0.5px', color: '#ffffff', fontFamily: 'sans-serif' }}>
        <b style={{ fontWeight: '800' }}>Insur</b>
        <span style={{ fontWeight: '200', color: 'rgba(255,255,255,0.8)' }}>AI</span>
      </span>
    </a>

    {/* 🔸 Toggler for Mobile */}
    <button 
      className="navbar-toggler" 
      type="button" 
      data-bs-toggle="collapse" 
      data-bs-target="#navbarNav"
      style={{ filter: 'invert(1)', border: 'none' }}
    >
      <span className="navbar-toggler-icon"></span>
    </button>

    <div className="collapse navbar-collapse" id="navbarNav">
      <ul className="navbar-nav ms-auto gap-1">
        {['about', 'features', 'workflow', 'why-choose', 'vision', 'contact'].map((section) => (
          <li key={section} className="nav-item">
            <button
              className="nav-link btn btn-link px-3 py-2"
              onClick={() => scrollToSection(section)}
              style={{
                color: activeSection === section ? "#00f5d4" : "rgba(255,255,255,0.7)",
                fontSize: '0.9rem',
                fontWeight: activeSection === section ? "600" : "400",
                textTransform: 'uppercase',
                letterSpacing: '1px',
                background: activeSection === section ? 'rgba(0, 245, 212, 0.1)' : 'transparent',
                borderRadius: '8px',
                border: 'none',
                transition: 'all 0.3s ease'
              }}
            >
              {section.replace('-', ' ')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  </div>
</nav>

 {/* Enhanced Hero Section with Particles */}
<section 
  id="hero"
  data-section="hero"
  style={{
    ...styles.hero,
    /* 🎨 Updated Background Shade: Deep Blue to Dark Midnight Gradient */
    background: 'linear-gradient(145deg, #0f172a 0%, #020617 100%)', 
    overflow: 'hidden',
    minHeight: '100vh'
  }}
  className="d-flex align-items-center justify-content-center text-white position-relative"
>
  <ParticleBackground />
  
  <div className="container-fluid px-lg-5 position-relative" style={{ zIndex: 10 }}>
    <div className="row align-items-center justify-content-center">
      
      {/* 🔹 LEFT SIDE: Professional Title & Enhanced Info */}
      <div className="col-lg-4 text-start">
        <div style={{
           opacity: isVisible.hero ? 1 : 0,
           transform: isVisible.hero ? 'translateX(0)' : 'translateX(-50px)',
           transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: '1.1', fontWeight: '800' }}>
            Insur<span style={{ color: '#06b6d4' }}>Ai</span>
          </h1>
          <div style={{ width: '50px', height: '4px', background: '#3b82f6', margin: '20px 0' }}></div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '300', letterSpacing: '1px', color: '#06b6d4' }}>
            Corporate Automation & <br /> Intelligence System
          </h2>
          
          {/* Enhanced Paragraph Information */}
          <p className="mt-4" style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', textAlign: 'justify' }}>
            InsurAi is a cutting-edge ecosystem designed to revolutionize corporate insurance management. 
            By integrating **real-time risk assessment**, **automated claim processing**, and **AI-driven policy analytics**, 
            we bridge the gap between complex insurance data and actionable intelligence. Our system ensures 
            unmatched transparency and operational efficiency for every stakeholder in your organization.
          </p>
          
          <div className="d-flex gap-2 mt-3">
             <span className="badge rounded-pill bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 px-3 py-2">Safe</span>
             <span className="badge rounded-pill bg-info bg-opacity-25 text-info border border-info border-opacity-25 px-3 py-2">Smart</span>
             <span className="badge rounded-pill bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-2">Secure</span>
          </div>
        </div>
      </div>

      {/* 🔹 CENTER: Static Circular Image */}
      <div className="col-lg-4 d-flex justify-content-center">
        <div style={{
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.4), rgba(59, 130, 246, 0.4))',
          boxShadow: '0 0 80px rgba(6, 182, 212, 0.2)',
          zIndex: 5
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '6px solid rgba(255, 255, 255, 0.05)',
            background: '#020617'
          }}>
            <img
              src={HeroFeatureImage}
              alt="InsurAi Ecosystem"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      {/* 🔹 RIGHT SIDE: Modern Login Buttons */}
      <div className="col-lg-4 text-end">
        <div className="d-flex flex-column gap-3 align-items-end" style={{
           opacity: isVisible.hero ? 1 : 0,
           transform: isVisible.hero ? 'translateX(0)' : 'translateX(50px)',
           transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {[
            { label: 'Employee', path: '/employee/register', icon: '👤' },
            { label: 'Admin', path: '/admin/login', icon: '🛡️' },
            { label: 'Agent', path: '/agent/login', icon: '💼' },
            { label: 'HR Portal', path: '/hr/login', icon: '🏢' }
          ].map((role) => (
            <button
              key={role.label}
              onClick={() => navigate(role.path)}
              className="btn d-flex align-items-center justify-content-between px-4"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                width: '260px',
                height: '65px',
                color: '#fff',
                fontSize: '1.05rem',
                fontWeight: '600',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)';
                e.currentTarget.style.transform = 'scale(1.05) translateX(-10px)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(6, 182, 212, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.transform = 'scale(1) translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <span style={{ fontSize: '1.3rem' }}>{role.icon}</span>
                <span>{role.label}</span>
              </div>
              <span style={{ opacity: 0.5 }}>→</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  </div>

  {/* Scroll indicator */}
  <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', opacity: 0.4 }}>
    <div className="text-uppercase small mb-1" style={{ letterSpacing: '3px', fontSize: '0.7rem' }}>Intelligence in Motion</div>
    <div style={{ animation: 'bounce 2s infinite', fontSize: '1.2rem', textAlign: 'center' }}>↓</div>
  </div>
</section>
      {/* Enhanced About Section */}
     <section 
  id="about" 
  data-section="about"
  className="py-5 position-relative"
  style={{ background: '#ffffff', overflow: 'hidden' }} // Pure White Background
>
  {/* 🎨 Subtle Light Blue Decorative Background Shape */}
  <div style={{
    position: 'absolute', top: '10%', right: '-5%', width: '400px', height: '400px',
    background: 'radial-gradient(circle, #f0f9ff 0%, transparent 70%)',
    zIndex: 1
  }}></div>

  <div className="container position-relative" style={{ zIndex: 10 }}>
    <div className="row g-4 align-items-stretch">
      
      {/* 🔹 Large Premium Card (Left Side) */}
      <div className="col-lg-7">
        <div style={{
          height: '100%', padding: '60px 45px', borderRadius: '32px',
          background: '#f8fafc', // Very Light Gray-Blue
          border: '1px solid #e2e8f0',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          transition: 'all 0.4s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.05)'}
        onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
        >
          <h6 className="fw-bold text-uppercase mb-3" style={{ color: '#3b82f6', letterSpacing: '4px', fontSize: '0.8rem' }}>
            The Intelligent Core
          </h6>
          <h2 className="display-4 fw-bold mb-4" style={{ color: '#0f172a', lineHeight: '1.1' }}>
            Insurance <span style={{ color: '#1e3a8a' }}>Automated</span> <br /> beyond limits.
          </h2>
          <p className="lead mb-4" style={{ color: '#475569', fontSize: '1.15rem', lineHeight: '1.8' }}>
            InsurAi replaces outdated legacy systems with a powerful infrastructure 
            designed to handle complex corporate policies with zero manual friction.
          </p>
          
          <div className="d-flex gap-5 mt-2">
            <div>
              <h3 className="fw-bold mb-0" style={{ color: '#1e3a8a' }}>90%</h3>
              <small className="text-muted fw-semibold">Faster Approvals</small>
            </div>
            <div style={{ width: '1px', background: '#cbd5e1' }}></div>
            <div>
              <h3 className="fw-bold mb-0" style={{ color: '#1e3a8a' }}>100%</h3>
              <small className="text-muted fw-semibold">Data Integrity</small>
            </div>
          </div>
        </div>
      </div>

      {/* 🔹 Right Side Grid (Bento Boxes) */}
      <div className="col-lg-5">
        <div className="row g-4 h-100">
          
          {/* Card 1: AI Processing */}
          <div className="col-12">
            <div style={{
              padding: '35px', borderRadius: '28px', background: '#1e3a8a', // Dark Navy
              color: '#ffffff', height: '100%', boxShadow: '0 15px 30px rgba(30, 58, 138, 0.15)'
            }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <span style={{ fontSize: '2rem' }}>🧠</span>
                <h5 className="fw-bold mb-0">Neural Processing</h5>
              </div>
              <p className="opacity-75 mb-0" style={{ fontSize: '0.95rem' }}>
                Advanced AI algorithms that validate policies and assess risks in milliseconds.
              </p>
            </div>
          </div>

          {/* Card 2: Security (Light Shade) */}
          <div className="col-md-6">
            <div style={{
              padding: '30px', borderRadius: '24px', background: '#f1f5f9',
              border: '1px solid #e2e8f0', height: '100%', textAlign: 'center'
            }}>
              <div className="mb-3" style={{ fontSize: '2.2rem' }}>🛡️</div>
              <h6 className="fw-bold" style={{ color: '#0f172a' }}>Secure</h6>
              <p className="small text-muted mb-0">Enterprise Encryption</p>
            </div>
          </div>

          {/* Card 3: Scale (Light Blue Shade) */}
          <div className="col-md-6">
            <div style={{
              padding: '30px', borderRadius: '24px', background: '#e0f2fe',
              border: '1px solid #bae6fd', height: '100%', textAlign: 'center'
            }}>
              <div className="mb-3" style={{ fontSize: '2.2rem' }}>📈</div>
              <h6 className="fw-bold" style={{ color: '#0369a1' }}>Scalable</h6>
              <p className="small text-muted mb-0">Global Node Growth</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</section>
      {/* Enhanced Features Section */}
     <section id="features" className="py-5" style={{ background: '#FFFFFF', overflow: 'hidden' }}>
  <div className="container py-5">
    
    {/* Header Section */}
    <div className="row align-items-end mb-5">
      <div className="col-lg-6">
        <div style={{ 
          color: '#3b82f6', 
          fontSize: '0.9rem', 
          fontWeight: '800', 
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}>
          Core Ecosystem
        </div>
        <h2 className="fw-bold display-4" style={{ color: '#0f172a', lineHeight: '1.2' }}>
          What <span style={{ color: '#1e3a8a' }}>InsurAI</span> <br /> Brings to the Table
        </h2>
      </div>
      <div className="col-lg-5 offset-lg-1">
        <p className="text-muted lead mb-0" style={{ borderLeft: '3px solid #3b82f6', paddingLeft: '20px' }}>
          We provide a comprehensive intelligence layer that transforms manual policy management into an autonomous digital experience.
        </p>
      </div>
    </div>

    {/* Feature Grid - Staggered Layout */}
    <div className="row g-4 mt-4">
      {features.map((feature, index) => (
        <div key={index} className="col-lg-4 col-md-6" style={{ 
          marginTop: index % 3 === 1 ? '40px' : '0px' // Creates the staggered/wave effect
        }}>
          <div 
            style={{ 
              background: '#FFFFFF',
              padding: '40px',
              borderRadius: '30px',
              border: '1px solid #f1f5f9',
              boxShadow: '0 10px 40px rgba(0,0,0,0.03)',
              height: '100%',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-15px)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(30, 58, 138, 0.1)';
              e.currentTarget.style.borderColor = '#3b82f633';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.03)';
              e.currentTarget.style.borderColor = '#f1f5f9';
            }}
          >
            {/* Background Decoration Circle */}
            <div style={{
              position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px',
              background: '#f0f9ff', borderRadius: '50%', zIndex: 0
            }}></div>

            {/* Icon Box */}
            <div className="mb-4 position-relative" style={{ zIndex: 1 }}>
              <div style={{
                width: '65px', height: '65px', background: '#1e3a8a', color: '#fff',
                borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', boxShadow: '0 10px 20px rgba(30, 58, 138, 0.2)'
              }}>
                {feature.icon}
              </div>
            </div>

            <h4 className="fw-bold mb-3 position-relative" style={{ color: '#0f172a', zIndex: 1 }}>
              {feature.title}
            </h4>
            <p className="text-muted mb-4 position-relative" style={{ fontSize: '1rem', lineHeight: '1.7', zIndex: 1 }}>
              {feature.description}
            </p>

            {/* Bottom Link/Stat */}
            <div className="mt-auto d-flex align-items-center gap-2" style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.85rem' }}>
              <span>EXPLORE CAPABILITY</span>
              <span style={{ transition: '0.3s' }}>→</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
      {/* Enhanced Target Audience Section */}
   <section className="py-5" style={{ background: '#FFFFFF', overflow: 'hidden' }}>
  <div className="container py-4">
    
    {/* --- Large Impact Header --- */}
    <div className="text-center mb-5">
      <h1 className="display-3 fw-bolder mb-2" style={{ color: '#0f172a', letterSpacing: '-1px' }}>
        Identity <span style={{ color: '#1e3a8a' }}>Infrastructure</span>
      </h1>
      <div style={{ height: '5px', width: '100px', background: '#1e3a8a', margin: '0 auto', borderRadius: '10px' }}></div>
      <p className="text-muted mt-3 fs-5">Centralized authentication and role-based access control.</p>
    </div>

    {/* --- Compact Hub Layout --- */}
    <div className="row justify-content-center align-items-center position-relative" style={{ minHeight: '450px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* 🛡️ Central Hub - Roles in Center */}
      <div className="position-absolute shadow-lg d-flex flex-column align-items-center justify-content-center text-center" style={{
        width: '120px', height: '120px', background: '#0f172a', 
        borderRadius: '50%', zIndex: 10, border: '6px solid #E1EFFF', 
        color: '#fff', boxShadow: '0 0 30px rgba(15, 23, 42, 0.2)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
      }}>
        <div style={{ fontSize: '1.8rem' }}>🛡️</div>
        <div style={{ fontSize: '1rem', fontWeight: '900', color: '#60a5fa', letterSpacing: '1px' }}>ROLES</div>
      </div>

      {/* 🔌 Connecting Lines */}
      <svg className="d-none d-lg-block position-absolute" style={{ width: '100%', height: '100%', zIndex: 0 }}>
        <line x1="25%" y1="15%" x2="50%" y2="50%" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="8" />
        <line x1="75%" y1="15%" x2="50%" y2="50%" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="8" />
        <line x1="25%" y1="85%" x2="50%" y2="50%" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="8" />
        <line x1="75%" y1="85%" x2="50%" y2="50%" stroke="#1e3a8a" strokeWidth="2" strokeDasharray="8" />
      </svg>

      {/* --- Four Role Squares (Compact) --- */}
      {[
        { icon: '👨‍💼', title: 'Employees', pos: { top: '0%', left: '10%' }, desc: 'Self-service portal' },
        { icon: '👥', title: 'HR Teams', pos: { top: '0%', right: '10%' }, desc: 'Admin control' },
        { icon: '🤝', title: 'Agents', pos: { bottom: '0%', left: '10%' }, desc: 'Sales tools' },
        { icon: '🏢', title: 'Enterprises', pos: { bottom: '0%', right: '10%' }, desc: 'Compliance hub' }
      ].map((item, index) => (
        <div key={index} className="col-lg-3 col-md-6 position-lg-absolute" style={{ 
          zIndex: 5, 
          position: 'absolute',
          top: item.pos.top, left: item.pos.left, right: item.pos.right, bottom: item.pos.bottom
        }}>
          <div 
            style={{
              background: '#ffffff',
              padding: '20px',
              borderRadius: '16px', 
              width: '170px',
              height: '170px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              border: '3px solid #1e3a8a',
              boxShadow: '0 10px 25px rgba(30, 58, 138, 0.08)',
              transition: 'all 0.4s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px) scale(1.03)';
              e.currentTarget.style.background = '#1e3a8a';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.querySelector('.small-desc').style.color = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.color = '#000000';
              e.currentTarget.querySelector('.small-desc').style.color = '#6c757d';
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{item.icon}</div>
            <h6 className="fw-bold mb-1">{item.title}</h6>
            <p className="small-desc mb-0" style={{ fontSize: '0.75rem', color: '#6c757d', transition: '0.3s' }}>
              {item.desc}
            </p>
          </div>
        </div>
      ))}

    </div>
  </div>
</section>
      {/* Enhanced How It Works Section */}
     <section id="workflow" className="py-5" style={{ background: '#FFFFFF', overflow: 'hidden' }}>
  <div className="container py-5">
    
    {/* Header */}
    <div className="text-center mb-5">
      <h2 className="display-5 fw-bold" style={{ color: '#0f172a' }}>
        Automated <span style={{ color: '#1e3a8a' }}>Workflow</span>
      </h2>
      <p className="text-muted">A seamless journey from submission to settlement</p>
    </div>

    <div className="position-relative mt-5">
      
      {/* 🚀 The Animated Winding Arrow Path (Desktop Only) */}
      <svg className="d-none d-lg-block" style={{
        position: 'absolute',
        top: '40px',
        left: '5%',
        width: '90%',
        height: '120px',
        zIndex: 0
      }} viewBox="0 0 1000 100">
        <path 
          d="M0,50 L200,50 L250,50 L450,50 L500,50 L700,50 L750,50 L950,50" 
          fill="none" 
          stroke="#E2E8F0" 
          strokeWidth="6" 
          strokeLinecap="round"
        />
        <path 
          d="M0,50 L200,50 L250,50 L450,50 L500,50 L700,50 L750,50 L950,50" 
          fill="none" 
          stroke="#1e3a8a" 
          strokeWidth="6" 
          strokeDasharray="1000"
          strokeDashoffset={isVisible.workflow ? "0" : "1000"}
          style={{ transition: 'stroke-dashoffset 3s ease-in-out' }}
          strokeLinecap="round"
        />
        {/* Dynamic Arrow Heads */}
        {[220, 470, 720, 970].map((pos, i) => (
          <polygon key={i} points={`${pos},40 ${pos+15},50 ${pos},60`} fill="#1e3a8a" />
        ))}
      </svg>

      <div className="row g-4 justify-content-between position-relative" style={{ zIndex: 1 }}>
        {[
          { step: '01', title: 'Submit', desc: 'Instant upload', icon: '📩' },
          { step: '02', title: 'Analyze', desc: 'AI Verification', icon: '⚙️' },
          { step: '03', title: 'Review', desc: 'HR Checklist', icon: '📋' },
          { step: '04', title: 'Notify', desc: 'Live Status', icon: '🔔' },
          { step: '05', title: 'Paid', desc: 'Direct Deposit', icon: '✅' }
        ].map((item, index) => (
          <div key={index} className="col-lg-2 col-md-4 text-center">
            
            {/* Step Number Badge */}
            <div className="mb-3">
               <span style={{ 
                 background: '#1e3a8a', color: '#fff', padding: '4px 12px', 
                 borderRadius: '50px', fontSize: '0.7rem', fontWeight: 'bold' 
               }}>
                 STEP {item.step}
               </span>
            </div>

            {/* Icon Node with Pulse Effect */}
            <div 
              style={{
                width: '80px', height: '80px', background: '#fff',
                border: '2px solid #1e3a8a', borderRadius: '20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2rem', margin: '0 auto 20px',
                boxShadow: '0 10px 25px rgba(30, 58, 138, 0.1)',
                transition: 'all 0.4s ease',
                transform: isVisible.workflow ? 'scale(1)' : 'scale(0)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px) rotate(5deg)';
                e.currentTarget.style.background = '#f0f7ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) rotate(0deg)';
                e.currentTarget.style.background = '#fff';
              }}
            >
              {item.icon}
            </div>

            {/* Content Text */}
            <h6 className="fw-bold mb-1" style={{ color: '#0f172a' }}>{item.title}</h6>
            <p className="text-muted small px-2" style={{ lineHeight: '1.4' }}>{item.desc}</p>
            
            {/* Mobile Arrow (Only visible on small screens) */}
            {index !== 4 && (
              <div className="d-lg-none my-3" style={{ color: '#1e3a8a', fontSize: '1.5rem' }}>↓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
      {/* Enhanced Why Choose Us Section */}
     

      {/* Enhanced Vision Section */}
      <section 
        id="vision" 
        data-section="vision"
        className="py-5 text-white position-relative"
        style={{ 
          background: `linear-gradient(135deg, ${colors.dark} 0%, ${colors.primaryDark} 100%)`,
          overflow: 'hidden'
        }}
      >
        {/* Animated background elements */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 8s infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 6s infinite 2s'
        }}></div>

        <div className="container-fluid px-4 position-relative" style={{ zIndex: 2 }}>
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <div style={{
                transform: isVisible.vision ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(50px)',
                opacity: isVisible.vision ? 1 : 0,
                transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <h2 className="fw-bold mb-4 display-5">Our Vision</h2>
                <p className="lead mb-4" style={{ 
                  fontSize: '1.3rem', 
                  lineHeight: '1.8',
                  opacity: 0.9
                }}>
                  To redefine how organizations handle corporate insurance — making it fully automated, 
                  transparent, and intelligent. We envision a future where insurance management is 
                  seamless, predictive, and empowers every stakeholder in the ecosystem.
                </p>
                <div style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  height: '2px',
                  width: '100%',
                  margin: '2rem auto',
                  animation: 'shimmer 3s infinite'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Contact Section */}
      <section 
        id="contact" 
        data-section="contact"
        className="py-5 position-relative"
        style={{ background: colors.light }}
      >
        <div className="container-fluid px-4">
          <div className="row justify-content-center">
            <div className="col-lg-6 text-center">
              <div style={{
                transform: isVisible.contact ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.9)',
                opacity: isVisible.contact ? 1 : 0,
                transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                <h2 className="fw-bold mb-4 display-5" style={{ color: colors.primary }}>
                  Get in Touch
                </h2>
                <p className="mb-5" style={{ 
                  fontSize: '1.1rem', 
                  color: colors.gray,
                  lineHeight: '1.6'
                }}>
                  Interested in modernizing your organization's insurance operations?<br />
                  Let's build a smarter future together.
                </p>
                <button 
                  className="btn btn-primary btn-lg px-5 py-3 rounded-pill fw-semibold position-relative overflow-hidden"
                  style={{
                    background: colors.gradientAccent,
                    border: 'none',
                    fontSize: '1.1rem',
                    transition: 'all 0.4s ease',
                    minWidth: '180px',
                    boxShadow: `0 8px 25px ${colors.primaryLight}40`
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-3px) scale(1.05)';
                    e.target.style.boxShadow = `0 15px 35px ${colors.primaryLight}60`;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)';
                    e.target.style.boxShadow = `0 8px 25px ${colors.primaryLight}40`;
                  }}
                >
                  <span className="position-relative z-2">Contact Us</span>
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                    transition: 'left 0.6s ease'
                  }}></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-4 text-white position-relative" style={{ background: colors.dark }}>
        <div className="container-fluid px-4 text-center">
          <p className="mb-0" style={{ fontSize: '0.95rem', opacity: 0.8 }}>
            &copy; 2024 InsurAI. All rights reserved. Corporate Policy Automation and Intelligence System.
          </p>
        </div>
      </footer>

      {/* Advanced Global Styles */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
          }
          
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0) translateX(-50%); }
            40% { transform: translateY(-10px) translateX(-50%); }
            60% { transform: translateY(-5px) translateX(-50%); }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          html {
            scroll-behavior: smooth;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            width: 100%;
            overflow-x: hidden;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          section {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .container-fluid {
            width: 100%;
            margin: 0 auto;
          }
          
          .btn-link {
            text-decoration: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .btn-link:hover {
            transform: translateY(-2px);
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: ${colors.light};
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${colors.primary};
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: ${colors.primaryDark};
          }
          
          @media (max-width: 768px) {
            .display-4 {
              font-size: 2.5rem !important;
            }
            .display-5 {
              font-size: 2rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Homepage;