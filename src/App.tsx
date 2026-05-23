import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Star, Search, Menu, Play, X, Trash2, Plus, LogOut, Edit } from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDocFromServer, query, orderBy, increment } from 'firebase/firestore';

const CursorGlow = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      setIsHovering(
        target.tagName.toLowerCase() === 'button' ||
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') != null ||
        target.closest('a') != null
      );
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
    };
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-10 rounded-full mix-blend-screen will-change-transform"
      animate={{
        x: mousePosition.x - 225,
        y: mousePosition.y - 225,
        scale: isHovering ? 1.5 : 1,
        opacity: isHovering ? 1 : 0.75
      }}
      transition={{ type: 'spring', damping: 28, stiffness: 120, mass: 0.8 }}
      style={{
        width: 450,
        height: 450,
        background: 'radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(168,85,247,0.08) 35%, rgba(244,63,94,0.04) 65%, transparent 100%)',
      }}
    />
  );
};

const LiveParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = [
      'rgba(66, 133, 244, alpha)',   // Google Blue
      'rgba(234, 67, 53, alpha)',   // Google Red
      'rgba(251, 188, 5, alpha)',   // Google Yellow
      'rgba(52, 168, 83, alpha)',   // Google Green
      'rgba(155, 114, 243, alpha)',  // Gemini Purple
      'rgba(34, 211, 238, alpha)'    // Gemini Cyan
    ];

    interface Particle {
      x: number;
      y: number;
      radius: number;
      baseColor: string;
      vx: number;
      vy: number;
      sinVal: number;
      sinSpeed: number;
      pulseSpeed: number;
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(40, Math.floor((width * height) / 32000));

    for (let i = 0; i < particleCount; i++) {
      const colorTemplate = colors[Math.floor(Math.random() * colors.length)];
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 3.5 + 1.2,
        baseColor: colorTemplate,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        sinVal: Math.random() * Math.PI * 2,
        sinSpeed: Math.random() * 0.01 + 0.005,
        pulseSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.sinVal += p.sinSpeed;

        p.x += Math.sin(p.sinVal) * 0.12;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 220) {
          const force = (220 - dist) / 220;
          p.x -= dx * force * 0.02;
          p.y -= dy * force * 0.02;
        }

        const opacity = 0.14 + Math.sin(p.sinVal * 0.8) * 0.08;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.baseColor.replace('alpha', opacity.toFixed(3));
        ctx.fill();

        if (p.radius > 2.8) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = p.baseColor.replace('alpha', (opacity * 0.25).toFixed(3));
          ctx.fill();
        }
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const pi = particles[i];
          const pj = particles[j];
          const dx = pi.x - pj.x;
          const dy = pi.y - pj.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 110) {
            const alpha = ((110 - dist) / 110) * 0.05;
            ctx.beginPath();
            ctx.moveTo(pi.x, pi.y);
            ctx.lineTo(pj.x, pj.y);
            const grad = ctx.createLinearGradient(pi.x, pi.y, pj.x, pj.y);
            grad.addColorStop(0, pi.baseColor.replace('alpha', alpha.toFixed(3)));
            grad.addColorStop(1, pj.baseColor.replace('alpha', alpha.toFixed(3)));
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] bg-transparent w-full h-full"
    />
  );
};

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Securely log but do not throw unhandled runtime errors in effects to prevent complete React render crashes.
}

const trackAnalytics = async (movieId: string | number, movieTitle: string, type: 'views' | 'downloads') => {
  try {
    const docId = movieId.toString();
    const docRef = doc(db, 'analytics', docId);
    const payload: any = {
      movieId: docId,
      movieTitle: movieTitle,
      updatedAt: serverTimestamp()
    };
    if (type === 'views') {
      payload.views = increment(1);
      payload.downloads = increment(0);
    } else {
      payload.views = increment(0);
      payload.downloads = increment(1);
    }
    await setDoc(docRef, payload, { merge: true });
  } catch (error) {
    console.error('Failed to track analytics:', error);
  }
};

// --- MOCK DATA ---
type Movie = {
  id: string | number;
  title: string;
  year: string;
  rating: number;
  poster: string;
  genre: string;
  size: string;
  downloadLink?: string;
  watchLink?: string;
  isTrending?: boolean;
};

