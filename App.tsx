import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, Search, X, Volume2, 
  ChevronLeft, MessageCircle, 
  Sword, Shield, Crosshair, Zap, Target, User, Bot, AlertCircle, Gamepad2, Download, Share,
  WifiOff, Star, Layers, Globe, Sparkles,
  Battery, Syringe, Box, Skull, Flame, Hexagon, Heart, Eye, Hand, Footprints, Clock, Coins, Speaker,
  EyeOff, Settings2, Check, Mic2, Radio, Loader2, Leaf, Music2, Cpu, Menu,
  Languages, Type, Wifi, Signal, ChevronDown, Backpack, Activity
} from 'lucide-react';
import { CATEGORIES, VOCAB_DATA, VocabItem, ValorantLogo, ApexLogo, OWLogo, SCENE_TAGS } from './constants';

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
      <div className={`w-8 h-8 flex items-center justify-center shadow-lg relative overflow-hidden ${isA ? 'bg-[#0f1923] border border-[#00f0ff]' : 'bg-[#0f1923] border border-[#ff4655]'}`}>
        {isA ? <Sword className="w-4 h-4 text-[#00f0ff]" /> : <Crosshair className="w-4 h-4 text-[#ff4655]" />}
        <div className="absolute inset-0 bg-white/5 skew-x-12"></div>
      </div>
    );
  }

  if (cat === 'APEX') {
    return (
      <div className="w-8 h-8 relative flex items-center justify-center">
        <div className={`absolute inset-0 w-full h-full [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)] ${isA ? 'bg-gradient-to-b from-orange-600 to-red-700' : 'bg-gradient-to-b from-neutral-600 to-neutral-800'}`}></div>
        <div className="relative z-10 text-white font-bold text-[10px] tracking-tighter">
            {isA ? "ATK" : "DEF"}
        </div>
        <div className="absolute inset-0 border border-white/30 [clip-path:polygon(50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%)] pointer-events-none"></div>
      </div>
    );
  }

  if (cat === 'OW') {
    return (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_0_10px_rgba(249,158,26,0.2)] border ${isA ? 'bg-[#f99e1a] border-white' : 'bg-[#282c34] border-[#f99e1a]'}`}>
        {isA ? <Shield className="w-4 h-4 text-[#1a1c24]" /> : <Zap className="w-4 h-4 text-[#f99e1a]" />}
      </div>
    );
  }

  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border border-white/20 ${isA ? 'bg-gradient-to-br from-cyan-400 to-blue-500' : 'bg-gradient-to-br from-fuchsia-500 to-pink-500'}`}>
      {isA ? <User className="w-4 h-4 text-zinc-100" /> : <Bot className="w-4 h-4 text-zinc-100" />}
    </div>
  );
};

// --- Unified Glass Icon Component ---
const GlassListIcon = React.memo(({ cat, size = "md" }: { cat: string, size?: "sm" | "md" | "lg" }) => {
    let icon = <Layers className="w-5 h-5 text-zinc-100" />;
    // Optimized gradients: Simple CSS gradients, no blurs
    let bgGradient = "from-slate-800 to-slate-900";
    let glowColor = "shadow-none"; // Removed shadows for flat feel or keep minimal
    let borderColor = "border-white/10";
    let ringColor = "ring-white/5";

    const isSmall = size === "sm";
    const dim = isSmall ? "w-8 h-8" : "w-12 h-12";
    const iconSize = isSmall ? "w-4 h-4" : "w-5 h-5";

    switch(cat) {
        case 'LIFE':
            icon = <MessageCircle className={`${iconSize} text-fuchsia-200`} />;
            bgGradient = "from-fuchsia-900/40 to-purple-900/40";
            borderColor = "border-fuchsia-500/20";
            break;
        case 'VALORANT':
            icon = <ValorantLogo className={`${iconSize} text-rose-200`} />;
            bgGradient = "from-rose-900/40 to-red-900/40";
            borderColor = "border-rose-500/20";
            break;
        case 'APEX':
            icon = <ApexLogo className={`${iconSize} text-red-200`} />;
            bgGradient = "from-red-900/40 to-orange-900/40";
            borderColor = "border-red-500/20";
            break;
        case 'OW':
            icon = <OWLogo className={`${iconSize} text-orange-200`} />;
            bgGradient = "from-orange-900/40 to-amber-900/40";
            borderColor = "border-orange-500/20";
            break;
        default: // ALL
            icon = <Layers className={`${iconSize} text-blue-200`} />;
            bgGradient = "from-blue-900/40 to-indigo-900/40";
            borderColor = "border-blue-500/20";
            break;
    }

    return (
        <div className={`relative ${dim} rounded-xl flex items-center justify-center bg-gradient-to-br ${bgGradient} border ${borderColor} ${glowColor} transition-transform duration-300 ring-1 ring-inset ${ringColor}`}>
            {icon}
        </div>
    );
});

