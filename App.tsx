import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, Mic, Search, X, Volume2, 
  StopCircle, ChevronLeft, MessageCircle, MoreHorizontal,
  Sword, Shield, Crosshair, Zap, Target, User, Bot, AlertCircle, Gamepad2, Download, Share,
  Trophy, WifiOff, Wifi
} from 'lucide-react';
import { CATEGORIES, VOCAB_DATA, VocabItem } from './constants';

// --- Local Feedback Database ---
const FEEDBACK_DB: Record<string, { perfect: string[], good: string[], ok: string[], bad: string[] }> = {
  VALORANT: {
    perfect: ["ACE! 完璧な発音だ！(ACE! 完美的发音！)", "クラッチ！その調子だ。(关键局拿下！保持这状态。)", "エイム神ってるね！(瞄准太神了！)"],
    good: ["ナイス！悪くない。(Nice！还不错。)", "リコイル制御できてるね。(后座力压得不错。)", "ファントムより安定してる。(比幻象还稳。)"],
    ok: ["惜しい！もう一本。(可惜！再来一局。)", "立ち回りはいい、発音を修正しよう。(身法不错，修正下发音。)", "アルティメット準備中...(大招充能中...)"],
    bad: ["フィードしてるぞ。練習場に行こう。(在送了。去靶场练练吧。)", "トキシックにならず、練習だ。(别压力队友，练枪去。)", "FF投票する？いや、まだ行ける！(投降吗？不，还能打！)"]
  },
  APEX: {
    perfect: ["チャンピオン！最高の発音だ。(捍卫者！最棒的发音。)", "キルリーダー撃破！(击杀王被干掉了！)", "プレデター級の発音！(猎杀者级别的发音！)"],
    good: ["ナイスワン！(Nice one!)", "シールドを割った、その調子！(碎甲了，继续！)", "紫アーマーレベルだね。(紫甲水平。)"],
    ok: ["バッテリーを巻こう。(打个大电吧。)", "アンチが痛い、急ごう。(毒圈很疼，快跑。)", "リスポーンビーコンを探そう。(找个复活台吧。)"],
    bad: ["部隊壊滅... 降下し直そう。(全队阵亡... 重新跳伞吧。)", "初動死は避けよう。(避免落地成盒啊。)", "ドームが遅かったな。(罩子给晚了。)"]
  },
  OW: {
    perfect: ["POTG！素晴らしい。(全场最佳！太棒了。)", "グランドマスター級だ！(宗师段位！)", "チームを救ったな！(你拯救了团队！)"],
    good: ["ペイロードは進んでいる。(车在推了。)", "ナイスヒール！(奶得好！)", "ウルトが刺さったね。(大招放得好。)"],
    ok: ["ヒールが必要ね。(需要治疗。)", "グループアップしよう。(集合集合。)", "C9に気をつけろ。(小心C9。)"],
    bad: ["トロール行為はやめて。(别演了。)", "ピック変更が必要かも。(可能需要换英雄了。)", "リスポーン待ち...(等待复活...)"]
  },
  LIFE: {
    perfect: ["完璧！ネイティブみたい。(完美！像母语者一样。)", "すごい！その通りです。(厉害！就是这样。)", "ブラボー！(太棒了！)"],
    good: ["とても上手です！(很棒！)", "いい感じ！(感觉不错！)", "自信を持って！(保持自信！)"],
    ok: ["もう少し！(差一点点！)", "アクセントに気をつけて。(注意重音。)", "もう一度聞いてみよう。(再听一遍试试。)"],
    bad: ["諦めないで！(别放弃！)", "ゆっくり練習しよう。(慢慢练习。)", "難しいね、でも大丈夫。(很难吧，但没关系。)"]
  }
};

const getRandomFeedback = (category: string, score: number) => {
  const db = FEEDBACK_DB[category] || FEEDBACK_DB['LIFE'];
  let pool = [];
  
  if (score === 100) pool = db.perfect;
  else if (score >= 80) pool = db.good;
  else if (score >= 50) pool = db.ok;
  else pool = db.bad;

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
};

