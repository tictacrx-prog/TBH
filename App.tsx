<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import { Shield, Sword, Zap, Clock, Calendar, Copy, CheckCircle2, ChevronRight, Play, Sparkles, Layout, Instagram, Flame, Timer, ZapOff, Music, Camera, Share2, Target, Rocket, Trophy, MessageSquare, ExternalLink, Info } from 'lucide-react';

const EVENT_DATE = new Date('2026-01-24T09:00:00');

const SCHEDULE = [
  { time: '9:00 AM', shop: 'Opening Show', persona: 'The Multiverse Gateway', team: 'DC', color: 'blue' },
  { time: '9:30 AM', shop: 'YAYASPLANTSHOP', persona: 'Captain Flora', team: 'Marvel', color: 'red' },
  { time: '10:00 AM', shop: 'GATHERING MOSS', persona: 'The Green Lantern', team: 'DC', color: 'blue' },
  { time: '10:30 AM', shop: 'PLANTSRLIFE', persona: 'Iron Bloom', team: 'Marvel', color: 'red' },
  { time: '11:00 AM', shop: 'PLANT STATE OF MIND', persona: 'Professor X-Leaf', team: 'Marvel', color: 'red' },
  { time: '11:30 AM', shop: 'SANDHILL PLANTS', persona: 'The Sandman', team: 'DC', color: 'blue' },
  { time: '12:00 PM', shop: 'KALIS GREENHOUSE', persona: 'Black Widow Ivy', team: 'Marvel', color: 'red' },
  { time: '12:30 PM', shop: 'PLANTS BY MAD MADINA', persona: 'Scarlet Witch', team: 'Marvel', color: 'red' },
  { time: '1:00 PM', shop: 'BUNCHAHOYAS', persona: 'The Hoya League', team: 'DC', color: 'blue' },
  { time: '1:30 PM', shop: 'HELLO BEAUTIFUL THINGS', persona: 'Wonder Woman Wellness', team: 'DC', color: 'blue' },
  { time: '2:00 PM', shop: 'CASITA MIA', persona: 'Fortress of Solitude', team: 'DC', color: 'blue' },
  { time: '2:30 PM', shop: 'LASUCCULENTS', persona: 'The Flash (Fast Shipping!)', team: 'DC', color: 'blue' },
  { time: '3:00 PM', shop: 'HOYA VAULT ALMA', persona: 'The Vault Dweller', team: 'Marvel', color: 'red' },
  { time: '3:30 PM', shop: 'THE PLANT QUEEN', persona: 'Storm', team: 'Marvel', color: 'red' },
  { time: '4:00 PM', shop: 'NORTH AUSTIN PLANT CO', persona: 'The Dark Knight of Hoya', team: 'DC', color: 'blue' },
  { time: '4:30 PM', shop: 'KNOTTY BLOOMS', persona: 'Spider-Man Web-Netting', team: 'Marvel', color: 'red' },
  { time: '5:00 PM', shop: 'GARDINO\'S NURSERY', persona: 'Aquaman (Ocean of Hoyas)', team: 'DC', color: 'blue' },
  { time: '5:30 PM', shop: 'THE BLOOMING HOYA', persona: 'Super-Flora (YOUR SHOW)', team: 'Marvel', color: 'red', highlight: true },
  { time: '6:00 PM', shop: 'PLANT PARENT ANONYMOUS', persona: 'The Avengers Assemble', team: 'Marvel', color: 'red' },
  { time: '6:30 PM', shop: 'PLANTAE JUNGLE', persona: 'Poison Ivy\'s Revenge', team: 'DC', color: 'blue' },
  { time: '7:00 PM', shop: 'CACTUS AND EXOTICS', persona: 'Guardians of the Greenhouse', team: 'Marvel', color: 'red' },
  { time: '7:30 PM', shop: 'VICKIES HOYA HOUSE', persona: 'The Batcave of Vines', team: 'DC', color: 'blue' },
  { time: '8:00 PM', shop: 'JAX\'S JUNGLE', persona: 'Thanos (Snap for Snap-ups)', team: 'Marvel', color: 'red' },
  { time: '8:30 PM', shop: 'WRAP UP PARTY', persona: 'The Endgame', team: 'Marvel', color: 'red' },
];

