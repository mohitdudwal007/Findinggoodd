import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, Star, Search, Menu, Play, X, Trash2, Plus, 
  LogOut, Edit, MessageSquare, FileText, Sliders, BarChart2, 
  ShieldAlert, Check, HelpCircle, Activity, LayoutGrid, MonitorPlay,
  ArrowRight, KeyRound, Radio, Compass, Film, Award, Hash, Zap
} from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  collection, onSnapshot, doc, setDoc, deleteDoc, 
  serverTimestamp, getDocFromServer, query, orderBy, increment 
} from 'firebase/firestore';

// Shared modular definitions
import { 
  Movie, OperationType, MovieRequest, AdSettings, SiteSettings 
} from './types';
import { 
  CursorGlow, LiveParticlesBackground 
} from './components/BackgroundEffects';

// Secure Firestore helper
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('[Firestore Ops Failure] Details:', JSON.stringify(errInfo));
}

// Analytics pulse tracking
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
    console.error('[Telemetry Failure] Failed to push stats:', error);
  }
};

// --- CLIENT RE-DESIGN COMPONENTS ---

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onBrandTripleClick: () => void;
  onRequestClick: () => void;
  siteName: string;
}

const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  onBrandTripleClick,
  onRequestClick,
  siteName,
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
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 left-4 right-4 z-50 max-w-7xl mx-auto border border-white/[0.08] bg-[#07080d]/65 backdrop-blur-3xl rounded-full py-3 px-6 md:px-10 flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
    >
      <div 
        onClick={handleBrandClick}
        className="flex items-center gap-3 cursor-pointer select-none group"
      >
        {/* Modern Multi-loop Logo Spark */}
        <div className="relative shrink-0 w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
          <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C12 2 13.5 8 16.5 9.5C19.5 11 22 11 22 11C22 11 19.5 11 16.5 12.5C13.5 14 12 20 12 20C12 20 10.5 14 7.5 12.5C4.5 11 2 11 2 11C2 11 4.5 11 7.5 9.5C10.5 8 12 2 12 2Z" fill="url(#navSpark)" />
            <defs>
              <linearGradient id="navSpark" x1="2" y1="2" x2="22" y2="20">
                <stop offset="0%" stopColor="#4285F4" />
                <stop offset="50%" stopColor="#9B72F3" />
                <stop offset="100%" stopColor="#EA4335" />
              </linearGradient>
            </defs>
          </svg>
          <span className="absolute inset-0 rounded-full bg-indigo-500/10 blur-sm -z-10 animate-ping scale-110"></span>
        </div>
        
        <span className="text-sm font-display font-black tracking-tight text-white uppercase hidden sm:block">
          <span className="text-gradient-gemini font-extrabold">{siteName}</span>
        </span>
      </div>

      {/* Floating Dynamic Search Expander */}
      <div className="flex-1 flex justify-end px-4">
        <motion.div 
          layout
          className={`flex items-center h-10 rounded-full transition-all duration-300 ${
            isSearchOpen 
              ? 'w-full md:w-80 bg-white/[0.04] border border-white/10 px-4' 
              : 'w-10 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08]'
          }`}
        >
          <button 
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="w-10 h-10 flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            {isSearchOpen ? <X size={15} /> : <Search size={15} />}
          </button>
          
          <AnimatePresence>
            {isSearchOpen && (
              <motion.input
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: '100%' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                type="text"
                autoFocus
                placeholder="Search index database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-[11px] font-medium tracking-wide text-white placeholder:text-white/20 w-full ml-2 capitalize"
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Main Actions Area */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onRequestClick} 
          className="relative group overflow-hidden bg-gradient-to-r from-[#4285F4]/15 via-[#9B72F3]/10 to-[#EA4335]/15 border border-white/[0.08] hover:border-[#9B72F3]/30 px-5 py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest text-white/90 cursor-pointer active:scale-95 transition-all duration-300 flex items-center gap-2 hover:shadow-[0_4px_15px_rgba(155,114,243,0.15)]"
        >
          <span className="w-1.5 h-1.5 bg-[#9B72F3] rounded-full animate-ping"></span>
          <span>Request Movie</span>
        </button>
      </div>
    </motion.nav>
  );
};

interface HeroProps {
  onExploreClick: () => void;
  featuredMovie?: Movie;
  onWatchMovie?: (movie: Movie) => void;
  onDownloadMovie?: (movie: Movie) => void;
}

const Hero: React.FC<HeroProps> = ({ onExploreClick }) => {
  return (
    <section className="relative min-h-[80vh] flex items-center px-6 md:px-16 xl:px-24 pt-32 pb-24 overflow-hidden border-b border-white/[0.04]">
      {/* Dynamic Network Lines and Mesh */}
      <div className="absolute inset-0 bg-[#040508] z-0">
        <div className="absolute top-[-30%] left-[-10%] w-[65vw] h-[65vw] bg-radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#4285F4]/10 via-transparent to-transparent blur-[120px] opacity-45 animate-pulse-slow"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[55vw] h-[55vw] bg-radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#9B72F3]/10 via-transparent to-transparent blur-[120px] opacity-35 animate-pulse-slow [animation-delay:4s]"></div>
        
        {/* Subtle Google Tech Grid Underlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* Floating Dynamic Orbital Circles */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[50vw] h-[50vw] border border-white/[0.02] rounded-full mix-blend-screen opacity-40 pointer-events-none hidden lg:block">
        <div className="absolute inset-12 border border-[#9B72F3]/3 rounded-full animate-pulse-slow"></div>
        <div className="absolute inset-32 border border-[#4285F4]/2 rounded-full animate-float"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 mb-6 justify-center"
        >
          <span className="w-6 h-[2px] bg-gradient-to-r from-[#4285F4] to-[#9B72F3]"></span>
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gradient-gemini">
            Verified Cloud Catalog & Streaming
          </span>
          <span className="w-6 h-[2px] bg-gradient-to-r from-[#9B72F3] to-[#EA4335]"></span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-4xl sm:text-6xl xl:text-[6.5rem] font-display font-black tracking-tight leading-[0.95] text-white mb-8 uppercase"
        >
          DIRECT.<br />
          <span className="italic font-light text-slate-300 font-sans mr-3 capitalize">HIGH-SPEED.</span>
          <span className="text-gradient-gemini font-black block sm:inline">CINEMA.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 0.75, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7 }}
          className="text-xs md:text-sm text-slate-300 font-medium tracking-widest uppercase leading-relaxed max-w-2xl mb-12"
        >
          Your dynamic standalone digital catalog. Instantly watch and download high-definition releases without speed throttling, intrusive redirections, or visual noise. Premium curation at your fingertips.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-5"
        >
          <button 
            onClick={onExploreClick}
            className="px-10 py-5 bg-gradient-to-r from-[#4285F4] via-[#9B72F3] to-[#EA4335] text-white text-[11px] font-extrabold uppercase tracking-widest rounded-full hover:scale-[1.03] active:scale-[0.97] hover:shadow-[0_12px_40px_rgba(155,114,243,0.35)] transition-all duration-300 flex items-center gap-2.5 cursor-pointer"
          >
            <span>Explore Catalog Shelf</span>
            <ArrowRight size={13} className="ml-1 animate-pulse" />
          </button>
          <button 
            onClick={onExploreClick}
            className="px-10 py-5 bg-white/[0.02] border border-white/10 hover:border-white/20 text-white/50 hover:text-white text-[11px] font-black uppercase tracking-widest rounded-full hover:bg-white/[0.04] transition-all duration-300 cursor-pointer"
          >
            Latest Releases
          </button>
        </motion.div>
      </div>
    </section>
  );
};