// --- Levenshtein Distance Algorithm ---
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
      }
    }
  }
  return matrix[b.length][a.length];
};

const toHiragana = (str: string) => {
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
};

const calculateScore = (target: string, transcript: string): number => {
  if (!transcript || transcript.length === 0) return 0;
  
  const normalize = (str: string) => {
    let s = str.replace(/[^a-zA-Z0-9ぁ-んァ-ン一-龯]/g, "").toLowerCase();
    return toHiragana(s);
  };

  const cleanTarget = normalize(target);
  const cleanTrans = normalize(transcript);

  if (cleanTarget.length === 0) return 0;
  if (cleanTrans === cleanTarget) return 100;
  if (cleanTrans.includes(cleanTarget)) return 100;

  const distance = levenshteinDistance(cleanTarget, cleanTrans);
  const maxLength = Math.max(cleanTarget.length, cleanTrans.length);
  
  const similarity = (1 - distance / maxLength) * 100;
  return Math.max(0, Math.floor(similarity));
};

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
        <div className={`absolute inset-0 w-full h-full clip-path-polygon-[50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%] ${isA ? 'bg-gradient-to-b from-orange-600 to-red-700' : 'bg-gradient-to-b from-neutral-600 to-neutral-800'}`}></div>
        <div className="relative z-10 text-white font-bold text-xs tracking-tighter">
            {isA ? "ATK" : "DEF"}
        </div>
        <div className="absolute inset-0 border border-white/30 clip-path-polygon-[50%_0,100%_25%,100%_75%,50%_100%,0_75%,0_25%] pointer-events-none"></div>
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