// --- Theme Configurations ---
// OPTIMIZATION: Updated with "Gamer Borders" as requested.
const THEME_STYLES: Record<string, { 
    bgClass: string,
    bgOverlay: React.ReactNode,
    cardClass: string,
    accentColorClass: string,
    buttonClass: string,
    detailBgClass: string,
    underlineColor: string,
}> = {
  ALL: {
    bgClass: "bg-[#050505]",
    bgOverlay: (
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-950/20 via-[#0a0a0c] to-[#050505]"></div>
       </div>
    ),
    // Standard flat list for ALL
    cardClass: "group relative py-5 px-2 flex items-center justify-between border-b border-white/5 active:bg-white/5 transition-colors",
    accentColorClass: "text-blue-400", 
    buttonClass: "bg-zinc-100 text-black rounded-xl font-bold hover:bg-zinc-200 transition-all",
    detailBgClass: "bg-[#050505]", 
    underlineColor: "border-blue-400"
  },
  LIFE: {
    bgClass: "bg-[#050505]", 
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-fuchsia-900/20 via-[#0a0a0c] to-[#050505]"></div>
      </div>
    ),
    cardClass: "group relative py-5 px-2 flex items-center justify-between border-b border-fuchsia-500/20 active:bg-fuchsia-500/5 transition-colors",
    accentColorClass: "text-fuchsia-400",
    buttonClass: "bg-gradient-to-r from-fuchsia-600 to-purple-600 rounded-xl font-bold shadow-lg shadow-fuchsia-900/20 hover:shadow-fuchsia-600/40 transition-all",
    detailBgClass: "bg-[#050505]",
    underlineColor: "border-fuchsia-500"
  },
  VALORANT: {
    bgClass: "bg-[#0f1923]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#0f1923]"></div>
        <div className="absolute top-0 right-0 w-[60%] h-full bg-[#ff4655]/5 skew-x-[-20deg] transform origin-bottom"></div>
      </div>
    ),
    // Valorant: Left Border (Tech/Cyberpunk feel)
    cardClass: "group relative py-5 px-3 flex items-center justify-between border-l-2 border-[#ff4655] bg-[#ff4655]/[0.02] border-b border-white/5 active:bg-[#ff4655]/10 transition-colors my-1",
    accentColorClass: "text-[#ff4655]",
    buttonClass: "bg-[#ff4655] rounded-none uppercase tracking-wider font-bold [clip-path:polygon(0_0,100%_0,100%_80%,92%_100%,0_100%)] hover:bg-[#ff5865]",
    detailBgClass: "bg-[#0f1923]",
    underlineColor: "border-[#ff4655]"
  },
  APEX: {
    bgClass: "bg-[#1a0b0b]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[451px] bg-gradient-to-b from-[#da292a]/10 via-[#1a0b0b]/80 to-[#1a0b0b]"></div>
      </div>
    ),
    // Apex: Bottom Border (Industrial feel), angular
    cardClass: "group relative py-5 px-2 flex items-center justify-between border-b-2 border-[#da292a] bg-gradient-to-r from-transparent to-[#da292a]/5 active:from-[#da292a]/10 transition-colors my-1 skew-x-[-2deg]",
    accentColorClass: "text-[#ff4e4e]",
    buttonClass: "bg-[#da292a] skew-x-[-10deg] border-b-4 border-[#8e0e0e] font-bold tracking-tighter uppercase hover:bg-[#f03a3b]",
    detailBgClass: "bg-[#1a0b0b]",
    underlineColor: "border-[#da292a]"
  },
  OW: {
    bgClass: "bg-[#181a20]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#f99e1a]/10 via-[#181a20] to-[#181a20]"></div>
      </div>
    ),
    // Overwatch: Full Border (Hero Card feel), rounded
    cardClass: "group relative py-5 px-4 flex items-center justify-between border border-[#f99e1a]/30 rounded-xl bg-[#f99e1a]/5 hover:bg-[#f99e1a]/10 active:scale-[0.99] transition-all my-2 mx-1",
    accentColorClass: "text-[#f99e1a] font-bold",
    buttonClass: "bg-[#f99e1a] hover:bg-[#ffaa33] text-[#16171d] rounded-xl font-bold shadow-[0_4px_15px_-5px_rgba(249,158,26,0.4)] transition-all transform hover:-translate-y-0.5",
    detailBgClass: "bg-[#181a20]",
    underlineColor: "border-[#f99e1a]"
  }
};

