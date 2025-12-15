import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, Search, X, Volume2, 
  ChevronLeft, MessageCircle, 
  Sword, Shield, Crosshair, Zap, Target, User, Bot, AlertCircle, Gamepad2, Download, Share,
  WifiOff, Star, Layers, Globe, Sparkles,
  Battery, Syringe, Box, Skull, Flame, Hexagon, Heart, Eye, Hand, Footprints, Clock, Coins, Speaker,
  EyeOff, Settings2, Check, Mic2, Radio, Loader2, Leaf, Music2, Cpu, Menu,
  Languages, Type, Wifi, Signal, ChevronDown
} from 'lucide-react';
import { CATEGORIES, VOCAB_DATA, VocabItem } from './constants';

// --- Audio Helper Functions ---

async function fetchWithRetry(url: string, retries = 2, delay = 1000): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      // Explicitly set mode to cors to avoid some browser warnings, though most modern browsers handle this automatically
      const res = await fetch(url, { mode: 'cors' });
      if (res.ok) return res;
      
      // Handle Rate Limiting (429)
      if (res.status === 429) {
          const retryHeader = res.headers.get('Retry-After');
          let waitTime = 1000 * Math.pow(2, i + 1); 
          if (retryHeader) {
             const seconds = parseInt(retryHeader);
             if (!isNaN(seconds)) waitTime = seconds * 1000;
          }
          waitTime = Math.min(waitTime, 5000); // Cap at 5s
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
      }

      if (i < retries && res.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1))); 
      } else {
        // Don't throw immediately, let the caller handle the non-ok response
        throw new Error(`Request failed with status ${res.status}`);
      }
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Fetch failed after retries");
}

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
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_0_10px_rgba(249,158,26,0.2)] border ${isA ? 'bg-[#f99e1a] border-white' : 'bg-[#282c34] border-[#f99e1a]'}`}>
        {isA ? <Shield className="w-5 h-5 text-[#1a1c24]" /> : <Zap className="w-5 h-5 text-[#f99e1a]" />}
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-white/20 ${isA ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 'bg-gradient-to-br from-fuchsia-500 to-pink-500'}`}>
      {isA ? <User className="w-5 h-5 text-zinc-100" /> : <Bot className="w-5 h-5 text-zinc-100" />}
    </div>
  );
};