// --- Theme Configurations with Richer Backgrounds ---
const THEME_STYLES: Record<string, { 
    bgClass: string,
    bgOverlay: React.ReactNode,
    cardClass: string,
    cardBgContent: React.ReactNode, // Content inside the card for background feel
    accentColorClass: string,
    buttonClass: string,
    detailBgClass: string
}> = {
  LIFE: {
    bgClass: "bg-[#0a0a0c]", // Dark midnight base
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Soft atmospheric gradient top - PURE COLOR TRANSITION */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-fuchsia-900/40 via-[#1a1025] to-[#0a0a0c]"></div>
        
        {/* Subtle bottom glow */}
        <div className="absolute bottom-0 right-0 w-[80%] h-[300px] bg-[radial-gradient(ellipse_at_bottom_right,rgba(79,70,229,0.1),transparent_70%)]"></div>
        {/* Very subtle grid for unity */}
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
        {/* WALLPAPER LAYER: Reverted to pure abstract/solid style - NO PHOTO PATTERN */}
        <div className="absolute inset-0 bg-[#0f1923]"></div>
        {/* Red Accent Graphic */}
        <div className="absolute top-0 right-0 w-[40%] h-full bg-[#ff4655]/10 skew-x-[-20deg] transform origin-bottom"></div>
        <div className="absolute top-0 right-[20%] w-[5%] h-full bg-[#ff4655]/5 skew-x-[-20deg]"></div>
        
        {/* Tactical Grid */}
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
    buttonClass: "bg-[#ff4655] rounded-none uppercase tracking-wider font-bold clip-path-polygon-[0_0,100%_0,100%_80%,92%_100%,0_100%]",
    detailBgClass: "bg-[#0f1923]"
  },
  APEX: {
    bgClass: "bg-[#1a0b0b]",
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* WALLPAPER LAYER: Canyon/Dusty Red Industrial */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[url('https://images.unsplash.com/photo-1533236897111-3e94666b2752?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        
        {/* Gradient Fade */}
        <div className="absolute top-0 left-0 w-full h-[451px] bg-gradient-to-b from-[#da292a]/10 via-[#1a0b0b]/80 to-[#1a0b0b]"></div>

        {/* Dusty Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#a33838_0%,transparent_70%)] opacity-20"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        {/* Tech Overlay */}
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
    bgClass: "bg-[#131519]", // Neutral dark metallic grey
    bgOverlay: (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* WALLPAPER LAYER: Futuristic White/Orange/Silver Tech */}
        <div className="absolute top-0 left-0 w-full h-[450px] bg-[url('https://images.unsplash.com/photo-1505424297051-c3ad50b71303?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay"></div>
        
        {/* Gradient Fade */}
        <div className="absolute top-0 left-0 w-full h-[451px] bg-gradient-to-b from-[#f99e1a]/10 via-[#131519]/80 to-[#131519]"></div>

        {/* Top Glow simulating the logo ring light (Silver/Orange halo) */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(249,158,26,0.15)_0%,transparent_70%)] blur-[70px]"></div>
        
        {/* Tech pattern overlay - subtle dotted grid */}
        <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(circle_at_center,white_1.5px,transparent_1.5px)] bg-[size:30px_30px]"></div>
      </div>
    ),
    // Cards: Flat, metallic dark grey with silver accents, sharp corners (rounded-sm)
    cardClass: "rounded-sm border-l-4 border-l-[#f99e1a] border-y border-r border-white/10 bg-[#1e2128] hover:bg-[#252932] hover:border-white/25 transition-all italic relative overflow-hidden shadow-md",
    cardBgContent: (
       // Metallic top highlight line
       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
    ),
    accentColorClass: "text-[#f99e1a] font-bold drop-shadow-sm",
    // Button: High contrast, Orange background, Dark text, Heavy font
    buttonClass: "bg-[#f99e1a] hover:bg-[#ffb03b] text-[#131519] rounded-sm italic font-black tracking-widest uppercase shadow-[0_0_20px_rgba(249,158,26,0.25)] transition-all transform hover:-translate-y-0.5 border-none",
    detailBgClass: "bg-[#131519]"
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('LIFE'); 
  const [selectedItem, setSelectedItem] = useState<VocabItem | null>(null); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  
  // Audio state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [coachTip, setCoachTip] = useState<string | null>(null);

  // Animation states
  const [isDetailClosing, setIsDetailClosing] = useState(false);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null); 
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Get current theme config
  const currentTheme = THEME_STYLES[activeTab] || THEME_STYLES['LIFE'];

  useEffect(() => {
    // Online/Offline status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Optimization for China/Offline: 
    // Prioritize 'localService' voices which are built-in and offline capable.
    // This avoids hitting Google servers if a network voice is default.
    const loadVoices = () => {
        const all = window.speechSynthesis.getVoices();
        // Filter for Japanese
        const ja = all.filter(v => v.lang.includes('ja'));
        
        // Sort: Local service first (true comes before false in this sort)
        ja.sort((a, b) => {
             if (a.localService === b.localService) return 0;
             return a.localService ? -1 : 1;
        });

        setVoices(ja);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // PWA Install Prompt Listener (Android)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    setIsStandalone(isStandaloneMode);
    if (isIosDevice && !isStandaloneMode) {
        // Delay slighty to not annoy user immediately
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
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      setDeferredPrompt(null);
    });
  };

  const finishRecording = useCallback((transcript: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!selectedItem) return;
    
    const scoreTerm = calculateScore(selectedItem.term, transcript);
    const scoreKana = calculateScore(selectedItem.kana, transcript);
    const finalScore = Math.max(scoreTerm, scoreKana);
    
    // Get Local Coach Feedback
    const tip = getRandomFeedback(selectedItem.cat, finalScore);
    setCoachTip(tip);
    
    if (finalScore === 100) {
        setFeedback(`完美！"${transcript}"`);
    } else {
        if (finalScore >= 80) {
            setFeedback(`很好！聽到："${transcript}"`);
        } else if (finalScore >= 50) {
            setFeedback(`接近了... 聽到："${transcript}"`);
        } else {
            setFeedback(`没对上。听到："${transcript}"`);
        }
    }

    setScore(finalScore);
    setRecording(false);
  }, [selectedItem]);

  useEffect(() => {
    const Win = window as any;
    const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        finishRecording(transcript);
      };
      
      recognition.onerror = (event: any) => {
         if (recording) {
             setRecording(false);
             setScore(0);
             if (event.error === 'no-speech') {
                 setFeedback("未检测到声音，请重试");
             } else if (event.error === 'not-allowed') {
                 alert("无法访问麦克风。请在系统设置或浏览器设置中允许此应用访问麦克风权限。\niOS用户请在设置-隐私-麦克风中检查。");
                 setFeedback("权限被拒绝");
             } else {
                 setFeedback("识别失败: " + event.error);
             }
         }
      };
      recognitionRef.current = recognition;
    }
  }, [recording, finishRecording]);

  const filteredData = useMemo(() => {
    return VOCAB_DATA.filter(item => {
      const matchesTab = item.cat === activeTab;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = item.term.toLowerCase().includes(searchLower) || 
                            item.kana.includes(searchTerm) || 
                            item.romaji.toLowerCase().includes(searchLower) || 
                            item.meaning.includes(searchTerm);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const stopRecording = () => {
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setRecording(false);
  };

  // Perform the visual logic for closing (without History API manipulation)
  const handleVisualClose = useCallback(() => {
    stopRecording();
    window.speechSynthesis.cancel();
    setIsDetailClosing(true);
    setTimeout(() => {
        setSelectedItem(null);
        setIsDetailClosing(false);
    }, 300);
  }, [selectedItem, recording]);

  // Handle Browser Back / Swipe Back events
  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
        // If an item is selected, closing it is the expected "Back" behavior.
        // We perform the visual closing sequence without calling history.back() again.
        if (selectedItem) {
            handleVisualClose();
        }
    };
    
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [selectedItem, handleVisualClose]);

  const openDetail = (item: VocabItem) => {
    // Push a new entry to history stack. 
    // This ensures that when user swipes back, they return to the previous state (list view)
    // instead of exiting the app.
    window.history.pushState({ itemId: item.id }, "", "");

    setSelectedItem(item);
    setScore(null);
    setFeedback("");
    setCoachTip(null);
    setIsDetailClosing(false); // Reset closing state
    stopRecording();
  };

  const closeDetail = () => {
    // When manually closing via UI, we go back in history.
    // This triggers the 'popstate' event which handles the actual UI closing.
    window.history.back();
  };

  const handlePlay = (text: string, id: string) => {
    // Uses window.speechSynthesis (Phone Built-in Service)
    // Works offline if language pack is installed on device
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
        u.lang = 'ja-JP';
        
        // Voice selection logic prioritized local voices in useEffect
        if (voices.length > 0) {
            if (voices.length >= 2) {
                 u.voice = line.isB ? voices[1] : voices[0];
            } else {
                 u.voice = voices[0];
            }
        }
        
        if (voices.length < 2) {
             u.pitch = line.isB ? 0.8 : 1.1; 
        }

        u.rate = 0.9; 
        u.onend = () => {
            index++;
            playNext();
        };
        u.onerror = (e) => {
            console.error("TTS Error:", e);
            setPlayingId(null);
        };
        window.speechSynthesis.speak(u);
    };
    window.speechSynthesis.cancel();
    playNext();
  };

  const handleRecord = () => {
    if (!selectedItem) return;
    if (recording) {
      stopRecording();
      return;
    }

    const Win = window as any;
    const SpeechRecognition = Win.SpeechRecognition || Win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("您的浏览器不支持语音识别，请使用 Chrome (Android) 或 Safari (iOS)");
        return;
    }

    setRecording(true);
    setFeedback("请大声朗读...");
    setScore(null);
    setCoachTip(null);

    // Timeout logic: if no result in 5s
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
        if (recording) { 
             setFeedback("超时: 未检测到语音");
             setScore(0);
             setRecording(false);
             if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e){}
        }
    }, 5000); 

    try {
      recognitionRef.current.start();
    } catch (e: any) {
      console.error("Mic Error:", e);
      setRecording(false);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          alert("无法访问麦克风。请检查浏览器权限设置。");
          setFeedback("权限被拒绝");
      } else {
          setFeedback("启动失败");
      }
    }
  };

  const renderChatBubbles = (exampleText: string) => {
      // NOTE: For the local version, we display the original text to avoid
      // heavy client-side transliteration libraries.
      const lines = exampleText.split('\n').filter(l => l.trim().length > 0);
      
      return lines.map((line, i) => {
          const isB = line.trim().startsWith('B') || line.trim().startsWith('Ｂ');
          const translationMatch = line.match(/\((.*?)\)/);
          const translation = translationMatch ? translationMatch[1] : "";
          const displayContent = line.replace(/^([ABＡＢ][:：]?\s*)/i, '').replace(/\(.*\)/g, '').trim();
          
          if (!displayContent) return null;

          const bubbleStyle = isB 
            ? activeTab === 'VALORANT' ? 'bg-[#ff4655] rounded-none clip-path-polygon-[0_0,100%_0,100%_100%,10%_100%,0_85%]'
              : activeTab === 'APEX' ? 'bg-[#da292a] skew-x-[-10deg]'
              : activeTab === 'OW' ? 'bg-[#f99e1a] text-[#131519] rounded-sm italic border-l-2 border-white/50'
              : 'bg-gradient-to-br from-fuchsia-600 to-indigo-600 rounded-xl rounded-br-sm'
            : activeTab === 'VALORANT' ? 'bg-[#1c252e] border border-white/10 rounded-none'
              : activeTab === 'APEX' ? 'bg-[#2a2a2a] border border-white/10 skew-x-[-10deg]'
              : activeTab === 'OW' ? 'bg-[#1e2128] border border-white/10 rounded-sm italic'
              : 'bg-[#18181b] border border-white/10 rounded-xl rounded-bl-sm';

          return (
              <div key={i} className={`flex ${isB ? 'justify-end' : 'justify-start'} mb-6 items-end gap-3`}>
                  {!isB && (
                      <Avatar cat={activeTab} side="A" />
                  )}
                  
                  <div className={`max-w-[75%] flex flex-col ${isB ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-3 shadow-lg relative text-white ${bubbleStyle}`}>
                          
                          <div className={`text-base font-bold ${activeTab === 'APEX' ? 'skew-x-[10deg]' : ''} ${activeTab === 'VALORANT' ? 'uppercase tracking-wide' : ''} ${activeTab === 'OW' && isB ? 'text-[#131519]' : ''}`}>
                             {displayContent}
                          </div>

                          {translation && (
                              <div className={`text-[10px] mt-1 pt-1 border-t ${activeTab === 'APEX' ? 'skew-x-[10deg]' : ''} ${
                                  isB ? (activeTab === 'OW' ? 'border-[#131519]/20 text-[#131519]/80' : 'border-white/20 text-white/90') 
                                      : 'border-white/10 text-neutral-400'
                              }`}>
                                  {translation}
                              </div>
                          )}
                      </div>
                  </div>

                  {isB && (
                      <Avatar cat={activeTab} side="B" />
                  )}
              </div>
          );
      });
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-fuchsia-900 selection:text-white flex flex-col relative transition-colors duration-500 text-white ${currentTheme.bgClass}`}>
      
      {/* Background Overlay with Fade Transition */}
      <div key={activeTab} className="absolute inset-0 animate-fade-in duration-1000">
          {currentTheme.bgOverlay}
      </div>

      {/* NEW HEADER with 4-Split Slanted Background */}
      <div className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0a0c] overflow-hidden shadow-2xl">
        
        {/* Slanted 4-Part Wallpaper Background Container */}
        <div className="absolute inset-0 flex transform -skew-x-12 scale-125 -ml-8 pointer-events-none opacity-90 select-none">
            {/* 1. Life: Purple Gradient */}
            <div className="flex-1 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-950 border-r border-white/5"></div>
            
            {/* 2. Valorant: Red/Rose Gradient */}
            <div className="flex-1 bg-gradient-to-br from-[#ff4655] to-[#bd3944] border-r border-white/10 relative"></div>

            {/* 3. Apex: Deep Red/Blood Gradient */}
            <div className="flex-1 bg-gradient-to-br from-[#8e0e0e] to-[#5e1c1c] border-r border-white/10 relative"></div>

            {/* 4. Overwatch: Orange Gradient */}
            <div className="flex-1 bg-gradient-to-br from-[#f99e1a] to-[#b36b0e] relative"></div>
        </div>

        {/* Global Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-[#0a0a0c]/90 pointer-events-none backdrop-blur-[2px]"></div>

        <div className="relative z-10 max-w-md mx-auto px-4 py-3 space-y-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-lg shadow-lg shadow-fuchsia-500/20">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <h1 className="font-bold text-xl tracking-wide text-white drop-shadow-md">
                  JPGamer
                </h1>
                {/* Offline Indicator */}
                {!isOnline && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-neutral-800/80 rounded-full border border-neutral-600 text-[10px] text-neutral-400">
                        <WifiOff className="w-3 h-3" />
                        <span>离线模式</span>
                    </div>
                )}
             </div>
             <div className="flex items-center gap-2">
                 {deferredPrompt && (
                    <button 
                      onClick={handleInstallClick}
                      className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-full text-xs font-bold hover:bg-neutral-200 transition-colors animate-pulse"
                    >
                      <Download className="w-3 h-3" />
                      安装
                    </button>
                 )}
             </div>
          </div>
          
          <div className="relative group">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-white transition-colors`} />
            <input 
              type="text" 
              placeholder={isOnline ? "搜索..." : "离线搜索..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-white/5 border border-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all backdrop-blur-sm ${activeTab === 'VALORANT' ? 'rounded-none' : 'rounded-xl'} ${activeTab === 'APEX' ? 'skew-x-[-10deg]' : ''}`}
            />
             {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
          </div>
        </div>
        
        {/* Category Tabs - Average Spacing via Grid */}
        <div className="relative z-10 max-w-md mx-auto px-2 pb-0 mt-2 mb-2">
          <div className="grid grid-cols-4 gap-2 w-full">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`pb-2 border-b-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                  activeTab === cat.id 
                    ? `${cat.color.split(' ')[0]} font-bold border-current scale-105`
                    : 'border-transparent text-neutral-400 font-medium hover:text-white'
                }`}
              >
                {activeTab === cat.id && <div className="mb-0.5">{cat.icon}</div>}
                <span className={`text-[10px] leading-tight text-center truncate w-full ${cat.id === 'VALORANT' ? 'uppercase' : ''} ${cat.id === 'OW' ? 'italic' : ''}`}>
                  {cat.id === 'LIFE' ? '生活' : cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List with Transition */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-10 relative z-10">
        {/* key={activeTab} triggers re-render animation */}
        <div key={activeTab} className="space-y-3 animate-enter">
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => openDetail(item)}
                className={`group py-4 px-4 flex items-center justify-between cursor-pointer ${currentTheme.cardClass}`}
              >
                {/* Internal Card Background */}
                {currentTheme.cardBgContent}

                <div className={`flex-1 min-w-0 pr-4 relative z-10 ${activeTab === 'APEX' ? 'skew-x-[6deg]' : ''}`}>
                  <h3 className={`font-bold text-base text-white mb-1 truncate ${activeTab === 'VALORANT' ? 'uppercase tracking-wider' : ''} ${activeTab === 'OW' ? 'italic' : ''}`}>{item.meaning}</h3>
                  <p className={`text-sm truncate font-mono flex items-center gap-2 group-hover:text-white transition-colors ${currentTheme.accentColorClass}`}>
                    <span>{item.term}</span>
                    {item.kana !== item.term && <span className="opacity-70 text-neutral-500 border-l border-neutral-600 pl-2 group-hover:text-neutral-300">{item.kana}</span>}
                  </p>
                </div>
                <MoreHorizontal className={`w-5 h-5 text-neutral-500 group-hover:text-white transition-colors relative z-10 ${activeTab === 'APEX' ? 'skew-x-[6deg]' : ''}`} />
              </div>
            ))
          ) : (
             <div className="text-center py-20 opacity-30 text-sm text-neutral-500">
               <p>没有找到相关词汇</p>
             </div>
          )}
        </div>
      </main>
      
      {/* ... (Rest of the component: Detail View, iOS Prompt, Styles) ... */}

      {/* ================= Detail View (Constrained to App Width) ================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-center pointer-events-none">
          <div className={`w-full max-w-md flex flex-col h-full pointer-events-auto shadow-2xl relative overflow-hidden ${currentTheme.detailBgClass} ${isDetailClosing ? 'animate-overlay-exit' : 'animate-overlay-enter'}`}>
            
            {/* Reuse overlay for Detail View Background */}
            {currentTheme.bgOverlay}

            {/* Top Bar */}
            <div className="px-4 py-4 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
                <button onClick={closeDetail} className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className={`text-sm font-bold text-neutral-200/80 ${activeTab === 'VALORANT' ? 'uppercase tracking-widest' : ''}`}>
                    {CATEGORIES.find(c => c.id === selectedItem.cat)?.name}
                </span>
                <div className="w-8"></div> {/* Spacer */}
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10">
                <div className="px-6 pt-8 pb-6 text-center border-b border-white/5 relative">
                    <h1 className={`text-3xl font-black text-white mb-2 leading-tight drop-shadow-lg ${activeTab === 'OW' ? 'italic' : ''} ${activeTab === 'APEX' ? 'uppercase' : ''}`}>
                        {selectedItem.meaning}
                    </h1>
                    
                    {/* Interactive Word Component */}
                    <button 
                        onClick={() => handlePlay(selectedItem.term, 'term')}
                        className={`group/term relative inline-flex items-center justify-center gap-2 px-4 py-2 mt-1 mx-auto rounded-lg transition-all active:scale-95 hover:bg-white/5 cursor-pointer`}
                    >
                        <p className={`text-2xl font-bold font-mono tracking-wide drop-shadow-md ${currentTheme.accentColorClass}`}>
                            {selectedItem.term}
                        </p>
                        <div className={`text-neutral-500 group-hover/term:text-white transition-colors ${playingId === 'term' ? 'text-white' : ''}`}>
                             {playingId === 'term' ? <Volume2 className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                        </div>
                    </button>

                    <p className="text-sm text-neutral-400 font-mono mt-1">
                        {selectedItem.kana} · {selectedItem.romaji}
                    </p>
                    <div className={`mt-6 bg-black/40 p-4 border border-white/10 inline-block text-sm text-neutral-200 backdrop-blur-md shadow-xl ${activeTab === 'VALORANT' ? 'rounded-none border-l-4 border-l-rose-600' : activeTab === 'APEX' ? 'skew-x-[-6deg] border-r-4 border-r-red-600' : 'rounded-xl'}`}>
                        <span className={activeTab === 'APEX' ? 'skew-x-[6deg] block' : ''}>💡 {selectedItem.desc}</span>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="px-4 py-6">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" /> 
                            {selectedItem.cat === 'LIFE' ? '生活场景' : '游戏语音'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => handlePlay(selectedItem.example, 'ex')}
                                className={`flex items-center gap-2 px-3 py-1.5 text-white transition-all active:scale-95 shadow-lg hover:brightness-110 ${currentTheme.buttonClass}`}
                            >
                                {playingId === 'ex' ? <Volume2 className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
                                <span className={`text-[10px] font-bold not-italic ${activeTab === 'APEX' ? 'skew-x-[10deg] inline-block' : ''}`}>播放</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pb-4">
                        {renderChatBubbles(selectedItem.example)}
                    </div>
                </div>
            </div>

            {/* Bottom Action Area */}
            <div className="p-6 bg-black/60 backdrop-blur-xl border-t border-white/10 pb-8 relative z-20">
                {score !== null && !recording && (
                    <div className="mb-6 text-center animate-in fade-in slide-in-from-bottom-4">
                        {score > 0 ? (
                            <>
                                <span className={`text-6xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${score >= 80 ? 'text-green-400' : 'text-neutral-100'} ${activeTab === 'VALORANT' ? 'font-mono' : ''}`}>
                                    {score}
                                </span>
                                <p className="text-white font-bold text-sm mt-1 mb-1">{feedback}</p>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-red-400 animate-in fade-in zoom-in duration-300">
                                <AlertCircle className="w-8 h-8" />
                                <span className="font-bold text-lg">{feedback || "识别失败"}</span>
                            </div>
                        )}
                        
                        {score > 0 && coachTip && (
                            <div className="mt-3 min-h-[40px] flex justify-center">
                                <div className={`bg-neutral-800/90 border border-white/10 p-3 text-xs text-neutral-300 max-w-[90%] mx-auto shadow-lg animate-in zoom-in ${activeTab === 'VALORANT' ? 'rounded-none border-l-rose-500 border-l-2' : 'rounded-lg'}`}>
                                    <span className="font-bold mr-1 text-white flex items-center justify-center gap-1 mb-1">
                                        <Trophy className="w-3 h-3 text-yellow-500" /> 
                                        COACH:
                                    </span>
                                    {coachTip}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <button 
                    onClick={handleRecord}
                    className={`w-full py-4 flex items-center justify-center gap-2 font-bold text-lg transition-all active:scale-95 shadow-2xl text-white hover:brightness-110 ${
                        recording 
                        ? 'bg-neutral-800 text-red-500 border border-red-500/30'
                        : currentTheme.buttonClass
                    } ${activeTab === 'VALORANT' ? 'rounded-none' : ''}`}
                >
                    {recording ? (
                        <>
                            <StopCircle className="w-6 h-6 animate-pulse" />
                            <span className={`not-italic ${activeTab === 'APEX' ? 'skew-x-[10deg]' : ''}`}>正在聆听...</span>
                        </>
                    ) : (
                        <>
                            <Mic className="w-6 h-6" />
                            <span className={`not-italic ${activeTab === 'APEX' ? 'skew-x-[10deg]' : ''}`}>跟读挑战</span>
                        </>
                    )}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Install Prompt (Custom Implementation) */}
      {isIOS && !isStandalone && (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900/95 border-t border-white/10 p-4 z-50 backdrop-blur-md animate-slide-up shadow-2xl safe-pb">
           <div className="max-w-md mx-auto flex items-start gap-4">
              <div className="p-2 bg-neutral-800 rounded-lg">
                 <Share className="w-6 h-6 text-blue-400" /> 
              </div>
              <div className="flex-1">
                 <h4 className="font-bold text-sm text-white mb-1">安装到 iPhone</h4>
                 <p className="text-xs text-neutral-400 leading-relaxed">
                    点击浏览器底部工具栏的 <span className="font-bold text-blue-400">分享</span> 按钮，然后向下滑动选择 <span className="font-bold text-white">"添加到主屏幕"</span> 即可獲得原生APP体验。
                 </p>
              </div>
              <button onClick={() => setIsIOS(false)} className="p-1 text-neutral-500 hover:text-white transition-colors">
                 <X className="w-5 h-5" />
              </button>
           </div>
        </div>
      )}
      
      {/* Global Animation Styles */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.98) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
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
        .safe-pb {
          padding-bottom: env(safe-area-inset-bottom, 20px);
        }
      `}</style>
    </div>
  );
}