const REEL_SCENES = [
  {
    scene: "The Hook",
    visual: "Macro shot of a Hoya bloom with a comic-style 'BOOM!' sticker. Background split: Red vs Blue neon.",
    audio: "Stop scrolling! The biggest Hoya collision in Multiverse history is happening on Palmstreet! 🌿🛡️"
  },
  {
    scene: "The Stakes",
    visual: "Fast-paced scrolling of the shop list. Freeze-frame on 'The Blooming Hoya' at 5:30 PM EST.",
    audio: "Team Marvel vs Team DC. 24 hours of rare hoyas. I'm taking the field at 5:30 PM!"
  },
  {
    scene: "The Call",
    visual: "Point to your link in bio / Palmstreet notification button. Comic dust cloud effect.",
    audio: "Join the Raid Train. Don't let your favorite varietals get snapped! See you there!"
  }
];

const GEMINI_PROMPTS = [
  {
    title: "Cinematic Video B-Roll",
    prompt: "Hyper-realistic 4K video of a rare Hoya plant with leaves that glow with blue and red electrical energy. The background is a mix of a futuristic laboratory and a dark gothic cathedral. Rain drops hitting the leaves. Dramatic cinematic lighting, movie trailer quality."
  },
  {
    title: "IG Caption Generator",
    prompt: "Write 3 punchy, high-energy Instagram captions for a 'Marvel vs DC' themed plant sale event on Palmstreet. Use plant puns and comic book references like 'Incredible Hoya-lk' or 'Spider-Vines'. Include a call to action to follow 'The Blooming Hoya' at 5:30 PM EST. Use hashtags #HoyaRaid #PalmstreetPlants #HoyaMultiverse."
  },
  {
    title: "Comic Splash Art",
    prompt: "Comic book style splash page illustration. A giant Hoya Kerrii heart shaped leaf as a shield for a superhero. Halftone dots, vibrant ink colors, 'BAM' and 'POW' text bubbles in the background. High contrast, 9:16 aspect ratio, 80s comic aesthetic."
  }
];

