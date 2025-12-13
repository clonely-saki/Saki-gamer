import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, Search, X, Volume2, 
  ChevronLeft, MessageCircle, 
  Sword, Shield, Crosshair, Zap, Target, User, Bot, AlertCircle, Gamepad2, Download, Share,
  WifiOff, Star, Layers, Globe, Sparkles,
  Battery, Syringe, Box, Skull, Flame, Hexagon, Heart, Eye, Hand, Footprints, Clock, Coins, Speaker,
  EyeOff, Settings2, Check, Mic2, Radio
} from 'lucide-react';
import { CATEGORIES, VOCAB_DATA, VocabItem } from './constants';

// --- Avatar Component ---
const Avatar = ({ cat, side }: { cat: string, side: 'A' | 'B' }) => {
  const isA = side === 'A';
  
  if (cat === 'VALORANT') {
    return (
      <div className={`w-10 h-10 flex items-center justify-center shadow-lg relative overflow-hidden ${isA ? 'bg-[#0f1923] border border-[#00f0ff]' : 'bg-[#0f1923] border border-[#ff4655]'}`}>
        {isA ? <Sword className="w-5 h-5 text-[#00f0ff]" /> : <Crosshair className="w-5 h-5 text-[#ff4655]" />}
        <div className="absolute inset-0 bg-white/5 skew-x-12"></div>
      </div>
    );
  }

  if (cat === 'APEX') {
    return (
      <div className="w-10 h-10 relative flex items-center justify-center">
        <div className={`absolute inset-0 w-full h-full [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)] ${isA ? 'bg-gradient-to-b from-orange-600 to-red-700' : 'bg-gradient-to-b from-neutral-600 to-neutral-800'}`}></div>
        <div className="relative z-10 text-white font-bold text-xs tracking-tighter">
            {isA ? "ATK" : "DEF"}
        </div>
        <div className="absolute inset-0 border border-white/30 [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)] pointer-events-none"></div>
      </div>
    );
  }

  if (cat === 'OW') {
    return (
      <div className={`w-10 h-10 rounded-md flex items-center justify-center shadow-[0_0_10px_rgba(249,158,26,0.2)] border ${isA ? 'bg-[#f99e1a] border-white' : 'bg-[#282c34] border-[#f99e1a]'}`}>
        {isA ? <Shield className="w-5 h-5 text-[#1a1c24]" /> : <Zap className="w-5 h-5 text-[#f99e1a]" />}
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/20 ${isA ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 'bg-gradient-to-br from-fuchsia-500 to-pink-500'}`}>
      {isA ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
    </div>
  );
};

// --- Theme Configurations ---
const THEME_STYLES: Record<string, { 
    bgClass: string,
    bgOverlay: React.ReactNode,
    cardClass: string,
    cardBgContent: React.ReactNode,
    accentColorClass: string,
    buttonClass: string,
    detailBgClass: string
}> = {
  ALL: {
    bgClass: "bg-[#050505]",
    bgOverlay: (
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 via-[#101015] to-[#050505]"></div>
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03)_0%,transparent_50%)]"></div>
       </div>
    ),
    cardClass: "rounded-xl border border-white/10 bg-[#18181b]/80 hover:bg-[#27272a] hover:border-white/20 transition-all shadow-sm relative overflow-hidden backdrop-blur-md",
    cardBgContent: (
      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    ),
    accentColorClass: "text-white font-bold",
    buttonClass: "bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-all",
    detailBgClass: "bg-[#050505]"
  },
  LIFE: {
    bgClass: "bg-[#0a0a0c]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-fuchsia-900/40 via-[#1a1025] to-[#0a0a0c]"></div>
        <div className="absolute bottom-0 right-0 w-[80%] h-[300px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(79,70,229,0.1),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
      </div>
    ),
    cardClass: "rounded-xl border-l-4 border-l-fuchsia-500 border-y border-r border-white/10 bg-[#18181b]/80 hover:bg-[#27272a] hover:border-l-fuchsia-400 transition-all shadow-sm relative overflow-hidden backdrop-blur-md",
    cardBgContent: (
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    ),
    accentColorClass: "text-fuchsia-400 font-bold",
    buttonClass: "bg-gradient-to-r from-fuchsia-600 to-indigo-600 rounded-xl font-bold shadow-[0_4px_20px_-5px_rgba(192,38,211,0.4)] hover:shadow-[0_4px_25px_-5px_rgba(192,38,211,0.6)] transition-all transform hover:-translate-y-0.5",
    detailBgClass: "bg-[#0a0a0c]"
  },
  VALORANT: {
    bgClass: "bg-[#0f1923]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0f1923]"></div>
        <div className="absolute top-0 right-0 w-[40%] h-full bg-[#ff4655]/10 skew-x-[-20deg] transform origin-bottom"></div>
        <div className="absolute top-0 right-[20%] w-[5%] h-full bg-[#ff4655]/5 skew-x-[-20deg]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>
    ),
    cardClass: "rounded-none border-l-4 border-l-[#ff4655] border-y border-r border-white/10 bg-[#ece8e1]/5 hover:bg-[#ece8e1]/10 transition-all relative overflow-hidden",
    cardBgContent: (
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-0 w-20 h-full bg-[#ff4655]/20 skew-x-[-20deg]"></div>
      </div>
    ),
    accentColorClass: "text-[#ff4655]",
    buttonClass: "bg-[#ff4655] rounded-none uppercase tracking-wider font-bold [clip-path:polygon(0_0,100%_0,100%_80%,92%_100%,0_100%)]",
    detailBgClass: "bg-[#0f1923]"
  },
  APEX: {
    bgClass: "bg-[#1a0b0b]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[url('https://images.unsplash.com/photo-1533236897111-3e94666b2752?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-[451px] bg-gradient-to-b from-[#da292a]/10 via-[#1a0b0b]/80 to-[#1a0b0b]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#a33838_0%,transparent_70%)] opacity-20"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute top-0 right-0 w-[200px] h-full border-l border-red-500/10 skew-x-[-15deg]"></div>
      </div>
    ),
    cardClass: "skew-x-[-6deg] border-l-4 border-l-[#da292a] border-y border-r border-red-500/10 bg-gradient-to-br from-neutral-900/90 to-neutral-950/90 hover:border-l-[#ff4e4e] hover:from-red-900/20 backdrop-blur-sm transition-all relative overflow-hidden",
    cardBgContent: (
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)]"></div>
    ),
    accentColorClass: "text-[#ff4e4e]",
    buttonClass: "bg-[#da292a] skew-x-[-10deg] border-b-4 border-[#8e0e0e] font-bold tracking-tighter uppercase",
    detailBgClass: "bg-[#1a0b0b]"
  },
  OW: {
    bgClass: "bg-[#131519]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[url('https://images.unsplash.com/photo-1505424297051-c3ad50b71303?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-[451px] bg-gradient-to-b from-[#f99e1a]/10 via-[#131519]/80 to-[#131519]"></div>
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(249,158,26,0.15)_0%,transparent_70%)] blur-[70px]"></div>
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_center,white_1.5px,transparent_1.5px)] bg-[size:30px_30px]"></div>
      </div>
    ),
    cardClass: "rounded-sm border-l-4 border-l-[#f99e1a] border-y border-r border-white/10 bg-[#1e2128] hover:bg-[#252932] hover:border-white/25 transition-all italic relative overflow-hidden shadow-md",
    cardBgContent: (
       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    ),
    accentColorClass: "text-[#f99e1a] font-bold drop-shadow-sm",
    buttonClass: "bg-[#f99e1a] hover:bg-[#ffb03b] text-[#131519] rounded-sm italic font-black tracking-widest uppercase shadow-[0_0_20px_rgba(249,158,26,0.25)] transition-all transform hover:-translate-y-0.5 border-none",
    detailBgClass: "bg-[#131519]"
  }
};

// --- Offline Icon/Image Logic ---

// Get specific icon based on term/meaning keywords
const getIconForTerm = (item: VocabItem) => {
    const text = (item.term + " " + item.meaning).toLowerCase();
    
    if (text.includes('battery') || text.includes('cell') || text.includes('charge')) return <Battery />;
    if (text.includes('heal') || text.includes('health') || text.includes('med')) return <Syringe />;
    if (text.includes('shield') || text.includes('armor') || text.includes('protect')) return <Shield />;
    if (text.includes('gun') || text.includes('shoot') || text.includes('aim') || text.includes('recoil')) return <Crosshair />;
    if (text.includes('ult') || text.includes('ability') || text.includes('skill')) return <Zap />;
    if (text.includes('kill') || text.includes('dead') || text.includes('death')) return <Skull />;
    if (text.includes('box') || text.includes('loot')) return <Box />;
    if (text.includes('fire') || text.includes('burn')) return <Flame />;
    if (text.includes('point') || text.includes('site') || text.includes('zone')) return <Hexagon />;
    if (text.includes('love') || text.includes('like') || text.includes('dating')) return <Heart />;
    if (text.includes('look') || text.includes('see') || text.includes('watch')) return <Eye />;
    if (text.includes('hand') || text.includes('touch')) return <Hand />;
    if (text.includes('run') || text.includes('walk') || text.includes('move')) return <Footprints />;
    if (text.includes('time') || text.includes('wait') || text.includes('later')) return <Clock />;
    if (text.includes('money') || text.includes('buy') || text.includes('pay')) return <Coins />;
    if (text.includes('voice') || text.includes('say') || text.includes('speak')) return <Speaker />;
    
    // Default icons by category
    if (item.cat === 'VALORANT') return <Sword />;
    if (item.cat === 'APEX') return <Target />;
    if (item.cat === 'OW') return <Gamepad2 />;
    return <Sparkles />;
};

// Component to render the "thumbnail" using icons
const VocabThumbnail = ({ item }: { item: VocabItem }) => {
    const icon = getIconForTerm(item);
    
    // Style base on category
    let bgClass = "bg-neutral-800";
    let iconColor = "text-white";
    
    if (item.cat === 'VALORANT') {
        bgClass = "bg-rose-900/30 border border-rose-500/30";
        iconColor = "text-rose-400";
    } else if (item.cat === 'APEX') {
        bgClass = "bg-red-900/30 border border-red-500/30 skew-x-[-6deg]";
        iconColor = "text-red-400 skew-x-[6deg]";
    } else if (item.cat === 'OW') {
        bgClass = "bg-orange-900/30 border border-orange-500/30";
        iconColor = "text-orange-400";
    } else {
        bgClass = "bg-fuchsia-900/30 border border-fuchsia-500/30";
        iconColor = "text-fuchsia-400";
    }

    return (
        <div className={`w-full h-full flex items-center justify-center ${bgClass} shadow-inner`}>
            {React.cloneElement(icon as React.ReactElement<any>, { className: `w-8 h-8 ${iconColor}` })}
        </div>
    );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [selectedItem, setSelectedItem] = useState<VocabItem | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [lang, setLang] = useState<'cn' | 'tw' | 'hk'>('cn'); 
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [animClass, setAnimClass] = useState('animate-enter');

  // New State for features
  const [isMaskMode, setIsMaskMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedGender, setSelectedGender] = useState<'female' | 'male'>('female');
  const [showSettings, setShowSettings] = useState(false);
  
  // Store filtered voice objects
  const [availableVoices, setAvailableVoices] = useState<{male: SpeechSynthesisVoice | null, female: SpeechSynthesisVoice | null}>({ male: null, female: null });
  // Ref to prevent garbage collection of utterance during playback
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [favorites, setFavorites] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('jpgamer_favorites');
          return saved ? JSON.parse(saved) : [];
      } catch (e) {
          return [];
      }
  });
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
      localStorage.setItem('jpgamer_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (e: React.MouseEvent | null, id: string) => {
      if (e) e.stopPropagation();
      setFavorites(prev => {
          if (prev.includes(id)) return prev.filter(i => i !== id);
          return [...prev, id];
      });
  };

  const selectLang = (newLang: 'cn' | 'tw' | 'hk') => {
    setLang(newLang);
    setShowLangMenu(false);
  };

  const toggleMaskMode = () => {
    setIsMaskMode(prev => !prev);
  };

  const cyclePlaybackSpeed = () => {
      setPlaybackSpeed(prev => {
          if (prev === 1.0) return 0.75;
          if (prev === 0.75) return 0.5;
          return 1.0;
      });
  };

  const getLocalizedText = useCallback((item: VocabItem, field: 'meaning' | 'desc' | 'example') => {
      if (lang === 'cn') return item[field];
      if (lang === 'hk') {
         if (field === 'meaning') return item.meaning_hk || item.meaning_tw || item.meaning;
         if (field === 'desc') return item.desc_hk || item.desc_tw || item.desc;
         if (field === 'example') return item.example_hk || item.example_tw || item.example;
      }
      // TW
      if (field === 'meaning') return item.meaning_tw || item.meaning;
      if (field === 'desc') return item.desc_tw || item.desc;
      if (field === 'example') return item.example_tw || item.example;
      return item[field];
  }, [lang]);

  const uiText = {
      searchPlaceholder: {
          cn: showFavorites ? "搜索收藏..." : "搜索...",
          tw: showFavorites ? "搜尋收藏..." : "搜尋...",
          hk: showFavorites ? "搜尋收藏..." : "搜尋...",
      },
      offlineMode: { cn: "离线模式", tw: "離線模式", hk: "離線模式" },
      favorite: { cn: "收藏", tw: "收藏", hk: "收藏" },
      install: { cn: "安装", tw: "安裝", hk: "安裝" },
      lifeCat: { cn: "常用", tw: "常用", hk: "常用" },
      noResults: { cn: "没有找到相关词汇", tw: "沒有找到相關詞彙", hk: "搵唔到相關詞彙" },
      noFavs: { cn: "本分类下暂无收藏", tw: "本分類下暫無收藏", hk: "呢個分類暫無收藏" },
      lifeScene: { cn: "常用场景", tw: "常用場景", hk: "常用場景" },
      gameVoice: { cn: "游戏语音", tw: "遊戲語音", hk: "遊戲語音" },
      play: { cn: "播放", tw: "播放", hk: "播放" },
      iosTitle: { cn: "安装到 iPhone", tw: "安裝到 iPhone", hk: "安裝到 iPhone" },
      iosDesc: { 
          cn: (<span>点击浏览器底部工具栏的 <span className="font-bold text-blue-400">分享</span> 按钮，然后向下滑动选择 <span className="font-bold text-white">"添加到主屏幕"</span> 即可獲得原生APP体验。</span>), 
          tw: (<span>點擊瀏覽器底部工具欄的 <span className="font-bold text-blue-400">分享</span> 按鈕，然後向下滑動選擇 <span className="font-bold text-white">"加入主畫面"</span> 即可獲得原生APP體驗。</span>),
          hk: (<span>點擊瀏覽器底部工具欄嘅 <span className="font-bold text-blue-400">分享</span> 按鈕，然後向下滑動選擇 <span className="font-bold text-white">"加入主畫面"</span> 即可獲得原生APP體驗。</span>) 
      }
  };

  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const currentTheme = THEME_STYLES[activeTab] || THEME_STYLES['LIFE'];
  const detailTheme = selectedItem ? (THEME_STYLES[selectedItem.cat] || THEME_STYLES['LIFE']) : currentTheme;

  const filteredData = useMemo(() => {
    return VOCAB_DATA.filter((item) => {
      const matchesCategory = activeTab === 'ALL' ? true : item.cat === activeTab;
      const lowerSearch = searchTerm.toLowerCase();
      const currentMeaning = getLocalizedText(item, 'meaning');
      const matchesSearch = 
        !searchTerm ||
        item.term.toLowerCase().includes(lowerSearch) || 
        currentMeaning.toLowerCase().includes(lowerSearch) || 
        item.kana.includes(lowerSearch) || 
        item.romaji.toLowerCase().includes(lowerSearch);
      
      const matchesFavorite = showFavorites ? favorites.includes(item.id) : true;
      return matchesCategory && matchesSearch && matchesFavorite;
    });
  }, [activeTab, searchTerm, showFavorites, favorites, lang, getLocalizedText]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const loadVoices = () => {
        const all = window.speechSynthesis.getVoices();
        const ja = all.filter(v => v.lang.includes('ja') || v.lang.includes('JP'));
        
        let bestMale: SpeechSynthesisVoice | null = null;
        let bestFemale: SpeechSynthesisVoice | null = null;

        const maleNames = ['Otoya', 'Ichiro', 'Keita', 'Takumi'];
        const femaleNames = ['Kyoko', 'Haruka', 'Ayumi', 'Nanami']; 

        bestMale = ja.find(v => maleNames.some(n => v.name.includes(n))) || null;
        bestFemale = ja.find(v => femaleNames.some(n => v.name.includes(n))) || null;

        if (!bestMale) bestMale = ja.find(v => v.name.toLowerCase().includes('male')) || null;
        if (!bestFemale) bestFemale = ja.find(v => v.name.toLowerCase().includes('female')) || null;

        const googleVoice = ja.find(v => v.name.includes('Google'));
        if (!bestFemale && googleVoice) bestFemale = googleVoice;
        
        if (!bestFemale && ja.length > 0) bestFemale = ja[0];
        if (!bestMale && ja.length > 0) bestMale = ja.length > 1 ? ja[1] : ja[0];

        setAvailableVoices({ male: bestMale, female: bestFemale });
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    setIsStandalone(isStandaloneMode);
    if (isIosDevice && !isStandaloneMode) {
        setTimeout(() => setIsIOS(true), 2000);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      setDeferredPrompt(null);
    });
  };

  const handleTabChange = (newTabId: string) => {
    if (newTabId === activeTab) return;
    
    const oldIndex = CATEGORIES.findIndex(c => c.id === activeTab);
    const newIndex = CATEGORIES.findIndex(c => c.id === newTabId);
    
    if (oldIndex !== -1 && newIndex !== -1) {
        if (oldIndex === CATEGORIES.length - 1 && newIndex === 0) {
            setAnimClass('animate-slide-right');
        } else if (oldIndex === 0 && newIndex === CATEGORIES.length - 1) {
            setAnimClass('animate-slide-left');
        } else if (newIndex > oldIndex) {
            setAnimClass('animate-slide-right');
        } else {
            setAnimClass('animate-slide-left');
        }
    } else {
        setAnimClass('animate-enter');
    }
    
    setActiveTab(newTabId);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    if (selectedItem) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
        const currentIndex = CATEGORIES.findIndex(c => c.id === activeTab);
        if (currentIndex === -1) return;

        if (isLeftSwipe) {
            const currentIndex = CATEGORIES.findIndex(c => c.id === activeTab);
            const nextIndex = (currentIndex + 1) % CATEGORIES.length;
            handleTabChange(CATEGORIES[nextIndex].id);
        } else {
            const currentIndex = CATEGORIES.findIndex(c => c.id === activeTab);
            const prevIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
            handleTabChange(CATEGORIES[prevIndex].id);
        }
    }
  };

  const handleVisualClose = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsDetailClosing(true);
    setTimeout(() => {
        setSelectedItem(null);
        setIsDetailClosing(false);
    }, 300);
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
        if (selectedItem) {
            handleVisualClose();
        }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [selectedItem, handleVisualClose]);

  const openDetail = (item: VocabItem) => {
    window.history.pushState({ itemId: item.id }, "", "");
    setSelectedItem(item);
    setIsDetailClosing(false); 
  };

  const closeDetail = () => {
    window.history.back();
  };

  const handlePlay = (text: string, id: string) => {
    setPlayingId(id);
    const rawLines = text.split('\n');
    const cleanLines = rawLines.map(line => {
        const isB = line.trim().startsWith('B') || line.trim().startsWith('Ｂ');
        const content = line.replace(/^([ABＡＢ][:：]?\s*)/i, '').replace(/\(.*\)/g, '').trim();
        return { content, isB };
    }).filter(l => l.content.length > 0);

    let index = 0;
    const playNext = () => {
        if (index >= cleanLines.length) {
            setPlayingId(null);
            return;
        }
        const line = cleanLines[index];
        const u = new SpeechSynthesisUtterance(line.content);
        utteranceRef.current = u; 
        
        u.lang = 'ja-JP';
        
        let selectedVoice = availableVoices[selectedGender] || availableVoices.female || availableVoices.male;
        
        if (selectedVoice) {
            u.voice = selectedVoice;
        }
        
        if (cleanLines.length > 1 && line.isB) {
             if (selectedGender === 'female' && availableVoices.male) {
                 u.voice = availableVoices.male;
             } else if (selectedGender === 'male' && availableVoices.female) {
                 u.voice = availableVoices.female;
             } else {
                 u.pitch = 0.8;
             }
        } else {
             u.pitch = 1.0;
        }

        u.rate = playbackSpeed; 
        u.onend = () => {
            index++;
            playNext();
        };
        u.onerror = (e) => {
            console.warn("TTS Error:", e);
            setPlayingId(null);
        };
        window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.cancel();
    playNext();
  };

  const renderChatBubbles = (exampleText: string) => {
      const lines = exampleText.split('\n').filter(l => l.trim().length > 0);
      const category = selectedItem?.cat || activeTab;

      return lines.map((line, i) => {
          const isB = line.trim().startsWith('B') || line.trim().startsWith('Ｂ');
          const translationMatch = line.match(/\((.*?)\)/);
          const translation = translationMatch ? translationMatch[1] : "";
          const displayContent = line.replace(/^([ABＡＢ][:：]?\s*)/i, '').replace(/\(.*\)/g, '').trim();
          
          if (!displayContent) return null;

          const bubbleStyle = isB 
            ? category === 'VALORANT' ? 'bg-[#ff4655] rounded-none [clip-path:polygon(0_0,100%_0,100%_100%,10%_100%,0_85%)]'
              : category === 'APEX' ? 'bg-[#da292a] skew-x-[-10deg]'
              : category === 'OW' ? 'bg-[#f99e1a] text-[#131519] rounded-sm italic border-l-2 border-white/50'
              : 'bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-xl rounded-br-sm'
            : category === 'VALORANT' ? 'bg-[#1c252e] border border-white/10 rounded-none'
              : category === 'APEX' ? 'bg-[#2a2a2a] border border-white/10 skew-x-[-10deg]'
              : category === 'OW' ? 'bg-[#1e2128] border border-white/10 rounded-sm italic'
              : 'bg-[#18181b] border border-white/10 rounded-xl rounded-bl-sm';

          return (
              <div key={i} className={`flex ${isB ? 'justify-end' : 'justify-start'} mb-6 items-end gap-3`}>
                  {!isB && ( <Avatar cat={category} side="A" /> )}
                  <div className={`max-w-[75%] flex flex-col ${isB ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 shadow-lg relative text-white ${bubbleStyle}`}>
                          <div className={`text-base font-bold ${category === 'APEX' ? 'skew-x-[10deg]' : ''} ${category === 'VALORANT' ? 'uppercase tracking-wide' : ''} ${category === 'OW' && isB ? 'text-[#131519]' : ''}`}>
                             {displayContent}
                          </div>
                          {translation && (
                              <div className={`text-[10px] mt-1 pt-1 border-t ${category === 'APEX' ? 'skew-x-[10deg]' : ''} ${
                                  isB ? (category === 'OW' ? 'border-[#131519]/20 text-[#131519]/80' : 'border-white/20 text-white/90') 
                                      : 'border-white/10 text-neutral-400'
                              }`}>
                                  {translation}
                              </div>
                          )}
                      </div>
                  </div>
                  {isB && ( <Avatar cat={category} side="B" /> )}
              </div>
          );
      });
  };

  return (
    <div 
        className={`h-[100dvh] font-sans selection:bg-fuchsia-900 selection:text-white flex flex-col relative transition-colors duration-500 text-white overflow-x-hidden ${currentTheme.bgClass} ${lang === 'cn' ? 'font-noto-sc' : 'font-noto-tc'}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      <div key={activeTab} className="absolute inset-0 animate-fade-in duration-1000">
          {currentTheme.bgOverlay}
      </div>

      <div className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-[#0a0a0c]/85 backdrop-blur-xl shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0 flex transform -skew-x-12 scale-125 -ml-8 opacity-90 select-none">
                <div className="flex-1 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-950 border-r border-white/5"></div>
                <div className="flex-1 bg-gradient-to-br from-[#ff4655] to-[#bd3944] border-r border-white/10 relative"></div>
                <div className="flex-1 bg-gradient-to-br from-[#8e0e0e] to-[#5e1c1c] border-r border-white/10 relative"></div>
                <div className="flex-1 bg-gradient-to-br from-[#f99e1a] to-[#b36b0e] relative"></div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[#0a0a0c]/90 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 max-w-md mx-auto px-4 py-3 space-y-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-lg shadow-lg shadow-fuchsia-500/20">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-xl tracking-wide text-white drop-shadow-md">
                  Tokyo Comms
                </h1>
                {!isOnline && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-neutral-800/80 rounded-full border border-neutral-600 text-[10px] text-neutral-400">
                        <WifiOff className="w-3 h-3" />
                        <span>{uiText.offlineMode[lang]}</span>
                    </div>
                )}
             </div>
             <div className="flex items-center gap-2">
                 
                 {/* --- NEW Language Selector: Dynamic Pill Animation --- */}
                 <div className="relative z-50 h-9 flex items-center justify-end">
                     {showLangMenu && (
                         <div 
                             className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] animate-in fade-in duration-300"
                             onClick={() => setShowLangMenu(false)}
                         />
                     )}
                     
                     <div 
                        className={`relative z-50 h-9 flex items-center transition-all duration-500 ease-[cubic-bezier(0.32,0.725,0,1)] shadow-xl overflow-hidden border ${
                            showLangMenu 
                                ? 'w-[180px] bg-[#1a1a1c] border-white/20 rounded-full pl-1 pr-1' 
                                : 'w-9 bg-transparent border-transparent rounded-lg'
                        }`}
                     >
                        {/* Closed State: Globe Icon (Morphs out) */}
                        <button
                            onClick={() => setShowLangMenu(true)}
                            className={`absolute left-0 top-0 w-9 h-9 flex flex-col items-center justify-center transition-all duration-300 ${
                                showLangMenu ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100 text-neutral-400 hover:text-white'
                            }`}
                        >
                            <Globe className="w-5 h-5" />
                            <span className="text-[10px] font-bold mt-0.5 leading-none">{lang === 'cn' ? 'CN' : (lang === 'hk' ? 'HK' : 'TW')}</span>
                        </button>

                        {/* Open State: Options (Slide & Fade in) */}
                        <div className={`flex items-center justify-between w-full h-full transition-all duration-500 ${showLangMenu ? 'opacity-100 translate-x-0 delay-75' : 'opacity-0 translate-x-4 pointer-events-none'}`}>
                            <button onClick={() => selectLang('cn')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${lang === 'cn' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>CN</button>
                            <div className="w-px h-3 bg-white/10"></div>
                            <button onClick={() => selectLang('tw')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${lang === 'tw' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>TW</button>
                            <div className="w-px h-3 bg-white/10"></div>
                            <button onClick={() => selectLang('hk')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${lang === 'hk' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'}`}>HK</button>
                        </div>
                     </div>
                 </div>
                 {/* --- End Language Selector --- */}

                 <button
                    onClick={toggleMaskMode}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${isMaskMode ? 'bg-indigo-500/20 text-indigo-400' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                 >
                    {isMaskMode ? <EyeOff className="w-5 h-5 fill-current" /> : <Eye className="w-5 h-5" />}
                    <span className="text-[10px] font-bold mt-0.5 leading-none">{isMaskMode ? 'Hide' : 'Show'}</span>
                 </button>

                 <button 
                   onClick={() => setShowFavorites(!showFavorites)}
                   className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all relative ${showFavorites ? 'bg-yellow-500/20 text-yellow-400' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                 >
                   <div className="relative">
                       <Star className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
                       <span className="absolute -bottom-1.5 -right-1 text-[8px] font-bold scale-75 origin-top-left bg-black/50 px-0.5 rounded text-white/90">推</span>
                   </div>
                   <span className="text-[10px] font-bold mt-0.5 leading-none">{uiText.favorite[lang]}</span>
                 </button>

                 {deferredPrompt && (
                    <button onClick={handleInstallClick} className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-neutral-200 transition-colors animate-pulse">
                      <Download className="w-3 h-3" /> {uiText.install[lang]}
                    </button>
                 )}
             </div>
          </div>
          
          <div className="relative group">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1 pointer-events-none transition-colors duration-300 group-focus-within:text-white text-neutral-400">
               <Gamepad2 className="w-3 h-3 opacity-70" />
               <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder={uiText.searchPlaceholder[lang]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-black/20 border border-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-black/40 focus:border-white/30 transition-all backdrop-blur-md shadow-inner ${activeTab === 'VALORANT' ? 'rounded-none' : 'rounded-xl'} ${activeTab === 'APEX' ? 'skew-x-[-10deg]' : ''}`}
            />
             {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
          </div>
        </div>
        
        <div className="relative z-10 max-w-md mx-auto px-2 pb-0 mt-2 mb-2">
          <div className="grid grid-cols-5 gap-1 w-full">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleTabChange(cat.id)}
                className={`pb-2 border-b-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                  activeTab === cat.id 
                    ? `${cat.color.split(' ')[0]} font-bold border-current scale-105`
                    : 'border-transparent text-neutral-400 font-medium hover:text-white'
                }`}
              >
                {activeTab === cat.id && <div className="mb-0.5">{cat.icon}</div>}
                <span className={`text-[10px] leading-tight text-center truncate w-full ${cat.id === 'VALORANT' ? 'uppercase' : ''} ${cat.id === 'OW' ? 'italic' : ''}`}>
                  {cat.id === 'LIFE' ? uiText.lifeCat[lang] : (lang === 'cn' ? cat.name : (lang === 'hk' ? (cat.name_hk || cat.name_tw) : cat.name_tw))}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-52 pb-40 relative z-10">
        <div key={activeTab + (showFavorites ? '-fav' : '') + lang} className={`space-y-3 ${animClass}`}>
          {filteredData.length > 0 ? (
            filteredData.map((item) => {
              const itemTheme = THEME_STYLES[item.cat] || THEME_STYLES['LIFE'];
              const displayMeaning = getLocalizedText(item, 'meaning');

              return (
              <div 
                key={item.id} 
                onClick={() => openDetail(item)}
                className={`group py-4 px-4 flex items-center justify-between cursor-pointer ${
                    activeTab === 'ALL' ? THEME_STYLES['ALL'].cardClass : currentTheme.cardClass
                }`}
              >
                {activeTab === 'ALL' ? THEME_STYLES['ALL'].cardBgContent : currentTheme.cardBgContent}
                
                <div className={`flex-1 min-w-0 pr-4 relative z-10 ${item.cat === 'APEX' ? 'skew-x-[6deg]' : ''}`}>
                  <h3 className={`font-bold text-base text-white mb-1 truncate transition-all duration-300 ${isMaskMode ? 'blur-md hover:blur-none select-none' : ''} ${item.cat === 'VALORANT' ? 'uppercase tracking-wider' : ''} ${item.cat === 'OW' ? 'italic' : ''}`}>
                      {displayMeaning}
                  </h3>
                  <div className="flex items-center gap-2">
                      {activeTab === 'ALL' && (
                         <span className={`text-[9px] px-1.5 py-0.5 rounded border ${itemTheme.accentColorClass.replace('text-', 'border-').replace('font-bold', '')} opacity-70`}>
                             {item.cat === 'LIFE' ? uiText.lifeCat[lang] : item.cat}
                         </span>
                      )}
                      <p className={`text-sm truncate font-mono flex items-center gap-2 group-hover:text-white transition-colors ${
                          activeTab === 'ALL' ? 'text-neutral-400' : currentTheme.accentColorClass
                      }`}>
                        <span>{item.term}</span>
                        {item.kana !== item.term && <span className="opacity-70 text-neutral-500 border-l border-neutral-600 pl-2 group-hover:text-neutral-300">{item.kana}</span>}
                      </p>
                  </div>
                </div>
                <button
                    onClick={(e) => toggleFavorite(e, item.id)}
                    className="p-3 -mr-3 relative z-10 text-neutral-500 hover:text-yellow-400 transition-colors"
                >
                    <Star className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </button>
              </div>
            )})
          ) : (
             <div className="text-center py-20 opacity-30 text-sm text-neutral-500">
               <p>{showFavorites ? uiText.noFavs[lang] : uiText.noResults[lang]}</p>
             </div>
          )}
        </div>
      </main>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
          <div className={`w-full max-w-md flex flex-col h-[100dvh] pointer-events-auto shadow-2xl relative overflow-hidden ${detailTheme.detailBgClass} ${isDetailClosing ? 'animate-overlay-exit' : 'animate-overlay-enter'}`}>
            {detailTheme.bgOverlay}
            
            <div className="px-4 py-4 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <button onClick={closeDetail} className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className={`text-sm font-bold text-neutral-200/80 ${selectedItem.cat === 'VALORANT' ? 'uppercase tracking-widest' : ''}`}>
                    {lang === 'cn' 
                        ? CATEGORIES.find(c => c.id === selectedItem.cat)?.name 
                        : (lang === 'hk' ? (CATEGORIES.find(c => c.id === selectedItem.cat)?.name_hk || CATEGORIES.find(c => c.id === selectedItem.cat)?.name_tw) : CATEGORIES.find(c => c.id === selectedItem.cat)?.name_tw)}
                </span>
                
                <div className="flex items-center gap-1 -mr-2">
                    <button 
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10"
                    >
                        <Settings2 className="w-6 h-6" />
                    </button>
                    <button 
                        onClick={(e) => toggleFavorite(e, selectedItem.id)}
                        className={`p-2 rounded-full transition-colors ${favorites.includes(selectedItem.id) ? 'text-yellow-400' : 'text-neutral-400'}`}
                    >
                        <Star className={`w-6 h-6 ${favorites.includes(selectedItem.id) ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 overscroll-contain pb-40 safe-pb">
                <div className="px-6 pt-8 pb-6 text-center border-b border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-[300px] z-0 overflow-hidden pointer-events-none">
                        <div className={`w-full h-full relative flex items-center justify-center overflow-hidden`}>
                            <div className={`absolute inset-0 opacity-20 transform scale-150 blur-xl ${
                                 selectedItem.cat === 'VALORANT' ? 'bg-rose-900' :
                                 selectedItem.cat === 'APEX' ? 'bg-red-900' :
                                 selectedItem.cat === 'OW' ? 'bg-orange-900' :
                                 'bg-fuchsia-900'
                            }`}></div>
                            <div className="transform scale-[8] opacity-10 text-white">
                                {CATEGORIES.find(c => c.id === selectedItem.cat)?.icon}
                            </div>
                        </div>
                        <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-${detailTheme.bgClass.replace('bg-','')}/80 to-${detailTheme.bgClass.replace('bg-','')}`}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] to-transparent"></div>
                    </div>

                    <h1 className={`text-3xl font-black text-white mb-2 leading-tight drop-shadow-lg relative z-10 ${selectedItem.cat === 'OW' ? 'italic' : ''} ${selectedItem.cat === 'APEX' ? 'uppercase' : ''}`}>
                        {getLocalizedText(selectedItem, 'meaning')}
                    </h1>
                    
                    <button 
                        onClick={() => handlePlay(selectedItem.term, 'term')}
                        className={`group/term relative z-10 inline-flex items-center justify-center gap-2 px-4 py-2 mt-1 mx-auto rounded-lg transition-all active:scale-95 hover:bg-white/5 cursor-pointer`}
                    >
                        <p className={`text-2xl font-bold font-mono tracking-wide drop-shadow-md ${detailTheme.accentColorClass}`}>
                            {selectedItem.term}
                        </p>
                        <div className={`text-neutral-500 group-hover/term:text-white transition-colors ${playingId === 'term' ? 'text-white' : ''}`}>
                             {playingId === 'term' ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                        </div>
                    </button>
                    
                    <p className="text-sm text-neutral-400 font-mono mt-3 relative z-10">
                        {selectedItem.kana} · {selectedItem.romaji}
                    </p>
                    <div className={`mt-6 bg-black/40 p-4 border border-white/10 inline-block text-sm text-neutral-200 backdrop-blur-md shadow-xl relative z-10 ${selectedItem.cat === 'VALORANT' ? 'rounded-none border-l-4 border-l-rose-600' : selectedItem.cat === 'APEX' ? 'skew-x-[-6deg] border-r-4 border-r-red-600' : 'rounded-xl'}`}>
                        <span className={selectedItem.cat === 'APEX' ? 'skew-x-[6deg] block' : ''}>💡 {getLocalizedText(selectedItem, 'desc')}</span>
                    </div>
                </div>

                <div className="px-4 py-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> 
                            {selectedItem.cat === 'LIFE' ? uiText.lifeScene[lang] : uiText.gameVoice[lang]}
                        </span>
                        
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => handlePlay(getLocalizedText(selectedItem, 'example'), 'ex')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-white transition-all active:scale-95 shadow-lg hover:brightness-110 relative z-20 ${detailTheme.buttonClass}`}
                            >
                                {playingId === 'ex' ? <Volume2 className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
                                <span className={`text-[10px] font-bold not-italic ${selectedItem.cat === 'APEX' ? 'skew-x-[10deg] inline-block' : ''}`}>{uiText.play[lang]}</span>
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4 pb-4">
                        {renderChatBubbles(getLocalizedText(selectedItem, 'example'))}
                    </div>
                </div>
            </div>

            {showSettings && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end animate-in fade-in" onClick={() => setShowSettings(false)}>
                    <div className="w-full bg-[#18181b] border-t border-white/10 rounded-t-2xl p-6 space-y-6 animate-in slide-in-from-bottom-10 pb-16 safe-pb" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-neutral-400" />
                                Voice Settings
                            </h3>
                            <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-neutral-400" /></button>
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Playback Speed</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[0.5, 0.75, 1.0].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => setPlaybackSpeed(s)}
                                        className={`py-2 rounded-lg text-sm font-bold transition-all ${playbackSpeed === s ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}
                                    >
                                        {s}x
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                             <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Voice Tone / 声音</label>
                             <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setSelectedGender('female')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedGender === 'female' ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white' : 'bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700'}`}
                                >
                                    <div className="text-2xl mb-1">👧</div>
                                    <span className="font-bold text-sm">Female</span>
                                    <span className="text-[10px] opacity-50 truncate w-full text-center mt-1">{availableVoices.female?.name.split(' ')[0] || 'Default'}</span>
                                </button>
                                <button
                                    onClick={() => setSelectedGender('male')}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${selectedGender === 'male' ? 'bg-blue-500/20 border-blue-500 text-white' : 'bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700'}`}
                                >
                                    <div className="text-2xl mb-1">👦</div>
                                    <span className="font-bold text-sm">Male</span>
                                    <span className="text-[10px] opacity-50 truncate w-full text-center mt-1">{availableVoices.male?.name.split(' ')[0] || 'Default'}</span>
                                </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      )}

      {isIOS && !isStandalone && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 border-t border-white/10 p-4 z-50 backdrop-blur-md animate-slide-up shadow-2xl safe-pb">
           <div className="max-w-md mx-auto flex items-start gap-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                 <Share className="w-6 h-6 text-blue-400" /> 
              </div>
              <div className="flex-1">
                 <h4 className="font-bold text-sm text-white mb-1">{uiText.iosTitle[lang]}</h4>
                 <p className="text-xs text-neutral-400 leading-relaxed">
                    {uiText.iosDesc[lang]}
                 </p>
              </div>
              <button onClick={() => setIsIOS(false)} className="p-1 text-neutral-500 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-enter {
          animation: fadeInScale 0.4s cubic-bezier(0.2, 0.0, 0.2, 1) forwards;
        }
        .animate-slide-right {
          animation: slideInRight 0.3s cubic-bezier(0.2, 0.0, 0.2, 1) forwards;
        }
        .animate-slide-left {
          animation: slideInLeft 0.3s cubic-bezier(0.2, 0.0, 0.2, 1) forwards;
        }
        .animate-overlay-enter {
          animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-overlay-exit {
          animation: slideDown 0.3s ease-in forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.5s ease-out forwards;
        }
        .animate-in {
            animation-duration: 0.2s;
            animation-timing-function: ease-out;
            animation-fill-mode: forwards;
        }
        .safe-pb {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
}