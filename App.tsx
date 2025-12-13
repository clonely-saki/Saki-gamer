import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Play, Mic, Search, X, Volume2, 
  StopCircle, ChevronLeft, MessageCircle, MoreHorizontal,
  Sword, Shield, Crosshair, Zap, Target, User, Bot, AlertCircle, Gamepad2, Download, Share,
  Trophy, WifiOff, Activity, Star, Layers, Globe, ImageIcon, Sparkles,
  Battery, Syringe, Box, Skull, Flame, Hexagon, Heart, Eye, Hand, Footprints, Clock, Coins, Speaker, Settings
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
    buttonClass: "bg-[#ff4655] rounded-none uppercase tracking-wider font-bold clip-path-polygon-[0_0,100%_0,100%_80%,92%_100%,0_100%]",
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

// Get Category Background Image
const getCategoryBg = (cat: string) => {
    switch(cat) {
        case 'VALORANT': return '/images/category-valorant.svg';
        case 'APEX': return '/images/category-apex.svg';
        case 'OW': return '/images/category-ow.svg';
        case 'LIFE': return '/images/category-life.svg';
        default: return '/images/category-life.svg';
    }
};

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
  const [lang, setLang] = useState<'cn' | 'tw'>('cn'); 
  
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

  const toggleLang = () => {
    setLang(prev => prev === 'cn' ? 'tw' : 'cn');
  };

  const getLocalizedText = useCallback((item: VocabItem, field: 'meaning' | 'desc' | 'example') => {
      if (lang === 'cn') return item[field];
      if (field === 'meaning') return item.meaning_tw || item.meaning;
      if (field === 'desc') return item.desc_tw || item.desc;
      if (field === 'example') return item.example_tw || item.example;
      return item[field];
  }, [lang]);

  const uiText = {
      searchPlaceholder: {
          cn: showFavorites ? "搜索收藏..." : "搜索...",
          tw: showFavorites ? "搜尋收藏..." : "搜尋...",
      },
      offlineMode: { cn: "离线模式", tw: "離線模式" },
      voiceOffline: { cn: "语音离线包", tw: "語音離線包" },
      favorite: { cn: "收藏", tw: "收藏" },
      install: { cn: "安装", tw: "安裝" },
      lifeCat: { cn: "生活", tw: "生活" },
      noResults: { cn: "没有找到相关词汇", tw: "沒有找到相關詞彙" },
      noFavs: { cn: "本分类下暂无收藏", tw: "本分類下暫無收藏" },
      lifeScene: { cn: "生活场景", tw: "生活場景" },
      gameVoice: { cn: "游戏语音", tw: "遊戲語音" },
      play: { cn: "播放", tw: "播放" },
      listen: { cn: "正在聆听...", tw: "正在聆聽..." },
      challenge: { cn: "跟读挑战", tw: "跟讀挑戰" },
      detecting: { cn: "检测声音中...", tw: "檢測聲音中..." },
      iosTitle: { cn: "安装到 iPhone", tw: "安裝到 iPhone" },
      iosDesc: { 
          cn: (<span>点击浏览器底部工具栏的 <span className="font-bold text-blue-400">分享</span> 按钮，然后向下滑动选择 <span className="font-bold text-white">"添加到主屏幕"</span> 即可獲得原生APP体验。</span>), 
          tw: (<span>點擊瀏覽器底部工具欄的 <span className="font-bold text-blue-400">分享</span> 按鈕，然後向下滑動選擇 <span className="font-bold text-white">"加入主畫面"</span> 即可獲得原生APP體驗。</span>) 
      }
  };

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [coachTip, setCoachTip] = useState<string | null>(null);
  
  const [audioLevel, setAudioLevel] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false); 
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isDetailClosing, setIsDetailClosing] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<number | null>(null); 
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

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
        const ja = all.filter(v => v.lang.includes('ja'));
        ja.sort((a, b) => {
             if (a.localService === b.localService) return 0;
             return a.localService ? -1 : 1;
        });
        setVoices(ja);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

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
      cancelAudioVisualization();
    };
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      setDeferredPrompt(null);
    });
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
            const nextIndex = (currentIndex + 1) % CATEGORIES.length;
            setActiveTab(CATEGORIES[nextIndex].id);
        } else {
            const prevIndex = (currentIndex - 1 + CATEGORIES.length) % CATEGORIES.length;
            setActiveTab(CATEGORIES[prevIndex].id);
        }
    }
  };

  const startAudioVisualization = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const update = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        setAudioLevel(avg); 
        
        if (fallbackMode && recording && avg > 50) {
             if (!timeoutRef.current) {
                 timeoutRef.current = window.setTimeout(() => {
                     finishRecording(selectedItem?.term || "...");
                 }, 800);
             }
        }
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
    } catch (err) {
      console.error("Visualizer Error:", err);
    }
  };

  const cancelAudioVisualization = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }
    setAudioLevel(0);
  };

  const finishRecording = useCallback((transcript: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!selectedItem) return;
    
    let finalScore = 0;
    let feedbackText = "";
    
    if (fallbackMode) {
        finalScore = Math.random() > 0.5 ? 100 : 85; 
        feedbackText = lang === 'cn' ? "声音已检测 (离线模式)" : "聲音已檢測 (離線模式)";
    } else {
        const scoreTerm = calculateScore(selectedItem.term, transcript);
        const scoreKana = calculateScore(selectedItem.kana, transcript);
        finalScore = Math.max(scoreTerm, scoreKana);
        
        if (lang === 'cn') {
            if (finalScore === 100) feedbackText = `完美！"${transcript}"`;
            else if (finalScore >= 80) feedbackText = `很好！聽到："${transcript}"`;
            else if (finalScore >= 50) feedbackText = `接近了... 聽到："${transcript}"`;
            else feedbackText = `没对上。听到："${transcript}"`;
        } else {
             if (finalScore === 100) feedbackText = `完美！"${transcript}"`;
            else if (finalScore >= 80) feedbackText = `很好！聽到："${transcript}"`;
            else if (finalScore >= 50) feedbackText = `差少少... 聽到："${transcript}"`;
            else feedbackText = `唔係好岩。聽到："${transcript}"`;
        }
    }
    
    const tip = getRandomFeedback(selectedItem.cat, finalScore);
    setCoachTip(tip);
    setFeedback(feedbackText);
    setScore(finalScore);
    setRecording(false);
    
    cancelAudioVisualization();
  }, [selectedItem, fallbackMode, lang]);

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
             console.log("Speech Error:", event.error);
             if (event.error === 'network') {
                 setFeedback(lang === 'cn' ? "网络不通，切换至离线音量模式..." : "網絡不通，切換至離線音量模式...");
                 setFallbackMode(true);
                 return;
             }
             setRecording(false);
             setScore(0);
             cancelAudioVisualization();

             if (event.error === 'no-speech') {
                 setFeedback(lang === 'cn' ? "未检测到声音" : "未檢測到聲音");
             } else if (event.error === 'not-allowed') {
                 setFeedback(lang === 'cn' ? "麦克风权限被拒绝" : "麥克風權限被拒絕");
             } else {
                 setFeedback(lang === 'cn' ? ("识别错误: " + event.error) : ("識別錯誤: " + event.error));
             }
         }
      };
      recognitionRef.current = recognition;
    }
  }, [recording, finishRecording, lang]);

  const stopRecording = () => {
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {}
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    cancelAudioVisualization();
    setRecording(false);
  };

  const handleVisualClose = useCallback(() => {
    stopRecording();
    window.speechSynthesis.cancel();
    setIsDetailClosing(true);
    setTimeout(() => {
        setSelectedItem(null);
        setIsDetailClosing(false);
    }, 300);
  }, [selectedItem, recording]);

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
    setScore(null);
    setFeedback("");
    setCoachTip(null);
    setIsDetailClosing(false); 
    stopRecording();
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
        u.lang = 'ja-JP';
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
        alert(lang === 'cn' ? "您的浏览器不支持语音识别" : "您的瀏覽器不支持語音識別");
        return;
    }
    setRecording(true);
    setScore(null);
    setCoachTip(null);
    startAudioVisualization();
    if (fallbackMode) {
        setFeedback(lang === 'cn' ? "请大声朗读... (离线模式)" : "請大聲朗讀... (離線模式)");
        return;
    }
    setFeedback(lang === 'cn' ? "请大声朗读..." : "請大聲朗讀...");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
        if (recording && !fallbackMode) { 
             setFeedback(lang === 'cn' ? "超时: 未检测到语音" : "超時: 未檢測到語音");
             setScore(0);
             setRecording(false);
             if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e){}
             cancelAudioVisualization();
        }
    }, 6000); 
    try {
      recognitionRef.current.start();
    } catch (e: any) {
      console.error("Mic Start Error:", e);
      if (e.name !== 'InvalidStateError') {
          setRecording(false);
          setFeedback(lang === 'cn' ? "启动失败" : "啟動失敗");
          cancelAudioVisualization();
      }
    }
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
            ? category === 'VALORANT' ? 'bg-[#ff4655] rounded-none clip-path-polygon-[0_0,100%_0,100%_100%,10%_100%,0_85%]'
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
        className={`min-h-screen font-sans selection:bg-fuchsia-900 selection:text-white flex flex-col relative transition-colors duration-500 text-white ${currentTheme.bgClass}`}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
    >
      <div key={activeTab} className="absolute inset-0 animate-fade-in duration-1000">
          {currentTheme.bgOverlay}
      </div>

      <div className="fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-[#0a0a0c]/85 backdrop-blur-xl overflow-hidden shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 flex transform -skew-x-12 scale-125 -ml-8 pointer-events-none opacity-90 select-none">
            <div className="flex-1 bg-gradient-to-br from-fuchsia-900 via-purple-900 to-indigo-950 border-r border-white/5"></div>
            <div className="flex-1 bg-gradient-to-br from-[#ff4655] to-[#bd3944] border-r border-white/10 relative"></div>
            <div className="flex-1 bg-gradient-to-br from-[#8e0e0e] to-[#5e1c1c] border-r border-white/10 relative"></div>
            <div className="flex-1 bg-gradient-to-br from-[#f99e1a] to-[#b36b0e] relative"></div>
        </div>
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
                {!isOnline ? (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-neutral-800/80 rounded-full border border-neutral-600 text-[10px] text-neutral-400">
                        <WifiOff className="w-3 h-3" />
                        <span>{uiText.offlineMode[lang]}</span>
                    </div>
                ) : fallbackMode && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-900/40 rounded-full border border-amber-600/50 text-[10px] text-amber-200">
                        <Activity className="w-3 h-3" />
                        <span>{uiText.voiceOffline[lang]}</span>
                    </div>
                )}
             </div>
             <div className="flex items-center gap-2">
                 <button
                    onClick={toggleLang}
                    className="flex flex-col items-center justify-center p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                 >
                    <Globe className="w-5 h-5" />
                    <span className="text-[10px] font-bold mt-0.5 leading-none">{lang === 'cn' ? '简' : '繁'}</span>
                 </button>

                 <button 
                   onClick={() => setShowFavorites(!showFavorites)}
                   className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${showFavorites ? 'bg-yellow-500/20 text-yellow-400' : 'text-neutral-400 hover:text-white hover:bg-white/10'}`}
                 >
                   <Star className={`w-5 h-5 ${showFavorites ? 'fill-current' : ''}`} />
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
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-white transition-colors`} />
            <input 
              type="text" 
              placeholder={uiText.searchPlaceholder[lang]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-white/5 border border-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all backdrop-blur-sm ${activeTab === 'VALORANT' ? 'rounded-none' : 'rounded-xl'} ${activeTab === 'APEX' ? 'skew-x-[-10deg]' : ''}`}
            />
             {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-white">
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
                onClick={() => setActiveTab(cat.id)}
                className={`pb-2 border-b-2 transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                  activeTab === cat.id 
                    ? `${cat.color.split(' ')[0]} font-bold border-current scale-105`
                    : 'border-transparent text-neutral-400 font-medium hover:text-white'
                }`}
              >
                {activeTab === cat.id && <div className="mb-0.5">{cat.icon}</div>}
                <span className={`text-[10px] leading-tight text-center truncate w-full ${cat.id === 'VALORANT' ? 'uppercase' : ''} ${cat.id === 'OW' ? 'italic' : ''}`}>
                  {cat.id === 'LIFE' ? uiText.lifeCat[lang] : (lang === 'cn' ? cat.name : cat.name_tw)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-40 pb-10 relative z-10">
        <div key={activeTab + (showFavorites ? '-fav' : '') + lang} className="space-y-3 animate-enter">
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
                  <h3 className={`font-bold text-base text-white mb-1 truncate ${item.cat === 'VALORANT' ? 'uppercase tracking-wider' : ''} ${item.cat === 'OW' ? 'italic' : ''}`}>{displayMeaning}</h3>
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
          <div className={`w-full max-w-md flex flex-col h-full pointer-events-auto shadow-2xl relative overflow-hidden ${detailTheme.detailBgClass} ${isDetailClosing ? 'animate-overlay-exit' : 'animate-overlay-enter'}`}>
            {detailTheme.bgOverlay}
            
            <div className="px-4 py-4 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
                <button onClick={closeDetail} className="p-2 -ml-2 text-neutral-400 hover:text-white transition-colors rounded-full hover:bg-white/10">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <span className={`text-sm font-bold text-neutral-200/80 ${selectedItem.cat === 'VALORANT' ? 'uppercase tracking-widest' : ''}`}>
                    {lang === 'cn' 
                        ? CATEGORIES.find(c => c.id === selectedItem.cat)?.name 
                        : CATEGORIES.find(c => c.id === selectedItem.cat)?.name_tw}
                </span>
                
                <button 
                    onClick={(e) => toggleFavorite(e, selectedItem.id)}
                    className={`p-2 -mr-2 rounded-full transition-colors ${favorites.includes(selectedItem.id) ? 'text-yellow-400' : 'text-neutral-400'}`}
                >
                    <Star className={`w-6 h-6 ${favorites.includes(selectedItem.id) ? 'fill-current' : ''}`} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 overscroll-contain">
                <div className="px-6 pt-8 pb-6 text-center border-b border-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-[300px] z-0 overflow-hidden pointer-events-none">
                        <div className="w-full h-full bg-neutral-900 relative">
                            <img src={getCategoryBg(selectedItem.cat)} alt="bg" className="w-full h-full object-cover opacity-60" />
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
                    <p className="text-sm text-neutral-400 font-mono mt-1 relative z-10">
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
                                className={`flex items-center gap-2 px-3 py-1.5 text-white transition-all active:scale-95 shadow-lg hover:brightness-110 ${detailTheme.buttonClass}`}
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

            <div className="p-6 bg-black/60 backdrop-blur-xl border-t border-white/10 pb-8 relative z-20">
                {recording && (
                   <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden">
                       <div className="h-full bg-green-500 transition-all duration-75 ease-out" style={{ width: `${(audioLevel / 255) * 100}%` }}></div>
                   </div>
                )}
                
                {score !== null && !recording && (
                    <div className="mb-6 text-center animate-in fade-in slide-in-from-bottom-4">
                        {score > 0 ? (
                            <>
                                <span className={`text-6xl font-black tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] ${score >= 80 ? 'text-green-400' : 'text-neutral-100'} ${selectedItem.cat === 'VALORANT' ? 'font-mono' : ''}`}>
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
                                <div className={`bg-neutral-800/90 border border-white/10 p-3 text-xs text-neutral-300 max-w-[90%] mx-auto shadow-lg animate-in zoom-in ${selectedItem.cat === 'VALORANT' ? 'rounded-none border-l-rose-500 border-l-2' : 'rounded-lg'}`}>
                                    <span className="font-bold mr-1 text-white flex items-center justify-center gap-1 mb-1">
                                        <Trophy className="w-3 h-3 text-yellow-500" /> COACH:
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
                        : detailTheme.buttonClass
                    } ${selectedItem.cat === 'VALORANT' ? 'rounded-none' : ''}`}
                >
                    {recording ? (
                        <>
                            <StopCircle className="w-6 h-6 animate-pulse" />
                            <span className={`not-italic ${selectedItem.cat === 'APEX' ? 'skew-x-[10deg]' : ''}`}>
                                {fallbackMode ? uiText.detecting[lang] : uiText.listen[lang]}
                            </span>
                        </>
                    ) : (
                        <>
                            <Mic className="w-6 h-6" />
                            <span className={`not-italic ${selectedItem.cat === 'APEX' ? 'skew-x-[10deg]' : ''}`}>{uiText.challenge[lang]}</span>
                        </>
                    )}
                </button>
            </div>
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