export default function App() {
  const [copied, setCopied] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [filter, setFilter] = useState<'ALL' | 'Marvel' | 'DC'>('ALL');
  const mySlotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = EVENT_DATE.getTime() - now;
      setTimeLeft({
        days: Math.max(0, Math.floor(distance / (1000 * 60 * 60 * 24))),
        hours: Math.max(0, Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))),
        minutes: Math.max(0, Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))),
        seconds: Math.max(0, Math.floor((distance % (1000 * 60)) / 1000)),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scrollToMySlot = () => {
    mySlotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const filteredSchedule = filter === 'ALL' ? SCHEDULE : SCHEDULE.filter(s => s.team === filter);

  return (
    <div className="min-h-screen bg-[#05070a] text-gray-100 font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Hype Marquee */}
      <div className="bg-yellow-500 text-black font-black uppercase italic py-3 overflow-hidden whitespace-nowrap border-b-[6px] border-black sticky top-0 z-[100] shadow-xl">
        <div className="animate-marquee inline-block">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-12 text-lg tracking-widest">
               JAN 24 RAID TRAIN ⚔️ THE BLOOMING HOYA @ 5:30 PM ⚔️ MARVEL VS DC ⚔️ 24 HOURS OF HOYAS ⚔️ 
            </span>
          ))}
        </div>
      </div>

      {/* Hero Section */}
      <header className="relative py-24 px-6 overflow-hidden border-b-[12px] border-black bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-5">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(47,129,247,0.15),transparent_75%)]" />
          <div className="absolute inset-0 halftone opacity-30" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#05070a] to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <div className="flex flex-col items-center mb-8">
            <button 
              onClick={scrollToMySlot}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-black uppercase italic tracking-[0.2em] rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-200"
            >
              <Target className="group-hover:rotate-45 transition-transform" size={22} />
              Target: My Slot (5:30 PM)
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8 mb-20">
            {Object.entries(timeLeft).map(([label, value]) => (
              <div key={label} className="group flex flex-col items-center bg-black border-4 border-white/10 p-5 rounded-3xl shadow-[12px_12px_0px_0px_rgba(47,129,247,0.4)] transform hover:-rotate-1 transition-transform cursor-default">
                <div className="text-6xl md:text-8xl font-black font-mono text-white group-hover:text-yellow-400 transition-colors drop-shadow-[4px_4px_0px_#2f81f7]">
                  {String(value).padStart(2, '0')}
                </div>
                <span className="text-sm font-black uppercase tracking-[0.4em] mt-3 text-gray-500 group-hover:text-white transition-colors">{label}</span>
              </div>
            ))}
          </div>

          <div className="relative inline-block mb-8">
            <div className="absolute -top-16 -left-16 transform -rotate-12 animate-comic-float">
              <div className="bg-yellow-500 text-black px-6 py-4 font-black text-4xl border-4 border-black shadow-[6px_6px_0px_0px_#000] uppercase italic skew-x-[-10deg]">
                BOOM!
              </div>
            </div>
            
            <div className="relative">
              <h1 className="text-8xl md:text-[11rem] font-black italic tracking-tighter leading-[0.85] text-stroke-sm">
                <span className="text-blue-500 block md:inline-block md:-mr-4 drop-shadow-[8px_8px_0px_#000] z-20 relative">DC</span>
                <span className="block md:inline-block text-white text-5xl md:text-7xl align-middle z-30 relative mx-4 -my-4 md:my-0">VS</span>
                <span className="text-red-600 block md:inline-block drop-shadow-[8px_8px_0px_#000] z-10 relative">MARVEL</span>
              </h1>
            </div>

            <div className="absolute -bottom-8 -right-16 transform rotate-6">
              <div className="bg-white text-black px-5 py-3 font-black text-2xl border-4 border-black shadow-[6px_6px_0px_0px_#000] uppercase italic skew-x-[10deg]">
                HOYA RAID
              </div>
            </div>
          </div>

          <p className="text-2xl md:text-3xl font-black text-gray-400 italic uppercase tracking-[0.25em] mt-16 max-w-3xl mx-auto leading-tight">
            Welcome to the <span className="text-white">Multiverse</span>. 24 Shops. 24 Hours. Zero Regrets.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 relative z-10">
        
        {/* Left Column: Timeline */}
        <div className="lg:col-span-7 space-y-12">
          <section className="bg-[#0d1117] rounded-[40px] border-[8px] border-black overflow-hidden shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <div className="p-10 border-b-[8px] border-black bg-[#161b22] flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="bg-yellow-500 p-3 rounded-2xl border-4 border-black shadow-lg rotate-3">
                  <Clock className="text-black" size={32} />
                </div>
                <div>
                  <h2 className="text-4xl font-black uppercase italic leading-none text-white">The Raid Map</h2>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">24:00:00 Operational Window</p>
                </div>
              </div>
              
              <div className="flex bg-black/50 p-2 rounded-2xl gap-2 border-2 border-white/10">
                {(['ALL', 'Marvel', 'DC'] as const).map((f) => (
                  <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-3 rounded-xl text-sm font-black transition-all duration-200 ${filter === f ? 'bg-yellow-500 text-black shadow-md scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[900px] overflow-y-auto no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] bg-opacity-5 p-6 space-y-4">
              {filteredSchedule.map((item, idx) => (
                <div 
                  key={idx} 
                  ref={item.highlight ? mySlotRef : null}
                  className={`group flex items-center gap-6 p-6 rounded-[28px] border-4 transition-all duration-300 ${item.highlight ? 'bg-yellow-500 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] scale-[1.03] z-50 sticky top-6 bottom-6' : 'bg-[#0d1117]/80 border-white/5 hover:border-blue-500/50 hover:bg-[#161b22] hover:-translate-y-1'}`}
                >
                  <div className={`w-24 text-sm font-black font-mono tracking-tighter shrink-0 ${item.highlight ? 'text-black' : 'text-gray-500 group-hover:text-blue-400 transition-colors'}`}>
                    {item.time}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className={`font-black uppercase italic tracking-tight truncate ${item.highlight ? 'text-black text-3xl' : 'text-gray-100 text-2xl group-hover:text-white transition-colors'}`}>
                      {item.shop}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                       <span className={`text-[11px] font-black px-3 py-1 rounded-lg border-2 ${item.highlight ? 'bg-black text-yellow-500 border-black' : item.team === 'Marvel' ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'}`}>
                        TEAM {item.team}
                       </span>
                       <span className={`text-base font-bold truncate ${item.highlight ? 'text-black/70' : 'text-gray-500 group-hover:text-gray-300 transition-colors'}`}>
                         {item.persona}
                       </span>
                    </div>
                  </div>

                  {item.highlight ? (
                    <div className="hidden md:flex bg-black text-yellow-500 px-6 py-3 rounded-2xl font-black italic text-sm animate-pulse border-2 border-black items-center gap-3 shadow-xl">
                      <Rocket size={18} />
                      LIVE MISSION
                    </div>
                  ) : (
                    <ChevronRight className={`opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 ${item.team === 'Marvel' ? 'text-red-500' : 'text-blue-500'}`} size={24} />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Creative Assets */}
        <div className="lg:col-span-5 space-y-12">
          
          {/* Battle Stats Cards */}
          <section className="grid grid-cols-2 gap-6">
             <div className="group bg-red-600 border-[6px] border-black p-6 rounded-[32px] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                <p className="text-xs font-black text-white/80 uppercase mb-2 tracking-widest">Force Status</p>
                <div className="text-4xl font-black text-white italic drop-shadow-md">12 HEROES</div>
                <div className="mt-4 h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-full animate-pulse" />
                </div>
             </div>
             <div className="group bg-blue-600 border-[6px] border-black p-6 rounded-[32px] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                <p className="text-xs font-black text-white/80 uppercase mb-2 tracking-widest">Force Status</p>
                <div className="text-4xl font-black text-white italic drop-shadow-md">12 HEROES</div>
                <div className="mt-4 h-2 bg-black/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white w-full animate-pulse" />
                </div>
             </div>
          </section>

          {/* IG Reel Script Section */}
          <section className="bg-[#0d1117] rounded-[40px] border-[8px] border-black overflow-hidden shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
            <div className="p-8 border-b-[8px] border-black bg-gradient-to-r from-pink-900/40 via-purple-900/20 to-[#0d1117] flex items-center gap-5">
              <div className="bg-pink-500 p-3 rounded-2xl border-4 border-black shadow-lg -rotate-3">
                <Instagram className="text-black" size={32} />
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Reel Directives</h2>
                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.2em] mt-1">Content Production Protocol</p>
              </div>
            </div>
            <div className="p-8 space-y-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-5">
              {REEL_SCENES.map((scene, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-pink-600 text-lg font-black flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_0px_#000] skew-x-[-10deg]">{idx+1}</div>
                    <span className="text-sm font-black uppercase text-pink-500 tracking-widest">{scene.scene}</span>
                  </div>
                  <div className="bg-black/80 border-2 border-white/10 rounded-3xl p-6 transition-all hover:border-pink-500/30 group">
                    <div className="flex items-start gap-4 mb-4">
                      <Camera size={20} className="text-pink-400 mt-1 shrink-0 group-hover:scale-110 transition-transform" />
                      <p className="text-gray-300 leading-relaxed font-medium italic">{scene.visual}</p>
                    </div>
                    <div className="flex items-start gap-4 p-5 bg-pink-500/5 rounded-[20px] border-2 border-pink-500/20 border-dashed">
                      <MessageSquare size={20} className="text-pink-400 mt-1 shrink-0" />
                      <p className="text-gray-100 font-black italic text-lg tracking-tight leading-snug">"{scene.audio}"</p>
                    </div>
                  </div>
                </div>
              ))}

              <button 
                onClick={() => copyToClipboard(REEL_SCENES.map(s => `${s.scene}\nVisual: ${s.visual}\nAudio: ${s.audio}`).join('\n\n'), 'full-script')}
                className="w-full flex items-center justify-center gap-4 bg-white text-black py-6 rounded-[24px] font-black uppercase tracking-[0.25em] hover:bg-yellow-400 transition-all active:scale-95 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,0.5)] group"
              >
                {copied === 'full-script' ? <CheckCircle2 size={28} className="text-green-600" /> : <Share2 size={28} className="group-hover:rotate-12 transition-transform" />}
                {copied === 'full-script' ? 'PROTOCOL COPIED!' : 'COPY FULL DIRECTIVE'}
              </button>
            </div>
          </section>

          {/* Gemini AI Lab Section */}
          <section className="bg-[#0d1117] rounded-[40px] border-[8px] border-black overflow-hidden shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]">
            <div className="p-8 border-b-[8px] border-black bg-gradient-to-r from-blue-900/40 to-[#0d1117] flex items-center gap-5">
              <div className="bg-blue-500 p-3 rounded-2xl border-4 border-black shadow-lg">
                <Sparkles className="text-black" size={32} />
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Gemini Lab</h2>
                <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-1">Synthesize Your Visuals</p>
              </div>
            </div>
            <div className="p-8 space-y-10">
              {GEMINI_PROMPTS.map((p, idx) => (
                <div key={idx} className="space-y-4 group">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 flex items-center gap-2">
                    <Zap size={14} />
                    {p.title}
                  </h3>
                  <div className="relative">
                    <div className="p-6 bg-black/90 rounded-[24px] border-2 border-white/10 text-base text-gray-400 font-mono leading-relaxed group-hover:border-blue-500/40 transition-colors">
                      {p.prompt}
                    </div>
                    <button 
                      onClick={() => copyToClipboard(p.prompt, `lab-${idx}`)}
                      className="absolute top-4 right-4 p-4 rounded-2xl bg-blue-600 hover:bg-yellow-400 transition-all group/btn border-4 border-black shadow-lg active:scale-90"
                    >
                      {copied === `lab-${idx}` ? <CheckCircle2 size={22} className="text-white" /> : <Copy size={22} className="text-white group-hover/btn:text-black" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>

      {/* Global Footer CTA Area */}
      <footer className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-white border-[8px] border-black rounded-[50px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          <div className="flex items-center gap-10">
            <div className="w-24 h-24 rounded-full bg-yellow-500 border-[6px] border-black flex items-center justify-center shrink-0 shadow-2xl animate-pulse">
              <Trophy className="text-black" size={48} />
            </div>
            <div className="space-y-2">
              <p className="text-black font-black text-lg uppercase leading-none tracking-widest">Final Objective</p>
              <h4 className="text-black font-black italic text-4xl md:text-6xl leading-none uppercase tracking-tighter">Victory for <span className="text-red-600">Marvel</span></h4>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 w-full md:w-auto">
            <button className="bg-black text-white px-10 py-6 rounded-3xl font-black uppercase italic tracking-widest text-xl hover:bg-blue-600 transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none">
              Remind Me
            </button>
            <button className="bg-red-600 text-white px-10 py-6 rounded-3xl font-black uppercase italic tracking-widest text-xl hover:bg-yellow-400 hover:text-black transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3">
              Open Palmstreet
              <ExternalLink size={24} />
            </button>
          </div>
        </div>
        
        <div className="mt-16 text-center space-y-4">
          <p className="text-gray-600 font-bold uppercase tracking-[0.5em] text-xs">Constructed by Flash Agent • 2026 Multiverse Protocol</p>
          <div className="flex justify-center gap-6 text-gray-500">
            <Shield size={20} className="hover:text-blue-500 cursor-help" />
            <Sword size={20} className="hover:text-red-500 cursor-help" />
            <Info size={20} className="hover:text-yellow-500 cursor-help" />
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100] flex gap-4">
        <button 
          onClick={scrollToMySlot}
          className="flex-1 bg-yellow-500 text-black p-5 rounded-2xl border-4 border-black font-black uppercase italic text-sm shadow-xl active:scale-95"
        >
          Jump to My Show
        </button>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-white text-black p-5 rounded-2xl border-4 border-black font-black shadow-xl active:scale-95"
        >
          <Zap size={20} />
        </button>
      </div>

      <div className="h-32 lg:hidden" />
    </div>
  );
}
=======
import React from 'react';
import { Sparkles } from 'lucide-react';

export default function App() {
  return (
    <div className="p-8 bg-[#0d1117] text-[#c9d1d9] min-h-screen flex flex-col items-center justify-center text-center font-sans selection:bg-[#2f81f7]/30 selection:text-[#2f81f7] overflow-hidden relative">
      <div className="relative z-10 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="w-32 h-32 flex items-center justify-center mx-auto transition-transform hover:scale-105 active:scale-95 duration-500 group cursor-pointer overflow-hidden">
           <img src="flashagent_logo3.png" alt="Flash Agent Logo" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
        </div>
        
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-[#2f81f7] font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
            <Sparkles size={12} />
            <span>Next-Gen Agent</span>
          </div>
          <h1 className="text-6xl font-black tracking-tight text-white leading-tight">
            Flash <span className="text-[#2f81f7]">Agent</span>
          </h1>
          <p className="text-[#8b949e] text-xl leading-relaxed font-medium max-w-lg mx-auto opacity-80">
            The world's most advanced autonomous AI architect. Describe your mission and witness the future of development.
          </p>
        </div>
      </div>

      {/* Subtle Dynamic Gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2f81f7]/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#2f81f7]/5 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}
>>>>>>> bd59738 (Initial upload of plant inventory system)