const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(15);
    }
};

const VocabCard = React.memo(({ item, catId, theme, isMaskMode, favorites, toggleFavorite, openDetail, getLocalizedText, GlassListIcon }: any) => {
    const displayMeaning = getLocalizedText(item, 'meaning');
    return (
        <div 
            onClick={() => { triggerHaptic(); openDetail(item); }}
            className={catId === 'ALL' ? THEME_STYLES['ALL'].cardClass : theme.cardClass}
        >
            {/* Left: Icon - Visual Anchor */}
            <div className={`mr-4 relative z-10 shrink-0 ${item.cat === 'APEX' ? 'skew-x-[2deg]' : ''}`}>
                <GlassListIcon cat={item.cat} />
            </div>

            {/* Center: Content */}
            <div className={`flex-1 min-w-0 pr-4 relative z-10 ${item.cat === 'APEX' ? 'skew-x-[2deg]' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium text-[17px] text-zinc-100 leading-snug truncate transition-all duration-300 ${isMaskMode ? 'blur-md hover:blur-none select-none' : ''} ${item.cat === 'VALORANT' ? 'uppercase tracking-wider' : ''} ${item.cat === 'OW' ? 'not-italic' : ''}`}>
                        {displayMeaning}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <p className={`text-[13px] font-normal text-zinc-500 truncate font-mono flex items-center gap-2 group-hover:text-zinc-400 transition-colors`}>
                        <span className="text-zinc-400">{item.term}</span>
                        {item.kana !== item.term && <span className="opacity-50">•</span>}
                        {item.kana !== item.term && <span>{item.kana}</span>}
                    </p>
                    
                    {/* Stars Display */}
                    {item.stars && item.stars > 0 && (
                        <div className="flex gap-0.5 ml-auto opacity-60">
                            {Array.from({ length: item.stars }).map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Backpack (Favorite) Button */}
            <button
                onClick={(e) => { triggerHaptic(); toggleFavorite(e, item.id); }}
                // UPDATED: Used md:hover:text-yellow-400 to prevent sticky hover on mobile
                className={`p-3 -mr-2 relative z-10 text-zinc-600 md:hover:text-yellow-400 active:scale-90 transition-all ${item.cat === 'APEX' ? 'skew-x-[2deg]' : ''}`}
            >
                <div className="relative">
                    <Backpack className={`w-5 h-5 ${favorites.includes(item.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </div>
            </button>
        </div>
    );
});

export default function App() {
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [activeScene, setActiveScene] = useState<string>('ALL'); // NEW: Scene Filter State
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

  const toggleFavorite = useCallback((e: React.MouseEvent | null, id: string) => {
      if (e) e.stopPropagation();
      setFavorites(prev => {
          if (prev.includes(id)) return prev.filter(i => i !== id);
          return [...prev, id];
      });
  }, []);

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
          cn: showFavorites ? "搜索背包..." : "搜索...",
          tw: showFavorites ? "搜尋背包..." : "搜尋...",
          hk: showFavorites ? "搜尋背包..." : "搜尋...",
      },
      offlineMode: { cn: "离线", tw: "離線", hk: "離線" },
      favorite: { cn: "背包", tw: "背包", hk: "背包" },
      install: { cn: "安装", tw: "安裝", hk: "安裝" },
      lifeCat: { cn: "常用", tw: "常用", hk: "常用" },
      noResults: { cn: "没有找到相关词汇", tw: "沒有找到相關詞彙", hk: "搵唔到相關詞彙" },
      noFavs: { cn: "背包空空如也", tw: "背包空空如也", hk: "背包吉嘅" },
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
      metan: { cn: "四国梅坦", tw: "四國梅坦", hk: "四國梅坦" },
      allScenes: { cn: "全部", tw: "全部", hk: "全部" }
  };

  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Swipe logic: Using refs for direct DOM manipulation to avoid Re-renders on iOS
  const sliderRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

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
        
        // Scene Tag Filter Logic
        let matchesScene = true;
        if (cat.id !== 'ALL' && activeScene !== 'ALL') {
             matchesScene = !!item.tags?.includes(activeScene);
        }

        return matchesCategory && matchesSearch && matchesFavorite && matchesScene;
      });
    });
    return data;
  }, [searchTerm, showFavorites, favorites, lang, getLocalizedText, activeScene]);

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
    setActiveScene('ALL'); // Reset scene filter on tab change
    // Reset scroll for the new tab (optional, but good for navigation feeling)
    const el = document.getElementById(`scroll-container-${newTabId}`);
    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Optimized Touch Handlers for Axis Locking ---
  const onTouchStart = (e: React.TouchEvent) => {
    if (selectedItem) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    
    // Edge protection
    if (startX < 30 || startX > window.innerWidth - 30) {
        return;
    }

    touchStartRef.current = startX;
    
    // Axis locking initialization
    // We store Y to calculate angle later
    (sliderRef.current as any)._startY = startY;
    (sliderRef.current as any)._isAxisLocked = false;
    (sliderRef.current as any)._lockDirection = null; // 'x' or 'y'

    isDraggingRef.current = true;
    
    if (sliderRef.current) {
        sliderRef.current.style.transition = 'none';
        sliderRef.current.style.willChange = 'transform';
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || touchStartRef.current === null || !sliderRef.current) return;
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;
    
    const diffX = currentX - touchStartRef.current;
    const diffY = currentY - (sliderRef.current as any)._startY;

    // Axis Locking Logic (First 10px determines fate)
    if (!(sliderRef.current as any)._isAxisLocked) {
        if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
            (sliderRef.current as any)._isAxisLocked = true;
            if (Math.abs(diffX) > Math.abs(diffY)) {
                (sliderRef.current as any)._lockDirection = 'x';
            } else {
                (sliderRef.current as any)._lockDirection = 'y';
            }
        }
    }

    // If locked to Y (vertical scroll), do NOT move the slider horizontally
    if ((sliderRef.current as any)._lockDirection === 'y') {
        return; 
    }

    // UPDATED: Require strict X-axis lock before moving visually to prevent vertical scroll jitter
    if ((sliderRef.current as any)._lockDirection !== 'x') {
        return;
    }

    // If locked to X (horizontal swipe) OR not locked yet, move the slider
    // We prevent default if moving X to stop browser back navigation if possible (though tough on iOS)
    if ((sliderRef.current as any)._lockDirection === 'x' && e.cancelable) {
        // e.preventDefault(); // Careful with this, might block scroll. 
        // We rely on CSS touch-action: pan-y mostly.
    }
    
    const categoryCount = CATEGORIES.length;
    const baseOffsetPct = -(activeIndex * (100 / categoryCount));
    
    // Apply transform directly to DOM
    sliderRef.current.style.transform = `translateX(calc(${baseOffsetPct}% + ${diffX}px))`;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || touchStartRef.current === null) return;
    
    const currentX = e.changedTouches[0].clientX;
    const diff = currentX - touchStartRef.current;
    const threshold = window.innerWidth * 0.2; // 20% width to trigger switch

    // Only switch if we were actually locked to X or moved significantly
    const isYLocked = (sliderRef.current as any)._lockDirection === 'y';

    isDraggingRef.current = false;
    touchStartRef.current = null;
    
    let newTabId = activeTab;

    if (!isYLocked) {
        if (diff > threshold && activeIndex > 0) {
            newTabId = CATEGORIES[activeIndex - 1].id;
        } else if (diff < -threshold && activeIndex < CATEGORIES.length - 1) {
            newTabId = CATEGORIES[activeIndex + 1].id;
        }
    }

    // Restore transition
    if (sliderRef.current) {
        sliderRef.current.style.transition = 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)';
        sliderRef.current.style.willChange = 'auto'; // release memory
        
        // Critical Fix: Explicitly set transform to target position instead of clearing it.
        // Clearing it with '' removes the inline style and resets to 0 (ALL category) because React
        // state hasn't changed if we are staying on the same tab.
        const targetIndex = CATEGORIES.findIndex(c => c.id === newTabId);
        const categoryCount = CATEGORIES.length;
        const offsetPct = -(targetIndex * (100 / categoryCount));
        sliderRef.current.style.transform = `translateX(${offsetPct}%)`;
    }
    
    if (newTabId !== activeTab) {
        handleTabChange(newTabId);
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

  const openDetail = useCallback((item: VocabItem) => {
    window.history.pushState({ itemId: item.id }, "", "");
    setSelectedItem(item);
    setIsDetailClosing(false); 
  }, []);

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
      triggerHaptic();
      
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
    triggerHaptic();
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
              <div key={i} className={`flex ${isB ? 'justify-end' : 'justify-start'} mb-2 items-end gap-2`}>
                  {!isB && ( <Avatar cat={category} side="A" /> )}
                  <div className={`max-w-[75%] flex flex-col ${isB ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3 py-2 shadow-lg relative text-zinc-100 ${bubbleStyle}`}>
                          <div className={`text-sm font-bold leading-snug transition-all duration-300 ${category === 'APEX' ? 'skew-x-[10deg]' : ''} ${category === 'VALORANT' ? 'uppercase tracking-wide' : ''} ${category === 'OW' && isB ? 'text-[#131519]' : ''}`}>
                             {text}
                          </div>
                          {translation && (
                              <div className={`text-[9px] mt-1 pt-1 border-t ${category === 'APEX' ? 'skew-x-[10deg]' : ''} ${
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
           ref={sliderRef}
           className="flex h-full transition-transform"
           style={{
               width: `${CATEGORIES.length * 100}%`,
               // transform is managed by ref during drag, but we set initial state here for SSR/first render
               transform: `translateX(-${activeIndex * (100 / CATEGORIES.length)}%)`,
               transition: 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)'
           }}
        >
          {CATEGORIES.map((cat, index) => {
             // VIRTUALIZATION LOGIC:
             // Only render the list items if the tab is active or immediately adjacent (±1).
             // This prevents iOS from trying to render 500+ heavy DOM elements at once.
             const shouldRenderContent = Math.abs(activeIndex - index) <= 1;

             const items = allCategoriesData[cat.id];
             // Resolve theme for this specific column. 'ALL' has special logic, others rely on ID or default to LIFE
             const catTheme = cat.id === 'ALL' ? THEME_STYLES['ALL'] : (THEME_STYLES[cat.id] || THEME_STYLES['LIFE']);
             const catName = lang === 'cn' ? cat.name : (lang === 'hk' ? (cat.name_hk || cat.name_tw) : cat.name_tw);
             const sceneTags = SCENE_TAGS[cat.id] || [];

             // Active Theme Color for Tags
             const tagActiveClass = cat.id === 'VALORANT' ? 'bg-[#ff4655] text-white' 
                : cat.id === 'APEX' ? 'bg-[#da292a] text-white' 
                : cat.id === 'OW' ? 'bg-[#f99e1a] text-black' 
                : 'bg-fuchsia-500 text-white';

             return (
               <div 
                 key={cat.id} 
                 id={`scroll-container-${cat.id}`}
                 className="h-full w-full overflow-y-auto no-scrollbar px-4 pb-[240px] pt-[calc(env(safe-area-inset-top)+6rem)]"
                 style={{ 
                     width: `${100 / CATEGORIES.length}%`,
                     // CSS Optimization: Tells browser to skip rendering off-screen content work
                     contentVisibility: 'auto',
                     containIntrinsicSize: '1px 5000px',
                     WebkitOverflowScrolling: 'touch' // Enable momentum scrolling on iOS
                 }}
               >
                 {/* Category Title Header - Moves with slide */}
                 <div className="mb-4 mt-4 pl-2">
                     <h2 className="text-[18px] font-semibold text-zinc-50 inline-block relative pb-1">
                         {showFavorites ? uiText.favorite[lang] : catName}
                         <div className={`absolute bottom-0 left-0 right-0 h-[1px] ${catTheme.underlineColor}`}></div>
                     </h2>
                 </div>
                 
                 {/* NEW: Horizontal Scene Filter (Tags) - Only show if not ALL and not Favorites */}
                 {cat.id !== 'ALL' && !showFavorites && (
                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-2 mask-linear-fade">
                         <button
                            onClick={() => setActiveScene('ALL')}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                                activeScene === 'ALL' 
                                ? tagActiveClass + ' border-transparent shadow-lg' 
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                            }`}
                         >
                            {uiText.allScenes[lang]}
                         </button>
                         {sceneTags.map(tag => (
                             <button
                                key={tag.id}
                                onClick={() => setActiveScene(tag.id)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${
                                    activeScene === tag.id 
                                    ? tagActiveClass + ' border-transparent shadow-lg' 
                                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                                }`}
                             >
                                {lang === 'cn' ? tag.label : (lang === 'hk' ? tag.label_hk : tag.label_tw)}
                             </button>
                         ))}
                     </div>
                 )}

                 {/* List - Virtualized */}
                 <div className="space-y-0"> {/* Removed vertical spacing for flat list */}
                   {shouldRenderContent ? (
                        items.length > 0 ? (
                            items.map((item) => (
                                <VocabCard 
                                    key={item.id}
                                    item={item}
                                    catId={cat.id}
                                    theme={catTheme}
                                    isMaskMode={isMaskMode}
                                    favorites={favorites}
                                    toggleFavorite={toggleFavorite}
                                    openDetail={openDetail}
                                    getLocalizedText={getLocalizedText}
                                    GlassListIcon={GlassListIcon}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 opacity-30 text-sm text-neutral-500">
                                <p>{showFavorites ? uiText.noFavs[lang] : uiText.noResults[lang]}</p>
                            </div>
                        )
                   ) : (
                       // Placeholder to keep scroll height vaguely correct or just empty
                       <div className="h-[200px] w-full"></div>
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
                        onClick={() => { triggerHaptic(); setShowFavorites(!showFavorites); }}
                        className={`p-1.5 rounded-full transition-all active:scale-95 ${showFavorites ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Backpack className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
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
                        onClick={() => { triggerHaptic(); handleTabChange(cat.id); }}
                        className={`flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group ${
                            activeTab === cat.id ? 'opacity-100 scale-110' : 'opacity-50 hover:opacity-80 scale-100'
                        }`}
                      >
                        <div className={`p-2 rounded-xl transition-all duration-300 ${
                             activeTab === cat.id ? 'bg-zinc-100 text-black shadow-lg shadow-white/20' : 'bg-transparent text-zinc-400 group-hover:text-zinc-200'
                        }`}>
                             {cat.icon}
                        </div>
                        <span className={`text-[9px] font-bold tracking-wider ${activeTab === cat.id ? 'text-zinc-100' : 'text-zinc-500'}`}>
                            {cat.id === 'ALL' ? 'HOME' : cat.id}
                        </span>
                        {/* Active Indicator Dot */}
                        {activeTab === cat.id && (
                             <div className={`w-1 h-1 rounded-full mt-0.5 ${
                                 activeTab === 'VALORANT' ? 'bg-[#ff4655]' : 
                                 activeTab === 'APEX' ? 'bg-[#da292a]' :
                                 activeTab === 'OW' ? 'bg-[#f99e1a]' : 
                                 'bg-white'
                             }`}></div>
                        )}
                      </button>
                    ))}
                 </div>
             </div>
         </div>
      </div>

      {/* --- DETAIL VIEW OVERLAY --- */}
      {selectedItem && (
        <div 
          className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 animate-fade-in-up duration-200 ${isDetailClosing ? 'opacity-0 translate-y-full' : 'opacity-100 translate-y-0'} transition-all`}
          style={{ transitionDuration: '300ms' }}
        >
          {/* Backdrop Blur */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={handleVisualClose}
          ></div>

          {/* Modal Content */}
          <div 
            className={`w-full max-w-md h-[95vh] sm:h-auto sm:max-h-[85vh] ${detailTheme.detailBgClass} border border-white/10 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col relative overflow-hidden`}
          >
              {/* Top Banner Background */}
              <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

              {/* Close Button */}
              <div className="absolute top-4 right-4 z-20">
                  <button 
                      onClick={handleVisualClose}
                      className="w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-95 transition-all text-zinc-200 shadow-lg"
                  >
                      <X className="w-4 h-4" />
                  </button>
              </div>

              {/* Content Scroll Area - Flex 1 allows it to take remaining space, overflow-auto handles small screens */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar p-6 pt-10 relative z-10 flex flex-col">
                  
                  {/* Header Section */}
                  <div className="text-center mb-4 relative">
                      {/* Small Icon Top Left */}
                      <div className="absolute top-0 left-0">
                           <div className="scale-75 origin-top-left">
                                <GlassListIcon cat={selectedItem.cat} size="sm" />
                           </div>
                      </div>

                      <h2 className={`text-3xl font-black mb-1 tracking-tight ${detailTheme.accentColorClass}`}>
                          {getLocalizedText(selectedItem, 'meaning')}
                      </h2>
                      
                      {/* Compact Term + Audio Row */}
                      <div className="flex items-center justify-center gap-3 text-zinc-400 mb-2">
                          <span className="text-lg font-bold text-white">{selectedItem.term}</span>
                          <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                          <span className="text-base">{selectedItem.kana}</span>
                          
                          {/* Integrated Audio Button */}
                          <button
                            onClick={() => handlePlay(selectedItem.kana || selectedItem.term, selectedItem.id + "_main")}
                            className={`ml-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${detailTheme.buttonClass} border border-white/10`}
                          >
                            {playingId === selectedItem.id + "_main" ? (
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                            ) : (
                                <Volume2 className="w-4 h-4 text-white fill-current" />
                            )}
                          </button>
                      </div>

                      {/* Meta Tags Row */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-2">
                           {/* Stars */}
                           {selectedItem.stars && selectedItem.stars > 0 && (
                                <div className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full flex items-center gap-1">
                                    {Array.from({ length: selectedItem.stars }).map((_, i) => (
                                        <Star key={i} className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                                    ))}
                                </div>
                           )}
                           {/* Scene Tags */}
                           {selectedItem.tags && selectedItem.tags.map(tagId => {
                               const catTags = SCENE_TAGS[selectedItem.cat] || SCENE_TAGS['LIFE'];
                               const tagObj = catTags.find(t => t.id === tagId);
                               const tagLabel = tagObj ? (lang === 'cn' ? tagObj.label : (lang === 'hk' ? tagObj.label_hk : tagObj.label_tw)) : tagId;
                               return (
                                   <span key={tagId} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-zinc-300">
                                       {tagLabel}
                                   </span>
                               );
                           })}
                           {/* Level Badge */}
                           <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-zinc-500">
                               Lv.{selectedItem.level}
                           </span>
                      </div>
                  </div>

                  {/* Description Box - Compact */}
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-4 backdrop-blur-sm shrink-0">
                      <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <Type className="w-3 h-3" />
                          {uiText.description[lang]}
                      </h4>
                      <p className="text-sm leading-relaxed text-zinc-200">
                          {getLocalizedText(selectedItem, 'desc')}
                      </p>
                  </div>

                  {/* Chat Examples - Takes remaining space if needed */}
                  <div className="mb-20 flex-1">
                      <div className="flex items-center justify-between mb-2 px-1">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                              <MessageCircle className="w-3 h-3" />
                              {uiText.example[lang]}
                          </h4>
                          <button 
                             onClick={() => handlePlay(getLocalizedText(selectedItem, 'example'), selectedItem.id + "_ex")}
                             className={`p-1.5 rounded-lg bg-white/5 hover:bg-white/10 active:scale-95 transition-all border border-white/5 ${playingId === selectedItem.id + "_ex" ? 'text-green-400 border-green-500/30' : 'text-zinc-400'}`}
                          >
                             {playingId === selectedItem.id + "_ex" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                          </button>
                      </div>
                      
                      <div className="space-y-1">
                          {renderChatBubbles(getLocalizedText(selectedItem, 'example'))}
                      </div>
                  </div>

              </div>

              {/* Bottom Settings in Detail View */}
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/95 to-transparent pt-12 pb-6 px-6 z-20">
                   <div className="flex items-center justify-between gap-4">
                       <button 
                           onClick={(e) => { triggerHaptic(); toggleFavorite(e, selectedItem.id); }}
                           className="flex-1 h-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-center gap-2 font-bold text-xs active:scale-95 transition-all hover:bg-white/20"
                       >
                           <Backpack className={`w-3.5 h-3.5 ${favorites.includes(selectedItem.id) ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'}`} />
                           <span className={favorites.includes(selectedItem.id) ? 'text-yellow-400' : 'text-zinc-300'}>
                               {favorites.includes(selectedItem.id) ? 'Saved' : 'Save'}
                           </span>
                       </button>

                       {/* Character Toggle */}
                       <div className="flex bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-1 h-10 items-center">
                           <button 
                               onClick={() => { setSelectedCharacter('zundamon'); triggerHaptic(); }}
                               className={`px-3 h-full rounded-lg text-[10px] font-bold transition-all ${selectedCharacter === 'zundamon' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                           >
                               {uiText.zundamon[lang]}
                           </button>
                           <button 
                               onClick={() => { setSelectedCharacter('metan'); triggerHaptic(); }}
                               className={`px-3 h-full rounded-lg text-[10px] font-bold transition-all ${selectedCharacter === 'metan' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
                           >
                               {uiText.metan[lang]}
                           </button>
                       </div>
                   </div>
              </div>
          </div>
        </div>
      )}
      
    </div>
  );
}