// --- INTERACTIVE MEDIA MODALS ---

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
      className="fixed inset-0 z-[100] bg-[#040508]/96 backdrop-blur-md flex items-center justify-center p-6"
    >
      <button onClick={onClose} className="absolute top-8 right-12 text-white/30 hover:text-white transition-colors cursor-pointer bg-white/[0.02] w-10 h-10 border border-white/5 rounded-full flex items-center justify-center">
        <X size={20} />
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[#0c0d13]/90 border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3]"></div>
        
        <h2 className="text-xl font-display font-black tracking-tight uppercase text-white mb-6">Request Catalog Additions</h2>
        
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-4">
            <div className="w-12 h-12 rounded-full border border-green-500/20 bg-green-500/10 flex items-center justify-center text-green-400">
              <Check size={24} />
            </div>
            <div>
              <div className="text-white font-bold text-sm uppercase tracking-wider">Request Deposited Successfully</div>
              <p className="text-[10px] text-white/40 uppercase mt-2 font-black tracking-widest">We will notify the cloud index to download</p>
            </div>
            <button onClick={onClose} className="mt-4 px-6 py-3 bg-white text-black font-extrabold uppercase text-[10px] tracking-widest rounded-full cursor-pointer hover:bg-slate-200 transition-all">
              Acknowledge Entry
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <p className="text-[10px] text-white/50 leading-relaxed font-bold uppercase tracking-wider">Cannot find a specific film? Notify our catalog team to instantly source the file.</p>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Movie Title &amp; Year</label>
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex. Interstellar (2014) Dual Audio"
                className="w-full bg-white/[0.02] border border-white/10 rounded-full py-3 px-5 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans"
                required 
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Specific Requirements (Optional)</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ex. Require 4K HDR Atmos or Hindi dubbed version..."
                className="w-full bg-white/[0.02] border border-white/10 rounded-[1.2rem] p-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans resize-none h-24"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="mt-2 py-3.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3] hover:from-[#3572df] hover:to-[#875de2] text-white font-extrabold uppercase text-[10px] tracking-widest transition-all duration-300 text-center rounded-full hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Transmitting Request Info...' : 'Transmit Request'}
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
      className="fixed inset-0 z-[100] bg-[#040508]/96 backdrop-blur-md flex items-center justify-center p-6"
    >
      <button onClick={onClose} className="absolute top-8 right-12 text-white/30 hover:text-white transition-colors cursor-pointer bg-white/[0.02] w-10 h-10 border border-white/5 rounded-full flex items-center justify-center">
        <X size={20} />
      </button>

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl bg-[#0c0d13]/90 border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl relative overflow-y-auto max-h-[80vh] thin-scrollbar"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3]"></div>
        
        <h2 className="text-2xl font-display font-black tracking-tight uppercase mb-6 text-white">{title}</h2>
        <div className="text-xs leading-relaxed text-slate-400 whitespace-pre-wrap font-sans uppercase tracking-wider font-semibold">
          {content}
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- SECURE CONSOLE SIGN-IN ---

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
      setError(err.message || 'Invalid Credentials');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#040508]/98 backdrop-blur-3xl flex items-center justify-center p-6"
    >
      <button 
        onClick={onClose} 
        className="absolute top-8 right-12 text-white/30 hover:text-white transition-colors cursor-pointer bg-white/[0.02] w-10 h-10 border border-white/5 rounded-full flex items-center justify-center"
      >
        <X size={20} />
      </button>

      <motion.div 
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 30, opacity: 0, scale: 0.96 }}
        className="w-full max-w-md bg-[#0c0d12]/90 border border-white/[0.08] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        {/* Colorful top bar resembling official Google design */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] via-[#34A853] via-[#9B72F3] to-[#22D3EE] z-20"></div>

        <div className="flex flex-col items-center mb-8 text-center select-none">
          {/* Logo element inside sign in */}
          <div className="w-12 h-12 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center mb-4 relative">
            <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C12 2 13.5 8 16.5 9.5C19.5 11 22 11 22 11C22 11 19.5 11 16.5 12.5C13.5 14 12 20 12 20C12 20 10.5 14 7.5 12.5C4.5 11 2 11 2 11C2 11 4.5 11 7.5 9.5C10.5 8 12 2 12 2Z" fill="url(#adminSpark)" />
              <defs>
                <linearGradient id="adminSpark" x1="2" y1="2" x2="22" y2="20">
                  <stop offset="0%" stopColor="#4285F4" />
                  <stop offset="50%" stopColor="#9B72F3" />
                  <stop offset="100%" stopColor="#EA4335" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">Identity Console</h2>
          <p className="text-white/40 text-[9px] tracking-[0.25em] font-black uppercase mt-1">Authorized Admins Only</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Admin Profile Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@findinggoodd.online"
              className="w-full bg-white/[0.02] border border-white/10 rounded-full py-3 px-5 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans"
              required 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Security Key Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/[0.02] border border-white/10 rounded-full py-3 px-5 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans"
              required 
            />
          </div>

          {error && (
            <div className="text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/15 py-2.5 px-4 rounded-full text-center mt-1">
              ⚠ Authenticate Failed: {error.replace('Firebase:', '')}
            </div>
          )}

          <button 
            type="submit" 
            className="mt-2 py-3.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3] hover:from-[#3572df] hover:to-[#875de2] text-white font-extrabold uppercase text-[10px] tracking-widest transition-all duration-300 text-center rounded-full hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            Pass Authenticate
          </button>
        </form>

        <p className="text-[8px] text-white/20 tracking-widest text-center uppercase font-black mt-6 leading-relaxed">
          Google Cloud Secure Access Environment
        </p>
      </motion.div>
    </motion.div>
  );
};

// --- DEEP-DIVE ADMIN WORKSPACE PANEL (GCP STYLED) ---