const INITIAL_MOVIES: Movie[] = [
  {
    id: 1,
    title: 'ECHELON',
    year: '2024',
    rating: 8.9,
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=800&auto=format&fit=crop',
    genre: 'Sci-Fi',
    size: '4.2 GB',
    isTrending: true,
    downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
    watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 2,
    title: 'NIGHTRUN',
    year: '2025',
    rating: 7.5,
    poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop',
    genre: 'Action',
    size: '3.8 GB',
    downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
    watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 3,
    title: 'VOID',
    year: '2023',
    rating: 9.2,
    poster: 'https://images.unsplash.com/photo-1535016120720-40c7467d5283?q=80&w=800&auto=format&fit=crop',
    genre: 'Thriller',
    size: '5.1 GB',
    isTrending: true,
    downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
    watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 4,
    title: 'THE GRID',
    year: '2026',
    rating: 8.4,
    poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop',
    genre: 'Cyberpunk',
    size: '6.0 GB',
    downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
    watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 5,
    title: 'NEON TEARS',
    year: '2022',
    rating: 8.1,
    poster: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=800&auto=format&fit=crop',
    genre: 'Drama',
    size: '2.9 GB',
    downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
    watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 6,
    title: 'OBSCURA',
    year: '2024',
    rating: 7.8,
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop',
    genre: 'Mystery',
    size: '3.5 GB',
    downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
    watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
];

// --- COMPONENTS ---

const Navbar = ({
  searchQuery,
  setSearchQuery,
  onBrandTripleClick,
  onRequestClick,
  siteName,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onBrandTripleClick: () => void;
  onRequestClick: () => void;
  siteName: string;
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const clickCount = useRef(0);
  const clickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleBrandClick = () => {
    clickCount.current += 1;
    if (clickCount.current >= 3) {
      onBrandTripleClick();
      clickCount.current = 0;
    }
    if (clickTimeout.current) clearTimeout(clickTimeout.current);
    clickTimeout.current = setTimeout(() => {
      clickCount.current = 0;
    }, 500);
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 w-full z-50 px-6 md:px-16 py-4 flex items-center justify-between border-b border-white/[0.06] bg-[#030303]/75 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
    >
      <div 
        onClick={handleBrandClick}
        className={`text-xl md:text-2xl font-display font-black tracking-tighter uppercase transition-all duration-300 cursor-pointer select-none ${isSearchOpen ? 'opacity-0 hidden md:flex' : 'opacity-100 flex'} items-center gap-2 relative group`}
      >
        {/* Beautiful Gemini Sparkle Emblem */}
        <div className="relative shrink-0 w-6 h-6 flex items-center justify-center animate-pulse">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 13.5 8 16.5 9.5C19.5 11 22 11 22 11C22 11 19.5 11 16.5 12.5C13.5 14 12 20 12 20C12 20 10.5 14 7.5 12.5C4.5 11 2 11 2 11C2 11 4.5 11 7.5 9.5C10.5 8 12 2 12 2Z" fill="url(#geminiNavBarSparkGradient)" />
            <defs>
              <linearGradient id="geminiNavBarSparkGradient" x1="2" y1="2" x2="22" y2="20" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="35%" stopColor="#9B72F3" />
                <stop offset="70%" stopColor="#D96570" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
          <span className="animate-ping absolute inset-0 rounded-full bg-indigo-500/10 -z-10 scale-150-delayed"></span>
        </div>
        <span className="text-gradient-gemini drop-shadow-[0_0_20px_rgba(155,114,243,0.35)] font-extrabold tracking-tight">{siteName}</span>
      </div>
      
      <div className="flex-1 flex justify-end">
        <motion.div 
          layout
          initial={false}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className={`flex items-center transition-all duration-300 rounded-full ${isSearchOpen ? 'w-full md:w-96 bg-white/[0.04] border border-white/10 px-4 py-2 shadow-[0_0_40px_rgba(155,114,243,0.05)] overflow-hidden' : 'w-auto'}`}
        >
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`${isSearchOpen ? 'text-white hover:bg-white/10 w-9 h-9 shrink-0 flex items-center justify-center rounded-full' : 'text-white/60 hover:text-white shrink-0 bg-white/[0.03] w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 border border-white/5'} transition-all`}
          >
            {isSearchOpen ? <X size={16} strokeWidth={2.5} /> : <Search size={16} strokeWidth={2.5} />}
          </button>
          
          <AnimatePresence>
            {isSearchOpen && (
              <motion.input
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                type="text"
                autoFocus
                placeholder="Search movies or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-semibold tracking-wider text-white placeholder:text-white/30 ml-3 w-full capitalize"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {!isSearchOpen && (
        <div className="flex gap-4 md:gap-6 items-center text-xs font-bold tracking-widest text-white/50 ml-4 md:ml-6">
          <button onClick={onRequestClick} className="relative group overflow-hidden border border-white/[0.08] px-5 py-2.5 text-[10px] md:text-xs transition-all hover:border-white/30 hover:text-white bg-white/[0.02] hover:bg-white/[0.06] rounded-full active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
            <span className="relative z-10 tracking-widest leading-none font-medium text-white/80 group-hover:text-white flex items-center gap-1.5">&#10024; Request Movie</span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-[150%] skew-x-12 group-hover:animate-[shimmer_1.7s_infinite] pointer-events-none"></div>
          </button>
          <button className="hover:text-white transition-all hover:scale-105 bg-white/[0.03] w-9 h-9 flex items-center justify-center rounded-full hidden md:flex border border-white/5 hover:bg-white/10 hover:border-white/10">
            <Menu size={16} strokeWidth={2} />
          </button>
        </div>
      )}
    </motion.nav>
  );
};

const Hero = () => (
  <section className="relative h-[80vh] min-h-[640px] flex items-center px-6 md:px-16 xl:px-24 overflow-hidden mb-12 border-b border-white/[0.04]">
    
    {/* Infinite Space Background */}
    <div className="absolute inset-0 bg-[#030303] z-0">
      {/* Aurora Lights */}
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-radial from-brand-purple/15 to-transparent blur-3xl opacity-60 animate-pulse-slow"></div>
      <div className="absolute top-[-30%] right-[-10%] w-[55vw] h-[55vw] bg-gradient-radial from-brand-cyan/15 to-transparent blur-3xl opacity-40 animate-pulse-slow [animation-delay:3s]"></div>
      
      {/* Mesh lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_65%_65%_at_50%_0%,#000_65%,transparent_100%)]"></div>
    </div>
    
    {/* Large ambient title underlay */}
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 0.03, y: 0 }}
      transition={{ duration: 1.8, ease: "easeOut" }}
      className="absolute -left-10 bottom-8 text-[120px] lg:text-[230px] font-display font-black text-white select-none pointer-events-none z-0 tracking-tighter leading-none whitespace-nowrap opacity-[0.015] font-extrabold uppercase"
    >
      FINDINGGOODD
    </motion.div>
    
    <div className="max-w-5xl relative z-10 w-full mt-10">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex items-center gap-3 mb-5"
      >
        <span className="w-6 h-[2px] bg-gradient-to-r from-brand-cyan to-brand-purple shadow-[0_0_15px_rgba(168,85,247,0.7)]"></span>
        <span className="text-[10px] tracking-[0.25em] uppercase font-bold text-white/40">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink font-semibold">ULTRA HD DIGITAL ARCHIVE</span>
        </span>
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="text-5xl md:text-7xl lg:text-[7.5rem] font-display font-black tracking-tight leading-[0.9] mb-8"
      >
        Discover <br /> 
        <span className="bg-gradient-to-r from-white via-white/80 to-white/40 bg-clip-text text-transparent italic mr-4">The Purest</span>
        <span className="text-gradient-gemini font-extrabold block md:inline-block">Cinema.</span>
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="text-xs md:text-sm text-white/60 tracking-wider max-w-xl mb-10 uppercase leading-relaxed font-semibold block"
      >
        High-velocity direct streams • Premium dual-audio releases • Curated Hollywood & Bollywood cinematic gems in Master Quality. Always Free.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="flex items-center gap-4 flex-wrap"
      >
        <button 
          onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} 
          className="px-8 py-4.5 bg-white text-black font-extrabold uppercase text-[10px] md:text-xs tracking-widest hover:bg-slate-200 transition-all duration-300 flex items-center gap-3.5 group rounded-full active:scale-95 shadow-[0_4px_30px_rgba(255,255,255,0.15)]"
        >
          <span>Explore Catalog</span>
          <Play size={12} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
        </button>
        <button 
          onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} 
          className="px-8 py-4.5 bg-white/[0.04] border border-white/10 hover:border-white/30 text-white font-extrabold uppercase text-[10px] md:text-xs tracking-widest hover:bg-white/[0.08] transition-all duration-300 flex items-center rounded-full active:scale-95"
        >
          <span>Latest Additions</span>
        </button>
      </motion.div>
    </div>

    {/* Floating multi-orbit geometric decoration */}
    <motion.div 
      initial={{ opacity: 0, rotate: -20, scale: 0.9 }}
      animate={{ opacity: 0.8, rotate: 10, scale: 1 }}
      transition={{ delay: 0.4, duration: 2.2, ease: "easeOut" }}
      className="absolute right-[8%] top-[12%] w-[36vw] h-[36vw] border border-white/[0.05] rounded-full mix-blend-screen opacity-50 pointer-events-none hidden lg:block"
    >
      <div className="absolute inset-4 border border-brand-purple/10 rounded-full animate-pulse-slow"></div>
      <div className="absolute inset-16 border border-brand-cyan/5 rounded-full animate-float"></div>
      <div className="absolute inset-0 bg-radial-gradient(circle, rgba(168,85,247,0.02) 0%, transparent 80%) rounded-full blur-2xl"></div>
    </motion.div>
  </section>
);

const MovieRequestModal = ({ onClose }: { onClose: () => void }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newId = Date.now().toString();
      await setDoc(doc(db, 'movieRequests', newId), {
        title,
        message,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'movieRequests');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-6"
    >
      <button onClick={onClose} className="absolute top-8 right-12 text-white/50 hover:text-white transition-colors duration-300">
        <X size={24} />
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#111] border border-white/5 p-8 shadow-2xl relative overflow-hidden"
      >
        <h2 className="text-2xl font-display font-black tracking-tighter uppercase mb-8 relative z-10 text-white">Request a Movie</h2>
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center relative z-10">
            <div className="text-white mb-2 text-lg font-bold">Request Submitted</div>
            <div className="text-white/50 text-[10px] tracking-widest uppercase font-bold">We will try to add it soon.</div>
            <button onClick={onClose} className="mt-8 px-6 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all text-center">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
            <div>
              <label className="text-[10px] tracking-widest uppercase font-bold text-white/40 block mb-2">Movie Title</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-sm text-white outline-none focus:border-white/40 transition-colors"
                required 
              />
            </div>
            <div>
              <label className="text-[10px] tracking-widest uppercase font-bold text-white/40 block mb-2">Message (Optional)</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-sm text-white outline-none focus:border-white/40 transition-colors resize-none h-24"
              />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="mt-4 px-6 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all text-center disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
};

const TermsModal = ({ onClose }: { onClose: () => void }) => {
  const [content, setContent] = useState('Loading...');
  const [title, setTitle] = useState('Terms & Conditions');

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const docRef = doc(db, 'pages', 'terms');
        const docSnap = await getDocFromServer(docRef);
        if (docSnap.exists()) {
          setContent(docSnap.data().content);
          setTitle(docSnap.data().title);
        } else {
          setContent('Terms and conditions not found.');
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'pages/terms');
        setContent('Error loading terms.');
      }
    };
    fetchTerms();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-6"
    >
      <button onClick={onClose} className="absolute top-8 right-12 text-white/50 hover:text-white transition-colors duration-300">
        <X size={24} />
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl bg-[#111] border border-white/5 p-8 lg:p-12 shadow-2xl relative overflow-y-auto max-h-[85vh] thin-scrollbar"
      >
        <h2 className="text-2xl lg:text-4xl font-display font-black tracking-tighter uppercase mb-8 relative z-10 text-white">{title}</h2>
        <div className="text-sm leading-relaxed text-white/70 whitespace-pre-wrap font-medium">
          {content}
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminLogin = ({ onLogin, onClose }: { onLogin: () => void, onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Invalid ID or Password');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-6"
    >
      <button onClick={onClose} className="absolute top-8 right-12 text-white/50 hover:text-white transition-colors duration-300">
        <X size={24} />
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#111] border border-white/5 p-8 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Menu size={120} />
        </div>
        
        <h2 className="text-2xl font-display font-black tracking-tighter uppercase mb-8 relative z-10">Admin Access</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
          <div>
            <label className="text-[10px] tracking-widest uppercase font-bold text-white/40 block mb-2">ID (Email)</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-sm text-white outline-none focus:border-white/40 transition-colors"
              required 
            />
          </div>
          <div>
            <label className="text-[10px] tracking-widest uppercase font-bold text-white/40 block mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-sm text-white outline-none focus:border-white/40 transition-colors"
              required 
            />
          </div>
          
          {error && <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest">{error}</div>}
          
          <button type="submit" className="mt-4 px-6 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all text-center">
            Authenticate
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
};

const AdminDashboard = ({ 
  movies, 
  setMovies, 
  requests,
  onLogout, 
  onClose,
  siteName,
  copyrightText,
  omdbApiKey
}: { 
  movies: Movie[]; 
  setMovies: (movies: Movie[]) => void; 
  requests: any[];
  onLogout: () => void; 
  onClose: () => void; 
  siteName: string;
  copyrightText: string;
  omdbApiKey: string;
}) => {
  const [newMovie, setNewMovie] = useState({
    title: '', year: '', rating: '', poster: '', genre: '', size: '', downloadLink: '', watchLink: '', isTrending: false
  });
  const [editingId, setEditingId] = useState<number | string | null>(null);

  const [activeTab, setActiveTab] = useState<'movies' | 'requests' | 'pages' | 'ads' | 'settings' | 'analytics'>('movies');
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [isSavingTerms, setIsSavingTerms] = useState(false);

  const [adminSiteName, setAdminSiteName] = useState(siteName);
  const [adminCopyrightText, setAdminCopyrightText] = useState(copyrightText || '');
  const [adminOmdbApiKey, setAdminOmdbApiKey] = useState(omdbApiKey || '');
  const [isSavingSiteName, setIsSavingSiteName] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  useEffect(() => {
    setAdminSiteName(siteName);
    setAdminCopyrightText(copyrightText || '');
    setAdminOmdbApiKey(omdbApiKey || '');
  }, [siteName, copyrightText, omdbApiKey]);

  const handleAutoFill = async () => {
    if (!newMovie.title) return alert("Please enter a movie title first!");
    if (!adminOmdbApiKey) return alert("Please set your OMDb API Key in the Settings tab first!");
    setIsFetchingDetails(true);
    try {
      let fetchUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(newMovie.title)}&apikey=${adminOmdbApiKey}`;
      if (newMovie.year) {
        fetchUrl += `&y=${encodeURIComponent(newMovie.year)}`;
      }
      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (data.Response === "True") {
        setNewMovie(prev => ({
          ...prev,
          year: data.Year && data.Year !== 'N/A' ? data.Year : prev.year,
          genre: data.Genre && data.Genre !== 'N/A' ? data.Genre : (prev.genre || 'Unknown'),
          poster: data.Poster && data.Poster !== 'N/A' ? data.Poster : prev.poster,
          rating: data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : prev.rating
        }));
        if (data.Genre === 'N/A') {
          alert('Movie fetched, but IMDb has no genre listed for this specific movie. You may need to enter it manually.');
        }
      } else {
        alert("Movie not found on OMDb! Check the title spelling, or try entering the Year before clicking Auto-Fill to be more specific.");
      }
    } catch (e) {
      alert("Failed to fetch details from OMDb.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const [adContent, setAdContent] = useState('');
  const [adPosterUrl, setAdPosterUrl] = useState('');
  const [adIsActive, setAdIsActive] = useState(false);
  const [adTimerSeconds, setAdTimerSeconds] = useState(10);
  const [isSavingAd, setIsSavingAd] = useState(false);

  useEffect(() => {
    if (activeTab === 'pages') {
      const fetchTerms = async () => {
        try {
          const docSnap = await getDocFromServer(doc(db, 'pages', 'terms'));
          if (docSnap.exists()) {
             setTermsContent(docSnap.data().content);
          }
        } catch(err) {
            handleFirestoreError(err, OperationType.GET, 'pages/terms');
        }
      };
      fetchTerms();
    } else if (activeTab === 'ads') {
      const fetchAd = async () => {
        try {
          const docSnap = await getDocFromServer(doc(db, 'settings', 'adBanner'));
          if (docSnap.exists()) {
             setAdContent(docSnap.data().content);
             setAdPosterUrl(docSnap.data().posterUrl || '');
             setAdIsActive(docSnap.data().isActive);
             setAdTimerSeconds(docSnap.data().timerSeconds);
          }
        } catch(err) {
            handleFirestoreError(err, OperationType.GET, 'settings/adBanner');
        }
      };
      fetchAd();
    } else if (activeTab === 'analytics') {
      setIsLoadingAnalytics(true);
      const q = query(collection(db, 'analytics'), orderBy('views', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
        setAnalyticsData(data);
        setIsLoadingAnalytics(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'analytics');
        setIsLoadingAnalytics(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const handleSaveTerms = async () => {
    setIsSavingTerms(true);
    try {
      await setDoc(doc(db, 'pages', 'terms'), {
        title: 'Terms & Conditions',
        content: termsContent,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'pages/terms');
    } finally {
      setIsSavingTerms(false);
    }
  };

  const handleSaveAd = async () => {
    setIsSavingAd(true);
    try {
      await setDoc(doc(db, 'settings', 'adBanner'), {
        content: adContent,
        posterUrl: adPosterUrl,
        isActive: adIsActive,
        timerSeconds: Number(adTimerSeconds),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/adBanner');
    } finally {
      setIsSavingAd(false);
    }
  };

  const handleSaveSiteName = async () => {
    setIsSavingSiteName(true);
    try {
      await setDoc(doc(db, 'settings', 'site'), {
        siteName: adminSiteName,
        copyrightText: adminCopyrightText,
        omdbApiKey: adminOmdbApiKey,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'settings/site');
    } finally {
      setIsSavingSiteName(false);
    }
  };

  const handleAddOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const docRef = doc(db, 'movies', editingId.toString());
        await setDoc(docRef, { ...newMovie, rating: Number(newMovie.rating), updatedAt: serverTimestamp() }, { merge: true });
        setEditingId(null);
      } else {
        const newId = Date.now().toString();
        const docRef = doc(db, 'movies', newId);
        await setDoc(docRef, { 
          ...newMovie, 
          rating: Number(newMovie.rating), 
          createdAt: serverTimestamp(), 
          updatedAt: serverTimestamp() 
        });
      }
      setNewMovie({ title: '', year: '', rating: '', poster: '', genre: '', size: '', downloadLink: '', watchLink: '', isTrending: false });
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, 'movies');
    }
  };

  const handleEdit = (movie: Movie) => {
    setNewMovie({
      title: movie.title,
      year: movie.year,
      rating: movie.rating.toString(),
      poster: movie.poster,
      genre: movie.genre,
      size: movie.size,
      downloadLink: movie.downloadLink || '',
      watchLink: movie.watchLink || '',
      isTrending: !!movie.isTrending
    });
    setEditingId(movie.id);
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteDoc(doc(db, 'movies', id.toString()));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'movies');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[100] bg-[#050505] overflow-y-auto"
    >
      <nav className="sticky top-0 z-50 px-6 lg:px-12 py-6 flex flex-col lg:flex-row lg:items-center justify-between border-b border-white/5 bg-[#050505]/80 backdrop-blur-md gap-6 lg:gap-4">
        <div className="text-2xl font-display font-black tracking-tighter uppercase flex items-center justify-between w-full lg:w-auto">
          <div>{siteName} <span className="text-white/30 text-sm hidden sm:inline">| ADMIN</span></div>
          <div className="flex gap-4 lg:hidden">
            <button onClick={onLogout} className="text-white/50 hover:text-white">
              <LogOut size={20} />
            </button>
            <button onClick={onClose} className="text-white/50 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="flex bg-[#111] border border-white/10 rounded-sm overflow-x-auto text-[10px] w-full lg:w-auto order-last lg:order-none snap-x">
          <button onClick={() => setActiveTab('movies')} className={`flex-1 lg:flex-none px-4 py-3 uppercase font-bold tracking-widest whitespace-nowrap snap-center ${activeTab === 'movies' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}>Movies</button>
          <button onClick={() => setActiveTab('requests')} className={`flex-1 lg:flex-none px-4 py-3 uppercase font-bold tracking-widest whitespace-nowrap snap-center ${activeTab === 'requests' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}>Requests</button>
          <button onClick={() => setActiveTab('pages')} className={`flex-1 lg:flex-none px-4 py-3 uppercase font-bold tracking-widest whitespace-nowrap snap-center ${activeTab === 'pages' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}>Terms</button>
          <button onClick={() => setActiveTab('ads')} className={`flex-1 lg:flex-none px-4 py-3 uppercase font-bold tracking-widest whitespace-nowrap snap-center ${activeTab === 'ads' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}>Ad Banner</button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 lg:flex-none px-4 py-3 uppercase font-bold tracking-widest whitespace-nowrap snap-center ${activeTab === 'settings' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}>Settings</button>
          <button onClick={() => setActiveTab('analytics')} className={`flex-1 lg:flex-none px-4 py-3 uppercase font-bold tracking-widest whitespace-nowrap snap-center ${activeTab === 'analytics' ? 'bg-white text-black' : 'text-white/50 hover:bg-white/5'}`}>Analytics</button>
        </div>

        <div className="hidden lg:flex gap-6">
          <button onClick={onLogout} className="text-[10px] tracking-widest uppercase font-bold text-white/50 hover:text-white flex items-center gap-2">
            <LogOut size={14} /> Logout
          </button>
          <button onClick={onClose} className="text-[10px] tracking-widest uppercase font-bold text-white/50 hover:text-white flex items-center gap-2">
             <X size={14} /> Close
          </button>
        </div>
      </nav>

      {activeTab === 'movies' && (
        <div className="px-12 py-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ADD MOVIE FORM */}
          <div className="lg:col-span-1">
          <div className="bg-[#111] border border-white/5 p-8 shadow-2xl lg:sticky lg:top-32">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-white border-b border-white/5 pb-4">
              {editingId ? 'Edit Title' : 'Add New Title'}
            </h3>
            <form onSubmit={handleAddOrUpdate} className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input placeholder="Title" required value={newMovie.title} onChange={e => setNewMovie({...newMovie, title: e.target.value})} className="flex-1 bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
                <button type="button" onClick={handleAutoFill} disabled={isFetchingDetails} className="bg-white text-black px-4 font-bold uppercase tracking-widest text-[10px] hover:bg-white/90 disabled:opacity-50 transition-colors whitespace-nowrap">
                  {isFetchingDetails ? 'Fetching...' : 'Auto-Fill 🪄'}
                </button>
              </div>
              <input placeholder="Year" required value={newMovie.year} onChange={e => setNewMovie({...newMovie, year: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
              <input placeholder="Rating (0-10)" required type="number" step="0.1" value={newMovie.rating} onChange={e => setNewMovie({...newMovie, rating: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
              <input placeholder="Poster URL" required value={newMovie.poster} onChange={e => setNewMovie({...newMovie, poster: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
              <input placeholder="Genre" required value={newMovie.genre} onChange={e => setNewMovie({...newMovie, genre: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
              <input placeholder="Size (e.g. 2.4 GB)" required value={newMovie.size} onChange={e => setNewMovie({...newMovie, size: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
              <input placeholder="Download Link (Optional URL)" value={newMovie.downloadLink} onChange={e => setNewMovie({...newMovie, downloadLink: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
              <input placeholder="Watch Now Link (Optional Iframe URL)" value={newMovie.watchLink} onChange={e => setNewMovie({...newMovie, watchLink: e.target.value})} className="w-full bg-[#1a1a1a] border border-white/10 p-3 text-xs text-white outline-none focus:border-white/40" />
              
              <div className="flex items-center gap-3 bg-[#1a1a1a] border border-white/10 p-3 select-none">
                <input 
                  type="checkbox" 
                  id="isTrending" 
                  checked={newMovie.isTrending} 
                  onChange={e => setNewMovie({...newMovie, isTrending: e.target.checked})} 
                  className="w-4 h-4 rounded border-white/10 bg-[#111] text-white focus:ring-0 accent-white" 
                />
                <label htmlFor="isTrending" className="text-xs text-white/70 font-bold tracking-wider cursor-pointer uppercase select-none">
                  Mark as Trending 🔥
                </label>
              </div>
              
              <button type="submit" className="mt-2 px-6 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2">
                {editingId ? (
                  <>
                    <Edit size={16} /> Update Movie
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Add Movie
                  </>
                )}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setNewMovie({ title: '', year: '', rating: '', poster: '', genre: '', size: '', downloadLink: '', watchLink: '', isTrending: false }); }} className="px-6 py-3 border border-white/20 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                  Cancel Edit
                </button>
              )}
            </form>
          </div>
        </div>

        {/* MOVIE LIST */}
        <div className="lg:col-span-2">
           <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-white border-b border-white/5 pb-4">Manage Library</h3>
           <div className="flex flex-col gap-4">
             <AnimatePresence>
             {movies.map((m) => (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#111] border border-white/5 p-4 flex items-center gap-4 group hover:bg-[#151515] transition-colors"
                >
                  <img src={m.poster} alt={m.title} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-16 h-24 object-cover transition-all duration-500" />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-1 flex items-center gap-2">
                      {m.title}
                      {m.isTrending && (
                        <span className="text-[8px] bg-white/10 text-white border border-white/20 px-1.5 py-0.5 rounded-sm font-bold tracking-wider uppercase inline-flex items-center gap-1 leading-none">
                          🔥 Trending
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-white/40 tracking-wide font-bold">{m.year} • {m.genre}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(m)} className="w-10 h-10 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-white/20">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="w-10 h-10 flex items-center justify-center rounded-full text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20">
                       <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
             ))}
             </AnimatePresence>
           </div>
        </div>
      </div>
      )}

      {/* ADD MOVIE REQUESTS HERE */}
      {activeTab === 'requests' && (
      <div className="px-12 py-12 max-w-7xl mx-auto w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-white border-b border-white/5 pb-4">User Movie Requests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {requests.map(req => (
               <motion.div 
                 key={req.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-[#111] border border-white/5 p-6 flex flex-col gap-4 relative"
               >
                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-2">
                     <h4 className="text-sm font-bold uppercase tracking-wider text-white">{req.title}</h4>
                     <span className={`text-[9px] uppercase tracking-widest font-bold px-2 py-1 ${req.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : req.status === 'fulfilled' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                       {req.status}
                     </span>
                   </div>
                   <p className="text-[11px] text-white/50">{req.message || 'No message provided.'}</p>
                 </div>
                 <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                   {req.status === 'pending' && (
                     <>
                       <button onClick={async () => {
                         try {
                           await setDoc(doc(db, 'movieRequests', req.id), { status: 'fulfilled', updatedAt: serverTimestamp() }, { merge: true });
                         } catch (err) { handleFirestoreError(err, OperationType.UPDATE, 'movieRequests'); }
                       }} className="flex-1 py-2 bg-green-500/10 text-green-500 text-[10px] uppercase font-bold hover:bg-green-500/20 border border-transparent transition-colors">Fulfill</button>
                       <button onClick={async () => {
                         try {
                           await setDoc(doc(db, 'movieRequests', req.id), { status: 'rejected', updatedAt: serverTimestamp() }, { merge: true });
                         } catch (err) { handleFirestoreError(err, OperationType.UPDATE, 'movieRequests'); }
                       }} className="flex-1 py-2 bg-red-500/10 text-red-500 text-[10px] uppercase font-bold hover:bg-red-500/20 border border-transparent transition-colors">Reject</button>
                     </>
                   )}
                   <button onClick={async () => {
                     try {
                        await deleteDoc(doc(db, 'movieRequests', req.id));
                     } catch(err) { handleFirestoreError(err, OperationType.DELETE, 'movieRequests'); }
                   }} className={`p-2 text-white/30 hover:text-white transition-colors border border-transparent ${req.status !== 'pending' ? 'w-full flex items-center justify-center gap-2' : ''}`}>
                     <Trash2 size={16}/> {req.status !== 'pending' ? 'Delete' : ''}
                   </button>
                 </div>
               </motion.div>
            ))}
          </AnimatePresence>
          {requests.length === 0 && (
            <div className="col-span-full py-12 text-center border border-white/5 bg-[#111]">
              <span className="text-[10px] tracking-widest uppercase font-bold text-white/40">No pending requests</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* MANAGE PAGES HERE */}
      {activeTab === 'pages' && (
      <div className="px-12 py-12 max-w-5xl mx-auto w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-white border-b border-white/5 pb-4">Terms & Conditions Settings</h3>
        <div className="bg-[#111] border border-white/5 p-8 flex flex-col gap-6">
          <textarea 
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            placeholder="Enter Terms and Conditions... (Formatting is preserved)"
            className="w-full bg-[#1a1a1a] border border-white/10 p-6 text-sm text-white outline-none focus:border-white/40 transition-colors resize-y h-96 font-medium leading-relaxed"
          ></textarea>
          <div className="flex justify-end">
            <button 
              onClick={handleSaveTerms} 
              disabled={isSavingTerms}
              className="px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all text-center disabled:opacity-50"
            >
              {isSavingTerms ? 'Saving...' : 'Save Terms'}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* MANAGE ADS HERE */}
      {activeTab === 'ads' && (
      <div className="px-12 py-12 max-w-5xl mx-auto w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-white border-b border-white/5 pb-4">Download Ad Banner Settings</h3>
        <div className="bg-[#111] border border-white/5 p-8 flex flex-col gap-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-6">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 flex-1 flex items-center justify-between">
              Enable Ad Banner Before Download
              <input 
                 type="checkbox" 
                 checked={adIsActive} 
                 onChange={(e) => setAdIsActive(e.target.checked)} 
                 className="w-5 h-5 accent-white ml-auto"
              />
            </label>
          </div>
          
          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-3">Timer Duration (Seconds)</label>
            <input 
              type="number" 
              value={adTimerSeconds}
              onChange={(e) => setAdTimerSeconds(Number(e.target.value))}
              min={0}
              max={60}
              className="w-full bg-[#1a1a1a] border border-white/10 p-4 text-sm text-white outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-3">Ad Poster URL (Optional background image)</label>
            <input 
              type="text"
              value={adPosterUrl}
              onChange={(e) => setAdPosterUrl(e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="w-full bg-[#1a1a1a] border border-white/10 p-4 text-sm text-white outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-3">Ad Content (HTML/Text)</label>
            <textarea 
              value={adContent}
              onChange={(e) => setAdContent(e.target.value)}
              placeholder="<img src='ad.jpg' /> or Just text..."
              className="w-full bg-[#1a1a1a] border border-white/10 p-6 text-sm text-white outline-none focus:border-white/40 transition-colors resize-y h-64 font-mono text-xs leading-relaxed"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleSaveAd} 
              disabled={isSavingAd}
              className="px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all text-center disabled:opacity-50"
            >
              {isSavingAd ? 'Saving...' : 'Save Setting'}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* MANAGE SETTINGS HERE */}
      {activeTab === 'settings' && (
      <div className="px-12 py-12 max-w-5xl mx-auto w-full">
        <h3 className="text-sm font-bold uppercase tracking-wider mb-6 text-white border-b border-white/5 pb-4">General Website Settings</h3>
        <div className="bg-[#111] border border-white/5 p-8 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-3">Website Name</label>
              <input 
                type="text" 
                value={adminSiteName}
                onChange={(e) => setAdminSiteName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 p-4 text-sm text-white outline-none focus:border-white/40 transition-colors"
                placeholder="Ex. Findinggoodd"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-3">Copyright Text</label>
              <input 
                type="text" 
                value={adminCopyrightText}
                onChange={(e) => setAdminCopyrightText(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/10 p-4 text-sm text-white outline-none focus:border-white/40 transition-colors"
                placeholder="Ex. Copyright 2026 Admin"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="text-[10px] uppercase font-bold tracking-widest text-white/50 block mb-3">OMDb API Key (Optional auto-fetch setup)</label>
            <div className="flex gap-4 items-center">
              <input 
                type="text" 
                value={adminOmdbApiKey}
                onChange={(e) => setAdminOmdbApiKey(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-white/10 p-4 text-sm text-white outline-none focus:border-white/40 transition-colors"
                placeholder="Ex. 8df9d3a"
              />
              <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold text-white/40 hover:text-white border-b border-white/20 pb-1">Get Free Key</a>
            </div>
            <p className="text-white/30 text-[10px] mt-2">Required for the "Auto-Fill 🪄" feature to work when adding movies.</p>
          </div>

          <div className="flex justify-end mt-8">
            <button 
              onClick={handleSaveSiteName} 
              disabled={isSavingSiteName}
              className="px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-white/90 transition-all text-center disabled:opacity-50"
            >
              {isSavingSiteName ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
      )}

      {/* VIEW ANALYTICS HERE */}
      {activeTab === 'analytics' && (
      <div className="px-6 md:px-12 py-12 max-w-5xl mx-auto w-full">
        {/* Analytics Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-2">Media Performance Analytics</h3>
            <p className="text-xs text-white/40 mt-1">Real-time interaction telemetry and audience request insight metrics.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-[#111] border border-white/5 p-4 rounded-sm flex flex-col min-w-[120px]">
              <span className="text-[9px] uppercase font-mono text-white/30 tracking-widest leading-none">Total Views</span>
              <span className="text-xl font-display font-black text-[#FFD700] mt-1">
                {analyticsData.reduce((acc, curr) => acc + (curr.views || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="bg-[#111] border border-white/5 p-4 rounded-sm flex flex-col min-w-[120px]">
              <span className="text-[9px] uppercase font-mono text-white/30 tracking-widest leading-none">Total Downloads</span>
              <span className="text-xl font-display font-black text-white mt-1">
                {analyticsData.reduce((acc, curr) => acc + (curr.downloads || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Analytics Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Leaders List */}
          <div className="md:col-span-2 bg-[#111] border border-white/5 p-6 rounded-sm flex flex-col h-full min-h-[400px]">
            <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-4 border-b border-white/5 pb-2">Content Popularity Rankings</h4>
            
            {isLoadingAnalytics ? (
              <div className="flex-1 flex items-center justify-center text-xs text-white/20 uppercase tracking-widest">
                Scanning Database signals...
              </div>
            ) : analyticsData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-xs text-white/20 uppercase tracking-widest py-16">
                <span>No analytics events recorded yet</span>
                <span className="text-[10px] text-white/10 mt-2 normal-case">Interact with watch or download buttons on the home screen to test tracking.</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10">
                {analyticsData.map((item, index) => (
                  <div key={item.id} className="py-4 flex items-center justify-between hover:bg-white/[0.01] px-2 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono font-bold text-white/20">#{index+1}</span>
                      <div>
                        <div className="text-sm font-bold text-white tracking-tight">{item.movieTitle}</div>
                        <div className="text-[10px] text-white/30 font-mono mt-0.5">ID: {item.movieId}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <div className="text-[9px] font-mono uppercase text-white/30 tracking-widest leading-none">Views</div>
                        <div className="text-sm font-bold text-[#FFD700] mt-1">{item.views || 0}</div>
                      </div>
                      <div className="min-w-[80px]">
                        <div className="text-[9px] font-mono uppercase text-white/30 tracking-widest leading-none">Downloads</div>
                        <div className="text-sm font-bold text-white mt-1">{item.downloads || 0}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity / Ratios / Meta Info Card */}
          <div className="bg-[#111] border border-white/5 p-6 rounded-sm flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-4 border-b border-white/5 pb-2">Conversion Efficiency</h4>
              
              {analyticsData.length > 0 ? (
                <div className="space-y-6 mt-4">
                  {/* Calculate general stats */}
                  {(() => {
                    const totalViews = analyticsData.reduce((acc, curr) => acc + (curr.views || 0), 0);
                    const totalDownloads = analyticsData.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
                    const conversionRate = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : '0.0';
                    
                    const sortedByViews = [...analyticsData].sort((a,b) => (b.views || 0) - (a.views || 0));
                    const sortedByDownloads = [...analyticsData].sort((a,b) => (b.downloads || 0) - (a.downloads || 0));
                    
                    return (
                      <>
                        <div>
                          <div className="text-[10px] font-mono uppercase text-white/40 tracking-wider">Download-to-View Ratio</div>
                          <div className="text-3xl font-display font-black text-white mt-1">{conversionRate}%</div>
                          <div className="w-full bg-white/5 h-1 mt-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-white h-full rounded-full transition-all duration-1000" 
                              style={{ width: `${Math.min(100, Number(conversionRate))}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] font-mono uppercase text-white/40 tracking-wider mb-1.5">Top-viewed Asset</div>
                          <span className="text-xs font-bold text-[#FFD700] block">{sortedByViews[0]?.movieTitle || 'None'}</span>
                          <span className="text-[9px] font-mono text-white/30 mt-0.5 block">{sortedByViews[0]?.views || 0} signals loaded</span>
                        </div>

                        <div>
                          <div className="text-[10px] font-mono uppercase text-white/40 tracking-wider mb-1.5">Top-retrieved Asset</div>
                          <span className="text-xs font-bold text-white block">{sortedByDownloads[0]?.movieTitle || 'None'}</span>
                          <span className="text-[9px] font-mono text-white/30 mt-0.5 block">{sortedByDownloads[0]?.downloads || 0} hits recorded</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-xs text-white/20 py-8 text-center uppercase tracking-widest mt-4">
                  Awaiting conversion ratios
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-white/5 pt-4 text-[10px] text-white/30 leading-relaxed font-mono">
              ⚡ Database reads optimized via O(n) local synchronization client. Metrics feed directly into the admin visual panel using a dedicated secure schema.
            </div>
          </div>

        </div>
      </div>
      )}
    </motion.div>
  );
};

const AdBannerModal = ({ movie, settings, onClose }: { movie: Movie, settings: any, onClose: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(settings?.timerSeconds || 10);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505]/98 flex flex-col items-center justify-center p-4 md:p-6"
    >
      <button onClick={onClose} className="absolute top-4 right-4 md:top-8 md:right-12 text-white/50 hover:text-white transition-colors duration-300 z-50 bg-[#111] w-10 h-10 flex items-center justify-center rounded-full border border-white/10">
        <X size={20} className="md:w-6 md:h-6" />
      </button>

      <div 
        className="w-full max-w-4xl bg-[#111] border border-white/10 p-5 md:p-8 relative flex flex-col min-h-[60vh] max-h-[85vh] md:h-[70vh] items-center justify-center text-center shadow-2xl bg-cover bg-center overflow-hidden"
        style={settings?.posterUrl ? { backgroundImage: `url(${settings.posterUrl})` } : {}}
      >
         {settings?.posterUrl && <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-0"></div>}
         
         <div className="z-10 flex flex-col w-full h-full items-center justify-center overflow-hidden relative">
           {/* Render Ad Content */}
           <div 
             className="flex-1 w-full overflow-y-auto mb-6 md:mb-8 text-white flex flex-col items-center justify-center font-display scrollbar-thin scrollbar-thumb-white/10" 
             dangerouslySetInnerHTML={{ __html: settings?.content || (settings?.posterUrl ? '' : '<h3 class="text-xl md:text-2xl font-display font-black uppercase tracking-widest text-white/40">Advertisement</h3>') }} 
           />
           
           <div className="mt-auto flex flex-col items-center gap-4 w-full max-w-sm">
             {timeLeft > 0 ? (
               <div className="w-full px-4 py-4 md:px-6 md:py-4 bg-[#1a1a1a]/90 backdrop-blur-md border border-white/20 text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                 Please wait {timeLeft} seconds to download...
               </div>
             ) : (
               <a 
                 href={movie.downloadLink} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 onClick={onClose}
                 className="w-full border border-white/20 bg-white hover:bg-white/90 text-black transition-all duration-300 py-4 md:py-5 text-[10px] md:text-xs tracking-[0.2em] uppercase font-black flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)]"
               >
                 <Download size={18} /> Download Now
               </a>
             )}
           </div>
         </div>
      </div>
    </motion.div>
  );
};

const WatchModal = ({ movie, onClose }: { movie: Movie, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#050505]/98 flex flex-col items-center justify-center p-4 md:p-12 backdrop-blur-3xl"
    >
      <button onClick={onClose} className="absolute top-6 right-6 md:top-10 md:right-10 text-white/50 hover:text-white hover:scale-110 active:scale-95 transition-all duration-300 z-50 bg-[#111] w-12 h-12 flex items-center justify-center rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
        <X size={20} />
      </button>

      <div className="w-full h-full max-h-[70vh] max-w-6xl aspect-video bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm relative border border-white/10 overflow-hidden ring-1 ring-white/5">
        {movie.watchLink ? (
          <iframe 
            src={movie.watchLink} 
            className="w-full h-full" 
            allowFullScreen 
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 font-display uppercase tracking-widest text-sm bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent">
            Watch link not available for this title.
          </div>
        )}
      </div>
      
      <div className="mt-8 flex flex-col items-center text-center">
        <h2 className="text-3xl md:text-4xl font-display font-black text-white uppercase tracking-tighter mb-3 drop-shadow-md">{movie.title}</h2>
        <div className="flex items-center gap-3 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span>{movie.year}</span>
            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
            <span>{movie.genre}</span>
            <span className="w-1 h-1 bg-white/20 rounded-full"></span>
            <span className="text-[#FFD700] flex items-center gap-1">★ {movie.rating}</span>
        </div>
      </div>
    </motion.div>
  );
};

const MovieCard: React.FC<{ movie: Movie, index: number, onDownloadClick: (movie: Movie) => void, onWatchClick: (movie: Movie) => void }> = React.memo(({ movie, index, onDownloadClick, onWatchClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.08, 0.4), ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden bg-[#0a0a0a] border border-white/[0.04] rounded-2xl flex flex-col shadow-[0_10px_35px_rgba(0,0,0,0.8)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-2 hover:border-[#a855f7]/30 hover:shadow-[0_15px_40px_rgba(168,85,247,0.1)]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dynamic colorful light edge */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#a855f7]/0 via-[#a855f7]/0 to-[#a855f7]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-30"></div>
      
      <div className="aspect-[2/3] bg-[#030303] relative overflow-hidden">
        {/* Ambient Blurred Glow/Placeholder */}
        <img 
          src={movie.poster} 
          alt=""
          loading="lazy"
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover blur-2xl opacity-20 scale-125 transition-all duration-700 pointer-events-none select-none z-0 ${
            imageLoaded ? 'opacity-[0.08]' : 'opacity-[0.25] scale-110'
          }`}
        />

        {/* Shimmer overlay shown during load */}
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
          </div>
        )}

        <img 
          src={movie.poster} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] z-0 group-hover:scale-108 ${
            imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-105'
          }`}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/45 to-transparent z-10 transition-all duration-500 group-hover:from-[#0e0e0e] group-hover:via-[#0e0e0e]/75"></div>
        
        {/* Polished Glassmorphic Rating Badge */}
        <div className="absolute top-4 right-4 z-20 bg-black/40 backdrop-blur-md px-3 py-1.5 text-[11px] font-bold border border-white/10 flex items-center gap-1.5 text-amber-400 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.5)] tracking-wider">
          <Star size={11} fill="currentColor" className="text-amber-400 shrink-0" />
          <span className="text-white text-xs font-semibold">{movie.rating}</span>
        </div>

        {/* Play overlay trigger */}
        <AnimatePresence>
          {movie.watchLink && isHovered && (
             <motion.button
               onClick={() => onWatchClick(movie)}
               initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
               animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
               exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
               transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-35 bg-white/15 backdrop-blur-md border border-white/30 text-white w-14 h-14 rounded-full flex items-center justify-center hover:bg-white hover:text-black hover:scale-105 active:scale-90 transition-all shadow-[0_0_30px_rgba(168,85,247,0.3)] cursor-pointer"
             >
               <Play fill="currentColor" size={20} className="ml-0.5" />
             </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      <div className="p-5 flex flex-col flex-1 relative z-20 bg-gradient-to-b from-[#090909] to-[#040404] group-hover:from-[#0e0e0e] group-hover:to-[#080808] transition-all duration-500">
        <h3 className="text-base font-display font-black tracking-tight mb-1 text-white line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300">
          {movie.title}
        </h3>
        <p className="text-[10px] text-white/40 mb-4 tracking-wider uppercase font-semibold font-sans">
          {movie.year} <span className="mx-1 opacity-50">•</span> {(movie.genre || '').split(',')[0] || 'Unknown'}
        </p>
        
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold text-white/30 uppercase bg-white/[0.03] border border-white/5 px-2 py-0.5 rounded-sm">{movie.size}</span>
          </div>
          
          <div className="flex gap-2">
            {movie.watchLink && (
              <button 
                onClick={() => onWatchClick(movie)}
                className="flex-1 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-300 py-2.5 text-[10px] tracking-widest uppercase font-black flex items-center justify-center gap-1.5 rounded-full active:scale-95 shadow-[0_2px_15px_rgba(99,102,241,0.15)] cursor-pointer"
              >
                <Play size={10} fill="currentColor" />
                <span>Watch</span>
              </button>
            )}
            {movie.downloadLink && (
              <button 
                onClick={() => onDownloadClick(movie)}
                className={`flex-1 transition-all duration-300 py-2.5 text-[10px] tracking-widest uppercase font-black flex items-center justify-center gap-1.5 rounded-full active:scale-95 cursor-pointer ${movie.watchLink ? 'bg-white/[0.04] border border-white/10 hover:border-white/30 hover:bg-white/[0.08] text-white/70 hover:text-white' : 'bg-white hover:bg-slate-200 text-black shadow-[0_4px_15px_rgba(255,255,255,0.1)]'}`}
              >
                <Download size={10} />
                <span>Get</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoadingMovies, setIsLoadingMovies] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [adSettings, setAdSettings] = useState<any>(null);
  const [siteName, setSiteName] = useState('Findinggoodd');
  const [copyrightText, setCopyrightText] = useState(`Copyright ${new Date().getFullYear()} Findinggoodd`);
  const [omdbApiKey, setOmdbApiKey] = useState('');
  const [downloadingMovie, setDownloadingMovie] = useState<Movie | null>(null);
  const [watchingMovie, setWatchingMovie] = useState<Movie | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Compute available genres dynamically
  const displayMovies = movies.length > 0 ? movies : INITIAL_MOVIES;
  const availableGenres = ['All', ...Array.from(new Set(displayMovies.flatMap(m => (m.genre || '').split(',').map(g => g.trim()))))].filter(Boolean);

  useEffect(() => {
    const unsubAd = onSnapshot(doc(db, 'settings', 'adBanner'), (docSnap) => {
        if (docSnap.exists()) {
            setAdSettings(docSnap.data());
        }
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, 'settings/adBanner');
    });

    const unsubSite = onSnapshot(doc(db, 'settings', 'site'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.siteName) {
                setSiteName(data.siteName);
                document.title = data.siteName;
            }
            if (data.copyrightText !== undefined) {
                setCopyrightText(data.copyrightText);
            }
            if (data.omdbApiKey !== undefined) {
                setOmdbApiKey(data.omdbApiKey);
            }
        }
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, 'settings/site');
    });

    return () => {
      unsubAd();
      unsubSite();
    };
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    checkConnection();

    // Only subscribe to movies if it's public (we decided anyone can read)
    const q = query(collection(db, 'movies'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMovies: Movie[] = [];
      snapshot.forEach((doc) => {
        fetchedMovies.push({ id: doc.id as any, ...doc.data() } as Movie);
      });
      setMovies(fetchedMovies);
      setIsLoadingMovies(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'movies');
      setIsLoadingMovies(false);
    });

    // Check pre-existing auth for admin
    const authSub = auth.onAuthStateChanged((user) => {
      if (user && user.email === 'mohitdudwal007@gmail.com') {
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
    });

    return () => {
      unsubscribe();
      authSub();
    };
  }, []);

  useEffect(() => {
    let unsubscribeReq: (() => void) | undefined;
    if (isAdminAuthenticated) {
      const qReq = query(collection(db, 'movieRequests'), orderBy('createdAt', 'desc'));
      unsubscribeReq = onSnapshot(qReq, (snapshot) => {
        const fetchedReqs: any[] = [];
        snapshot.forEach((doc) => {
          fetchedReqs.push({ id: doc.id, ...doc.data() });
        });
        setRequests(fetchedReqs);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'movieRequests');
      });
    }

    return () => {
      if (unsubscribeReq) unsubscribeReq();
    };
  }, [isAdminAuthenticated]);

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminAuthenticated(false);
    setShowAdmin(false);
  };

  const filteredMovies = displayMovies.filter(movie => {
    const q = searchQuery.toLowerCase();
    const searchMatch = (movie.title || '').toLowerCase().includes(q) || (movie.genre || '').toLowerCase().includes(q);
    const genreMatch = selectedGenre === 'All' || (movie.genre || '').toLowerCase().includes(selectedGenre.toLowerCase());
    return searchMatch && genreMatch;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans overflow-x-hidden relative selection:bg-white selection:text-black">
      <CursorGlow />
      <LiveParticlesBackground />
      <div className="fixed inset-0 pointer-events-none bg-noise opacity-[0.03] z-[100] mix-blend-overlay"></div>
      <Navbar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onBrandTripleClick={() => setShowAdmin(true)} 
        onRequestClick={() => setShowRequestModal(true)}
        siteName={siteName}
      />

      <AnimatePresence>
        {downloadingMovie && (
          <AdBannerModal movie={downloadingMovie} settings={adSettings} onClose={() => setDownloadingMovie(null)} />
        )}
        {watchingMovie && (
          <WatchModal movie={watchingMovie} onClose={() => setWatchingMovie(null)} />
        )}
        {showTermsModal && (
          <TermsModal onClose={() => setShowTermsModal(false)} />
        )}
        {showRequestModal && (
          <MovieRequestModal onClose={() => setShowRequestModal(false)} />
        )}
        {showAdmin && !isAdminAuthenticated && (
           <AdminLogin 
             onLogin={() => setIsAdminAuthenticated(true)} 
             onClose={() => setShowAdmin(false)} 
           />
        )}
        {showAdmin && isAdminAuthenticated && (
           <AdminDashboard 
             movies={movies} 
             setMovies={setMovies} 
             requests={requests}
             onLogout={handleLogout}
             onClose={() => setShowAdmin(false)} 
             siteName={siteName}
             copyrightText={copyrightText}
             omdbApiKey={omdbApiKey}
           />
        )}
      </AnimatePresence>
      
      <main className="flex-1 flex flex-col mt-20">
        <Hero />
        
        {/* Trending Section */}
        {displayMovies.some(m => m.isTrending) && (
          <section className="px-6 md:px-16 xl:px-24 pb-16">
            <div className="flex items-center gap-3.5 mb-8 border-b border-white/[0.04] pb-4">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 animate-pulse"></span>
              </span>
              <h2 className="text-xl md:text-2xl font-display font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-brand-pink via-brand-amber to-brand-purple drop-shadow-[0_0_15px_rgba(244,63,94,0.15)] flex items-center gap-2">
                Trending Now 🔥
              </h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {displayMovies.filter(m => m.isTrending).map((movie, idx) => (
                <MovieCard 
                   key={`trending-${movie.id}`} 
                   movie={movie} 
                   index={idx} 
                   onDownloadClick={(m) => {
                     if (!m.downloadLink) return;
                     trackAnalytics(m.id, m.title, 'downloads');
                     if (adSettings && adSettings.isActive) {
                       setDownloadingMovie(m);
                     } else {
                       window.open(m.downloadLink, '_blank');
                     }
                   }} 
                   onWatchClick={(m) => {
                     setWatchingMovie(m);
                     trackAnalytics(m.id, m.title, 'views');
                   }}
                 />
              ))}
            </div>
          </section>
        )}
        
        <section id="catalog" className="px-6 md:px-16 xl:px-24 pb-24">
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-white/[0.04] pb-4 gap-4 relative">
            <h2 className="text-xl md:text-2xl font-display font-black tracking-tighter uppercase relative group flex items-center gap-2 text-white">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">Latest Additions</span>
            </h2>
            <button className="hidden md:flex text-white/40 hover:text-white transition-all items-center gap-2 text-[10px] uppercase tracking-widest font-bold group border border-white/[0.04] hover:border-white/15 px-4 py-2 rounded-full hover:bg-white/[0.02]">
              View All <motion.span animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="text-lg leading-none">→</motion.span>
            </button>
          </div>
          
          {/* Genre Filters */}
          {availableGenres.length > 1 && (
            <div className="flex gap-2 pb-6 mb-4 overflow-x-auto scrollbar-none snap-x py-1">
              {availableGenres.map(genre => {
                const isActive = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`snap-center shrink-0 px-6 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all duration-300 border cursor-pointer select-none relative overflow-hidden ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white border-transparent shadow-[0_4px_20px_rgba(99,102,241,0.35)] scale-105 font-black' 
                        : 'bg-white/[0.02] text-white/60 border-white/[0.05] hover:border-white/20 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="relative z-10">{genre}</span>
                  </button>
                );
              })}
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 flex-1">
            {isLoadingMovies ? (
              // Enhanced Loading Skeleton with beautiful high-end container match
              Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#080808] animate-pulse relative overflow-hidden border border-white/[0.05] rounded-2xl flex flex-col justify-end p-5">
                  <div className="absolute top-4 right-4 bg-white/5 w-12 h-6 border border-white/5 rounded-full"></div>
                  <div className="flex flex-col w-full relative z-10 pt-12 space-y-3">
                     <div className="h-4 w-3/4 bg-white/[0.04] rounded-sm"></div>
                     <div className="h-2.5 w-1/3 bg-white/[0.04] rounded-sm pb-2"></div>
                     <div className="flex gap-2 w-full pt-2">
                       <div className="flex-1 h-8.5 bg-white/[0.04] rounded-full"></div>
                       <div className="flex-1 h-8.5 bg-white/[0.04] rounded-full"></div>
                     </div>
                  </div>
                </div>
              ))
            ) : filteredMovies.length > 0 ? (
              filteredMovies.map((movie, idx) => (
                <MovieCard 
                   key={movie.id} 
                   movie={movie} 
                   index={idx} 
                   onDownloadClick={(m) => {
                     if (!m.downloadLink) return;
                     trackAnalytics(m.id, m.title, 'downloads');
                     if (adSettings && adSettings.isActive) {
                       setDownloadingMovie(m);
                     } else {
                       window.open(m.downloadLink, '_blank');
                     }
                   }} 
                   onWatchClick={(m) => {
                     setWatchingMovie(m);
                     trackAnalytics(m.id, m.title, 'views');
                   }}
                 />
              ))
            ) : (
              <div className="col-span-full py-32 flex flex-col items-center justify-center border border-white/5 bg-[#0a0a0a] rounded-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.03] via-transparent to-transparent"></div>
                
                <h3 className="text-3xl md:text-5xl font-display font-black tracking-tighter uppercase text-white/20 mb-4 z-10">
                  {searchQuery ? 'Missing Title' : 'Empty Vault'}
                </h3>
                
                <div className="text-[10px] tracking-[0.2em] uppercase font-bold text-[#FFD700]/50 mb-2 z-10 flex border border-[#FFD700]/10 bg-[#FFD700]/5 px-4 py-2 rounded-full">
                  {searchQuery ? `No signals found ` : "Awaiting transmissions"}
                </div>
                
                <p className="text-sm tracking-wide text-white/40 text-center max-w-md z-10 mt-4 leading-relaxed">
                  {searchQuery 
                    ? `Our deep space scans couldn't fetch any records matching "${searchQuery}". Try modifying your search parameters.` 
                    : "The archive is currently completely desolate. Stand by for the next wave of movie uploads."}
                </p>
                
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
                    className="mt-8 px-6 py-3 border border-white/20 hover:bg-white hover:text-black transition-all uppercase text-[10px] font-bold tracking-widest z-10"
                  >
                    Clear Search Scanners
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Footer Area */}
        <footer className="border-t border-white/5 mt-auto relative overflow-hidden bg-gradient-to-b from-transparent to-black/50">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          <div className="px-6 md:px-12 xl:px-24 py-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 text-[10px] tracking-widest uppercase font-bold text-white/40">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-12 text-center md:text-left">
              <span className="text-white hover:text-white/80 transition-colors drop-shadow-md">{copyrightText}</span>
              <button 
                onClick={() => setShowTermsModal(true)} 
                className="hover:text-white transition-colors cursor-pointer uppercase border-b border-transparent hover:border-white/20 pb-1"
              >
                Terms & Conditions
              </button>
            </div>
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/5 backdrop-blur-md transition-colors hover:bg-white/10 hover:border-white/10">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full"></span>
              <span className="text-white/60 text-[9px] tracking-[0.2em]">
                Archive Size: <span className="text-white ml-1">{displayMovies.length} {displayMovies.length === 1 ? 'Title' : 'Titles'}</span>
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