// --- Unified Glass Icon Component ---
const GlassListIcon = ({ cat }: { cat: string }) => {
    let icon = <Layers className="w-5 h-5 text-zinc-100" />;
    // Enhanced gradients for a "gem-like" look
    let bgGradient = "from-slate-500/20 to-blue-600/20";
    let glowColor = "shadow-blue-500/10";
    let borderColor = "border-white/10";
    let ringColor = "ring-blue-400/20";

    switch(cat) {
        case 'LIFE':
            icon = <Sparkles className="w-5 h-5 text-fuchsia-200" />;
            bgGradient = "from-fuchsia-500/20 to-purple-600/20";
            glowColor = "shadow-fuchsia-500/20";
            borderColor = "border-fuchsia-400/20";
            ringColor = "ring-fuchsia-400/20";
            break;
        case 'VALORANT':
            icon = <Zap className="w-5 h-5 text-rose-200" />;
            bgGradient = "from-rose-500/20 to-red-600/20";
            glowColor = "shadow-rose-500/20";
            borderColor = "border-rose-400/20";
            ringColor = "ring-rose-400/20";
            break;
        case 'APEX':
            icon = <Target className="w-5 h-5 text-red-200" />;
            bgGradient = "from-red-600/20 to-orange-700/20";
            glowColor = "shadow-red-500/20";
            borderColor = "border-red-400/20";
            ringColor = "ring-red-400/20";
            break;
        case 'OW':
            icon = <Gamepad2 className="w-5 h-5 text-orange-200" />;
            bgGradient = "from-orange-500/20 to-amber-600/20";
            glowColor = "shadow-orange-500/20";
            borderColor = "border-orange-400/20";
            ringColor = "ring-orange-400/20";
            break;
        default: // ALL
            icon = <Layers className="w-5 h-5 text-blue-200" />;
            bgGradient = "from-blue-500/20 to-indigo-600/20";
            glowColor = "shadow-blue-500/20";
            borderColor = "border-blue-400/20";
            ringColor = "ring-blue-400/20";
            break;
    }

    // REMOVED backdrop-blur-md to prevent iOS crashes on scroll
    return (
        <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${bgGradient} border ${borderColor} shadow-lg ${glowColor} group-hover:scale-105 transition-transform duration-300 ring-1 ring-inset ${ringColor}`}>
            {/* Inner gloss reflection */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none"></div>
            {icon}
        </div>
    );
};

// --- Theme Configurations ---
// OPTIMIZATION: Removed backdrop-blur from cardClass to prevent iOS GPU memory overload/crashing
const THEME_STYLES: Record<string, { 
    bgClass: string,
    bgOverlay: React.ReactNode,
    cardClass: string,
    cardBgContent: React.ReactNode,
    accentColorClass: string,
    buttonClass: string,
    detailBgClass: string,
    underlineColor: string,
}> = {
  ALL: {
    bgClass: "bg-[#050505]",
    bgOverlay: (
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         {/* Cool Blue/Slate Ambient for ALL */}
         <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-950/40 via-[#0a0a0c] to-[#050505]"></div>
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
         <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]"></div>
       </div>
    ),
    // Removed backdrop-blur-md
    cardClass: "rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden group hover:border-white/10 hover:shadow-blue-500/5",
    cardBgContent: (
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    ),
    accentColorClass: "text-blue-400", 
    buttonClass: "bg-zinc-100 text-black rounded-xl font-bold hover:bg-zinc-200 transition-all",
    detailBgClass: "bg-[#050505]/95 backdrop-blur-3xl",
    underlineColor: "border-blue-400"
  },
  LIFE: {
    bgClass: "bg-[#050505]", 
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Warm Fuchsia/Purple Ambient for LIFE - Distinct from ALL */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-fuchsia-900/30 via-[#0a0a0c] to-[#050505]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-fuchsia-600/10 rounded-full blur-[100px]"></div>
      </div>
    ),
    // Removed backdrop-blur-md
    cardClass: "rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden group hover:border-white/10 hover:shadow-fuchsia-500/5",
    cardBgContent: (
      <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    ),
    accentColorClass: "text-fuchsia-400",
    buttonClass: "bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-bold shadow-lg shadow-fuchsia-900/20 hover:shadow-fuchsia-600/40 transition-all",
    detailBgClass: "bg-[#0a0a0c]/95 backdrop-blur-3xl",
    underlineColor: "border-fuchsia-500"
  },
  VALORANT: {
    bgClass: "bg-[#0f1923]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0f1923]"></div>
        <div className="absolute top-0 right-0 w-[60%] h-full bg-[#ff4655]/5 skew-x-[-20deg] transform origin-bottom"></div>
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] opacity-10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,70,85,0.05)_1px,transparent_1px)] bg-[size:100px_100%] opacity-20"></div>
      </div>
    ),
    // Removed backdrop-blur-sm
    cardClass: "rounded-none border border-white/5 bg-[#ece8e1]/5 hover:bg-[#ece8e1]/10 transition-all relative overflow-hidden group/card shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:border-[#ff4655]/30",
    cardBgContent: (
      <div className="absolute inset-0 pointer-events-none opacity-20 group-hover/card:opacity-30 transition-opacity">
         <div className="absolute top-0 right-0 w-20 h-full bg-[#ff4655]/20 skew-x-[-20deg]"></div>
      </div>
    ),
    accentColorClass: "text-[#ff4655]",
    buttonClass: "bg-[#ff4655] rounded-none uppercase tracking-wider font-bold [clip-path:polygon(0_0,100%_0,100%_80%,92%_100%,0_100%)] hover:bg-[#ff5865]",
    detailBgClass: "bg-[#0f1923]/95 backdrop-blur-3xl",
    underlineColor: "border-[#ff4655]"
  },
  APEX: {
    bgClass: "bg-[#1a0b0b]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[451px] bg-gradient-to-b from-[#da292a]/10 via-[#1a0b0b]/80 to-[#1a0b0b]"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(transparent_0%,#000_100%),repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_10px)]"></div>
        <div className="absolute top-0 right-0 w-[200px] h-full border-l border-red-500/10 skew-x-[-15deg]"></div>
      </div>
    ),
    // Removed backdrop-blur-md
    cardClass: "skew-x-[-6deg] border border-white/5 bg-gradient-to-br from-neutral-900/40 to-neutral-950/40 hover:from-red-900/20 transition-all relative overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05)] hover:border-red-500/30",
    cardBgContent: (
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_11px)]"></div>
    ),
    accentColorClass: "text-[#ff4e4e]",
    buttonClass: "bg-[#da292a] skew-x-[-10deg] border-b-4 border-[#8e0e0e] font-bold tracking-tighter uppercase hover:bg-[#f03a3b]",
    detailBgClass: "bg-[#1a0b0b]/90 backdrop-blur-3xl",
    underlineColor: "border-[#da292a]"
  },
  OW: {
    bgClass: "bg-[#181a20]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#f99e1a]/10 via-[#181a20] to-[#181a20]"></div>
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-[#f99e1a]/5 rounded-full blur-3xl"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-20"></div>
      </div>
    ),
    // Removed backdrop-blur-md
    cardClass: "rounded-2xl border border-white/5 bg-[#22252e]/60 hover:bg-[#2b2f3a]/80 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05)] relative overflow-hidden group hover:border-[#f99e1a]/30",
    cardBgContent: (
       <div className="absolute inset-0 bg-gradient-to-r from-[#f99e1a]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    ),
    accentColorClass: "text-[#f99e1a] font-bold",
    buttonClass: "bg-[#f99e1a] hover:bg-[#ffaa33] text-[#16171d] rounded-xl font-bold shadow-[0_4px_15px_-5px_rgba(249,158,26,0.4)] transition-all transform hover:-translate-y-0.5",
    detailBgClass: "bg-[#181a20]/90 backdrop-blur-3xl",
    underlineColor: "border-[#f99e1a]"
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [selectedItem, setSelectedItem] = useState<VocabItem | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [lang, setLang] = useState<'cn' | 'tw' | 'hk'>('cn'); 
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashFading, setIsSplashFading] = useState(false);

  const [isMaskMode, setIsMaskMode] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedCharacter, setSelectedCharacter] = useState<'zundamon' | 'metan'>('zundamon');
  
  const [useVoicevox, setUseVoicevox] = useState(() => {
      try {
          const saved = localStorage.getItem('jpgamer_use_voicevox');
          return saved !== null ? JSON.parse(saved) : true;
      } catch (e) {
          return true;
      }
  });

  useEffect(() => {
      // Phase 1: Show Splash, then start fading
      const timer1 = setTimeout(() => {
          setIsSplashFading(true);
      }, 1800);

      // Phase 2: Remove Splash from DOM
      const timer2 = setTimeout(() => {
          setShowSplash(false);
      }, 2500); // 1.8s + 0.7s fade

      return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  const audioCacheRef = useRef<Map<string, Promise<AudioBuffer[]>>>(new Map());

  useEffect(() => {
      localStorage.setItem('jpgamer_use_voicevox', JSON.stringify(useVoicevox));
  }, [useVoicevox]);

  const [isAiLoading, setIsAiLoading] = useState(false); 
  
  const audioContextRef = useRef<AudioContext | null>(null);

  const [availableVoices, setAvailableVoices] = useState<{male: SpeechSynthesisVoice | null, female: SpeechSynthesisVoice | null}>({ male: null, female: null });
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
      offlineMode: { cn: "离线", tw: "離線", hk: "離線" },
      favorite: { cn: "收藏", tw: "收藏", hk: "收藏" },
      install: { cn: "安装", tw: "安裝", hk: "安裝" },
      lifeCat: { cn: "常用", tw: "常用", hk: "常用" },
      noResults: { cn: "没有找到相关词汇", tw: "沒有找到相關詞彙", hk: "搵唔到相關詞彙" },
      noFavs: { cn: "本分类下暂无收藏", tw: "本分類下暫無收藏", hk: "呢個分類暫無收藏" },
      lifeScene: { cn: "常用场景", tw: "常用場景", hk: "常用場景" },
      gameVoice: { cn: "游戏语音", tw: "遊戲語音", hk: "遊戲語音" },
      play: { cn: "播放", tw: "播放", hk: "播放" },
      voiceMode: { 
        offline: { cn: "离线发音", tw: "離線發音", hk: "離線發音" },
        online: { cn: "在线发音", tw: "線上發音", hk: "線上發音" }
      },
      iosTitle: { cn: "安装到 iPhone", tw: "安裝到 iPhone", hk: "安裝到 iPhone" },
      iosDesc: { 
          cn: (<span>点击浏览器底部工具栏的 <span className="font-bold text-blue-400">分享</span> 按钮，然后向下滑动选择 <span className="font-bold text-zinc-100">"添加到主屏幕"</span> 即可獲得原生APP体验。</span>), 
          tw: (<span>點擊瀏覽器底部工具欄的 <span className="font-bold text-blue-400">分享</span> 按鈕，然後向下滑動選擇 <span className="font-bold text-zinc-100">"加入主畫面"</span> 即可獲得原生APP體驗。</span>),
          hk: (<span>點擊瀏覽器底部工具欄嘅 <span className="font-bold text-blue-400">分享</span> 按鈕，然後向下滑動選擇 <span className="font-bold text-zinc-100">"加入主畫面"</span> 即可獲得原生APP體驗。</span>) 
      },
      description: { cn: "备注", tw: "備註", hk: "備註" },
      example: { cn: "场景例句", tw: "場景例句", hk: "場景例句" },
      zundamon: { cn: "尊达萌", tw: "尊達萌", hk: "尊達萌" },
      metan: { cn: "四国梅坦", tw: "四國梅坦", hk: "四國梅坦" }
  };

  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Swipe logic State
  const [swipeState, setSwipeState] = useState({
    startX: 0,
    currentX: 0,
    startY: 0,
    isDragging: false
  });

  const activeIndex = CATEGORIES.findIndex(c => c.id === activeTab);
  const currentTheme = THEME_STYLES[activeTab] || THEME_STYLES['LIFE'];
  const detailTheme = selectedItem ? (THEME_STYLES[selectedItem.cat] || THEME_STYLES['LIFE']) : currentTheme;

  // Prepare filtered data for ALL categories to render simultaneously
  const allCategoriesData = useMemo(() => {
    const data: Record<string, VocabItem[]> = {};
    CATEGORIES.forEach(cat => {
      data[cat.id] = VOCAB_DATA.filter((item) => {
        const matchesCategory = cat.id === 'ALL' ? true : item.cat === cat.id;
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
    });
    return data;
  }, [searchTerm, showFavorites, favorites, lang, getLocalizedText]);

  const activeCategoryName = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === activeTab);
    if (!cat) return "";
    return lang === 'cn' ? cat.name : (lang === 'hk' ? (cat.name_hk || cat.name_tw) : cat.name_tw);
  }, [activeTab, lang]);

  useEffect(() => {
    const unlockAudio = () => {
        if (!audioContextRef.current) {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContext();
        }
        
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        const buffer = audioContextRef.current.createBuffer(1, 1, 22050);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);

        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    document.body.style.fontFamily = lang === 'cn' 
      ? "'Inter', 'Noto Sans SC', 'Noto Sans JP', sans-serif" 
      : "'Inter', 'Noto Sans TC', 'Noto Sans JP', sans-serif";
  }, [lang]);

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
    setActiveTab(newTabId);
    // Reset scroll for the new tab (optional, but good for navigation feeling)
    const el = document.getElementById(`scroll-container-${newTabId}`);
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (selectedItem) return;
    
    const startX = e.touches[0].clientX;
    // Edge Protection for iOS:
    // If the touch starts too close to the left/right edge, ignore it
    // to allow the native iOS "Back" or "Forward" swipe gestures to work without conflict.
    if (startX < 30 || startX > window.innerWidth - 30) {
        return;
    }

    setSwipeState({
        startX: startX,
        currentX: startX,
        startY: e.touches[0].clientY,
        isDragging: true
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swipeState.isDragging || selectedItem) return;
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    
    // Determine scroll direction lock
    const dx = Math.abs(x - swipeState.startX);
    const dy = Math.abs(y - swipeState.startY);

    // If vertical movement dominates, assume scrolling and ignore horizontal swipe
    if (dy > dx) return;

    setSwipeState(prev => ({ ...prev, currentX: x }));
  };

  const onTouchEnd = () => {
    if (!swipeState.isDragging || selectedItem) return;
    
    const diff = swipeState.currentX - swipeState.startX;
    const threshold = window.innerWidth * 0.2; // 20% width to trigger switch
    
    // Only switch if dragging horizontally (check implicitly via startX/currentX difference)
    if (Math.abs(diff) > threshold) {
        if (diff > 0 && activeIndex > 0) {
            // Swipe Right -> Prev
            handleTabChange(CATEGORIES[activeIndex - 1].id);
        } else if (diff < 0 && activeIndex < CATEGORIES.length - 1) {
            // Swipe Left -> Next
            handleTabChange(CATEGORIES[activeIndex + 1].id);
        }
    }
    
    setSwipeState(prev => ({ ...prev, isDragging: false, startX: 0, currentX: 0 }));
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

  const preprocessTextForTTS = (text: string) => {
    return text
        .replace(/([俺私僕君彼彼女敵服場今日明日発言人推し])は/g, '$1わ')
        .replace(/(これ|それ|あれ|どこ|ここ|そこ|あそこ)は/g, '$1わ')
        .replace(/のでは/g, 'のでわ')
        .replace(/ては/g, 'てわ')
        .replace(/では/g, 'でわ')
        .replace(/逃げ場は/g, '逃げ場わ')
        .replace(/俺は/g, '俺わ')
        .replace(/午後は/g, '午後わ');
  };

  const loadAudioBuffers = useCallback(async (text: string, char: string): Promise<AudioBuffer[]> => {
    if (!text || text.trim() === '') return [];
    
    const cacheKey = `${char}:${text}`;
    if (audioCacheRef.current.has(cacheKey)) {
        return audioCacheRef.current.get(cacheKey)!;
    }

    const promise = (async () => {
        const primaryId = char === 'zundamon' ? 3 : 2;
        const secondaryId = char === 'zundamon' ? 2 : 3;

        const lines = text.split('\n').filter(l => l.trim() !== '');
        const audioQueue: { text: string, speakerId: number }[] = [];

        for (const line of lines) {
            const cleanLine = line.replace(/[\(（].*?[\)）]/g, '').trim();
            if (!cleanLine) continue;
            
            const match = cleanLine.match(/^([ABＡＢ][:：]?\s*)(.*)/i);
            if (match) {
                 const prefix = match[1];
                 const spokenText = match[2];
                 const isB = prefix.toUpperCase().includes('B') || prefix.includes('Ｂ');
                 if (spokenText) audioQueue.push({ text: spokenText, speakerId: isB ? secondaryId : primaryId });
            } else {
                 audioQueue.push({ text: cleanLine, speakerId: primaryId });
            }
        }

        if (audioQueue.length === 0) return [];

        if (!audioContextRef.current) {
             const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
             audioContextRef.current = new AudioContext();
        }

        const buffers: AudioBuffer[] = [];
        for (const q of audioQueue) {
            try {
                 const url = `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(q.text)}&speaker=${q.speakerId}`;
                 const res = await fetchWithRetry(url);
                 const data = await res.json();
                 
                 if (data.mp3StreamingUrl) {
                    await new Promise(r => setTimeout(r, 150));
                    
                    const audioRes = await fetchWithRetry(data.mp3StreamingUrl);
                    const ab = await audioRes.arrayBuffer();
                    
                    if (audioContextRef.current) {
                        const decoded = await audioContextRef.current.decodeAudioData(ab);
                        buffers.push(decoded);
                    }
                 }
            } catch (e) {
                 console.warn("Audio segment load failed, skipping segment", e);
                 // Don't throw here to allow partial success or fallback
            }
        }
        
        if (buffers.length === 0) throw new Error("No buffers loaded");
        return buffers;
    })();

    const cachedPromise = promise.catch(e => {
        audioCacheRef.current.delete(cacheKey);
        throw e;
    });

    audioCacheRef.current.set(cacheKey, cachedPromise);
    return cachedPromise;
  }, []);

  const playVoicevoxAudio = async (text: string, id: string) => {
      setPlayingId(id);
      setIsAiLoading(true);
      
      try {
          if (!audioContextRef.current) {
               const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
               audioContextRef.current = new AudioContext();
          }
          if (audioContextRef.current.state === 'suspended') {
              await audioContextRef.current.resume();
          }

          const buffers = await loadAudioBuffers(text, selectedCharacter);
          setIsAiLoading(false); 
          
          if (!buffers || buffers.length === 0) {
              // Silently fall back to browser TTS if buffers are empty
              handleBrowserPlay(text, id);
              return;
          }

          let nextStartTime = audioContextRef.current.currentTime + 0.05;
          
          buffers.forEach((buffer, i) => {
               if (!audioContextRef.current) return;
               const source = audioContextRef.current.createBufferSource();
               source.buffer = buffer;
               source.playbackRate.value = playbackSpeed;
               source.connect(audioContextRef.current.destination);
               source.start(nextStartTime);
               
               const duration = buffer.duration / playbackSpeed;
               nextStartTime += duration + 0.05;
               
               if (i === buffers.length - 1) {
                   source.onended = () => setPlayingId(null);
               }
          });

      } catch (error) {
          console.warn("VOICEVOX Failed (network or api error), falling back to Browser TTS:", error);
          handleBrowserPlay(text, id);
      } finally {
          if (isAiLoading) setIsAiLoading(false);
      }
  };

  const handleBrowserPlay = (text: string, id: string) => {
    setPlayingId(id);
    const rawLines = text.split('\n');
    const cleanLines = rawLines.map(line => {
        const isB = line.trim().startsWith('B') || line.trim().startsWith('Ｂ');
        const content = line.replace(/^([ABＡＢ][:：]?\s*)/i, '').replace(/[\(（].*?[\)）]/g, '').trim();
        return { content, isB };
    }).filter(l => l.content.length > 0);

    let index = 0;
    const playNext = () => {
        if (index >= cleanLines.length) {
            setPlayingId(null);
            return;
        }
        const line = cleanLines[index];
        const textToSpeak = preprocessTextForTTS(line.content);
        
        const u = new SpeechSynthesisUtterance(textToSpeak);
        utteranceRef.current = u; 
        
        u.lang = 'ja-JP';
        
        let selectedVoice = availableVoices.female || availableVoices.male;
        
        if (selectedVoice) {
            u.voice = selectedVoice;
        }
        
        const isZundamon = selectedCharacter === 'zundamon';
        const isPrimary = !line.isB;
        const currentIsZundamon = (isZundamon && isPrimary) || (!isZundamon && !isPrimary);

        if (currentIsZundamon) {
            u.pitch = 1.3;
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

  const handlePlay = (text: string, id: string) => {
      window.speechSynthesis.cancel();
      
      if (!audioContextRef.current) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContext();
      }
      if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(e => console.error("Audio resume failed", e));
      }

      if (!isOnline && useVoicevox) {
          handleBrowserPlay(text, id);
          return;
      }

      if (useVoicevox) {
          playVoicevoxAudio(text, id);
      } else {
          handleBrowserPlay(text, id);
      }
  };

  useEffect(() => {
    if (selectedItem && useVoicevox && isOnline) {
         const termText = selectedItem.kana || selectedItem.term;
         const exText = getLocalizedText(selectedItem, 'example');
         
         loadAudioBuffers(termText, selectedCharacter).catch(e => {
             // Silence preload errors to avoid console spam
         });
         loadAudioBuffers(exText, selectedCharacter).catch(e => {});
    }
  }, [selectedItem, useVoicevox, isOnline, selectedCharacter, loadAudioBuffers, getLocalizedText]);

  const renderChatBubbles = (exampleText: string) => {
      const rawLines = exampleText.split('\n').filter(l => l.trim().length > 0);
      const parsedBubbles: { isB: boolean; text: string; translation: string }[] = [];

      for (let i = 0; i < rawLines.length; i++) {
          const line = rawLines[i];
          const isB = line.trim().startsWith('B') || line.trim().startsWith('Ｂ');
          
          const inlineTransMatch = line.match(/[\(（](.*?)[\)）]/);
          const inlineTrans = inlineTransMatch ? inlineTransMatch[1] : "";
          
          const cleanText = line
              .replace(/^([ABＡＢ][:：]?\s*)/i, '')
              .replace(/[\(（].*?[\)）]/g, '')
              .trim();

          const isOrphanTranslation = /^[\(（]/.test(line.trim()) && !cleanText;

          if (isOrphanTranslation) {
             if (inlineTransMatch && parsedBubbles.length > 0) {
                 parsedBubbles[parsedBubbles.length - 1].translation = inlineTransMatch[1];
             }
          } else if (cleanText) {
             parsedBubbles.push({
                 isB,
                 text: cleanText,
                 translation: inlineTrans
             });
          }
      }

      const category = selectedItem?.cat || activeTab;

      return parsedBubbles.map((bubble, i) => {
          const { isB, text, translation } = bubble;
          
          const bubbleStyle = isB 
            ? category === 'VALORANT' ? 'bg-[#ff4655] rounded-none [clip-path:polygon(0_0,100%_0,100%_100%,10%_100%,0_85%)]'
              : category === 'APEX' ? 'bg-[#da292a] skew-x-[-10deg]'
              : category === 'OW' ? 'bg-[#f99e1a] text-[#131519] rounded-xl rounded-br-sm'
              : 'bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-xl rounded-br-sm'
            : category === 'VALORANT' ? 'bg-[#1c252e] border border-white/10 rounded-none'
              : category === 'APEX' ? 'bg-[#2a2a2a] border border-white/10 skew-x-[-10deg]'
              : category === 'OW' ? 'bg-[#1e2128] border border-white/10 rounded-xl rounded-bl-sm'
              : 'bg-[#18181b] border border-white/10 rounded-xl rounded-bl-sm';

          return (
              <div key={i} className={`flex ${isB ? 'justify-end' : 'justify-start'} mb-6 items-end gap-3`}>
                  {!isB && ( <Avatar cat={category} side="A" /> )}
                  <div className={`max-w-[75%] flex flex-col ${isB ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 shadow-lg relative text-zinc-100 ${bubbleStyle}`}>
                          <div className={`text-base font-bold leading-relaxed transition-all duration-300 ${category === 'APEX' ? 'skew-x-[10deg]' : ''} ${category === 'VALORANT' ? 'uppercase tracking-wide' : ''} ${category === 'OW' && isB ? 'text-[#131519]' : ''}`}>
                             {text}
                          </div>
                          {translation && (
                              <div className={`text-[10px] mt-1 pt-1 border-t ${category === 'APEX' ? 'skew-x-[10deg]' : ''} ${
                                  isB ? (category === 'OW' ? 'border-[#131519]/20 text-[#131519]/80' : 'border-white/20 text-white/90') 
                                      : 'border-white/10 text-zinc-400'
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
        className={`h-[100dvh] selection:bg-fuchsia-900 selection:text-white flex flex-col relative transition-colors duration-500 text-zinc-100 overflow-x-hidden ${currentTheme.bgClass}`}
    >
      {/* --- SPLASH SCREEN (OPTION C) --- */}
      {showSplash && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-700 ease-out pointer-events-none ${isSplashFading ? 'opacity-0' : 'opacity-100'}`}>
             {/* Main Logo */}
             <div className="relative mb-8">
                {/* Glow Behind */}
                <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-[80px] animate-pulse"></div>
                {/* Logo Image */}
                <div className="w-24 h-24 rounded-full overflow-hidden border border-white/5 shadow-2xl relative z-10 animate-breathe grayscale brightness-125 contrast-125">
                    <img src="/saiba.png" className="w-full h-full object-cover" />
                </div>
             </div>
             
             {/* Text Group */}
             <div className="flex flex-col items-center gap-2 animate-fade-in-up z-10">
                 <h1 className="text-4xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-b from-zinc-100 to-zinc-500">SAKI</h1>
                 <div className="flex items-center gap-3">
                    <div className="h-[1px] w-8 bg-zinc-800"></div>
                    <p className="text-[9px] text-zinc-500 font-mono tracking-[0.3em] uppercase">by Saki</p>
                    <div className="h-[1px] w-8 bg-zinc-800"></div>
                 </div>
             </div>
        </div>
      )}

      <div key={activeTab} className="absolute inset-0 animate-fade-in duration-1000">
          {currentTheme.bgOverlay}
      </div>

      {/* --- TOP FLOATING BAR --- */}
      <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pointer-events-none">
         <div className="flex items-center justify-between pointer-events-auto max-w-md mx-auto">
            {/* Logo Pill - Glass Effect (Unified rounded-2xl & bg-black/40) */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-2xl shadow-lg shadow-black/20">
                <div className="w-6 h-6 rounded-lg overflow-hidden border border-white/20">
                   <img src="/saiba.png" className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-sm tracking-wide text-zinc-100/90">Saki</span>
                {!isOnline && <WifiOff className="w-3 h-3 text-red-400 ml-1" />}
            </div>

            {/* Action Buttons - Unified Glass Style (Rounded-xl & bg-black/40) */}
            <div className="flex items-center gap-2">
                {/* REFACTORED LANGUAGE SELECTOR */}
                <div className="relative">
                    <button 
                      onClick={() => setShowLangMenu(!showLangMenu)}
                      className={`h-10 px-3 flex items-center justify-between gap-2 rounded-xl backdrop-blur-xl border transition-all duration-300 shadow-lg min-w-[70px] ${showLangMenu ? 'bg-zinc-100 text-black border-white' : 'bg-black/40 text-zinc-100 border-white/10 hover:bg-black/60 active:scale-95'}`}
                    >
                        <span className="text-[10px] font-bold">{lang.toUpperCase()}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} />
                    </button>
                    {showLangMenu && (
                        <div className="absolute top-full mt-2 left-0 w-full z-50 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl flex flex-col gap-1 origin-top animate-elastic-drop overflow-hidden">
                            {(['cn', 'tw', 'hk'] as const).map(l => (
                                 <button key={l} onClick={() => selectLang(l)} className={`w-full py-2 text-[10px] font-bold rounded-lg text-center transition-colors ${lang === l ? 'bg-white/10 text-zinc-100' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'}`}>
                                     {l.toUpperCase()}
                                 </button>
                            ))}
                        </div>
                    )}
                </div>
                
                <button 
                  onClick={toggleMaskMode}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-lg ${isMaskMode ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-black/40 text-zinc-100 border-white/10 hover:bg-black/60 active:scale-95'}`}
                >
                    {isMaskMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                {deferredPrompt && (
                   <button onClick={handleInstallClick} className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 text-black shadow-lg active:scale-95 animate-pulse">
                      <Download className="w-4 h-4" />
                   </button>
                )}
            </div>
         </div>
      </header>

      {/* --- MAIN CAROUSEL CONTENT --- */}
      <main 
        className="flex-1 w-full max-w-md mx-auto relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ touchAction: 'pan-y' }} // Let browser handle vertical scroll, we handle swipe
      >
        <div 
           className="flex h-full transition-transform"
           style={{
               width: `${CATEGORIES.length * 100}%`,
               transform: `translateX(calc(-${activeIndex * (100 / CATEGORIES.length)}% + ${swipeState.isDragging ? (swipeState.currentX - swipeState.startX) : 0}px))`,
               transition: swipeState.isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
           }}
        >
          {CATEGORIES.map(cat => {
             const items = allCategoriesData[cat.id];
             // Resolve theme for this specific column. 'ALL' has special logic, others rely on ID or default to LIFE
             const catTheme = cat.id === 'ALL' ? THEME_STYLES['ALL'] : (THEME_STYLES[cat.id] || THEME_STYLES['LIFE']);
             const catName = lang === 'cn' ? cat.name : (lang === 'hk' ? (cat.name_hk || cat.name_tw) : cat.name_tw);

             return (
               <div 
                 key={cat.id} 
                 id={`scroll-container-${cat.id}`}
                 className="h-full w-full overflow-y-auto no-scrollbar px-4 pb-[240px] pt-[calc(env(safe-area-inset-top)+6rem)]"
                 style={{ width: `${100 / CATEGORIES.length}%` }}
               >
                 {/* Category Title Header - Moves with slide */}
                 <div className="mb-6 mt-4 pl-2">
                     <h2 className="text-[18px] font-semibold text-zinc-50 inline-block relative pb-1">
                         {showFavorites ? uiText.favorite[lang] : catName}
                         <div className={`absolute bottom-0 left-0 right-0 h-[1px] ${catTheme.underlineColor}`}></div>
                     </h2>
                 </div>

                 {/* List */}
                 <div className="space-y-3">
                   {items.length > 0 ? (
                     items.map((item) => {
                       const displayMeaning = getLocalizedText(item, 'meaning');
                       return (
                       <div 
                         key={item.id} 
                         onClick={() => openDetail(item)}
                         className={`group py-4 px-4 flex items-center justify-between cursor-pointer ${
                            cat.id === 'ALL' ? THEME_STYLES['ALL'].cardClass : catTheme.cardClass
                         }`}
                       >
                         {/* Background Animation Layer */}
                         {cat.id === 'ALL' ? THEME_STYLES['ALL'].cardBgContent : catTheme.cardBgContent}
                         
                         {/* Left: Glass Icon Decoration */}
                         <div className={`mr-4 relative z-10 ${item.cat === 'APEX' ? 'skew-x-[6deg]' : ''}`}>
                             <GlassListIcon cat={item.cat} />
                         </div>

                         {/* Center: Content */}
                         <div className={`flex-1 min-w-0 pr-2 relative z-10 ${item.cat === 'APEX' ? 'skew-x-[6deg]' : ''}`}>
                           <h3 className={`font-medium text-[16px] text-zinc-100 leading-relaxed mb-0.5 truncate transition-all duration-300 ${isMaskMode ? 'blur-md hover:blur-none select-none' : ''} ${item.cat === 'VALORANT' ? 'uppercase tracking-wider' : ''} ${item.cat === 'OW' ? 'not-italic' : ''}`}>
                               {displayMeaning}
                           </h3>
                           <p className={`text-[14px] font-normal text-slate-400 truncate font-mono flex items-center gap-2 group-hover:text-zinc-200 transition-colors`}>
                             <span>{item.term}</span>
                             {item.kana !== item.term && <span className="opacity-70 border-l border-neutral-600 pl-2 group-hover:text-neutral-300">{item.kana}</span>}
                           </p>
                         </div>

                         {/* Right: Favorite Button */}
                         <button
                             onClick={(e) => toggleFavorite(e, item.id)}
                             className={`p-2 relative z-10 text-neutral-600 hover:text-yellow-400 transition-colors ${item.cat === 'APEX' ? 'skew-x-[6deg]' : ''}`}
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
               </div>
             );
          })}
        </div>
      </main>

      {/* --- BOTTOM FLOATING DOCK --- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pointer-events-none">
         <div className="max-w-md mx-auto flex flex-col gap-3 pointer-events-auto">
             
             {/* 1. Floating Search Bar (Stacked Above Tabs) - Unified BG & Radius */}
             <div className={`relative bg-black/40 rounded-2xl border border-white/10 flex items-center px-4 h-12 transition-all focus-within:border-white/30 focus-within:shadow-[0_0_25px_-5px_rgba(255,255,255,0.15)] backdrop-blur-xl shadow-lg shadow-black/50 overflow-hidden group`}>
                {/* Tech Accent Line */}
                <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                    activeTab === 'VALORANT' ? 'bg-[#ff4655]' : 
                    activeTab === 'APEX' ? 'bg-[#da292a]' : 
                    activeTab === 'OW' ? 'bg-[#f99e1a]' : 
                    activeTab === 'LIFE' ? 'bg-fuchsia-500' : 'bg-blue-500'
                } opacity-50`}></div>
                
                <Search className="w-5 h-5 text-zinc-400 mr-3" />
                <input 
                   type="text"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder={uiText.searchPlaceholder[lang]}
                   className="bg-transparent border-none outline-none text-base text-zinc-100 w-full placeholder-zinc-500 font-medium tracking-wide h-full"
                />
                
                {/* Integrated Controls Right Side */}
                <div className="flex items-center gap-2">
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                            <X className="w-4 h-4 text-zinc-100" />
                        </button>
                    )}
                    {/* Vertical Separator for HUD look */}
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    
                    <button 
                        onClick={() => setShowFavorites(!showFavorites)}
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${showFavorites ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Star className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
                    </button>
                </div>
             </div>

             {/* 2. Category Tabs (The Dock) - Unified BG & Radius (rounded-2xl) */}
             <div className={`backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-3 transition-all duration-500 bg-black/40 ${
                 activeTab === 'VALORANT' ? 'shadow-rose-900/20 border-rose-500/10' : 
                 activeTab === 'APEX' ? 'shadow-red-900/20 border-red-500/10' :
                 activeTab === 'OW' ? 'shadow-orange-900/20 border-orange-500/10' :
                 'shadow-black/50'
             }`}>
                 <div className="flex items-center justify-between px-2 pt-1">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleTabChange(cat.id)}
                        className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group ${
                            activeTab === cat.id ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80 scale-100'
                        }`}
                      >
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border ${
                             activeTab === cat.id 
                                ? `bg-white/10 border-white/20 shadow-lg backdrop-blur-md` 
                                : 'bg-transparent border-transparent group-hover:bg-white/5'
                         }`}>
                             <div className={`${activeTab === cat.id ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`}>
                                {cat.icon}
                             </div>
                         </div>
                         <span className={`text-[9px] font-bold tracking-wide ${activeTab === cat.id ? 'text-zinc-100' : 'text-neutral-400'}`}>
                             {cat.id === 'LIFE' ? uiText.lifeCat[lang] : (lang === 'cn' ? cat.name : (lang === 'hk' ? (cat.name_hk || cat.name_tw) : cat.name_tw))}
                         </span>
                      </button>
                    ))}
                 </div>
             </div>
         </div>
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
          {/* Main Detail Container */}
          <div className={`w-full max-w-md flex flex-col h-[100dvh] pointer-events-auto shadow-2xl relative overflow-hidden ${detailTheme.detailBgClass} ${isDetailClosing ? 'animate-collapse-vertical' : 'animate-expand-vertical'}`}>
            {/* Ambient Background Overlay (Preserves context) */}
            {detailTheme.bgOverlay}
            
            {/* Detail Top Controls (Floating) */}
            <div className="fixed top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between z-50 pointer-events-none max-w-md mx-auto">
                <button
                    onClick={closeDetail}
                    className="pointer-events-auto w-12 h-12 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 text-zinc-100 shadow-xl active:scale-95 transition-all hover:bg-black/60"
                >
                    <ChevronLeft className="w-6 h-6 -ml-0.5" />
                </button>

                <div className="flex gap-2">
                    <button 
                        onClick={(e) => toggleFavorite(e, selectedItem.id)}
                        className={`pointer-events-auto w-12 h-12 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-xl active:scale-95 transition-all hover:bg-black/60 ${favorites.includes(selectedItem.id) ? 'text-yellow-400' : 'text-neutral-200'}`}
                    >
                        <Star className={`w-6 h-6 ${favorites.includes(selectedItem.id) ? 'fill-current' : ''}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 overscroll-contain pb-[280px]">
                {/* HERO SECTION */}
                <div className="px-6 pt-[calc(6rem+env(safe-area-inset-top))] pb-8 text-center relative">
                     {/* Term (Japanese) - Playable Hero */}
                     <button 
                        onClick={() => handlePlay(selectedItem.kana || selectedItem.term, 'term')}
                        className={`group/term relative z-10 flex items-center justify-center gap-3 mx-auto transition-all active:scale-[0.98] cursor-pointer mb-1`}
                    >
                        <h1 className={`text-5xl font-black tracking-tight drop-shadow-xl ${detailTheme.accentColorClass} ${selectedItem.cat === 'VALORANT' ? 'uppercase' : ''} ${selectedItem.cat === 'APEX' ? 'italic skew-x-[-6deg]' : ''}`}>
                            {selectedItem.term}
                        </h1>
                        
                        {/* Audio Icon - Explicitly styled as requested */}
                        <div className={`${detailTheme.accentColorClass} ${playingId === 'term' ? 'opacity-100' : 'opacity-70 group-hover/term:opacity-100'} transition-opacity`}>
                             {playingId === 'term' && isAiLoading && useVoicevox ? (
                                 <Loader2 className="w-6 h-6 animate-spin" />
                             ) : (
                                 <Volume2 className="w-6 h-6" />
                             )}
                        </div>
                    </button>

                    {/* Meaning (Native) - Subtitle */}
                    <p className={`text-xl font-medium text-zinc-300 leading-tight mb-4 drop-shadow-md ${selectedItem.cat === 'OW' ? 'not-italic' : ''}`}>
                        {getLocalizedText(selectedItem, 'meaning')}
                    </p>
                    
                    {/* Meta Data Pill */}
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm text-sm font-mono text-zinc-400">
                        <span>{selectedItem.kana}</span>
                        <span className="text-zinc-600">•</span>
                        <span>{selectedItem.romaji}</span>
                    </div>

                    {/* Description Card */}
                    <div className={`mt-6 w-full p-5 border border-white/10 backdrop-blur-md shadow-lg relative overflow-hidden group hover:border-white/20 transition-all ${
                        selectedItem.cat === 'VALORANT' ? 'bg-[#0f1923]/80 rounded-none border-l-4 border-l-[#ff4655]' : 
                        selectedItem.cat === 'APEX' ? 'bg-[#1a0b0b]/80 skew-x-[-3deg] border-r-4 border-r-[#da292a]' : 
                        'bg-black/40 rounded-2xl'
                    }`}>
                        <div className="absolute top-0 right-0 p-3 opacity-20">
                            <GlassListIcon cat={selectedItem.cat} />
                        </div>
                        <div className={`relative z-10 text-left ${selectedItem.cat === 'APEX' ? 'skew-x-[3deg]' : ''}`}>
                            <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">{uiText.description[lang]}</div>
                            <p className="text-sm text-zinc-200 leading-relaxed">
                                {getLocalizedText(selectedItem, 'desc')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* EXAMPLE SECTION */}
                <div className="px-4 pb-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1">{uiText.example[lang]}</span>
                        <button 
                            onClick={() => handlePlay(getLocalizedText(selectedItem, 'example'), 'ex')}
                            className={`flex items-center gap-2 px-3 py-1.5 transition-all active:scale-95 shadow-lg hover:brightness-110 relative z-20 ${detailTheme.buttonClass} text-xs`}
                        >
                            {playingId === 'ex' 
                                ? (isAiLoading && useVoicevox ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3 animate-pulse" />)
                                : <Play className="w-3 h-3" />
                            }
                            <span className={`font-bold not-italic ${selectedItem.cat === 'APEX' ? 'skew-x-[10deg] inline-block' : ''}`}>{uiText.play[lang]}</span>
                        </button>
                    </div>
                    <div className="space-y-4 pb-4">
                        {renderChatBubbles(getLocalizedText(selectedItem, 'example'))}
                    </div>
                </div>
            </div>

            {/* Bottom Controls Panel - Animated & Premium */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-zinc-950/95 to-transparent pt-12 pb-[env(safe-area-inset-bottom)] pointer-events-auto">
                 <div className="px-6 pb-4 max-w-md mx-auto">
                    
                    {/* Glass Control Capsule */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-2xl shadow-black/50 mb-3 flex items-center justify-between gap-3">
                         {/* Speed Controls (Segmented) */}
                         <div className="flex bg-black/30 rounded-xl p-1 flex-1">
                            {[0.5, 0.75, 1.0].map(s => (
                                <button 
                                    key={s}
                                    onClick={() => setPlaybackSpeed(s)}
                                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 ${playbackSpeed === s ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {s}x
                                </button>
                            ))}
                         </div>
                         
                         {/* Source Toggle Switch */}
                         <button 
                            onClick={() => setUseVoicevox(!useVoicevox)}
                            className={`relative px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 overflow-hidden ${useVoicevox ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-zinc-800 border border-white/5'}`}
                         >
                            <div className={`w-2 h-2 rounded-full ${useVoicevox ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`}></div>
                            <span className={`text-xs font-bold ${useVoicevox ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                {useVoicevox ? uiText.voiceMode.online[lang] : uiText.voiceMode.offline[lang]}
                            </span>
                         </button>
                    </div>

                    {/* Animated Character Drawer */}
                    <div className={`transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden ${useVoicevox ? 'max-h-24 opacity-100 translate-y-0' : 'max-h-0 opacity-0 translate-y-4'}`}>
                        <div className="grid grid-cols-2 gap-3 pb-2">
                             <button
                                onClick={() => setSelectedCharacter('zundamon')}
                                className={`relative h-14 rounded-xl border transition-all duration-200 overflow-hidden group active:scale-95 ${selectedCharacter === 'zundamon' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                             >
                                <div className="absolute inset-0 flex items-center justify-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedCharacter === 'zundamon' ? 'bg-emerald-500 text-white shadow-lg scale-110' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Leaf className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-xs font-bold leading-none transition-colors ${selectedCharacter === 'zundamon' ? 'text-emerald-400' : 'text-zinc-400'}`}>{uiText.zundamon[lang]}</div>
                                    </div>
                                </div>
                             </button>

                             <button
                                onClick={() => setSelectedCharacter('metan')}
                                className={`relative h-14 rounded-xl border transition-all duration-200 overflow-hidden group active:scale-95 ${selectedCharacter === 'metan' ? 'bg-fuchsia-500/10 border-fuchsia-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                             >
                                <div className="absolute inset-0 flex items-center justify-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${selectedCharacter === 'metan' ? 'bg-fuchsia-500 text-white shadow-lg scale-110' : 'bg-zinc-800 text-zinc-500'}`}>
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div className="text-left">
                                        <div className={`text-xs font-bold leading-none transition-colors ${selectedCharacter === 'metan' ? 'text-fuchsia-400' : 'text-zinc-400'}`}>{uiText.metan[lang]}</div>
                                    </div>
                                </div>
                             </button>
                        </div>
                    </div>

                 </div>
            </div>

          </div>
        </div>
      )}

      {isIOS && !isStandalone && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 border-t border-white/10 p-4 z-50 backdrop-blur-md animate-slide-up shadow-2xl safe-pb pb-[env(safe-area-inset-bottom)]">
           <div className="max-w-md mx-auto flex items-start gap-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                 <Share className="w-6 h-6 text-blue-400" /> 
              </div>
              <div className="flex-1">
                 <h4 className="font-bold text-sm text-zinc-100 mb-1">{uiText.iosTitle[lang]}</h4>
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
        @keyframes expandVertical {
          0% { clip-path: inset(50% 0 50% 0); opacity: 0; }
          100% { clip-path: inset(0 0 0 0); opacity: 1; }
        }
        @keyframes collapseVertical {
          0% { clip-path: inset(0 0 0 0); opacity: 1; }
          100% { clip-path: inset(50% 0 50% 0); opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Custom Breathe Animation for Splash Screen */
        @keyframes breathe {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.2); }
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fadeInUp 1s ease-out forwards;
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
        .animate-expand-vertical {
          animation: expandVertical 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-collapse-vertical {
          animation: collapseVertical 0.25s ease-in forwards;
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
        @keyframes elasticDrop {
            0% { opacity: 0; transform: scaleY(0.5); }
            60% { transform: scaleY(1.1); }
            100% { opacity: 1; transform: scaleY(1); }
        }
        .animate-elastic-drop {
            animation: elasticDrop 0.4s cubic-bezier(0.3, 1.5, 0.5, 1) forwards;
        }
        .safe-pb {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
        .safe-pt {
            padding-top: calc(env(safe-area-inset-top, 20px) + 210px);
        }
      `}</style>
    </div>
  );
}