interface AdminDashboardProps {
  movies: Movie[];
  setMovies: (movies: Movie[]) => void;
  requests: any[];
  onLogout: () => void;
  onClose: () => void;
  siteName: string;
  copyrightText: string;
  omdbApiKey: string;
  initialEditingMovie?: Movie | null;
  clearInitialEditingMovie?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  movies,
  setMovies,
  requests,
  onLogout,
  onClose,
  siteName,
  copyrightText,
  omdbApiKey,
  initialEditingMovie,
  clearInitialEditingMovie,
}) => {
  const [newMovie, setNewMovie] = useState({
    title: '', year: '', rating: '', poster: '', genre: '', size: '', downloadLink: '', watchLink: '', isTrending: false
  });
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [activeTab, setActiveTab] = useState<'movies' | 'requests' | 'pages' | 'ads' | 'settings' | 'analytics'>('movies');
  
  // States syncing
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [termsContent, setTermsContent] = useState('');
  const [isSavingTerms, setIsSavingTerms] = useState(false);
  const [adminSiteName, setAdminSiteName] = useState(siteName);
  const [adminCopyrightText, setAdminCopyrightText] = useState(copyrightText || '');
  const [adminOmdbApiKey, setAdminOmdbApiKey] = useState(omdbApiKey || '');
  const [isSavingSiteName, setIsSavingSiteName] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Sync props to state on mounts
  useEffect(() => {
    setAdminSiteName(siteName);
    setAdminCopyrightText(copyrightText || '');
    setAdminOmdbApiKey(omdbApiKey || '');
  }, [siteName, copyrightText, omdbApiKey]);

  // Handle direct movie edit from card triggers
  useEffect(() => {
    if (initialEditingMovie) {
      handleEdit(initialEditingMovie);
      if (clearInitialEditingMovie) {
        clearInitialEditingMovie();
      }
    }
  }, [initialEditingMovie, clearInitialEditingMovie]);

  // Real-time tab data fetching
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
             // Handled locally
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

  // OMDb Auto Fill Wizard logic
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
      } else {
        alert("Movie not found on OMDb directory!");
      }
    } catch (e) {
      alert("Failed to connect to OMDb api query.");
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Ads Setup fields
  const [adContent, setAdContent] = useState('');
  const [adPosterUrl, setAdPosterUrl] = useState('');
  const [adIsActive, setAdIsActive] = useState(false);
  const [adTimerSeconds, setAdTimerSeconds] = useState(10);
  const [isSavingAd, setIsSavingAd] = useState(false);

  useEffect(() => {
    if (activeTab === 'ads') {
      const getAdDetails = async () => {
        try {
          const docSnap = await getDocFromServer(doc(db, 'settings', 'adBanner'));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setAdContent(data.content || '');
            setAdPosterUrl(data.posterUrl || '');
            setAdIsActive(!!data.isActive);
            setAdTimerSeconds(Number(data.timerSeconds || 10));
          }
        } catch (e) {
          console.error(e);
        }
      };
      getAdDetails();
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
      alert("T&C Updated Successfully!");
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
      alert("Promotion Rules Applied Successfully!");
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
      alert("System Preferences Updated!");
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
    if (!confirm("Are you sure you want to permanently delete this movie release?")) return;
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
      className="fixed inset-0 z-[100] bg-[#05060a] text-slate-200 overflow-y-auto thin-scrollbar"
    >
      {/* Workspace Header Dashboard */}
      <nav className="sticky top-0 z-50 px-6 lg:px-12 py-5 flex flex-col xl:flex-row xl:items-center justify-between border-b border-white/[0.08] bg-[#05060b]/85 backdrop-blur-3xl gap-6 xl:gap-4 shadow-lg">
        <div className="flex items-center justify-between w-full xl:w-auto">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4285F4] opacity-50"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4285F4] shadow-md shadow-[#4285F4]/30"></span>
            </span>
            <span className="text-white font-display font-black uppercase tracking-tight text-lg">{siteName}</span> 
            <span className="text-[9px] uppercase font-mono tracking-widest text-slate-400 border border-white/10 px-2.5 py-0.5 rounded-full bg-white/[0.02]">console</span>
          </div>
          
          <div className="flex gap-3 xl:hidden">
            <button onClick={onLogout} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white cursor-pointer"><LogOut size={16} /></button>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.02] border border-white/5 text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
          </div>
        </div>

        {/* Dynamic Nav tabs */}
        <div className="flex bg-white/[0.02] border border-white/[0.08] p-1.5 rounded-full overflow-x-auto text-[10px] w-full xl:w-auto snap-x gap-1">
          {[
            { id: 'movies', label: 'Library Vault', icon: Film },
            { id: 'requests', label: 'Guest Requests', icon: MessageSquare },
            { id: 'pages', label: 'Privacy Policies', icon: FileText },
            { id: 'ads', label: 'Promo Injector', icon: Radio },
            { id: 'settings', label: 'Preferences', icon: Sliders },
            { id: 'analytics', label: 'Insights Stream', icon: BarChart2 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`px-5 py-2 rounded-full font-bold tracking-widest snap-center flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap uppercase ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white shadow-md shadow-indigo-500/15' 
                    : 'text-slate-400 hover:bg-white/[0.03] hover:text-white/80'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex gap-3">
          <button 
            onClick={onLogout} 
            className="px-5 py-2.5 transition-all bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-full text-[10px] tracking-widest uppercase font-black flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <LogOut size={13} /> Sign-Out
          </button>
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 transition-all bg-[#4285F4]/10 text-[#4285F4] hover:bg-[#4285F4]/20 border border-[#4285F4]/20 rounded-full text-[10px] tracking-widest uppercase font-black flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <X size={13} /> Exit Console
          </button>
        </div>
      </nav>

      {/* TABS CONTAINER */}
      {activeTab === 'movies' && (
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Form Side */}
          <div className="lg:col-span-5">
            <div id="admin-form-container" className="bg-[#0b0c13]/90 border border-white/[0.08] p-8 rounded-[2rem] shadow-xl lg:sticky lg:top-36 backdrop-blur-3xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1.5 h-16 bg-gradient-to-b from-[#4285F4] to-[#9B72F3]"></div>
              
              <h3 className="text-sm font-display font-black uppercase tracking-widest text-white mb-6 border-b border-white/[0.06] pb-4 flex items-center gap-2">
                <LayoutGrid size={15} />
                {editingId ? 'Modify Release Card' : 'Launch New Release'}
              </h3>

              <form onSubmit={handleAddOrUpdate} className="flex flex-col gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Movie Title</label>
                  <div className="flex gap-2">
                    <input 
                      placeholder="Ex. Interstellar" 
                      required 
                      value={newMovie.title} 
                      onChange={e => setNewMovie({...newMovie, title: e.target.value})} 
                      className="flex-1 bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                    />
                    <button 
                      type="button" 
                      onClick={handleAutoFill} 
                      disabled={isFetchingDetails} 
                      className="bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white px-4 rounded-full font-black uppercase tracking-widest text-[9px] hover:scale-102 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {isFetchingDetails ? 'Fetching...' : 'OMDb FILL 🪄'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Year</label>
                    <input 
                      placeholder="Ex. 2014" 
                      required 
                      value={newMovie.year} 
                      onChange={e => setNewMovie({...newMovie, year: e.target.value})} 
                      className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Rating</label>
                    <input 
                      placeholder="Ex. 8.6" 
                      required 
                      type="number" 
                      step="0.1" 
                      value={newMovie.rating} 
                      onChange={e => setNewMovie({...newMovie, rating: e.target.value})} 
                      className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Poster Image URL</label>
                  <input 
                    placeholder="https://image-link.com/poster.jpg" 
                    required 
                    value={newMovie.poster} 
                    onChange={e => setNewMovie({...newMovie, poster: e.target.value})} 
                    className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Genre (Comma split)</label>
                    <input 
                      placeholder="Ex. Sci-Fi, Drama" 
                      required 
                      value={newMovie.genre} 
                      onChange={e => setNewMovie({...newMovie, genre: e.target.value})} 
                      className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">File Size</label>
                    <input 
                      placeholder="Ex. 2.1 GB" 
                      required 
                      value={newMovie.size} 
                      onChange={e => setNewMovie({...newMovie, size: e.target.value})} 
                      className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Direct Access File Link</label>
                  <input 
                    placeholder="https://drive-storage-link.com/file" 
                    value={newMovie.downloadLink} 
                    onChange={e => setNewMovie({...newMovie, downloadLink: e.target.value})} 
                    className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase tracking-widest font-black text-white/40 pl-2">Interactive Theatre Embed Link (IFrame Player)</label>
                  <input 
                    placeholder="https://vidsrc.to/embed/movie/..." 
                    value={newMovie.watchLink} 
                    onChange={e => setNewMovie({...newMovie, watchLink: e.target.value})} 
                    className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60 focus:bg-white/[0.04] transition-all font-sans" 
                  />
                </div>

                <div className="flex items-center gap-3 bg-white/[0.02] border border-white/10 p-3 rounded-2xl select-none transition-colors cursor-pointer mt-1">
                  <input 
                    type="checkbox" 
                    id="isTrending" 
                    checked={newMovie.isTrending} 
                    onChange={e => setNewMovie({...newMovie, isTrending: e.target.checked})} 
                    className="w-4 h-4 rounded border-white/10 bg-transparent text-[#4285F4] focus:ring-0 accent-[#4285F4]" 
                  />
                  <label htmlFor="isTrending" className="text-[10px] text-white/70 font-display font-black tracking-widest cursor-pointer uppercase">
                    Promote to Trending Shelf 🔥
                  </label>
                </div>

                <button 
                  type="submit" 
                  className="mt-2 py-3.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white font-extrabold uppercase text-[10px] tracking-widest rounded-full flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-97 transition-all shadow-md"
                >
                  <Plus size={14} /> {editingId ? 'Modify Release' : 'Publish to Catalog'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => { setEditingId(null); setNewMovie({ title: '', year: '', rating: '', poster: '', genre: '', size: '', downloadLink: '', watchLink: '', isTrending: false }); }} 
                    className="py-3 bg-white/[0.02] border border-white/10 text-white font-extrabold uppercase text-[9px] tracking-widest rounded-full cursor-pointer hover:bg-white/[0.04]"
                  >
                    Discard Changes
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* List/Management view */}
          <div className="lg:col-span-7">
            <h3 className="text-xs font-display font-black uppercase tracking-widest mb-6 text-white border-b border-white/[0.05] pb-4 flex items-center gap-2">
              <Film size={15} /> Catalog Management ({movies.length})
            </h3>
            <div className="flex flex-col gap-3.5">
              <AnimatePresence>
                {movies.map((m) => (
                  <motion.div 
                    key={m.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/[0.01]/80 backdrop-blur-md border border-white/[0.06] hover:border-white/15 p-4 flex items-center gap-4 rounded-2xl transition-all duration-300"
                  >
                    <img 
                      src={m.poster} 
                      alt={m.title} 
                      className="w-11 h-16 object-cover rounded-xl border border-white/10 shrink-0" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-display font-black text-white uppercase truncate flex items-center gap-2">
                        {m.title}
                        {m.isTrending && <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">TRENDING</span>}
                      </h4>
                      <p className="text-[9px] text-slate-400 tracking-wider font-extrabold uppercase mt-1">
                        Year: {m.year} <span className="mx-1">•</span> rating: ★ {m.rating} <span className="mx-1">•</span> size: {m.size}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(m)} className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-slate-400"><Edit size={13} /></button>
                      <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 hover:bg-red-500/15 text-red-400 cursor-pointer"><Trash2 size={13} /></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {movies.length === 0 && (
                <div className="py-12 px-6 text-center border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center gap-4 bg-white/[0.01]">
                  <Film size={28} className="text-white/20 animate-pulse" />
                  <div className="max-w-md">
                    <h4 className="text-sm font-display font-black uppercase text-white tracking-wider mb-1">Live Catalog is Empty</h4>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide leading-relaxed">
                      Your Firestore movies collection currently contains zero entries. You can populate it with high-quality sample movies to get started, or add custom movies manually.
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!confirm("Populate Firestore with sample movies?")) return;
                      try {
                        const sampleMovies = [
                          {
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
                            title: 'NIGHTRUN',
                            year: '2025',
                            rating: 7.5,
                            poster: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=800&auto=format&fit=crop',
                            genre: 'Action',
                            size: '3.8 GB',
                            isTrending: false,
                            downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
                            watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                          },
                          {
                            title: 'VOID',
                            year: '2023',
                            rating: 9.2,
                            poster: 'https://images.unsplash.com/photo-1535016120720-40c7467d5283?q=80&w=800&auto=format&fit=crop',
                            genre: 'Thriller',
                            size: '5.1 GB',
                            isTrending: true,
                            downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
                            watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
                          }
                        ];
                        for (const m of sampleMovies) {
                          const seedId = 'seed_' + m.title.toLowerCase();
                          await setDoc(doc(db, 'movies', seedId), {
                            ...m,
                            rating: Number(m.rating),
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                          });
                        }
                        alert("Default catalog initialized successfully!");
                      } catch (e: any) {
                        alert("Failed to populate default catalog: " + e.message);
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white font-extrabold uppercase text-[9.5px] tracking-widest rounded-full cursor-pointer hover:shadow-[0_4px_20px_rgba(155,114,243,0.3)] active:scale-95 transition-all flex items-center gap-2"
                  >
                    🚀 Populate Sample Catalog
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto w-full">
          <h3 className="text-xs font-display font-black uppercase tracking-widest mb-6 text-white border-b border-white/[0.05] pb-4 flex items-center gap-2">
            <MessageSquare size={15} /> User Requests Archive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {requests.map(req => (
                <motion.div 
                  key={req.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[#0b0c13]/90 border border-white/[0.08] p-6 rounded-[2rem] flex flex-col gap-4 relative backdrop-blur-3xl"
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-xs font-display font-black text-white uppercase truncate">{req.title}</h4>
                      <span className={`text-[8px] uppercase font-mono font-black border tracking-widest px-2.5 py-0.5 rounded-full ${
                        req.status === 'pending' 
                          ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500' 
                          : req.status === 'fulfilled' 
                            ? 'border-green-500/20 bg-green-500/10 text-green-400' 
                            : 'border-red-500/20 bg-red-500/10 text-red-400'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 uppercase tracking-wide leading-relaxed mt-2">{req.message || 'No additional requirements specified.'}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/[0.05]">
                    {req.status === 'pending' && (
                      <>
                        <button onClick={async () => {
                          await setDoc(doc(db, 'movieRequests', req.id), { status: 'fulfilled', updatedAt: serverTimestamp() }, { merge: true });
                        }} className="flex-1 py-1.5 px-3 bg-green-500/10 border border-green-500/20 hover:bg-green-500 text-green-400 hover:text-white rounded-full text-[9px] uppercase font-black transition-all cursor-pointer">Approved</button>
                        <button onClick={async () => {
                          await setDoc(doc(db, 'movieRequests', req.id), { status: 'rejected', updatedAt: serverTimestamp() }, { merge: true });
                        }} className="flex-1 py-1.5 px-3 bg-red-500/10 border border-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full text-[9px] uppercase font-black transition-all cursor-pointer">Reject</button>
                      </>
                    )}
                    <button 
                      onClick={async () => {
                        await deleteDoc(doc(db, 'movieRequests', req.id));
                      }} 
                      className="p-2 border border-white/5 rounded-full hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0 ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {requests.length === 0 && (
              <div className="col-span-full py-20 text-center border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-2">
                <MessageSquare size={32} className="text-white/10 animate-scale-slow" />
                <span className="text-[10px] uppercase font-black tracking-widest text-white/30 tracking-widest">No Active User Requests</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="px-6 md:px-12 py-12 max-w-5xl mx-auto w-full">
          <h3 className="text-xs font-display font-black uppercase tracking-widest mb-6 text-white border-b border-white/[0.05] pb-4 flex items-center gap-2">
            <FileText size={15} /> Privacy Terms configuration
          </h3>
          <div className="bg-[#0b0c13]/90 border border-white/[0.08] p-8 rounded-[2rem] flex flex-col gap-6 backdrop-blur-3xl shadow-xl">
            <textarea 
              value={termsContent}
              onChange={(e) => setTermsContent(e.target.value)}
              placeholder="Deploy full disclosure policy statement terms here..."
              className="w-full bg-white/[0.02] border border-white/10 p-6 text-xs text-white outline-none focus:border-[#4285F4]/60 font-sans leading-relaxed rounded-[1.5rem] resize-y h-96 tracking-wide font-medium"
            ></textarea>
            <div className="flex justify-end mt-2">
              <button 
                onClick={handleSaveTerms} 
                disabled={isSavingTerms}
                className="px-8 py-3.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white font-extrabold uppercase text-[10px] tracking-widest rounded-full cursor-pointer disabled:opacity-50"
              >
                {isSavingTerms ? 'Saving Statement policies' : 'Commit Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="px-6 md:px-12 py-12 max-w-5xl mx-auto w-full">
          <h3 className="text-xs font-display font-black uppercase tracking-widest mb-6 text-white border-b border-white/[0.05] pb-4 flex items-center gap-2">
            <Radio size={15} /> Promotion Delivery configuration
          </h3>
          <div className="bg-[#0b0c13]/90 border border-white/[0.08] p-8 rounded-[2rem] flex flex-col gap-6 backdrop-blur-3xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider text-white">Promotion delivery switch</span>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Present promo countdown screen before downloads</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none border border-white/5 rounded-full p-0.5">
                <input 
                  type="checkbox" 
                  checked={adIsActive} 
                  onChange={(e) => setAdIsActive(e.target.checked)} 
                  className="sr-only peer"
                />
                <div className="w-12 h-6.5 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4.5px] after:left-[4px] after:bg-white after:border-white after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-[#4285F4]"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 pl-2">Timer Countdown (Seconds)</label>
                <input 
                  type="number" 
                  value={adTimerSeconds}
                  onChange={(e) => setAdTimerSeconds(Number(e.target.value))}
                  min={0}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 pl-2">Ambient Poster URL (Optional background image)</label>
                <input 
                  type="text"
                  value={adPosterUrl}
                  onChange={(e) => setAdPosterUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/promo.jpg"
                  className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none" 
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 pl-2">HTML Inject Delivery Content (Embed Script, Banners, text)</label>
              <textarea 
                value={adContent}
                onChange={(e) => setAdContent(e.target.value)}
                placeholder="<a href='#'><img src='...' /></a>"
                className="w-full bg-white/[0.02] border border-white/10 p-6 text-xs text-white outline-none focus:border-[#4285F4]/60 font-mono rounded-[1.5rem] h-52 resize-y leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end mt-2">
              <button 
                onClick={handleSaveAd} 
                disabled={isSavingAd}
                className="px-8 py-3.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white font-extrabold uppercase text-[10px] tracking-widest rounded-full cursor-pointer"
              >
                {isSavingAd ? 'Appling delivery parameters...' : 'Publish configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="px-6 md:px-12 py-12 max-w-5xl mx-auto w-full">
          <h3 className="text-xs font-display font-black uppercase tracking-widest mb-6 text-white border-b border-white/[0.05] pb-4 flex items-center gap-2">
            <Sliders size={15} /> System Platform configuration
          </h3>
          <div className="bg-[#0b0c13]/90 border border-white/[0.08] p-8 rounded-[2rem] flex flex-col gap-6 backdrop-blur-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 pl-2">System Title Name</label>
                <input 
                  type="text" 
                  value={adminSiteName}
                  onChange={(e) => setAdminSiteName(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60" 
                  placeholder="FindingGoodd"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 pl-2">Footer Copyright Text</label>
                <input 
                  type="text" 
                  value={adminCopyrightText}
                  onChange={(e) => setAdminCopyrightText(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60" 
                  placeholder="Copyright © 2026 Findinggoodd"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] uppercase tracking-widest font-black text-slate-400 pl-2">OMDb API Key Access Token (Catalog auto fill service)</label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={adminOmdbApiKey}
                  onChange={(e) => setAdminOmdbApiKey(e.target.value)}
                  placeholder="Ex. c8fac2c"
                  className="flex-1 bg-white/[0.02] border border-white/10 rounded-full py-2.5 px-4 text-xs text-white outline-none focus:border-[#4285F4]/60" 
                />
                <a 
                  href="https://www.omdbapi.com/apikey.aspx" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-5 py-2.5 rounded-full border border-white/10 hover:border-[#4285F4] hover:bg-[#4285F4]/10 text-[9px] uppercase tracking-widest font-black text-white/50 hover:text-white transition-all flex items-center justify-center"
                >
                  Register Token
                </a>
              </div>
              <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 pl-2">Enables automated filled metrics (plot, cover, genre, year) from IMDb index database</span>
            </div>

            <div className="flex justify-end mt-2">
              <button 
                onClick={handleSaveSiteName} 
                disabled={isSavingSiteName}
                className="px-8 py-3.5 bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white font-extrabold uppercase text-[10px] tracking-widest rounded-full cursor-pointer"
              >
                {isSavingSiteName ? 'Applying Preference setup...' : 'Save Preferred Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/[0.05] pb-6 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-display font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Activity className="text-[#9B72F3]" size={15} />
                Media Actions Telemetry Insights
              </h3>
              <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">Real-time interaction log details representing streams &amp; downloads</p>
            </div>

            <div className="flex gap-3">
              <div className="bg-[#0b0c13]/90 border border-white/[0.08] p-4 rounded-2xl flex flex-col min-w-[140px]">
                <span className="text-[8px] uppercase tracking-widest text-[#4285F4] font-black">STREAM VIEW ACTIONS</span>
                <span className="text-xl font-display font-black text-white mt-1">
                  {analyticsData.reduce((acc, curr) => acc + (curr.views || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-[#0b0c13]/90 border border-white/[0.08] p-4 rounded-2xl flex flex-col min-w-[140px]">
                <span className="text-[8px] uppercase tracking-widest text-[#9B72F3] font-black">FILE SAVED ACTION</span>
                <span className="text-xl font-display font-black text-white mt-1">
                  {analyticsData.reduce((acc, curr) => acc + (curr.downloads || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-[#0b0c13]/90 border border-white/[0.08] p-8 rounded-[2rem] flex flex-col h-full min-h-[400px]">
              <span className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-4 border-b border-white/[0.05] pb-3 block">Relative Release Performance Listings</span>
              
              {isLoadingAnalytics ? (
                <div className="flex-1 flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-500">Scanning Signal Packet telemetry...</div>
              ) : analyticsData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-500">Telemetry logs entirely clear</div>
              ) : (
                <div className="flex-1 overflow-y-auto max-h-[400px] divide-y divide-white/[0.05]">
                  {analyticsData.map((item, index) => (
                    <div key={item.id} className="py-3 flex items-center justify-between hover:bg-white/[0.01]">
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-mono text-slate-500">#{index+1}</span>
                        <div>
                          <span className="text-xs font-display font-black uppercase tracking-tight text-white">{item.movieTitle}</span>
                          <span className="text-[8px] tracking-widest font-mono text-slate-500 block uppercase">DocID: {item.movieId}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-right shrink-0">
                        <div>
                          <span className="text-[8px] font-mono uppercase text-slate-500 block">Streams</span>
                          <strong className="text-xs text-[#4285F4] font-black">{item.views || 0}</strong>
                        </div>
                        <div>
                          <span className="text-[8px] font-mono uppercase text-slate-500 block">Saves</span>
                          <strong className="text-xs text-[#9B72F3] font-black">{item.downloads || 0}</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calculations Card */}
            <div className="lg:col-span-4 bg-[#0b0c13]/90 border border-white/[0.08] p-8 rounded-[2rem] flex flex-col justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-4 border-b border-white/[0.05] pb-3 block">Conversion telemetry</span>
                
                {analyticsData.length > 0 ? (
                  <div className="flex flex-col gap-5 mt-4">
                    {(() => {
                      const totalViews = analyticsData.reduce((acc, curr) => acc + (curr.views || 0), 0);
                      const totalDownloads = analyticsData.reduce((acc, curr) => acc + (curr.downloads || 0), 0);
                      const conversion = totalViews > 0 ? ((totalDownloads / totalViews) * 100).toFixed(1) : '0.0';
                      
                      const topViewed = [...analyticsData].sort((a,b) => (b.views || 0) - (a.views || 0))[0];
                      const topDownloads = [...analyticsData].sort((a,b) => (b.downloads || 0) - (a.downloads || 0))[0];

                      return (
                        <>
                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold block">Efficiency Saved Ratio</span>
                            <span className="text-3xl font-display font-black text-white mt-1 block">{conversion}%</span>
                            <div className="w-full bg-white/5 h-1.5 rounded-full mt-2.5 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#4285F4] to-[#9B72F3]" style={{ width: `${Math.min(100, Number(conversion))}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold block">Streaming Winner</span>
                            <span className="text-xs font-display font-black uppercase text-[#4285F4] mt-1 block truncate">{topViewed?.movieTitle || 'None'}</span>
                            <span className="text-[8px] tracking-widest text-slate-500 font-mono inline-block">{topViewed?.views || 0} signals views</span>
                          </div>

                          <div>
                            <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold block">Retrieval Winner</span>
                            <span className="text-xs font-display font-black uppercase text-[#9B72F3] mt-1 block truncate">{topDownloads?.movieTitle || 'None'}</span>
                            <span className="text-[8px] tracking-widest text-slate-500 font-mono inline-block">{topDownloads?.downloads || 0} signals saves</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-4">Awaiting Signal packet data</span>
                )}
              </div>

              <div className="border-t border-white/[0.05] pt-4 mt-8 text-[8px] text-slate-500 tracking-wider uppercase leading-relaxed font-mono">
                System telemetry syncs directly across dynamic Google Identity cloud workspace databases securely.
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- AD DELIVERY PROMOTIONAL CARD INTERACTIVE SYSTEM ---

const AdBannerModal = ({ movie, settings, onClose }: { movie: Movie, settings: any, onClose: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(settings?.timerSeconds || 10);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const progressPct = settings?.timerSeconds ? ((settings.timerSeconds - timeLeft) / settings.timerSeconds) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#040508]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-6"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors cursor-pointer bg-white/[0.02] w-10 h-10 border border-white/5 rounded-full flex items-center justify-center z-50">
        <X size={20} />
      </button>

      <div 
        className="w-full max-w-4xl bg-[#090a10] border border-white/10 rounded-[2.5rem] p-6 md:p-10 relative flex flex-col min-h-[60vh] max-h-[85vh] items-center justify-center text-center shadow-2xl bg-cover bg-center overflow-hidden"
        style={settings?.posterUrl ? { backgroundImage: `url(${settings.posterUrl})` } : {}}
      >
        {settings?.posterUrl && <div className="absolute inset-0 bg-gradient-to-t from-[#040508] via-[#040508]/75 to-transparent z-0"></div>}
         
        <div className="z-10 flex flex-col w-full h-full items-center justify-center overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 flex flex-col items-center select-none opacity-40">
            <span className="text-[9px] uppercase tracking-[0.3em] font-black text-white">SPONSORED PROMOTION CONSOLE</span>
          </div>

          <div 
            className="flex-1 w-full overflow-y-auto mb-8 text-white flex flex-col items-center justify-center font-display leading-relaxed" 
            dangerouslySetInnerHTML={{ __html: settings?.content || '<span class="text-white/40 text-xs uppercase tracking-widest">Sponsored content loading...</span>' }} 
          />
           
          <div className="mt-auto flex flex-col items-center gap-4 w-full max-w-xs relative z-10">
            {timeLeft > 0 ? (
              <div className="w-full flex flex-col gap-2.5">
                <span className="text-[9px] uppercase font-black text-white/40 tracking-widest leading-none">Preparing direct secure line ({timeLeft}s)</span>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-[#4285F4] to-[#9B72F3]" 
                    style={{ width: `${progressPct}%` }}
                    transition={{ ease: "linear" }}
                  />
                </div>
              </div>
            ) : (
              <a 
                href={movie.downloadLink} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full bg-gradient-to-r from-[#4285F4] to-[#9B72F3] border border-white/10 text-white hover:scale-102 active:scale-97 transition-all duration-300 py-4 rounded-full text-[10px] tracking-widest uppercase font-black flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(66,133,244,0.3)] cursor-pointer"
              >
                <Download size={14} /> Download Secure File
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- THEATRICAL CINEMA WATCH MODAL ---

const WatchModal = ({ movie, onClose }: { movie: Movie, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#030406]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-12"
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors cursor-pointer bg-white/[0.02] w-12 h-12 border border-white/5 rounded-full flex items-center justify-center z-50">
        <X size={20} />
      </button>

      <div className="w-full h-full max-h-[70vh] max-w-6xl aspect-video bg-black rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl relative">
        {movie.watchLink ? (
          <iframe 
            src={movie.watchLink} 
            className="w-full h-full" 
            allowFullScreen 
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/20 uppercase tracking-widest text-xs">
            Theatre link is not deployed for this title.
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center flex flex-col items-center">
        <h2 className="text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight mb-2.5">{movie.title}</h2>
        <div className="flex items-center gap-3 text-white/40 text-[9px] font-black uppercase tracking-widest">
          <span>{movie.year}</span>
          <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
          <span>{movie.genre}</span>
          <span className="w-1.5 h-1.5 bg-white/10 rounded-full"></span>
          <span className="text-amber-400">★ {movie.rating}</span>
        </div>
      </div>
    </motion.div>
  );
};

// --- DYNAMIC CATALOG BENTO GRID CARD COMPONENT ---

const MovieCard: React.FC<{ 
  movie: Movie, 
  index: number, 
  onDownloadClick: (movie: Movie) => void, 
  onWatchClick: (movie: Movie) => void,
  isAdmin?: boolean,
  onDeleteClick?: (id: string | number) => void,
  onEditClick?: (movie: Movie) => void
}> = React.memo(({ movie, index, onDownloadClick, onWatchClick, isAdmin, onDeleteClick, onEditClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Derive high fidelity specifications dynamically
  const isUHD = movie.size.toLowerCase().includes('gb') && parseFloat(movie.size) > 3.5;
  const qualityTag = isUHD ? "4K UHD" : "1085p FHD";

  return (
    <motion.div
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay: Math.min(index * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col w-full bg-[#0d0e15]/40 hover:bg-[#11131e]/70 border border-white/[0.05] hover:border-indigo-500/35 rounded-[1.8rem] sm:rounded-[2.2rem] overflow-hidden transition-all duration-500 ease-[0.16,1,0.3,1] hover:-translate-y-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] hover:shadow-[0_25px_60px_-15px_rgba(139,92,246,0.38)]"
    >
      {/* Top Left Hot/Trending Badge */}
      {movie.isTrending && (
        <span className="absolute top-4 left-4 z-20 bg-gradient-to-r from-[#EA4335] via-[#ea5f35] to-[#FBBC05] text-white font-sans font-black tracking-widest text-[8px] sm:text-[9px] px-3 py-1.5 rounded-full shadow-[0_4px_14px_rgba(234,67,53,0.4)] animate-pulse">
          🔥 TRENDING
        </span>
      )}

      {/* Glossy Symmetrical Neon Highlight Underline */}
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#4285F4] via-[#9B72F3] to-[#EA4335] opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20"></span>

      {/* Floating Dynamic Shadow Backglow */}
      <span className="absolute -inset-4 bg-gradient-to-r from-violet-600/10 to-blue-600/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none -z-10"></span>

      {/* Cover Image Wrapper with aspect-[11/16] */}
      <div className="aspect-[11/16] w-full bg-[#040508] relative overflow-hidden">
        {/* Ambient Underlay Blur for premium glow */}
        <img 
          src={movie.poster} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-110 pointer-events-none"
          referrerPolicy="no-referrer"
        />

        {/* High-Fidelity Shimmer loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/[0.01]">
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
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-110 ${
            imageLoaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-102 blur-sm'
          }`}
        />

        {/* Dual Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e15] via-transparent to-black/40 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d0e15]/25 via-transparent to-[#0d0e15]/25 z-10"></div>

        {/* Floating Star Glass Rating badge */}
        <div className="absolute top-4 right-4 z-20 bg-[#040508]/60 backdrop-blur-md px-3 py-1.5 border border-white/10 rounded-full text-amber-400 font-sans font-black text-[11px] flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
          <Star size={11} fill="currentColor" className="text-amber-400 rotate-[15deg] group-hover:rotate-0 transition-transform duration-500" />
          <span className="text-white text-xs font-black leading-none">{movie.rating}</span>
        </div>

        {/* Play Action Hover overlay Trigger */}
        {movie.watchLink && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20">
            <button 
              onClick={() => onWatchClick(movie)}
              className="w-13 h-13 rounded-full bg-white/10 backdrop-blur-md border border-white/25 text-white flex items-center justify-center transform scale-90 group-hover:scale-100 transition-all duration-300 ease-[0.16,1,0.3,1] hover:bg-white hover:text-black hover:scale-110 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer"
            >
              <Play size={18} fill="currentColor" className="ml-0.5" />
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Spec/Data presentation row */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 relative z-10 bg-gradient-to-b from-[#11131e]/80 to-[#08090d]/100">
        <h3 className="text-sm sm:text-base font-display font-black text-white uppercase tracking-tight line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#4285F4] group-hover:to-[#9B72F3] transition-colors duration-300 mb-1">
          {movie.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-4 text-[10px] text-slate-400/80 font-bold uppercase tracking-wider">
          <span>{movie.year}</span>
          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
          <span className="truncate">{(movie.genre || '').split(',').slice(0, 2).join(', ')}</span>
        </div>

        {/* High Tech Speccing Badges Row */}
        <div className="flex items-center justify-between gap-1.5 mb-4 border-t border-white/[0.04] pt-4 mt-auto">
          <span className="text-[9px] font-mono font-black text-[#9B72F3] bg-[#9B72F3]/8 border border-[#9B72F3]/15 px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">
            {qualityTag}
          </span>
          <span className="text-[9px] font-mono font-black text-[#4285F4] bg-[#4285F4]/8 border border-[#4285F4]/15 px-2.5 py-1 rounded-full uppercase tracking-widest shrink-0">
            {movie.size}
          </span>
        </div>

        {/* Dual Actions Portal area (Watch and Save triggers) */}
        <div className="flex gap-2">
          {movie.watchLink && (
            <button 
              onClick={() => onWatchClick(movie)}
              className="flex-1 bg-white/[0.02] hover:bg-gradient-to-r hover:from-[#4285F4]/15 hover:to-[#9B72F3]/15 border border-white/10 hover:border-indigo-500/30 text-white/90 hover:text-white py-2.5 rounded-full text-[10px] tracking-widest font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all duration-300"
            >
              <MonitorPlay size={12} className="text-blue-400" />
              <span>Watch</span>
            </button>
          )}
          {movie.downloadLink && (
            <button 
              onClick={() => onDownloadClick(movie)}
              className={`flex-1 py-2.5 rounded-full text-[10px] tracking-widest font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all duration-300 ${
                movie.watchLink 
                  ? 'bg-gradient-to-b from-white to-slate-200 text-black hover:from-white hover:to-white shadow-[0_4px_12px_rgba(255,255,255,0.08)] hover:shadow-[0_4px_20px_rgba(255,255,255,0.2)]' 
                  : 'bg-gradient-to-r from-[#4285F4] to-[#9B72F3] hover:scale-102 text-white shadow-[0_4px_12px_rgba(155,114,243,0.25)] hover:shadow-[0_4px_20px_rgba(155,114,243,0.4)] border border-white/10'
              }`}
            >
              <Download size={12} />
              <span>Get</span>
            </button>
          )}
        </div>

        {/* Direct Admin Operations */}
        {isAdmin && (
          <div className="flex gap-2 mt-4 pt-3.5 border-t border-dashed border-red-500/20 bg-red-500/5 -mx-4 -mb-4 px-4 py-3 rounded-b-[1.8rem] sm:rounded-b-[2.2rem] items-center justify-between relative z-20">
            <span className="text-[8px] font-sans font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
              Admin Actions
            </span>
            <div className="flex gap-1.5">
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick && onEditClick(movie);
                }}
                className="px-3.5 py-1.5 rounded-full bg-blue-500/20 hover:bg-blue-500 hover:text-white border border-blue-500/20 text-blue-400 text-[9px] tracking-widest font-black uppercase transition-all duration-300 cursor-pointer active:scale-95"
              >
                Edit
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick && onDeleteClick(movie.id);
                }}
                className="px-3.5 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 text-[9px] tracking-widest font-black uppercase transition-all duration-300 cursor-pointer active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// --- CORE APP PLATFORM ---

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
  const [copyrightText, setCopyrightText] = useState(`Copyright © ${new Date().getFullYear()} Findinggoodd`);
  const [omdbApiKey, setOmdbApiKey] = useState('');
  const [initialEditingMovie, setInitialEditingMovie] = useState<Movie | null>(null);
  const [downloadingMovie, setDownloadingMovie] = useState<Movie | null>(null);
  const [watchingMovie, setWatchingMovie] = useState<Movie | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string>('All');

  // Hidden admin trigger via footer copyright sequence
  const footerClickCount = useRef(0);
  const footerClickTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleFooterClick = () => {
    footerClickCount.current += 1;
    if (footerClickCount.current >= 3) {
      setShowAdmin(true);
      footerClickCount.current = 0;
    }
    if (footerClickTimeout.current) clearTimeout(footerClickTimeout.current);
    footerClickTimeout.current = setTimeout(() => {
      footerClickCount.current = 0;
    }, 500);
  };

  // Sync state constants with live fallback
  const INITIAL_MOVIES: Movie[] = [
    {
      id: "1",
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
      id: "2",
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
      id: "3",
      title: 'VOID',
      year: '2023',
      rating: 9.2,
      poster: 'https://images.unsplash.com/photo-1535016120720-40c7467d5283?q=80&w=800&auto=format&fit=crop',
      genre: 'Thriller',
      size: '5.1 GB',
      isTrending: true,
      downloadLink: 'https://github.com/mohitdudwal/Findinggoodd',
      watchLink: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
  ];

  const displayMovies = movies.length > 0 ? movies : INITIAL_MOVIES;
  const availableGenres = ['All', ...Array.from(new Set(displayMovies.flatMap(m => (m.genre || '').split(',').map(g => g.trim()))))].filter(Boolean);

  // Auto query top-tier featured release in hero cover
  const topTrendingMovie = displayMovies.find(m => m.isTrending) || displayMovies[0];

  // Global settings fetching
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
                document.title = data.siteName + " - High-Speed Dual-Audio HD Movie Downloads";
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

  // System syncing & validation hooks
  useEffect(() => {
    const unsubMovies = onSnapshot(query(collection(db, 'movies'), orderBy('createdAt', 'desc')), (snapshot) => {
      const fetched: Movie[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as Movie);
      });
      setMovies(fetched);
      setIsLoadingMovies(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'movies');
      setIsLoadingMovies(false);
    });

    const sizeAuth = auth.onAuthStateChanged((user) => {
      // Retain authentic credentials access check
      if (user && user.email === 'mohitdudwal007@gmail.com') {
        setIsAdminAuthenticated(true);
      } else {
        setIsAdminAuthenticated(false);
      }
    });

    return () => {
      unsubMovies();
      sizeAuth();
    };
  }, []);

  // Sync user requests if admin logged in
  useEffect(() => {
    let unsubReq: (() => void) | undefined;
    if (isAdminAuthenticated) {
      unsubReq = onSnapshot(query(collection(db, 'movieRequests'), orderBy('createdAt', 'desc')), (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach(docSnap => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRequests(fetched);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'movieRequests');
      });
    }
    return () => {
      if (unsubReq) unsubReq();
    };
  }, [isAdminAuthenticated]);

  const handleLogout = async () => {
    await signOut(auth);
    setIsAdminAuthenticated(false);
    setShowAdmin(false);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to permanently delete this movie release?")) return;
    try {
      await deleteDoc(doc(db, 'movies', id.toString()));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'movies');
    }
  };

  const handleEditFromCard = (movie: Movie) => {
    setInitialEditingMovie(movie);
    setShowAdmin(true);
    setTimeout(() => {
      document.getElementById('admin-form-container')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Processing filters
  const filteredMovies = displayMovies.filter(movie => {
    const q = searchQuery.toLowerCase();
    const searchMatch = (movie.title || '').toLowerCase().includes(q) || (movie.genre || '').toLowerCase().includes(q);
    const genreMatch = selectedGenre === 'All' || (movie.genre || '').toLowerCase().includes(selectedGenre.toLowerCase());
    return searchMatch && genreMatch;
  });

  const scrollCatalogIntoView = () => {
    document.getElementById('catalog-block')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#040508] text-slate-100 font-sans overflow-x-hidden relative selection:bg-white selection:text-black">
      {/* Visual Ambient Elements */}
      <CursorGlow />
      <LiveParticlesBackground />
      <div className="fixed inset-0 pointer-events-none bg-noise opacity-[0.02] z-50"></div>

      <Navbar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onBrandTripleClick={() => setShowAdmin(true)} 
        onRequestClick={() => setShowRequestModal(true)}
        siteName={siteName}
      />

      {/* MODALS GATEKEEPERS */}
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
          <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} onClose={() => setShowAdmin(false)} />
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
            initialEditingMovie={initialEditingMovie}
            clearInitialEditingMovie={() => setInitialEditingMovie(null)}
          />
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Hero 
          onExploreClick={scrollCatalogIntoView} 
          featuredMovie={topTrendingMovie}
          onWatchMovie={(m) => setWatchingMovie(m)}
          onDownloadMovie={(m) => {
            if (!m.downloadLink) return;
            trackAnalytics(m.id, m.title, 'downloads');
            if (adSettings?.isActive) {
              setDownloadingMovie(m);
            } else {
              window.open(m.downloadLink, '_blank');
            }
          }}
        />

        {/* Dynamic Trending Row */}
        {displayMovies.some(m => m.isTrending) && (
          <section className="px-6 md:px-16 xl:px-24 py-16 max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-3 mb-8 border-b border-white/[0.04] pb-4">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA4335] opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EA4335]"></span>
              </span>
              <h2 className="text-sm font-display font-black tracking-widest uppercase text-white flex items-center gap-2">
                Trending Highlights 🔥
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 sm:gap-8">
              {displayMovies.filter(m => m.isTrending).map((movie, idx) => (
                <MovieCard 
                  key={`trending-${movie.id}`} 
                  movie={movie} 
                  index={idx} 
                  onDownloadClick={(m) => {
                    if (!m.downloadLink) return;
                    trackAnalytics(m.id, m.title, 'downloads');
                    if (adSettings?.isActive) {
                      setDownloadingMovie(m);
                    } else {
                      window.open(m.downloadLink, '_blank');
                    }
                  }} 
                  onWatchClick={(m) => {
                    setWatchingMovie(m);
                    trackAnalytics(m.id, m.title, 'views');
                  }}
                  isAdmin={isAdminAuthenticated}
                  onDeleteClick={handleDelete}
                  onEditClick={handleEditFromCard}
                />
              ))}
            </div>
          </section>
        )}

        {/* Core Catalog Section */}
        <section id="catalog-block" className="px-6 md:px-16 xl:px-24 py-16 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.04] pb-5 mb-8 gap-4">
            <h2 className="text-sm font-display font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Compass size={16} className="text-[#4285F4] animate-spin-slow" />
              Comprehensive Catalog
            </h2>
          </div>

          {/* Symmetrical dynamic sliding filter indicator capsule */}
          {availableGenres.length > 1 && (
            <div className="flex gap-2.5 pb-6 mb-4 overflow-x-auto scrollbar-none snap-x py-1.5">
              {availableGenres.map(genre => {
                const isActive = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`snap-center shrink-0 px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest font-black transition-all duration-300 border cursor-pointer select-none relative ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#4285F4] to-[#9B72F3] text-white border-transparent shadow-md shadow-indigo-500/15 scale-102' 
                        : 'bg-white/[0.02] text-slate-400 border-white/[0.05] hover:border-white/15 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{genre}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 sm:gap-8">
            {isLoadingMovies ? (
              // Spectacular loading skeleton match for high-fidelity loaders
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-[#07080d]/80 animate-pulse relative overflow-hidden border border-white/[0.05] rounded-[2rem] flex flex-col justify-end p-5">
                  <div className="absolute top-4 right-4 bg-white/5 w-12 h-6 rounded-full border border-white/5"></div>
                  <div className="flex flex-col w-full space-y-3 relative pt-12">
                     <div className="h-4 w-3/4 bg-white/[0.04] rounded-sm"></div>
                     <div className="h-2.5 w-1/3 bg-white/[0.04] rounded-sm pb-1"></div>
                     <div className="flex gap-2 w-full pt-2">
                        <div className="flex-1 h-8 bg-white/[0.04] rounded-full"></div>
                        <div className="flex-1 h-8 bg-white/[0.04] rounded-full"></div>
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
                    if (adSettings?.isActive) {
                      setDownloadingMovie(m);
                    } else {
                      window.open(m.downloadLink, '_blank');
                    }
                  }} 
                  onWatchClick={(m) => {
                    setWatchingMovie(m);
                    trackAnalytics(m.id, m.title, 'views');
                  }}
                  isAdmin={isAdminAuthenticated}
                  onDeleteClick={handleDelete}
                  onEditClick={handleEditFromCard}
                />
              ))
            ) : (
              <div className="col-span-full py-28 flex flex-col items-center justify-center border border-white/5 bg-[#07080d]/40 rounded-[2.5rem] relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,_rgba(255,255,255,0.01),_transparent)"></div>
                <h3 className="text-xl font-display font-black tracking-tight text-white uppercase mb-3">Release Index Empty</h3>
                <p className="text-[11px] uppercase tracking-wide text-slate-400 max-w-sm text-center leading-relaxed">No catalog titles match your scanner query. Check filters or try requesting the title above.</p>
                {searchQuery && (
                  <button 
                    onClick={() => { setSearchQuery(''); setSelectedGenre('All'); }}
                    className="mt-6 px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Reset Filter Query
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="border-t border-white/[0.04] mt-16 bg-gradient-to-b from-transparent to-black/30">
          <div className="px-6 md:px-16 xl:px-24 py-12 max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] tracking-widest uppercase font-black text-slate-400">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left">
              <span 
                onClick={handleFooterClick}
                className="text-white font-bold cursor-pointer select-none hover:text-slate-200 transition-colors"
                title="System Archive Node"
              >
                {copyrightText}
              </span>
              <button onClick={() => setShowTermsModal(true)} className="hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-white/20 pb-0.5">Privacy Policies</button>
            </div>
            
            <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 px-5 py-2.5 rounded-full backdrop-blur-md">
              <span className="w-1.5 h-1.5 bg-[#4285F4] rounded-full animate-pulse"></span>
              <span className="text-[9px] font-bold text-slate-400">Deployed database size: <strong className="text-white font-mono ml-1">{displayMovies.length}</strong> releases</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
