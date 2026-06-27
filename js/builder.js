/* ============================================================
   DoodleUp! — Canva-style Canvas Engine v2
   Fabric.js 5.3 · AI Design Copilot integrated
   ============================================================ */
(function () {
  "use strict";

  /* ══ CONSTANTS ═══════════════════════════════════════════ */
  const SAVE_KEY = "du_canvas_";
  const PROJ_KEY = "du_projects";
  const SNAP_PX  = 7;
  const GUIDE_COLOR = "#f3701e";

  /* ══ STATE ═══════════════════════════════════════════════ */
  let PAGE_W = 1080, PAGE_H = 1080;
  let pages = [{ id:"p1", name:"Page 1", json:null }];
  let currentPageIdx = 0;
  let activeProjectId = localStorage.getItem("du_active_project") || "default";
  let projectName = "Untitled Design";
  let undoStacks = { p1:[] }, redoStacks = { p1:[] };
  let guides = [], isPanning = false, isSpaceDown = false, lastPtr = {x:0,y:0};
  let pageRect = null;
  let activeFontEl = null, activeColorEl = null, activeColorProp = "fill";
  let gradientMode = false, gradColor1 = "#f3701e", gradColor2 = "#BA3801", gradAngle = 135, gradType = "linear";
  let savedStyles = JSON.parse(localStorage.getItem("du_styles") || "[]");
  const loadedFonts = new Set(["Space Grotesk","DM Serif Display","Inter","Outfit","JetBrains Mono"]);

  /* ══ FONTS ═══════════════════════════════════════════════ */
  const FONTS = [
    /* Sans-serif — Modern */
    "Inter","Space Grotesk","Outfit","Poppins","Montserrat","Raleway","Nunito","Nunito Sans",
    "Lato","Roboto","Open Sans","Ubuntu","Oswald","Barlow","Barlow Condensed","DM Sans",
    "Figtree","Plus Jakarta Sans","Syne","Manrope","Work Sans","Public Sans","Jost",
    "Urbanist","Lexend","Quicksand","Mulish","Karla","Hind","Rubik",
    /* Sans-serif — Creative & Expressive */
    "Bricolage Grotesque","Hanken Grotesk","Albert Sans","Epilogue","Chivo","Sora",
    "Josefin Sans","Spline Sans","Familjen Grotesk","Encode Sans Condensed",
    "Saira Condensed","Rajdhani","Prompt","Asap","Fira Sans",
    /* Serif — Editorial & Luxury */
    "DM Serif Display","Playfair Display","Merriweather","Lora","Cormorant Garamond",
    "Libre Baskerville","EB Garamond","Crimson Pro","Spectral","Domine","Cardo",
    "Gloock","Fraunces","Young Serif","Instrument Serif","Newsreader",
    /* Serif — Decorative & Distinctive */
    "Bodoni Moda","Marcellus","Yeseva One","Trocchi","Josefin Slab","Libre Baskerville",
    /* Display — Impact */
    "Abril Fatface","Bebas Neue","Anton","Black Han Sans","Big Shoulders Display",
    "Dela Gothic One","Unbounded","Righteous","Russo One","Teko","Fjalla One",
    "Climate Crisis","Lilita One","Graduate","Permanent Marker",
    /* Display — Unique Character */
    "Syncopate","Passion One","Secular One","Mohave","Stardos Stencil","Bungee",
    /* Handwriting / Script */
    "Pacifico","Dancing Script","Satisfy","Caveat","Caveat Brush","Sacramento",
    "Great Vibes","Allura","Pinyon Script","Kaushan Script","Yellowtail",
    "Cookie","Marck Script","Norican","Lobster","Lobster Two",
    /* Script — Elegant */
    "Alex Brush","Tangerine","Rochester","Clicker Script","Herr Von Muellerhoff",
    /* Monospace / Code */
    "JetBrains Mono","Source Code Pro","Fira Code","IBM Plex Mono","Space Mono",
    "Roboto Mono","Courier Prime","Inconsolata","Share Tech Mono","Fragment Mono",
    /* Specialty / Futuristic */
    "Cinzel","Cinzel Decorative","Italiana","Philosopher","Arvo","Rokkitt","Zilla Slab",
    "Chakra Petch","Exo 2","Orbitron","Michroma","Share Tech","Audiowide","Oxanium",
    /* Arabic Script — from dataset: Nazanin→Amiri, Mitra→Scheherazade, Tahoma→Cairo, Titr→Reem Kufi */
    "Amiri","Cairo","Scheherazade New","El Messiri","Reem Kufi","Lateef","Noto Naskh Arabic","Noto Sans Arabic",
    /* Chinese Script — from dataset: HeiTi→Noto Sans SC, SongTi/FangSong→Noto Serif SC, KaiTi→Ma Shan Zheng */
    "Noto Sans SC","Noto Serif SC","ZCOOL XiaoWei","ZCOOL QingKe HuangYou","Ma Shan Zheng","Long Cang","Liu Jian Mao Cao",
    /* Latin Classics — from dataset: Bookman→IM Fell, Century→Libre Franklin, Computer Modern→STIX Two Text */
    "IM Fell English","IM Fell DW Pica","Libre Franklin","STIX Two Text","GFS Didot",
    /* Ottoman Calligraphy — from dataset: Divani/Nesih/Talik styles */
    "Gulzar","Noto Nastaliq Urdu","Qahiri",
  ];
  function loadFont(family) {
    if (loadedFonts.has(family)) return;
    loadedFonts.add(family);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }
  FONTS.forEach(loadFont);

  /* ══ TEMPLATES ════════════════════════════════════════════ */
  const TEMPLATES = [
    /* ── Social ─────────────────────────────────── */
    { id:"t1", cat:"social", w:1080, h:1080, name:"Aurora Dream", layout:"hero", style:"dark-gradient",
      thumbBg:"radial-gradient(ellipse at 20% 20%,rgba(124,58,237,.7) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(236,72,153,.5) 0%,transparent 50%),linear-gradient(135deg,#0f0c29,#1e1040)",
      thumbEls:[
        {y:"-20%",x:"62%",w:"55px",h:"55px",bg:"rgba(124,58,237,0.35)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#a78bfa"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#7c3aed",r:"4px"},
      ],
      bg:["#0f0c29","#302b63","#24243e"], angle:135, textColor:"#fff", accent:"#a78bfa",
      lines:["AURORA DREAM","Creative Studio · Since 2024","Explore Work"] },

    { id:"t2", cat:"social", w:1080, h:1080, name:"Luxury Noir", layout:"poster", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 50% 30%,rgba(255,236,137,.18) 0%,transparent 60%),linear-gradient(180deg,#0a0805,#1a0f08)",
      thumbEls:[
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,236,137,0.3)"},
        {y:"30%",x:"10%",w:"80%",h:"13px",bg:"rgba(255,236,137,0.92)",r:"2px"},
        {y:"50%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,236,137,0.3)"},
        {y:"60%",x:"18%",w:"64%",h:"7px",bg:"rgba(255,236,137,0.55)",r:"2px"},
        {y:"76%",x:"32%",w:"36%",h:"8px",bg:"rgba(255,236,137,0.25)",r:"2px"},
      ],
      bg:["#0a0805","#1a0f08"], angle:180, textColor:"#FFEC89", accent:"#FFEC89",
      lines:["LUXURY NOIR","Studio · Est. 2018","@yourhandle"] },

    { id:"t3", cat:"social", w:1080, h:1080, name:"Sunset Fire", layout:"hero", style:"warm-gradient",
      thumbBg:"linear-gradient(135deg,#f97316,#dc2626,#7c3aed)",
      thumbEls:[
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"rgba(255,255,255,0.7)"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.5)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(255,255,255,0.18)",r:"4px"},
      ],
      bg:["#f97316","#dc2626","#7c3aed"], angle:135, textColor:"#fff", accent:"#FFEC89",
      lines:["SUNSET FIRE","Bold. Vivid. Alive.","Tap to explore →"] },

    { id:"t4", cat:"social", w:1080, h:1080, name:"Neon Cyber", layout:"poster", style:"cyber",
      thumbBg:"radial-gradient(ellipse at 50% 50%,rgba(0,255,159,.12) 0%,transparent 60%),linear-gradient(180deg,#050508,#0d0d14)",
      thumbEls:[
        {y:"12%",x:"0",w:"28%",h:"3px",bg:"#00ff9f"},
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(0,255,159,0.2)"},
        {y:"30%",x:"10%",w:"80%",h:"13px",bg:"rgba(0,255,159,0.9)",r:"2px"},
        {y:"49%",x:"5%",w:"90%",h:"1px",bg:"rgba(0,255,159,0.2)"},
        {y:"59%",x:"18%",w:"64%",h:"7px",bg:"rgba(0,255,159,0.45)",r:"2px"},
        {y:"76%",x:"32%",w:"36%",h:"8px",bg:"rgba(0,255,159,0.2)",r:"2px"},
      ],
      bg:["#050508","#0d0d14"], angle:180, textColor:"#00ff9f", accent:"#00ff9f",
      lines:["CYBER 2025","Hack. Build. Ship.","sys://online"] },

    { id:"t5", cat:"social", w:1080, h:1080, name:"Blush Editorial", layout:"editorial", style:"light",
      thumbBg:"linear-gradient(135deg,#fdf6f0,#fce4d8)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#BA3801",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(26,15,8,0.35)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(26,15,8,0.85)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(26,15,8,0.65)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(26,15,8,0.35)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#BA3801",r:"2px"},
      ],
      bg:["#fdf6f0","#fce4d8"], angle:135, textColor:"#2d1810", accent:"#BA3801",
      lines:["Blush Editorial","Style & Substance","Read the latest →"] },

    { id:"t6", cat:"social", w:1080, h:1080, name:"Ocean Abyss", layout:"hero", style:"dark-gradient",
      thumbBg:"radial-gradient(ellipse at 30% 70%,rgba(6,182,212,.35) 0%,transparent 55%),linear-gradient(160deg,#0d3d3a,#0c4a6e)",
      thumbEls:[
        {y:"-20%",x:"62%",w:"55px",h:"55px",bg:"rgba(6,182,212,0.2)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.9)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#06b6d4"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(6,182,212,0.6)",r:"4px"},
      ],
      bg:["#0d3d3a","#0c4a6e"], angle:160, textColor:"#e0f2fe", accent:"#06b6d4",
      lines:["Ocean Abyss","Deep & Limitless","@studio"] },

    { id:"t7", cat:"social", w:1080, h:1080, name:"Minimal B&W", layout:"minimal", style:"light",
      thumbBg:"#fafafa",
      thumbEls:[
        {y:"30%",x:"22%",w:"56%",h:"11px",bg:"rgba(10,10,10,0.88)",r:"2px"},
        {y:"49%",x:"40%",w:"20%",h:"2px",bg:"#0a0a0a"},
        {y:"57%",x:"16%",w:"68%",h:"6px",bg:"rgba(10,10,10,0.35)",r:"2px"},
      ],
      bg:["#fafafa","#f0f0f0"], angle:0, textColor:"#0a0a0a", accent:"#0a0a0a",
      lines:["MINIMAL","Less is more.","@minimal.studio"] },

    { id:"t8", cat:"social", w:1080, h:1080, name:"Warm Terracotta", layout:"editorial", style:"warm",
      thumbBg:"linear-gradient(160deg,#c84b31,#e07a5f,#f4a261)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"rgba(255,248,240,0.7)",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(255,248,240,0.45)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(255,248,240,0.92)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(255,248,240,0.65)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(255,248,240,0.35)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#FFEC89",r:"2px"},
      ],
      bg:["#c84b31","#f4a261"], angle:160, textColor:"#fff8f0", accent:"#FFEC89",
      lines:["TERRACOTTA","Earth. Warmth. Soul.","2024 Collection"] },

    { id:"t9", cat:"social", w:1080, h:1920, tall:true, name:"Gradient Story", layout:"poster", style:"dark-gradient",
      thumbBg:"linear-gradient(180deg,#7c3aed,#db2777,#f97316)",
      thumbEls:[
        {y:"22%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.3)"},
        {y:"32%",x:"10%",w:"80%",h:"13px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"51%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.3)"},
        {y:"61%",x:"18%",w:"64%",h:"7px",bg:"rgba(255,255,255,0.55)",r:"2px"},
        {y:"78%",x:"32%",w:"36%",h:"8px",bg:"rgba(255,255,255,0.3)",r:"2px"},
      ],
      bg:["#7c3aed","#db2777","#f97316"], angle:180, textColor:"#fff", accent:"#fff",
      lines:["YOUR STORY","Starts here.","Swipe up ↑"] },

    { id:"t10", cat:"social", w:1080, h:1920, tall:true, name:"Dark Gold Story", layout:"poster", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 50% 40%,rgba(255,236,137,.2) 0%,transparent 65%),linear-gradient(180deg,#0a0805,#1a0f08,#2d1008)",
      thumbEls:[
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,236,137,0.3)"},
        {y:"30%",x:"10%",w:"80%",h:"13px",bg:"rgba(255,236,137,0.9)",r:"2px"},
        {y:"50%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,236,137,0.3)"},
        {y:"60%",x:"18%",w:"64%",h:"7px",bg:"rgba(255,236,137,0.5)",r:"2px"},
        {y:"77%",x:"32%",w:"36%",h:"8px",bg:"rgba(255,236,137,0.2)",r:"2px"},
      ],
      bg:["#0a0805","#1a0f08","#2d1008"], angle:180, textColor:"#FFEC89", accent:"#FFEC89",
      lines:["TONIGHT","10 PM · Rooftop Bar","Limited entry"] },

    { id:"t11", cat:"social", w:1500, h:500, name:"Stripe Banner", layout:"hero", style:"gradient-purple",
      thumbBg:"radial-gradient(ellipse at 20% 50%,rgba(124,58,237,.6) 0%,transparent 50%),radial-gradient(ellipse at 80% 50%,rgba(99,91,255,.5) 0%,transparent 50%),linear-gradient(135deg,#0f0c29,#1e1040)",
      thumbEls:[
        {y:"22%",x:"10%",w:"45%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"44%",x:"10%",w:"35%",h:"2px",bg:"#a78bfa"},
        {y:"54%",x:"10%",w:"60%",h:"6px",bg:"rgba(255,255,255,0.42)",r:"2px"},
      ],
      bg:["#0f0c29","#1e1040"], angle:135, textColor:"#e2e8f0", accent:"#a78bfa",
      lines:["Your Name","Designer & Developer","yourwebsite.com"] },

    /* ── Presentation ──────────────────────────── */
    { id:"t12", cat:"presentation", w:1280, h:720, name:"Dark Corporate", layout:"hero", style:"dark-gradient",
      thumbBg:"linear-gradient(135deg,#0f172a,#1e293b,#0f172a)",
      thumbEls:[
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(248,250,252,0.9)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#38bdf8"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(248,250,252,0.4)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#0ea5e9",r:"4px"},
      ],
      bg:["#0f172a","#1e293b"], angle:135, textColor:"#f8fafc", accent:"#38bdf8",
      lines:["Q4 2024 Report","Company Performance","Presented by Team"] },

    { id:"t13", cat:"presentation", w:1280, h:720, name:"Bold Gradient Deck", layout:"hero", style:"dark-gradient",
      thumbBg:"linear-gradient(135deg,#7c3aed,#6d28d9,#4338ca)",
      thumbEls:[
        {y:"-18%",x:"62%",w:"55px",h:"55px",bg:"rgba(251,191,36,0.2)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#fbbf24"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(251,191,36,0.85)",r:"4px"},
      ],
      bg:["#7c3aed","#4338ca"], angle:135, textColor:"#fff", accent:"#fbbf24",
      lines:["Design System 2025","Building for Scale","Your Company"] },

    { id:"t14", cat:"presentation", w:1280, h:720, name:"Light Minimal Deck", layout:"minimal", style:"light",
      thumbBg:"#ffffff",
      thumbEls:[
        {y:"30%",x:"22%",w:"56%",h:"11px",bg:"rgba(15,23,42,0.88)",r:"2px"},
        {y:"49%",x:"40%",w:"20%",h:"2px",bg:"#7c3aed"},
        {y:"57%",x:"16%",w:"68%",h:"6px",bg:"rgba(15,23,42,0.32)",r:"2px"},
      ],
      bg:["#ffffff","#f8f9fa"], angle:0, textColor:"#0f172a", accent:"#7c3aed",
      lines:["Design Thinking","Workshop Series 2024","@speaker"] },

    { id:"t15", cat:"presentation", w:1280, h:720, name:"Retro Wave Deck", layout:"hero", style:"cyber",
      thumbBg:"linear-gradient(180deg,#0d0221,#190933,#220644)",
      thumbEls:[
        {y:"12%",x:"0",w:"28%",h:"3px",bg:"#ff0080"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,0,128,0.88)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#ff0080"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,0,128,0.4)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(255,0,128,0.2)",r:"4px"},
      ],
      bg:["#0d0221","#220644"], angle:180, textColor:"#ff0080", accent:"#ff0080",
      lines:["RETRO WAVE","Synthwave · 1984–∞","Slide 01 of 12"] },

    { id:"t16", cat:"presentation", w:1280, h:720, name:"Pastel Creative", layout:"editorial", style:"light",
      thumbBg:"linear-gradient(135deg,#fdf4ff,#fce7f3,#eff6ff)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#7c3aed",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(76,29,149,0.3)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(76,29,149,0.82)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(76,29,149,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(76,29,149,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#7c3aed",r:"2px"},
      ],
      bg:["#fdf4ff","#eff6ff"], angle:135, textColor:"#4c1d95", accent:"#7c3aed",
      lines:["Creative Process","UX Research Methods","Design Team"] },

    /* ── Print ─────────────────────────────────── */
    { id:"t17", cat:"print", w:595, h:842, tall:true, name:"Magazine Cover", layout:"editorial", style:"editorial",
      thumbBg:"linear-gradient(180deg,#1a1a1a 55%,#f5f5f5 55%)",
      thumbEls:[
        {y:"8%",x:"10%",w:"80%",h:"8px",bg:"rgba(255,255,255,0.92)",r:"1px"},
        {y:"22%",x:"10%",w:"80%",h:"14px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"38%",x:"10%",w:"60%",h:"8px",bg:"rgba(243,112,30,0.92)",r:"1px"},
        {y:"53%",x:"10%",w:"80%",h:"7px",bg:"rgba(26,26,26,0.75)",r:"1px"},
        {y:"64%",x:"10%",w:"60%",h:"6px",bg:"rgba(26,26,26,0.5)",r:"1px"},
        {y:"74%",x:"10%",w:"45%",h:"6px",bg:"rgba(26,26,26,0.35)",r:"1px"},
      ],
      bg:["#1a1a1a","#f5f5f5"], angle:180, textColor:"#fff", accent:"#f3701e",
      lines:["MAGAZINE","November 2024","The Creative Issue"] },

    { id:"t18", cat:"print", w:595, h:842, tall:true, name:"Luxury Event Poster", layout:"poster", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 50% 30%,rgba(255,236,137,.18) 0%,transparent 50%),linear-gradient(180deg,#050302,#100a05,#1a0f08)",
      thumbEls:[
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,236,137,0.3)"},
        {y:"30%",x:"10%",w:"80%",h:"13px",bg:"rgba(255,236,137,0.9)",r:"2px"},
        {y:"50%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,236,137,0.3)"},
        {y:"60%",x:"18%",w:"64%",h:"7px",bg:"rgba(255,236,137,0.5)",r:"2px"},
        {y:"77%",x:"32%",w:"36%",h:"8px",bg:"rgba(255,236,137,0.2)",r:"2px"},
      ],
      bg:["#050302","#1a0f08"], angle:180, textColor:"#FFEC89", accent:"#FFEC89",
      lines:["GALA NIGHT","Saturday · 8 PM · Grand Ballroom","Black tie preferred"] },

    { id:"t19", cat:"print", w:595, h:842, tall:true, name:"Psychedelic Poster", layout:"poster", style:"vivid",
      thumbBg:"conic-gradient(from 200deg at 50% 50%,#f97316,#ec4899,#8b5cf6,#06b6d4,#10b981,#f97316)",
      thumbEls:[
        {y:"22%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.5)"},
        {y:"30%",x:"10%",w:"80%",h:"14px",bg:"rgba(255,255,255,0.95)",r:"2px"},
        {y:"50%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.5)"},
        {y:"60%",x:"18%",w:"64%",h:"7px",bg:"rgba(255,255,255,0.7)",r:"2px"},
        {y:"77%",x:"32%",w:"36%",h:"9px",bg:"rgba(255,255,255,0.3)",r:"3px"},
      ],
      bg:["#f97316","#8b5cf6"], angle:135, textColor:"#fff", accent:"#fff",
      lines:["MUSIC FEST","July 14 · Open Air Stage","Tickets at door"] },

    { id:"t20", cat:"print", w:595, h:842, tall:true, name:"Minimal Exhibit", layout:"minimal", style:"museum",
      thumbBg:"#f9f7f5",
      thumbEls:[
        {y:"30%",x:"22%",w:"56%",h:"11px",bg:"rgba(26,18,16,0.85)",r:"1px"},
        {y:"49%",x:"40%",w:"20%",h:"2px",bg:"#8B7355"},
        {y:"57%",x:"16%",w:"68%",h:"6px",bg:"rgba(26,18,16,0.32)",r:"1px"},
        {y:"69%",x:"30%",w:"40%",h:"6px",bg:"rgba(26,18,16,0.2)",r:"1px"},
      ],
      bg:["#f9f7f5","#f0ede8"], angle:0, textColor:"#1a1210", accent:"#8B7355",
      lines:["EXHIBITION","Works on Paper","October 12–31"] },

    { id:"t21", cat:"print", w:1050, h:600, name:"Business Card Dark", layout:"minimal", style:"dark",
      thumbBg:"linear-gradient(135deg,#0f0f11,#1a1a1f)",
      thumbEls:[
        {y:"28%",x:"10%",w:"55%",h:"10px",bg:"rgba(240,240,245,0.88)",r:"2px"},
        {y:"47%",x:"10%",w:"20%",h:"2px",bg:"#a78bfa"},
        {y:"56%",x:"10%",w:"65%",h:"6px",bg:"rgba(240,240,245,0.4)",r:"2px"},
        {y:"70%",x:"10%",w:"50%",h:"5px",bg:"rgba(240,240,245,0.22)",r:"1px"},
      ],
      bg:["#0f0f11","#1a1a1f"], angle:135, textColor:"#f0f0f5", accent:"#a78bfa",
      lines:["Jane Smith","Creative Director · UI/UX","jane@studio.com"] },

    { id:"t22", cat:"print", w:595, h:842, tall:true, name:"Orange Gradient Flyer", layout:"hero", style:"warm-gradient",
      thumbBg:"linear-gradient(160deg,#f97316,#dc2626,#9a1212)",
      thumbEls:[
        {y:"-18%",x:"62%",w:"55px",h:"55px",bg:"rgba(255,255,255,0.1)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"rgba(255,255,255,0.6)"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(255,255,255,0.18)",r:"4px"},
      ],
      bg:["#f97316","#9a1212"], angle:160, textColor:"#fff", accent:"#FFEC89",
      lines:["GRAND OPENING","Friday · 7 PM","RSVP required"] },

    /* ── Marketing ─────────────────────────────── */
    { id:"t23", cat:"marketing", w:1080, h:1080, name:"Product Launch", layout:"hero", style:"dark-gradient",
      thumbBg:"radial-gradient(ellipse at 60% 40%,rgba(124,58,237,.4) 0%,transparent 55%),linear-gradient(135deg,#0f0c29,#0d3d3a)",
      thumbEls:[
        {y:"-18%",x:"55%",w:"55px",h:"55px",bg:"rgba(124,58,237,0.35)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#a78bfa"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#7c3aed",r:"4px"},
      ],
      bg:["#0f0c29","#0d3d3a"], angle:135, textColor:"#fff", accent:"#a78bfa",
      lines:["NEW DROP","Available Now","Shop the collection →"] },

    { id:"t24", cat:"marketing", w:1080, h:1080, name:"Flash Sale", layout:"poster", style:"vivid",
      thumbBg:"linear-gradient(135deg,#dc2626,#b91c1c,#7f1d1d)",
      thumbEls:[
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.35)"},
        {y:"28%",x:"10%",w:"80%",h:"13px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"47%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.35)"},
        {y:"56%",x:"18%",w:"64%",h:"8px",bg:"rgba(255,255,255,0.6)",r:"2px"},
        {y:"73%",x:"28%",w:"44%",h:"11px",bg:"rgba(255,236,137,0.85)",r:"3px"},
      ],
      bg:["#dc2626","#7f1d1d"], angle:135, textColor:"#fff", accent:"#FFEC89",
      lines:["60% OFF","Flash Sale · 24hrs only","Code: FLASH60"] },

    { id:"t25", cat:"marketing", w:1200, h:628, name:"Gradient OG Banner", layout:"hero", style:"gradient-purple",
      thumbBg:"radial-gradient(ellipse at 30% 60%,rgba(124,58,237,.5) 0%,transparent 50%),linear-gradient(135deg,#0f0c29,#1e1b4b,#312e81)",
      thumbEls:[
        {y:"22%",x:"10%",w:"45%",h:"10px",bg:"rgba(255,255,255,0.9)",r:"2px"},
        {y:"40%",x:"10%",w:"25%",h:"2px",bg:"#818cf8"},
        {y:"49%",x:"10%",w:"62%",h:"6px",bg:"rgba(255,255,255,0.42)",r:"2px"},
        {y:"65%",x:"10%",w:"30%",h:"12px",bg:"#6366f1",r:"4px"},
      ],
      bg:["#0f0c29","#312e81"], angle:135, textColor:"#e0e7ff", accent:"#818cf8",
      lines:["10 Design Trends","2025 Edition · 8 min read","Read on Notion →"] },

    { id:"t26", cat:"marketing", w:1200, h:628, name:"Light Blog Banner", layout:"editorial", style:"light",
      thumbBg:"linear-gradient(135deg,#fafafa,#f5f0eb)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#BA3801",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(26,15,8,0.3)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(26,15,8,0.85)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(26,15,8,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(26,15,8,0.35)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#BA3801",r:"2px"},
      ],
      bg:["#fafafa","#f5f0eb"], angle:135, textColor:"#1a0f08", accent:"#BA3801",
      lines:["The Future of AI Design","Technology · 12 min read","your-blog.com"] },

    { id:"t27", cat:"marketing", w:1080, h:1080, name:"Mint Fresh", layout:"hero", style:"light-gradient",
      thumbBg:"linear-gradient(135deg,#d1fae5,#6ee7b7,#10b981)",
      thumbEls:[
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(6,78,59,0.88)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#064e3b"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(6,78,59,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#065f46",r:"4px"},
      ],
      bg:["#d1fae5","#10b981"], angle:135, textColor:"#064e3b", accent:"#065f46",
      lines:["Fresh Start","Spring Collection 2024","Shop now →"] },

    { id:"t28", cat:"marketing", w:1080, h:1080, name:"Announcement Dark", layout:"minimal", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 50% 50%,rgba(255,236,137,.12) 0%,transparent 70%),linear-gradient(135deg,#0f0c29,#0a0805)",
      thumbEls:[
        {y:"30%",x:"22%",w:"56%",h:"11px",bg:"rgba(255,236,137,0.88)",r:"2px"},
        {y:"49%",x:"40%",w:"20%",h:"2px",bg:"#FFEC89"},
        {y:"57%",x:"16%",w:"68%",h:"6px",bg:"rgba(255,236,137,0.35)",r:"2px"},
        {y:"70%",x:"28%",w:"44%",h:"6px",bg:"rgba(255,236,137,0.18)",r:"1px"},
      ],
      bg:["#0f0c29","#0a0805"], angle:135, textColor:"#FFEC89", accent:"#FFEC89",
      lines:["BIG NEWS","Something is coming.","Stay tuned · Jan 2025"] },

    /* ── Webpage ────────────────────────────────── */
    { id:"t29", cat:"webpage", w:1440, h:900, name:"SaaS Dark Hero", layout:"hero", style:"dark-gradient",
      thumbBg:"radial-gradient(ellipse at 30% 50%,rgba(124,58,237,.35) 0%,transparent 55%),radial-gradient(ellipse at 70% 50%,rgba(99,91,255,.25) 0%,transparent 55%),linear-gradient(135deg,#050508,#0f0c29)",
      thumbEls:[
        {y:"-18%",x:"62%",w:"55px",h:"55px",bg:"rgba(124,58,237,0.25)",r:"50%"},
        {y:"55%",x:"-8%",w:"50px",h:"50px",bg:"rgba(99,91,255,0.18)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(240,240,248,0.9)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#a78bfa"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(240,240,248,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#7c3aed",r:"4px"},
      ],
      bg:["#050508","#0f0c29"], angle:135, textColor:"#f0f0f8", accent:"#a78bfa",
      lines:["Build Beautiful Apps","The fastest way to ship design","Get started free →"] },

    { id:"t30", cat:"webpage", w:1440, h:900, name:"Agency Bold", layout:"editorial", style:"light",
      thumbBg:"#ffffff",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#f3701e",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(10,10,10,0.3)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(10,10,10,0.85)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(10,10,10,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(10,10,10,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#f3701e",r:"2px"},
      ],
      bg:["#ffffff","#f9f9f9"], angle:0, textColor:"#0a0a0a", accent:"#f3701e",
      lines:["We Make Brands","Creative Agency · 2019–2024","Say hello →"] },

    { id:"t31", cat:"webpage", w:1440, h:900, name:"Stripe Purple", layout:"hero", style:"gradient-purple",
      thumbBg:"radial-gradient(ellipse at 50% 0%,rgba(167,139,250,.6) 0%,transparent 50%),radial-gradient(ellipse at 0% 100%,rgba(99,91,255,.4) 0%,transparent 40%),linear-gradient(135deg,#1e1040,#2d1b69,#1e1040)",
      thumbEls:[
        {y:"-18%",x:"25%",w:"55px",h:"55px",bg:"rgba(167,139,250,0.3)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#a78bfa"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#7c3aed",r:"4px"},
      ],
      bg:["#1e1040","#2d1b69"], angle:135, textColor:"#fff", accent:"#a78bfa",
      lines:["Payments, reimagined.","Accept money online in minutes.","Start now — it's free"] },

    { id:"t32", cat:"webpage", w:1440, h:900, name:"Notion Warm", layout:"minimal", style:"cream",
      thumbBg:"linear-gradient(180deg,#faf9f7,#f3efe9)",
      thumbEls:[
        {y:"28%",x:"20%",w:"60%",h:"12px",bg:"rgba(26,26,26,0.88)",r:"2px"},
        {y:"48%",x:"40%",w:"20%",h:"2px",bg:"#b85c38"},
        {y:"56%",x:"15%",w:"70%",h:"7px",bg:"rgba(26,26,26,0.35)",r:"2px"},
        {y:"68%",x:"30%",w:"40%",h:"11px",bg:"rgba(26,26,26,0.1)",r:"3px"},
      ],
      bg:["#faf9f7","#f3efe9"], angle:180, textColor:"#1a1a1a", accent:"#b85c38",
      lines:["Your workspace, reimagined.","All your work, in one place.","Get Notion free →"] },

    { id:"t33", cat:"webpage", w:1366, h:768, name:"Linear Dark", layout:"hero", style:"dark",
      thumbBg:"linear-gradient(135deg,#0f0f11,#111116,#141416)",
      thumbEls:[
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(228,228,231,0.9)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#5e6ad2"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(228,228,231,0.38)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#5e6ad2",r:"4px"},
      ],
      bg:["#0f0f11","#141416"], angle:135, textColor:"#e4e4e7", accent:"#5e6ad2",
      lines:["Meet Linear","The issue tracking tool","Try for free →"] },

    /* ── Portfolio ──────────────────────────────── */
    { id:"t34", cat:"portfolio", w:1200, h:800, name:"Creative Dark", layout:"editorial", style:"dark",
      thumbBg:"linear-gradient(135deg,#050508,#0f0c29)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#a78bfa",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(167,139,250,0.4)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(240,240,248,0.92)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(240,240,248,0.6)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(240,240,248,0.35)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#a78bfa",r:"2px"},
      ],
      bg:["#050508","#0f0c29"], angle:135, textColor:"#f0f0f8", accent:"#a78bfa",
      lines:["CREATIVE PORTFOLIO","UI/UX · Branding · Motion","2024 Selected Works"] },

    { id:"t35", cat:"portfolio", w:1200, h:800, name:"Photography Dark", layout:"minimal", style:"pure-dark",
      thumbBg:"#050505",
      thumbEls:[
        {y:"28%",x:"12%",w:"55%",h:"11px",bg:"rgba(245,245,245,0.88)",r:"1px"},
        {y:"47%",x:"12%",w:"15%",h:"2px",bg:"rgba(245,245,245,0.8)"},
        {y:"55%",x:"12%",w:"65%",h:"6px",bg:"rgba(245,245,245,0.35)",r:"1px"},
      ],
      bg:["#050505","#080808"], angle:0, textColor:"#f5f5f5", accent:"#fff",
      lines:["STUDIO NAME","Photography · Film","By appointment"] },

    { id:"t36", cat:"portfolio", w:1200, h:800, name:"Agency White", layout:"editorial", style:"light",
      thumbBg:"linear-gradient(135deg,#ffffff,#f8f6f2)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#f3701e",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(26,15,8,0.3)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(26,15,8,0.85)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(26,15,8,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(26,15,8,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#f3701e",r:"2px"},
      ],
      bg:["#ffffff","#f8f6f2"], angle:135, textColor:"#1a0f08", accent:"#f3701e",
      lines:["STUDIO NAME","Creative Agency · Est. 2019","hello@studio.com"] },

    { id:"t37", cat:"portfolio", w:1080, h:1080, name:"Case Study Teal", layout:"hero", style:"gradient-teal",
      thumbBg:"linear-gradient(135deg,#0d3d3a,#0f766e,#059669)",
      thumbEls:[
        {y:"-18%",x:"55%",w:"55px",h:"55px",bg:"rgba(6,182,212,0.18)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(236,253,245,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#6ee7b7"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(236,253,245,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(6,95,70,0.85)",r:"4px"},
      ],
      bg:["#0d3d3a","#059669"], angle:135, textColor:"#ecfdf5", accent:"#6ee7b7",
      lines:["Case Study #01","Redesigning the experience","2024 · Client Project"] },

    { id:"t38", cat:"portfolio", w:1200, h:800, name:"Navy Gold Resume", layout:"editorial", style:"navy-gold",
      thumbBg:"linear-gradient(135deg,#0f172a,#1e293b)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#fbbf24",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(251,191,36,0.4)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(248,250,252,0.92)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(248,250,252,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(248,250,252,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#fbbf24",r:"2px"},
      ],
      bg:["#0f172a","#1e293b"], angle:135, textColor:"#f8fafc", accent:"#fbbf24",
      lines:["RESUME","Creative Director","Jane Smith · 2024"] },

    /* ── Video ──────────────────────────────────── */
    { id:"t39", cat:"video", w:1920, h:1080, name:"YouTube Fire", layout:"hero", style:"vivid",
      thumbBg:"linear-gradient(135deg,#dc2626,#ea580c,#f97316)",
      thumbEls:[
        {y:"-18%",x:"62%",w:"55px",h:"55px",bg:"rgba(255,255,255,0.1)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"rgba(255,236,137,0.8)"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(255,255,255,0.18)",r:"4px"},
      ],
      bg:["#dc2626","#f97316"], angle:135, textColor:"#fff", accent:"#FFEC89",
      lines:["I BUILT THIS IN 24H","Full Breakdown Inside","10M Views · Subscribe Now"] },

    { id:"t40", cat:"video", w:1920, h:1080, name:"YouTube Dark Neon", layout:"hero", style:"cyber",
      thumbBg:"radial-gradient(ellipse at 30% 50%,rgba(0,255,159,.15) 0%,transparent 50%),radial-gradient(ellipse at 70% 50%,rgba(124,58,237,.15) 0%,transparent 50%),linear-gradient(135deg,#050508,#0a0a10)",
      thumbEls:[
        {y:"12%",x:"0",w:"28%",h:"3px",bg:"#00ff9f"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(240,240,248,0.9)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#00ff9f"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(240,240,248,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(0,255,159,0.18)",r:"4px"},
      ],
      bg:["#050508","#0a0a10"], angle:135, textColor:"#f0f0f8", accent:"#00ff9f",
      lines:["MUST WATCH","The Truth About AI","Episode 47 · Tech Show"] },

    { id:"t41", cat:"video", w:1920, h:1080, name:"Podcast Cover", layout:"hero", style:"gradient-purple",
      thumbBg:"radial-gradient(ellipse at 50% 50%,rgba(124,58,237,.5) 0%,transparent 60%),linear-gradient(135deg,#0f0c29,#1a0f08)",
      thumbEls:[
        {y:"-18%",x:"62%",w:"55px",h:"55px",bg:"rgba(124,58,237,0.3)",r:"50%"},
        {y:"55%",x:"-8%",w:"50px",h:"50px",bg:"rgba(236,72,153,0.2)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#a78bfa"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#7c3aed",r:"4px"},
      ],
      bg:["#0f0c29","#1a0f08"], angle:135, textColor:"#fff", accent:"#a78bfa",
      lines:["THE FUTURE SHOW","Episode 12","with Jane & John"] },

    /* ── Social (new) ───────────────────────────── */
    { id:"t42", cat:"social", w:1080, h:1080, name:"Midnight Rose", layout:"hero", style:"gradient-rose",
      thumbBg:"radial-gradient(ellipse at 30% 70%,rgba(236,72,153,.6) 0%,transparent 50%),radial-gradient(ellipse at 70% 20%,rgba(168,85,247,.5) 0%,transparent 50%),linear-gradient(135deg,#0d0118,#1a0830)",
      thumbEls:[
        {y:"-20%",x:"55%",w:"55px",h:"55px",bg:"rgba(236,72,153,0.3)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#f472b6"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#db2777",r:"4px"},
      ],
      bg:["#0d0118","#1a0830","#0d0118"], angle:135, textColor:"#fff", accent:"#f472b6",
      lines:["MIDNIGHT ROSE","Beauty Without Limit","Shop the edit →"] },

    { id:"t43", cat:"social", w:1080, h:1080, name:"Sage Minimal", layout:"editorial", style:"sage",
      thumbBg:"linear-gradient(160deg,#d1e7d0,#a8c5a2,#8fad8a)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"rgba(36,68,34,0.65)",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(36,68,34,0.4)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(36,68,34,0.88)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(36,68,34,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(36,68,34,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#2d5228",r:"2px"},
      ],
      bg:["#d1e7d0","#8fad8a"], angle:160, textColor:"#1a3318", accent:"#2d5228",
      lines:["sage & slow","Living mindfully, growing gently","@sagelife"] },

    { id:"t44", cat:"social", w:1080, h:1080, name:"Cobalt Wave", layout:"hero", style:"dark-gradient",
      thumbBg:"radial-gradient(ellipse at 20% 80%,rgba(37,99,235,.55) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(6,182,212,.4) 0%,transparent 50%),linear-gradient(160deg,#0a0f1e,#0f1f3d)",
      thumbEls:[
        {y:"-18%",x:"60%",w:"60px",h:"60px",bg:"rgba(37,99,235,0.25)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(224,231,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#60a5fa"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(224,231,255,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#2563eb",r:"4px"},
      ],
      bg:["#0a0f1e","#0f1f3d","#0a2456"], angle:160, textColor:"#e0e7ff", accent:"#60a5fa",
      lines:["Cobalt Wave","Depth & clarity in design","Explore the series →"] },

    { id:"t45", cat:"social", w:1080, h:1080, name:"Duotone Punch", layout:"poster", style:"vivid",
      thumbBg:"linear-gradient(135deg,#f97316 50%,#1e3a5f 50%)",
      thumbEls:[
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.45)"},
        {y:"29%",x:"10%",w:"80%",h:"14px",bg:"rgba(255,255,255,0.95)",r:"2px"},
        {y:"48%",x:"5%",w:"90%",h:"1px",bg:"rgba(255,255,255,0.45)"},
        {y:"57%",x:"18%",w:"64%",h:"8px",bg:"rgba(255,255,255,0.65)",r:"2px"},
        {y:"74%",x:"30%",w:"40%",h:"10px",bg:"rgba(255,255,255,0.3)",r:"3px"},
      ],
      bg:["#f97316","#1e3a5f"], angle:90, textColor:"#fff", accent:"#FFEC89",
      lines:["BOLD MOVES","The contrast collection","Summer 2024"] },

    { id:"t46", cat:"social", w:1080, h:1080, name:"Velvet Rouge", layout:"editorial", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 50% 20%,rgba(139,0,0,.3) 0%,transparent 55%),linear-gradient(180deg,#1a0000,#2d0a0a,#3d1010)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#ef4444",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(239,68,68,0.4)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(255,245,245,0.92)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(255,245,245,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(255,245,245,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#ef4444",r:"2px"},
      ],
      bg:["#1a0000","#2d0a0a"], angle:180, textColor:"#fff5f5", accent:"#ef4444",
      lines:["VELVET ROUGE","Passion, curated.","@velvetrouge"] },

    { id:"t47", cat:"social", w:1080, h:1080, name:"Acid Lemon", layout:"poster", style:"vivid",
      thumbBg:"linear-gradient(135deg,#ecff00,#a8ff00,#00ff87)",
      thumbEls:[
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(0,0,0,0.28)"},
        {y:"28%",x:"10%",w:"80%",h:"13px",bg:"rgba(0,0,0,0.88)",r:"2px"},
        {y:"47%",x:"5%",w:"90%",h:"1px",bg:"rgba(0,0,0,0.28)"},
        {y:"56%",x:"18%",w:"64%",h:"7px",bg:"rgba(0,0,0,0.55)",r:"2px"},
        {y:"72%",x:"28%",w:"44%",h:"10px",bg:"rgba(0,0,0,0.2)",r:"3px"},
      ],
      bg:["#ecff00","#a8ff00"], angle:135, textColor:"#0a1a00", accent:"#006622",
      lines:["ACID DROP","The zesty creative drop","Drop 003 · June 2024"] },

    { id:"t48", cat:"social", w:1080, h:1080, name:"Arctic Frost", layout:"minimal", style:"light-gradient",
      thumbBg:"linear-gradient(135deg,#e0f2fe,#bae6fd,#f0f9ff)",
      thumbEls:[
        {y:"30%",x:"22%",w:"56%",h:"11px",bg:"rgba(7,89,133,0.88)",r:"2px"},
        {y:"49%",x:"40%",w:"20%",h:"2px",bg:"#0284c7"},
        {y:"57%",x:"16%",w:"68%",h:"6px",bg:"rgba(7,89,133,0.35)",r:"2px"},
      ],
      bg:["#e0f2fe","#f0f9ff"], angle:135, textColor:"#075985", accent:"#0284c7",
      lines:["Arctic Frost","Coldplay. Clarity. Clean.","@arcticfrost"] },

    { id:"t49", cat:"social", w:1080, h:1080, name:"Copper Luxe", layout:"editorial", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 40% 30%,rgba(180,83,9,.35) 0%,transparent 55%),linear-gradient(135deg,#0f0a06,#1c1208,#2a1a0a)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#d97706",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(217,119,6,0.4)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(255,248,235,0.92)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(255,248,235,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(255,248,235,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#d97706",r:"2px"},
      ],
      bg:["#0f0a06","#2a1a0a"], angle:135, textColor:"#fff8eb", accent:"#d97706",
      lines:["COPPER LUXE","Refined. Raw. Radiant.","2024 Collection"] },

    { id:"t50", cat:"social", w:1080, h:1080, name:"Holographic", layout:"hero", style:"holographic",
      thumbBg:"conic-gradient(from 0deg at 50% 50%,#ff006e,#8338ec,#3a86ff,#06d6a0,#ffbe0b,#ff006e)",
      thumbEls:[
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"rgba(255,255,255,0.8)"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.5)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(255,255,255,0.2)",r:"4px"},
      ],
      bg:["#ff006e","#8338ec","#3a86ff"], angle:135, textColor:"#fff", accent:"#fff",
      lines:["HOLOGRAPHIC","Beyond the spectrum","Issue 01 · 2024"] },

    { id:"t51", cat:"social", w:1080, h:1920, tall:true, name:"Neon Pink Story", layout:"poster", style:"gradient-rose",
      thumbBg:"radial-gradient(ellipse at 50% 30%,rgba(236,72,153,.5) 0%,transparent 55%),linear-gradient(180deg,#0f0010,#1e0025,#0a000f)",
      thumbEls:[
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(236,72,153,0.35)"},
        {y:"30%",x:"10%",w:"80%",h:"13px",bg:"rgba(249,168,212,0.9)",r:"2px"},
        {y:"50%",x:"5%",w:"90%",h:"1px",bg:"rgba(236,72,153,0.35)"},
        {y:"60%",x:"18%",w:"64%",h:"7px",bg:"rgba(249,168,212,0.5)",r:"2px"},
        {y:"77%",x:"32%",w:"36%",h:"8px",bg:"rgba(236,72,153,0.25)",r:"2px"},
      ],
      bg:["#0f0010","#1e0025"], angle:180, textColor:"#fdf2f8", accent:"#f472b6",
      lines:["AFTER DARK","The night is young","Story · Tap to see more"] },

    /* ── Presentation (new) ─────────────────────── */
    { id:"t52", cat:"presentation", w:1280, h:720, name:"Silicon Pitch", layout:"hero", style:"dark",
      thumbBg:"linear-gradient(135deg,#0a0a0f,#12121a,#0d0d17)",
      thumbEls:[
        {y:"12%",x:"5%",w:"25%",h:"3px",bg:"#3b82f6"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(228,228,231,0.88)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#3b82f6"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(228,228,231,0.38)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#3b82f6",r:"4px"},
      ],
      bg:["#0a0a0f","#0d0d17"], angle:135, textColor:"#e4e4e7", accent:"#3b82f6",
      lines:["SERIES A PITCH","Building the future of work","YC W24 · $2M Raised"] },

    { id:"t53", cat:"presentation", w:1280, h:720, name:"Conference Gold", layout:"hero", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 60% 30%,rgba(251,191,36,.2) 0%,transparent 55%),linear-gradient(135deg,#0a0805,#1a1208)",
      thumbEls:[
        {y:"-18%",x:"60%",w:"55px",h:"55px",bg:"rgba(251,191,36,0.18)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,248,220,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#fbbf24"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,248,220,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(251,191,36,0.65)",r:"4px"},
      ],
      bg:["#0a0805","#1a1208"], angle:135, textColor:"#fff8dc", accent:"#fbbf24",
      lines:["KEYNOTE 2025","Global Leadership Summit","Day 1 · Main Stage"] },

    { id:"t54", cat:"presentation", w:1280, h:720, name:"Lavender Dream", layout:"minimal", style:"light-gradient",
      thumbBg:"linear-gradient(135deg,#f5f3ff,#ede9fe,#ddd6fe)",
      thumbEls:[
        {y:"30%",x:"22%",w:"56%",h:"11px",bg:"rgba(76,29,149,0.88)",r:"2px"},
        {y:"49%",x:"40%",w:"20%",h:"2px",bg:"#7c3aed"},
        {y:"57%",x:"16%",w:"68%",h:"6px",bg:"rgba(76,29,149,0.35)",r:"2px"},
        {y:"69%",x:"28%",w:"44%",h:"10px",bg:"rgba(124,58,237,0.12)",r:"3px"},
      ],
      bg:["#f5f3ff","#ddd6fe"], angle:135, textColor:"#4c1d95", accent:"#7c3aed",
      lines:["Brand Identity","Visual Design System 2025","Creative Direction"] },

    { id:"t55", cat:"presentation", w:1280, h:720, name:"Brutalist Grid", layout:"poster", style:"brutalist",
      thumbBg:"#f5f5f0",
      thumbEls:[
        {y:"8%",x:"0%",w:"100%",h:"4px",bg:"#0a0a0a",r:"0"},
        {y:"20%",x:"5%",w:"90%",h:"16px",bg:"#0a0a0a",r:"0"},
        {y:"40%",x:"5%",w:"70%",h:"10px",bg:"rgba(0,0,0,0.5)",r:"0"},
        {y:"55%",x:"5%",w:"50%",h:"10px",bg:"rgba(0,0,0,0.3)",r:"0"},
        {y:"76%",x:"0%",w:"100%",h:"4px",bg:"#0a0a0a",r:"0"},
      ],
      bg:["#f5f5f0","#f0f0e8"], angle:0, textColor:"#0a0a0a", accent:"#e53e3e",
      lines:["BRUTALIST","Function is form.","2024 Manifesto"] },

    /* ── Webpage (new) ──────────────────────────── */
    { id:"t56", cat:"webpage", w:1440, h:900, name:"Apple Clean", layout:"minimal", style:"light",
      thumbBg:"linear-gradient(180deg,#ffffff,#f5f5f7)",
      thumbEls:[
        {y:"28%",x:"25%",w:"50%",h:"12px",bg:"rgba(0,0,0,0.88)",r:"2px"},
        {y:"47%",x:"35%",w:"30%",h:"2px",bg:"rgba(0,0,0,0.2)"},
        {y:"55%",x:"20%",w:"60%",h:"7px",bg:"rgba(0,0,0,0.35)",r:"2px"},
        {y:"68%",x:"35%",w:"30%",h:"12px",bg:"#0a0a0a",r:"4px"},
      ],
      bg:["#ffffff","#f5f5f7"], angle:180, textColor:"#1d1d1f", accent:"#0071e3",
      lines:["Think different.","The most personal computer yet.","Order now →"] },

    { id:"t57", cat:"webpage", w:1440, h:900, name:"Vercel Black", layout:"minimal", style:"pure-dark",
      thumbBg:"#000000",
      thumbEls:[
        {y:"28%",x:"22%",w:"56%",h:"12px",bg:"rgba(255,255,255,0.95)",r:"2px"},
        {y:"47%",x:"38%",w:"24%",h:"2px",bg:"rgba(255,255,255,0.3)"},
        {y:"55%",x:"18%",w:"64%",h:"7px",bg:"rgba(255,255,255,0.38)",r:"2px"},
        {y:"68%",x:"34%",w:"32%",h:"12px",bg:"rgba(255,255,255,0.92)",r:"4px"},
      ],
      bg:["#000000","#0a0a0a"], angle:0, textColor:"#ffffff", accent:"#ffffff",
      lines:["Develop. Preview. Ship.","The platform for frontend teams.","Start deploying →"] },

    { id:"t58", cat:"webpage", w:1440, h:900, name:"Framer Aurora", layout:"hero", style:"gradient-purple",
      thumbBg:"radial-gradient(ellipse at 20% 50%,rgba(124,58,237,.4) 0%,transparent 50%),radial-gradient(ellipse at 80% 50%,rgba(236,72,153,.35) 0%,transparent 50%),radial-gradient(ellipse at 50% 0%,rgba(99,91,255,.3) 0%,transparent 40%),linear-gradient(135deg,#0d0220,#100835)",
      thumbEls:[
        {y:"-18%",x:"35%",w:"65px",h:"65px",bg:"rgba(124,58,237,0.2)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#c084fc"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(124,58,237,0.75)",r:"4px"},
      ],
      bg:["#0d0220","#100835","#1a0545"], angle:135, textColor:"#faf5ff", accent:"#c084fc",
      lines:["Build sites that move.","The web builder for design teams.","Get started free →"] },

    { id:"t59", cat:"webpage", w:1440, h:900, name:"Ecommerce Fresh", layout:"hero", style:"light",
      thumbBg:"linear-gradient(135deg,#f0fdf4,#dcfce7)",
      thumbEls:[
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(6,78,59,0.88)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#059669"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(6,78,59,0.45)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#065f46",r:"4px"},
      ],
      bg:["#f0fdf4","#dcfce7"], angle:135, textColor:"#064e3b", accent:"#059669",
      lines:["Natural. Organic. Fresh.","100% sustainably sourced","Shop the collection →"] },

    { id:"t60", cat:"webpage", w:1440, h:900, name:"SaaS Indigo", layout:"hero", style:"gradient-purple",
      thumbBg:"radial-gradient(ellipse at 50% 0%,rgba(99,102,241,.5) 0%,transparent 50%),linear-gradient(180deg,#1e1b4b,#312e81,#1e1b4b)",
      thumbEls:[
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(224,231,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#a5b4fc"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(224,231,255,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#6366f1",r:"4px"},
      ],
      bg:["#1e1b4b","#312e81"], angle:180, textColor:"#e0e7ff", accent:"#a5b4fc",
      lines:["Analytics, simplified.","Real-time insights for modern teams.","Start free trial →"] },

    /* ── Print (new) ────────────────────────────── */
    { id:"t61", cat:"print", w:595, h:842, tall:true, name:"Art Deco Noir", layout:"poster", style:"art-deco",
      thumbBg:"radial-gradient(ellipse at 50% 10%,rgba(255,215,0,.2) 0%,transparent 40%),linear-gradient(180deg,#0a0800,#111100,#1a1800)",
      thumbEls:[
        {y:"8%",x:"30%",w:"40%",h:"2px",bg:"rgba(255,215,0,0.5)"},
        {y:"13%",x:"35%",w:"30%",h:"1px",bg:"rgba(255,215,0,0.3)"},
        {y:"22%",x:"10%",w:"80%",h:"14px",bg:"rgba(255,215,0,0.9)",r:"1px"},
        {y:"40%",x:"15%",w:"70%",h:"1px",bg:"rgba(255,215,0,0.3)"},
        {y:"48%",x:"20%",w:"60%",h:"8px",bg:"rgba(255,215,0,0.55)",r:"1px"},
        {y:"62%",x:"15%",w:"70%",h:"1px",bg:"rgba(255,215,0,0.3)"},
        {y:"75%",x:"30%",w:"40%",h:"6px",bg:"rgba(255,215,0,0.25)",r:"1px"},
      ],
      bg:["#0a0800","#1a1800"], angle:180, textColor:"#ffd700", accent:"#ffd700",
      lines:["ART DECO","The Golden Age","1920 · Exhibition"] },

    { id:"t62", cat:"print", w:595, h:842, tall:true, name:"Swiss Grid", layout:"editorial", style:"swiss",
      thumbBg:"#f5f5f5",
      thumbEls:[
        {y:"10%",x:"5%",w:"90%",h:"3px",bg:"#e53e3e",r:"0"},
        {y:"20%",x:"5%",w:"15%",h:"55%",bg:"#e53e3e",r:"0"},
        {y:"22%",x:"24%",w:"72%",h:"12px",bg:"#0a0a0a",r:"0"},
        {y:"38%",x:"24%",w:"60%",h:"8px",bg:"rgba(0,0,0,0.65)",r:"0"},
        {y:"52%",x:"24%",w:"50%",h:"7px",bg:"rgba(0,0,0,0.45)",r:"0"},
        {y:"64%",x:"24%",w:"40%",h:"6px",bg:"rgba(0,0,0,0.3)",r:"0"},
      ],
      bg:["#f5f5f5","#ebebeb"], angle:0, textColor:"#0a0a0a", accent:"#e53e3e",
      lines:["HELVETICA","Typographic Modernism","Zurich · 1957"] },

    { id:"t63", cat:"print", w:595, h:842, tall:true, name:"Risograph", layout:"hero", style:"vivid",
      thumbBg:"linear-gradient(135deg,#ff6b35 50%,#00b4d8 50%)",
      thumbEls:[
        {y:"-18%",x:"55%",w:"65px",h:"65px",bg:"rgba(255,255,255,0.15)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.95)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"rgba(255,255,255,0.7)"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.5)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(255,255,255,0.2)",r:"4px"},
      ],
      bg:["#ff6b35","#00b4d8"], angle:90, textColor:"#fff", accent:"#fff",
      lines:["RISO PRINT","Two-colour edition","Edition of 200"] },

    { id:"t64", cat:"print", w:595, h:842, tall:true, name:"Vintage Paper", layout:"minimal", style:"vintage",
      thumbBg:"linear-gradient(160deg,#e8d5b0,#d4b896,#c4a57a)",
      thumbEls:[
        {y:"28%",x:"18%",w:"64%",h:"12px",bg:"rgba(60,35,10,0.82)",r:"1px"},
        {y:"46%",x:"36%",w:"28%",h:"2px",bg:"rgba(100,65,25,0.6)"},
        {y:"54%",x:"12%",w:"76%",h:"7px",bg:"rgba(60,35,10,0.45)",r:"1px"},
        {y:"66%",x:"20%",w:"60%",h:"6px",bg:"rgba(60,35,10,0.28)",r:"1px"},
      ],
      bg:["#e8d5b0","#c4a57a"], angle:160, textColor:"#3c230a", accent:"#7c4a1a",
      lines:["PRINTED MATTER","Selected works, hand-curated","Autumn · MMXXIV"] },

    /* ── Portfolio (new) ────────────────────────── */
    { id:"t65", cat:"portfolio", w:1200, h:800, name:"Bauhaus Primary", layout:"poster", style:"vivid",
      thumbBg:"#f5f5f0",
      thumbEls:[
        {y:"8%",x:"5%",w:"42%",h:"42%",bg:"#e53e3e",r:"0"},
        {y:"8%",x:"53%",w:"42%",h:"42%",bg:"#3182ce",r:"0"},
        {y:"57%",x:"5%",w:"90%",h:"12px",bg:"#0a0a0a",r:"0"},
        {y:"75%",x:"5%",w:"70%",h:"8px",bg:"rgba(0,0,0,0.45)",r:"0"},
      ],
      bg:["#f5f5f0","#ebebeb"], angle:0, textColor:"#0a0a0a", accent:"#e53e3e",
      lines:["BAUHAUS","Form follows function","Portfolio 2024"] },

    { id:"t66", cat:"portfolio", w:1200, h:800, name:"Art Nouveau", layout:"editorial", style:"sage",
      thumbBg:"linear-gradient(160deg,#f0e6d3,#e8d5b8,#d4c4a0)",
      thumbEls:[
        {y:"10%",x:"9%",w:"5px",h:"78%",bg:"rgba(74,55,18,0.4)",r:"8px"},
        {y:"10%",x:"86%",w:"5px",h:"78%",bg:"rgba(74,55,18,0.4)",r:"8px"},
        {y:"20%",x:"18%",w:"65%",h:"12px",bg:"rgba(74,55,18,0.82)",r:"2px"},
        {y:"38%",x:"18%",w:"50%",h:"8px",bg:"rgba(74,55,18,0.55)",r:"1px"},
        {y:"53%",x:"18%",w:"40%",h:"7px",bg:"rgba(74,55,18,0.35)",r:"1px"},
        {y:"67%",x:"28%",w:"40%",h:"8px",bg:"rgba(74,55,18,0.2)",r:"2px"},
      ],
      bg:["#f0e6d3","#d4c4a0"], angle:160, textColor:"#3a2d10", accent:"#7a5c1e",
      lines:["Art Nouveau","Organic beauty in design","Selected Works 2024"] },

    { id:"t67", cat:"portfolio", w:1200, h:800, name:"Brutalist BW", layout:"poster", style:"brutalist",
      thumbBg:"#ffffff",
      thumbEls:[
        {y:"5%",x:"0%",w:"100%",h:"5px",bg:"#000000",r:"0"},
        {y:"18%",x:"5%",w:"90%",h:"18px",bg:"#000000",r:"0"},
        {y:"40%",x:"5%",w:"60%",h:"10px",bg:"rgba(0,0,0,0.5)",r:"0"},
        {y:"55%",x:"5%",w:"40%",h:"10px",bg:"rgba(0,0,0,0.3)",r:"0"},
        {y:"76%",x:"0%",w:"100%",h:"5px",bg:"#000000",r:"0"},
      ],
      bg:["#ffffff","#f5f5f5"], angle:0, textColor:"#000000", accent:"#000000",
      lines:["PORTFOLIO","No decoration. Pure vision.","2019–2024"] },

    /* ── Video (new) ────────────────────────────── */
    { id:"t68", cat:"video", w:1920, h:1080, name:"Tutorial Blue", layout:"hero", style:"dark-gradient",
      thumbBg:"radial-gradient(ellipse at 30% 50%,rgba(37,99,235,.45) 0%,transparent 50%),linear-gradient(135deg,#0a0f1e,#0f1f3d,#112244)",
      thumbEls:[
        {y:"12%",x:"5%",w:"20%",h:"3px",bg:"#3b82f6"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(224,231,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"#60a5fa"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(224,231,255,0.42)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"#2563eb",r:"4px"},
      ],
      bg:["#0a0f1e","#112244"], angle:135, textColor:"#e0e7ff", accent:"#60a5fa",
      lines:["How I code in 2025","Full tutorial walkthrough","50K views · 38 min"] },

    { id:"t69", cat:"video", w:1920, h:1080, name:"Vlog Sunset", layout:"editorial", style:"warm-gradient",
      thumbBg:"linear-gradient(135deg,#fde68a,#fb923c,#ef4444)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"rgba(255,255,255,0.7)",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(255,255,255,0.45)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(255,255,255,0.65)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(255,255,255,0.42)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"rgba(255,255,255,0.22)",r:"2px"},
      ],
      bg:["#fde68a","#ef4444"], angle:135, textColor:"#fff", accent:"#fff",
      lines:["GOLDEN HOUR VLOG","Lost in Lisbon","Day 3 of 30"] },

    { id:"t70", cat:"video", w:1920, h:1080, name:"Crypto Hype", layout:"poster", style:"cyber",
      thumbBg:"radial-gradient(ellipse at 50% 30%,rgba(250,204,21,.15) 0%,transparent 50%),linear-gradient(135deg,#050508,#0a0a10)",
      thumbEls:[
        {y:"12%",x:"0",w:"28%",h:"3px",bg:"#facc15"},
        {y:"20%",x:"5%",w:"90%",h:"1px",bg:"rgba(250,204,21,0.2)"},
        {y:"30%",x:"10%",w:"80%",h:"13px",bg:"rgba(250,204,21,0.9)",r:"2px"},
        {y:"49%",x:"5%",w:"90%",h:"1px",bg:"rgba(250,204,21,0.2)"},
        {y:"59%",x:"18%",w:"64%",h:"7px",bg:"rgba(250,204,21,0.45)",r:"2px"},
        {y:"76%",x:"32%",w:"36%",h:"8px",bg:"rgba(250,204,21,0.2)",r:"2px"},
      ],
      bg:["#050508","#0a0a10"], angle:135, textColor:"#facc15", accent:"#facc15",
      lines:["BTC TO $1M","Why I'm all in (not advice)","Episode 99 · CoinCast"] },

    /* ── Marketing (new) ────────────────────────── */
    { id:"t71", cat:"marketing", w:1080, h:1080, name:"Studio Gradient", layout:"hero", style:"gradient-rose",
      thumbBg:"linear-gradient(135deg,#f43f5e,#ec4899,#a855f7,#8b5cf6)",
      thumbEls:[
        {y:"-18%",x:"58%",w:"55px",h:"55px",bg:"rgba(255,255,255,0.12)",r:"50%"},
        {y:"27%",x:"10%",w:"80%",h:"10px",bg:"rgba(255,255,255,0.92)",r:"2px"},
        {y:"43%",x:"35%",w:"30%",h:"2px",bg:"rgba(255,255,255,0.7)"},
        {y:"51%",x:"15%",w:"70%",h:"6px",bg:"rgba(255,255,255,0.5)",r:"2px"},
        {y:"66%",x:"28%",w:"44%",h:"13px",bg:"rgba(255,255,255,0.2)",r:"4px"},
      ],
      bg:["#f43f5e","#a855f7","#8b5cf6"], angle:135, textColor:"#fff", accent:"#fda4af",
      lines:["STUDIO DROP","New collection every Friday","Sign up for early access →"] },

    { id:"t72", cat:"marketing", w:1200, h:628, name:"Emerald Luxury", layout:"editorial", style:"dark-gold",
      thumbBg:"radial-gradient(ellipse at 40% 30%,rgba(6,78,59,.4) 0%,transparent 55%),linear-gradient(135deg,#021a0f,#042a18,#064e3b)",
      thumbEls:[
        {y:"18%",x:"8%",w:"3px",h:"62%",bg:"#10b981",r:"1px"},
        {y:"22%",x:"14%",w:"36%",h:"5px",bg:"rgba(16,185,129,0.4)",r:"1px"},
        {y:"33%",x:"14%",w:"72%",h:"11px",bg:"rgba(236,253,245,0.92)",r:"2px"},
        {y:"48%",x:"14%",w:"65%",h:"8px",bg:"rgba(236,253,245,0.55)",r:"1px"},
        {y:"62%",x:"14%",w:"55%",h:"6px",bg:"rgba(236,253,245,0.32)",r:"1px"},
        {y:"76%",x:"14%",w:"28%",h:"7px",bg:"#10b981",r:"2px"},
      ],
      bg:["#021a0f","#064e3b"], angle:135, textColor:"#ecfdf5", accent:"#10b981",
      lines:["Emerald Collection","Nature, elevated.","View lookbook →"] },

    /* ── Calligraphy ─ inspired by dataset: Arabic, Chinese, Ottoman, Latin ── */

    /* Arabic — Nazanin/Titr/Homa styles → Amiri/Cairo aesthetic */
    { id:"t73", cat:"calligraphy", w:1080, h:1080, name:"Arabic Splendour", layout:"editorial", style:"arabic-calligraphy",
      thumbBg:"radial-gradient(ellipse at 50% 20%,rgba(218,165,32,.25) 0%,transparent 50%),radial-gradient(ellipse at 20% 80%,rgba(180,83,9,.2) 0%,transparent 40%),linear-gradient(160deg,#0d0700,#1a0e00,#241200)",
      thumbEls:[
        /* decorative arch at top */
        {y:"5%",x:"30%",w:"40%",h:"2px",bg:"rgba(218,165,32,0.5)"},
        {y:"8%",x:"35%",w:"30%",h:"1px",bg:"rgba(218,165,32,0.3)"},
        /* central calligraphy block */
        {y:"22%",x:"12%",w:"76%",h:"14px",bg:"rgba(255,236,153,0.92)",r:"3px"},
        {y:"40%",x:"18%",w:"64%",h:"9px",bg:"rgba(255,236,153,0.62)",r:"2px"},
        {y:"52%",x:"22%",w:"56%",h:"8px",bg:"rgba(255,236,153,0.42)",r:"2px"},
        /* bottom rule */
        {y:"66%",x:"15%",w:"70%",h:"1px",bg:"rgba(218,165,32,0.4)"},
        {y:"70%",x:"30%",w:"40%",h:"1px",bg:"rgba(218,165,32,0.2)"},
        /* footer */
        {y:"78%",x:"28%",w:"44%",h:"8px",bg:"rgba(255,236,153,0.22)",r:"2px"},
      ],
      bg:["#0d0700","#1a0e00","#241200"], angle:160, textColor:"#fef3c7", accent:"#d4a017",
      lines:["بِسْمِ اللّهِ","In the Name of God","Arabic · Amiri · Est. VIII c."] },

    /* Arabic — Mitra/Zar/Lotus → lighter parchment tone */
    { id:"t74", cat:"calligraphy", w:1080, h:1080, name:"Nashki Parchment", layout:"minimal", style:"arabic-calligraphy",
      thumbBg:"radial-gradient(ellipse at 50% 30%,rgba(180,140,80,.2) 0%,transparent 55%),linear-gradient(160deg,#f5ecd7,#ede0c4,#e0cfa8)",
      thumbEls:[
        {y:"18%",x:"20%",w:"60%",h:"13px",bg:"rgba(60,35,5,0.82)",r:"3px"},
        {y:"36%",x:"28%",w:"44%",h:"2px",bg:"rgba(139,90,20,0.5)"},
        {y:"44%",x:"14%",w:"72%",h:"9px",bg:"rgba(60,35,5,0.52)",r:"2px"},
        {y:"57%",x:"18%",w:"64%",h:"7px",bg:"rgba(60,35,5,0.32)",r:"2px"},
        {y:"70%",x:"25%",w:"50%",h:"8px",bg:"rgba(139,90,20,0.2)",r:"2px"},
      ],
      bg:["#f5ecd7","#e0cfa8"], angle:160, textColor:"#3c2305", accent:"#8b5a14",
      lines:["الخط العربي","The Art of Arabic Writing","Naskh · Scheherazade · Classic"] },

    /* Chinese — HeiTi/SongTi → Noto Sans SC / Noto Serif SC aesthetic */
    { id:"t75", cat:"calligraphy", w:1080, h:1080, name:"Chinese Ink", layout:"editorial", style:"chinese-ink",
      thumbBg:"linear-gradient(160deg,#0a0a0a,#111111,#0d0d0d)",
      thumbEls:[
        /* vertical rule like ink wash border */
        {y:"10%",x:"10%",w:"3px",h:"78%",bg:"rgba(255,255,255,0.12)",r:"1px"},
        {y:"10%",x:"87%",w:"3px",h:"78%",bg:"rgba(255,255,255,0.12)",r:"1px"},
        /* main text block */
        {y:"22%",x:"18%",w:"64%",h:"12px",bg:"rgba(255,255,255,0.92)",r:"1px"},
        {y:"38%",x:"22%",w:"56%",h:"9px",bg:"rgba(255,255,255,0.6)",r:"1px"},
        {y:"51%",x:"28%",w:"44%",h:"8px",bg:"rgba(255,255,255,0.38)",r:"1px"},
        /* small red seal mark */
        {y:"65%",x:"42%",w:"16%",h:"16%",bg:"rgba(200,30,30,0.75)",r:"2px"},
      ],
      bg:["#0a0a0a","#111111"], angle:0, textColor:"#f5f5f5", accent:"#c81e1e",
      lines:["水墨之美","The Beauty of Ink","Noto Serif SC · Sumi-e"] },

    /* Chinese — KaiTi/LiShu → Ma Shan Zheng / ZCOOL brush aesthetic */
    { id:"t76", cat:"calligraphy", w:1080, h:1080, name:"Ink & Bamboo", layout:"minimal", style:"chinese-ink",
      thumbBg:"linear-gradient(160deg,#f0ede5,#e8e2d4,#ddd6c5)",
      thumbEls:[
        {y:"18%",x:"22%",w:"56%",h:"14px",bg:"rgba(30,20,5,0.85)",r:"2px"},
        {y:"38%",x:"38%",w:"24%",h:"2px",bg:"rgba(139,90,20,0.5)"},
        {y:"47%",x:"16%",w:"68%",h:"9px",bg:"rgba(30,20,5,0.5)",r:"1px"},
        {y:"60%",x:"20%",w:"60%",h:"7px",bg:"rgba(30,20,5,0.3)",r:"1px"},
        /* vertical bamboo stalks decoration */
        {y:"72%",x:"38%",w:"3px",h:"18%",bg:"rgba(60,100,30,0.35)",r:"1px"},
        {y:"72%",x:"49%",w:"3px",h:"18%",bg:"rgba(60,100,30,0.25)",r:"1px"},
        {y:"72%",x:"60%",w:"3px",h:"18%",bg:"rgba(60,100,30,0.2)",r:"1px"},
      ],
      bg:["#f0ede5","#ddd6c5"], angle:160, textColor:"#1e1405", accent:"#5a7820",
      lines:["竹影扫阶尘","Bamboo shadows sweep the steps","Ma Shan Zheng · ZCOOL"] },

    /* Ottoman — Divani style (ornate, imperial) */
    { id:"t77", cat:"calligraphy", w:1080, h:1080, name:"Ottoman Divani", layout:"editorial", style:"divani",
      thumbBg:"radial-gradient(ellipse at 50% 20%,rgba(0,100,80,.3) 0%,transparent 50%),linear-gradient(160deg,#021410,#03201a,#042a22)",
      thumbEls:[
        /* ornate top border */
        {y:"7%",x:"10%",w:"80%",h:"2px",bg:"rgba(180,215,180,0.5)"},
        {y:"10%",x:"20%",w:"60%",h:"1px",bg:"rgba(180,215,180,0.3)"},
        /* central script */
        {y:"22%",x:"12%",w:"76%",h:"13px",bg:"rgba(200,240,210,0.88)",r:"3px"},
        {y:"39%",x:"18%",w:"64%",h:"9px",bg:"rgba(200,240,210,0.58)",r:"2px"},
        {y:"51%",x:"24%",w:"52%",h:"7px",bg:"rgba(200,240,210,0.38)",r:"2px"},
        /* bottom ornamental border */
        {y:"65%",x:"20%",w:"60%",h:"1px",bg:"rgba(180,215,180,0.3)"},
        {y:"68%",x:"10%",w:"80%",h:"2px",bg:"rgba(180,215,180,0.5)"},
        /* footer */
        {y:"77%",x:"30%",w:"40%",h:"8px",bg:"rgba(200,240,210,0.2)",r:"2px"},
      ],
      bg:["#021410","#042a22"], angle:160, textColor:"#c8f0d2", accent:"#2d9a6a",
      lines:["Divani Hatt","Imperial Ottoman Script","Reem Kufi · XIV century"] },

    /* Ottoman — Nesih/Talik (flowing cursive) */
    { id:"t78", cat:"calligraphy", w:1080, h:1080, name:"Talik Flow", layout:"minimal", style:"nastaliq",
      thumbBg:"radial-gradient(ellipse at 30% 60%,rgba(120,60,180,.3) 0%,transparent 50%),linear-gradient(160deg,#0d0820,#14103a,#1a1450)",
      thumbEls:[
        {y:"22%",x:"14%",w:"72%",h:"13px",bg:"rgba(220,200,255,0.88)",r:"4px"},
        {y:"40%",x:"20%",w:"60%",h:"9px",bg:"rgba(220,200,255,0.55)",r:"3px"},
        {y:"53%",x:"28%",w:"44%",h:"7px",bg:"rgba(220,200,255,0.35)",r:"2px"},
        {y:"68%",x:"35%",w:"30%",h:"8px",bg:"rgba(167,139,250,0.3)",r:"3px"},
      ],
      bg:["#0d0820","#1a1450"], angle:160, textColor:"#dcd4ff", accent:"#a78bfa",
      lines:["Talik Hatt","The Flowing Ottoman Script","Gulzar · Nastaliq style"] },

    /* Latin Classic — Bookman/Century/Computer Modern → IM Fell / GFS Didot */
    { id:"t79", cat:"calligraphy", w:1080, h:1080, name:"Latin Antiqua", layout:"editorial", style:"latin-classic",
      thumbBg:"linear-gradient(160deg,#faf7f0,#f5f0e5,#ede5d5)",
      thumbEls:[
        /* decorative initial capital block */
        {y:"10%",x:"10%",w:"18%",h:"25%",bg:"rgba(100,60,20,0.12)",r:"2px"},
        {y:"11%",x:"11%",w:"15%",h:"23%",bg:"rgba(100,60,20,0.08)",r:"1px"},
        /* running text lines */
        {y:"12%",x:"32%",w:"58%",h:"8px",bg:"rgba(40,20,5,0.75)",r:"1px"},
        {y:"22%",x:"32%",w:"55%",h:"7px",bg:"rgba(40,20,5,0.55)",r:"1px"},
        {y:"32%",x:"10%",w:"80%",h:"7px",bg:"rgba(40,20,5,0.45)",r:"1px"},
        {y:"42%",x:"10%",w:"75%",h:"7px",bg:"rgba(40,20,5,0.35)",r:"1px"},
        {y:"52%",x:"10%",w:"80%",h:"6px",bg:"rgba(40,20,5,0.28)",r:"1px"},
        {y:"62%",x:"10%",w:"70%",h:"6px",bg:"rgba(40,20,5,0.22)",r:"1px"},
        /* colophon */
        {y:"76%",x:"30%",w:"40%",h:"2px",bg:"rgba(120,80,30,0.4)"},
        {y:"81%",x:"25%",w:"50%",h:"7px",bg:"rgba(40,20,5,0.2)",r:"1px"},
      ],
      bg:["#faf7f0","#ede5d5"], angle:160, textColor:"#281405", accent:"#7a4c1e",
      lines:["LOREM CLASSICA","Ars longa, vita brevis","IM Fell English · Roman · MDXXIV"] },
  ];

  /* ══ SHAPES / ELEMENTS DATA ══════════════════════════════ */
  const LINES_ELS = [
    { id:"l1", label:"Line",   svg:`<line x1="4" y1="16" x2="44" y2="16" stroke="#4b607f" stroke-width="2" stroke-linecap="round"/>`, create:()=>new fabric.Line([0,0,220,0],{stroke:"#1a0f08",strokeWidth:2,padding:10}) },
    { id:"l2", label:"Dashed", svg:`<line x1="4" y1="16" x2="44" y2="16" stroke="#4b607f" stroke-width="2" stroke-dasharray="5 4" stroke-linecap="round"/>`, create:()=>new fabric.Line([0,0,220,0],{stroke:"#1a0f08",strokeWidth:2,strokeDashArray:[8,6],padding:10}) },
    { id:"l3", label:"Thick",  svg:`<line x1="4" y1="16" x2="44" y2="16" stroke="#4b607f" stroke-width="5" stroke-linecap="round"/>`, create:()=>new fabric.Line([0,0,220,0],{stroke:"#1a0f08",strokeWidth:6,padding:10}) },
    { id:"l4", label:"Arrow",  svg:`<path d="M4 16h36M32 10l8 6-8 6" stroke="#4b607f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`, create:makeArrow },
  ];
  const SHAPES_ELS = [
    { id:"s1",  label:"Rectangle",    svg:`<rect x="6" y="8" width="36" height="24" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`,  create:()=>new fabric.Rect({width:240,height:160,fill:"#e8d8c9"}) },
    { id:"s2",  label:"Rounded",      svg:`<rect x="6" y="8" width="36" height="24" rx="6" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>new fabric.Rect({width:240,height:160,fill:"#e8d8c9",rx:16,ry:16}) },
    { id:"s3",  label:"Circle",       svg:`<circle cx="24" cy="16" r="12" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>new fabric.Circle({radius:100,fill:"#e8d8c9"}) },
    { id:"s4",  label:"Ellipse",      svg:`<ellipse cx="24" cy="16" rx="18" ry="10" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>new fabric.Ellipse({rx:140,ry:80,fill:"#e8d8c9"}) },
    { id:"s5",  label:"Triangle",     svg:`<polygon points="24,4 42,28 6,28" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>new fabric.Triangle({width:180,height:160,fill:"#e8d8c9"}) },
    { id:"s6",  label:"Diamond",      svg:`<polygon points="24,4 42,16 24,28 6,16" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>makeDiamond() },
    { id:"s7",  label:"Star",         svg:`<polygon points="24,4 27,15 38,15 29,21 32,32 24,26 16,32 19,21 10,15 21,15" fill="#FFEC89" stroke="#c4a800" stroke-width="1"/>`, create:()=>makeStar(5,90,45) },
    { id:"s8",  label:"Hexagon",      svg:`<polygon points="24,4 38,12 38,24 24,32 10,24 10,12" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>makeRegPoly(6,100) },
    { id:"s9",  label:"Rect Outline", svg:`<rect x="6" y="8" width="36" height="24" fill="none" stroke="#4b607f" stroke-width="2"/>`, create:()=>new fabric.Rect({width:240,height:160,fill:"transparent",stroke:"#4b607f",strokeWidth:2}) },
    { id:"s10", label:"Ring",         svg:`<circle cx="24" cy="16" r="12" fill="none" stroke="#4b607f" stroke-width="2"/>`, create:()=>new fabric.Circle({radius:100,fill:"transparent",stroke:"#4b607f",strokeWidth:3}) },
    { id:"s11", label:"Pentagon",     svg:`<polygon points="24,4 40,18 34,32 14,32 8,18" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>makeRegPoly(5,100) },
    { id:"s12", label:"Octagon",      svg:`<polygon points="14,4 34,4 44,14 44,26 34,36 14,36 4,26 4,14" fill="#e8d8c9" stroke="#c4a88a" stroke-width="1"/>`, create:()=>makeRegPoly(8,100) },
  ];
  const ICONS_ELS = [
    { id:"i1", label:"Heart",   color:"#f3701e", path:"M24 32s-14-9-14-18a8 8 0 0 1 14-5.3A8 8 0 0 1 38 14c0 9-14 18-14 18z" },
    { id:"i2", label:"Star",    color:"#FFEC89", path:"M24 6l3.6 11h11.6l-9.4 6.8 3.6 11L24 28l-9.4 6.8 3.6-11L9.8 17H21.4z" },
    { id:"i3", label:"Check",   color:"#2d7d5a", fill:"none", path:"M8 22l8 8L40 14" },
    { id:"i4", label:"Bolt",    color:"#f3701e", path:"M26 4L12 26h14l-4 18 18-24H26z" },
    { id:"i5", label:"Diamond", color:"#4A69B3", path:"M24 4l10 10L24 24 14 14z" },
    { id:"i6", label:"Smile",   color:"#f3701e", path:"M24 8a16 16 0 1 0 0 32 16 16 0 0 0 0-32zM17 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 6c-3.3 0-6-1.3-7.5-3.5h15C35 26.7 32.3 28 29 28h-2zm7-6a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" },
    { id:"i7", label:"Cloud",   color:"#4A69B3", path:"M36 28H16a10 10 0 0 1 0-20c.8 0 1.5.1 2.2.3A10 10 0 0 1 38 18h-2a10 10 0 1 1 0 10z" },
    { id:"i8", label:"Flame",   color:"#f3701e", path:"M28 4c0 0-4 8-4 14a8 8 0 0 1-4-6 14 14 0 1 0 14-10c0 2-6 6-6 2z" },
    { id:"i9", label:"Crown",   color:"#FFEC89", path:"M8 36l4-20 12 10 12-10 4 20H8z" },
    { id:"i10",label:"Lock",    color:"#6C171E", path:"M24 6a8 8 0 0 0-8 8v4h-4v20h24V18h-4v-4a8 8 0 0 0-8-8zm0 4a4 4 0 0 1 4 4v4H20v-4a4 4 0 0 1 4-4zm0 14a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" },
    { id:"i11",label:"Award",   color:"#f3701e", path:"M24 4l4 8h9l-7 6 3 9-9-5-9 5 3-9-7-6h9z" },
    { id:"i12",label:"Eye",     color:"#0d3d3a", path:"M4 24s6-14 20-14 20 14 20 14-6 14-20 14S4 24 4 24zm20 6a6 6 0 1 0 0-12 6 6 0 0 0 0 12z" },
  ];
  const DECO_ELS = [
    { id:"d1", label:"Wave",   svg:`<path d="M4 16 Q12 8 20 16 Q28 24 36 16 Q44 8 52 16" stroke="#4b607f" stroke-width="2" fill="none"/>`, create:()=>new fabric.Path("M 0 20 Q 30 0 60 20 Q 90 40 120 20 Q 150 0 180 20 Q 210 40 240 20",{stroke:"#4b607f",strokeWidth:2,fill:""}) },
    { id:"d2", label:"Zigzag", svg:`<polyline points="4,24 12,8 20,24 28,8 36,24 44,8 52,24" stroke="#4b607f" stroke-width="2" fill="none"/>`, create:()=>new fabric.Path("M 0 30 L 30 0 L 60 30 L 90 0 L 120 30 L 150 0 L 180 30",{stroke:"#4b607f",strokeWidth:2,fill:""}) },
    { id:"d3", label:"Dots",   svg:`<circle cx="8" cy="16" r="3" fill="#4b607f"/><circle cx="18" cy="16" r="3" fill="#4b607f"/><circle cx="28" cy="16" r="3" fill="#4b607f"/><circle cx="38" cy="16" r="3" fill="#4b607f"/>`, create:makeDots },
    { id:"d4", label:"Plus",   svg:`<rect x="20" y="8" width="8" height="24" rx="2" fill="#4b607f"/><rect x="8" y="20" width="32" height="8" rx="2" fill="#4b607f"/>`, create:makePlus },
    { id:"d5", label:"Cross",  svg:`<path d="M8 8l32 32M40 8L8 40" stroke="#4b607f" stroke-width="3" stroke-linecap="round"/>`, create:()=>new fabric.Path("M 0 0 L 60 60 M 60 0 L 0 60",{stroke:"#4b607f",strokeWidth:3,fill:"",strokeLineCap:"round"}) },
    { id:"d6", label:"Spark",  svg:`<path d="M24 4l2 14 14 2-14 2-2 14-2-14L8 20l14-2z" fill="#FFEC89"/>`, create:()=>makeStar(4,50,20) },
  ];

  /* ══ CANVAS INIT ══════════════════════════════════════════ */
  const workspaceEl = document.getElementById("workspace");
  const canvas = new fabric.Canvas("mainCanvas", {
    width:  workspaceEl.clientWidth,
    height: workspaceEl.clientHeight,
    backgroundColor: "#dde0e3",
    selection: true,
    preserveObjectStacking: true,
    stopContextMenu: true,
    uniformScaling: false,
    uniScaleKey: "shiftKey",
  });
  fabric.Object.prototype.set({
    borderColor:"#f3701e", cornerColor:"#f3701e", cornerStrokeColor:"#fff",
    cornerSize:10, cornerStyle:"circle", borderScaleFactor:1.5, transparentCorners:false,
  });

  function makePageRect() {
    return new fabric.Rect({
      left:0, top:0, width:PAGE_W, height:PAGE_H, fill:"#ffffff",
      selectable:false, evented:false, excludeFromExport:true,
      shadow: new fabric.Shadow({color:"rgba(0,0,0,0.16)",blur:32,offsetX:0,offsetY:6}),
      hoverCursor:"default",
    });
  }

  function initPage() {
    canvas.clear();
    canvas.backgroundColor = "#dde0e3";
    pageRect = makePageRect();
    canvas.add(pageRect);
    canvas.sendToBack(pageRect);
    fitPage();
    canvas.requestRenderAll();
  }

  function fitPage() {
    // In stack mode, fit the canvas to its page section
    if (workspaceEl.classList.contains("stack-mode")) {
      _fitPageStack(); return;
    }
    const pad = 80;
    const scale = Math.min((canvas.width - pad*2)/PAGE_W, (canvas.height - pad*2)/PAGE_H, 1.5);
    canvas.setViewportTransform([scale,0,0,scale,(canvas.width - PAGE_W*scale)/2,(canvas.height - PAGE_H*scale)/2]);
    updateZoomDisplay();
  }

  function _getStackScale() {
    const avail = Math.min(workspaceEl.clientWidth - 80, 1200);
    return avail / PAGE_W;
  }

  function _fitPageStack() {
    const scale = _getStackScale();
    const dW = Math.round(PAGE_W * scale);
    const dH = Math.round(PAGE_H * scale);
    canvas.setWidth(dW); canvas.setHeight(dH);
    canvas.setViewportTransform([scale,0,0,scale,0,0]);
    if(canvas.wrapperEl){ canvas.wrapperEl.style.width=dW+"px"; canvas.wrapperEl.style.height=dH+"px"; }
    if(canvas.upperCanvasEl){ canvas.upperCanvasEl.style.width=dW+"px"; canvas.upperCanvasEl.style.height=dH+"px"; }
    // Sync the page body size
    const body = document.getElementById("ps-body-"+currentPageIdx);
    if (body) { body.style.width = dW+"px"; body.style.height = dH+"px"; }
    // Sync header widths
    const hdr = body?.previousElementSibling;
    if (hdr) hdr.style.width = dW+"px";
    canvas.calcOffset(); canvas.requestRenderAll();
    updateZoomDisplay();
  }

  /* ══ RESIZE OBSERVER ══════════════════════════════════════ */
  new ResizeObserver(() => {
    if (workspaceEl.classList.contains("stack-mode")) {
      _fitPageStack(); return;
    }
    canvas.setWidth(workspaceEl.clientWidth);
    canvas.setHeight(workspaceEl.clientHeight);
    canvas.calcOffset(); canvas.requestRenderAll();
  }).observe(workspaceEl);

  /* ══ ZOOM ════════════════════════════════════════════════ */
  function updateZoomDisplay() {
    document.getElementById("zoomDisplay").textContent = Math.round(canvas.getZoom()*100) + "%";
  }
  canvas.on("mouse:wheel", opt => {
    opt.e.preventDefault();
    let z = canvas.getZoom() * (0.999 ** opt.e.deltaY);
    z = Math.min(Math.max(z, 0.04), 12);
    canvas.zoomToPoint({x:opt.e.offsetX, y:opt.e.offsetY}, z);
    updateZoomDisplay();
  });
  document.getElementById("zoomInBtn") .addEventListener("click", () => { canvas.setZoom(Math.min(canvas.getZoom()*1.18,12)); updateZoomDisplay(); });
  document.getElementById("zoomOutBtn").addEventListener("click", () => { canvas.setZoom(Math.max(canvas.getZoom()/1.18,0.04)); updateZoomDisplay(); });
  document.getElementById("zoomFitBtn").addEventListener("click", fitPage);
  document.getElementById("zoomDisplay").addEventListener("click", () => {
    canvas.setZoom(1);
    const vpt = canvas.viewportTransform;
    vpt[4] = (canvas.width - PAGE_W)/2; vpt[5] = (canvas.height - PAGE_H)/2;
    canvas.setViewportTransform(vpt); updateZoomDisplay();
  });

  /* ══ PAN ══════════════════════════════════════════════════ */
  document.addEventListener("keydown", e => {
    if (e.key===" " && e.target===document.body) { isSpaceDown=true; e.preventDefault(); canvas.defaultCursor="grab"; }
    if ((e.ctrlKey||e.metaKey)&&e.key==="z"&&!e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey||e.metaKey)&&(e.key==="y"||(e.shiftKey&&e.key==="z"))) { e.preventDefault(); redo(); }
    if ((e.ctrlKey||e.metaKey)&&e.key==="s") { e.preventDefault(); setAutoSaveSaved(); showToast("Saved","success"); }
    if ((e.ctrlKey||e.metaKey)&&e.key==="d") { e.preventDefault(); duplicateActive(); }
    if (e.key==="Delete"||e.key==="Backspace") { if (["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return; deleteActive(); }
    if (e.key==="Escape") { canvas.discardActiveObject(); canvas.requestRenderAll(); closeAllPopups(); }
  });
  document.addEventListener("keyup", e => { if (e.key===" ") { isSpaceDown=false; canvas.defaultCursor="default"; }});
  canvas.on("mouse:down", opt => {
    if (isSpaceDown || opt.e.altKey) { isPanning=true; canvas.selection=false; lastPtr={x:opt.e.clientX,y:opt.e.clientY}; canvas.defaultCursor="grabbing"; }
  });
  canvas.on("mouse:move", opt => {
    if (!isPanning) return;
    const vpt = canvas.viewportTransform;
    vpt[4] += opt.e.clientX - lastPtr.x; vpt[5] += opt.e.clientY - lastPtr.y;
    canvas.requestRenderAll(); lastPtr={x:opt.e.clientX,y:opt.e.clientY};
  });
  canvas.on("mouse:up", () => { isPanning=false; canvas.selection=true; if (!isSpaceDown) canvas.defaultCursor="default"; });
  canvas.on("mouse:dblclick", opt => {
    if (!opt.target) return;
    if (opt.target.type==="i-text"||opt.target.type==="textbox") { opt.target.enterEditing(); canvas.setActiveObject(opt.target); }
  });

  /* ══ SMART GUIDES ═════════════════════════════════════════ */
  canvas.on("after:render", () => {
    if (!guides.length) return;
    const ctx = canvas.getContext(), vpt = canvas.viewportTransform;
    ctx.save(); ctx.strokeStyle=GUIDE_COLOR; ctx.lineWidth=1/canvas.getZoom(); ctx.setLineDash([4,4]);
    guides.forEach(g => {
      ctx.beginPath();
      if (g.type==="v") { const sx=g.x*vpt[0]+vpt[4]; ctx.moveTo(sx,0); ctx.lineTo(sx,canvas.height); }
      else              { const sy=g.y*vpt[3]+vpt[5]; ctx.moveTo(0,sy); ctx.lineTo(canvas.width,sy); }
      ctx.stroke();
    });
    ctx.restore();
  });
  canvas.on("object:moving", evt => {
    const obj=evt.target, snap=SNAP_PX/canvas.getZoom();
    guides=[];
    const oL=obj.left,oT=obj.top,oR=oL+obj.getScaledWidth(),oB=oT+obj.getScaledHeight(),oCX=oL+obj.getScaledWidth()/2,oCY=oT+obj.getScaledHeight()/2;
    const candidates=[...canvas.getObjects().filter(o=>o!==obj&&o!==pageRect),{left:0,top:0,getScaledWidth:()=>PAGE_W,getScaledHeight:()=>PAGE_H}];
    candidates.forEach(other=>{
      const aL=other.left,aT=other.top,aR=aL+other.getScaledWidth(),aB=aT+other.getScaledHeight(),aCX=aL+other.getScaledWidth()/2,aCY=aT+other.getScaledHeight()/2;
      [[oL,aL],[oL,aR],[oL,aCX],[oR,aL],[oR,aR],[oR,aCX],[oCX,aL],[oCX,aR],[oCX,aCX]].forEach(([a,b])=>{ if(Math.abs(a-b)<snap){guides.push({type:"v",x:b});obj.set("left",b-(a-oL));} });
      [[oT,aT],[oT,aB],[oT,aCY],[oB,aT],[oB,aB],[oB,aCY],[oCY,aT],[oCY,aB],[oCY,aCY]].forEach(([a,b])=>{ if(Math.abs(a-b)<snap){guides.push({type:"h",y:b});obj.set("top",b-(a-oT));} });
    });
    canvas.requestRenderAll();
  });
  canvas.on("object:modified",()=>{ guides=[]; pushUndo(); updateRightPanel(); updateFloatingToolbar(); canvas.requestRenderAll(); });
  canvas.on("mouse:up",()=>{ guides=[]; });
  canvas.on("selection:created", e=>{ updateRightPanel(); showFloatingToolbar(e.selected?.[0]); });
  canvas.on("selection:updated", e=>{ updateRightPanel(); showFloatingToolbar(e.selected?.[0]); });
  canvas.on("selection:cleared", ()=>{ updateRightPanel(); hideFloatingToolbar(); });
  canvas.on("text:editing:entered", ()=>updateFloatingToolbar());
  canvas.on("text:changed", ()=>updateFloatingToolbar());

  /* ══ UNDO / REDO ══════════════════════════════════════════ */
  function pid() { return pages[currentPageIdx].id; }
  function getJSON() { return canvas.toJSON(["selectable","evented","excludeFromExport","animationType","animDuration","animDelay","linkType","linkTarget"]); }
  function pushUndo() {
    const id=pid(); if(!undoStacks[id])undoStacks[id]=[]; if(!redoStacks[id])redoStacks[id]=[];
    undoStacks[id].push(getJSON()); if(undoStacks[id].length>60)undoStacks[id].shift(); redoStacks[id]=[];
  }
  function undo() {
    const id=pid(); if(!undoStacks[id]?.length)return;
    if(!redoStacks[id])redoStacks[id]=[]; redoStacks[id].push(getJSON());
    restoreState(undoStacks[id].pop());
  }
  function redo() {
    const id=pid(); if(!redoStacks[id]?.length)return;
    if(!undoStacks[id])undoStacks[id]=[]; undoStacks[id].push(getJSON());
    restoreState(redoStacks[id].pop());
  }
  function restoreState(state) {
    canvas.loadFromJSON(state, ()=>{
      canvas.backgroundColor="#dde0e3";
      pageRect=canvas.getObjects().find(o=>o.excludeFromExport)||makePageRect();
      canvas.sendToBack(pageRect); canvas.requestRenderAll(); updateRightPanel();
    });
  }
  document.getElementById("undoBtn").addEventListener("click",undo);
  document.getElementById("redoBtn").addEventListener("click",redo);

  /* ══ SIDEBAR NAVIGATION ═══════════════════════════════════ */
  document.querySelectorAll(".rail-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const panel=btn.dataset.panel, isActive=btn.classList.contains("active");
      document.querySelectorAll(".rail-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".sb-panel").forEach(p=>p.classList.remove("active"));
      if(!isActive){ btn.classList.add("active"); document.getElementById("panel-"+panel)?.classList.add("active"); }
    });
  });

  /* ══ TEMPLATES ════════════════════════════════════════════ */
  const STYLE_TAG_MAP = {
    "dark-gradient":   ["Dark","Gradient","Modern"],
    "dark-gold":       ["Dark","Luxury","Elegant"],
    "warm-gradient":   ["Warm","Gradient","Creative"],
    "cyber":           ["Dark","Tech","Futuristic"],
    "light":           ["Minimal","Clean","Modern"],
    "warm":            ["Warm","Minimal","Elegant"],
    "gradient-purple": ["Gradient","Startup","Modern"],
    "vivid":           ["Vivid","Bold","Creative"],
    "museum":          ["Editorial","Elegant","Minimal"],
    "editorial":       ["Editorial","Modern","Luxury"],
    "cream":           ["Minimal","Warm","Elegant"],
    "pure-dark":       ["Dark","Minimal","Tech"],
    "navy-gold":       ["Dark","Luxury","Corporate"],
    "gradient-teal":   ["Gradient","Modern","Tech"],
    "dark":            ["Dark","Corporate","Modern"],
    "light-gradient":  ["Gradient","Minimal","Modern"],
    "gradient-rose":   ["Gradient","Vivid","Creative"],
    "sage":            ["Minimal","Warm","Elegant"],
    "holographic":     ["Vivid","Creative","Futuristic"],
    "brutalist":       ["Bold","Editorial","Creative"],
    "art-deco":        ["Dark","Luxury","Elegant"],
    "swiss":           ["Minimal","Editorial","Corporate"],
    "vintage":         ["Warm","Elegant","Creative"],
    "arabic-calligraphy": ["Calligraphy","Elegant","Luxury"],
    "chinese-ink":     ["Calligraphy","Minimal","Elegant"],
    "ottoman":         ["Calligraphy","Dark","Elegant"],
    "latin-classic":   ["Calligraphy","Editorial","Elegant"],
    "nastaliq":        ["Calligraphy","Elegant","Creative"],
    "divani":          ["Calligraphy","Dark","Luxury"],
  };
  function getStyleTags(t) {
    return STYLE_TAG_MAP[t.style] || ["Creative"];
  }

  function renderTemplates(cat, filter, styleFilter) {
    const grid = document.getElementById("templatesGrid");
    if (!grid) return;
    let list = TEMPLATES;
    if (cat && cat !== "all") list = list.filter(t => t.cat === cat);
    if (filter) list = list.filter(t => t.name.toLowerCase().includes(filter.toLowerCase()));
    if (styleFilter && styleFilter !== "all") {
      list = list.filter(t => getStyleTags(t).includes(styleFilter));
    }

    const countEl = document.getElementById("tmplResultsCount");
    if (countEl) countEl.textContent = list.length ? `${list.length} template${list.length===1?"":"s"}` : "No templates found";

    function mkThumb(t) {
      const bg = t.thumbBg || `linear-gradient(${t.angle||135}deg,${(t.bg||["#1a1a2e","#0f0f14"])[0]},${(t.bg||["#1a1a2e","#0f0f14"])[1]})`;
      const minH = t.tall ? 110 : 76;
      const elHtml = (t.thumbEls||[]).map(e =>
        `<div style="position:absolute;left:${e.x||"10%"};top:${e.y||"30%"};width:${e.w||"80%"};height:${e.h||"6px"};background:${e.bg};border-radius:${e.r||"2px"};opacity:${e.o||1}"></div>`
      ).join("");
      return `<div class="tmpl-thumb" style="background:${bg};min-height:${minH}px;position:relative;overflow:hidden">
        ${elHtml}
        <div class="tmpl-overlay">
          <div class="tmpl-card-actions">
            <button class="tmpl-action-btn fav-btn" title="Favorite" onclick="event.stopPropagation()">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
          <div class="tmpl-use-action-btn">Use template</div>
        </div>
      </div>`;
    }

    grid.innerHTML = list.length ? list.map(t => {
      const tags = getStyleTags(t);
      const tagHtml = tags.slice(0,2).map(tag => `<span class="tmpl-tag">${tag}</span>`).join("");
      return `<div class="tmpl-card${t.tall?" tall":""}" data-id="${t.id}">
        ${mkThumb(t)}
        <div class="tmpl-info">
          <div class="tmpl-label-name">${t.name}</div>
          <div class="tmpl-label-tags">${tagHtml}<span class="tmpl-size-tag">${t.w}×${t.h}</span></div>
        </div>
      </div>`;
    }).join("") : `<div style="grid-column:1/-1;padding:32px 16px;text-align:center;color:#6b7280;font-size:12px">No templates match this filter</div>`;

    grid.querySelectorAll(".tmpl-card").forEach(card => {
      const t = TEMPLATES.find(x => x.id === card.dataset.id);
      if (!t) return;
      card.addEventListener("click", () => applyTemplate(t));
      const favBtn = card.querySelector(".fav-btn");
      if (favBtn) {
        favBtn.addEventListener("click", e => {
          e.stopPropagation();
          favBtn.classList.toggle("active");
          favBtn.querySelector("svg").style.fill = favBtn.classList.contains("active") ? "#ec4899" : "none";
          favBtn.querySelector("svg").style.stroke = favBtn.classList.contains("active") ? "#ec4899" : "currentColor";
        });
      }
    });
  }

  /* ── Apply template ─────────────────────────────────────── */
  function applyTemplate(t) {
    saveCurrentPage();
    PAGE_W=t.w; PAGE_H=t.h;
    initPage();
    const W=PAGE_W, H=PAGE_H, S=Math.min(W,H);

    /* Background — supports N-stop gradients */
    const bgRect=new fabric.Rect({left:0,top:0,width:W,height:H,selectable:true,strokeWidth:0});
    const colors=t.bg||["#1a1a2e","#0f0f14"];
    if (colors.length>=2) {
      const rad=(t.angle||135)*Math.PI/180;
      const cx=W/2,cy=H/2,hd=Math.sqrt(W*W+H*H)/2;
      bgRect.set("fill",new fabric.Gradient({
        type:"linear",gradientUnits:"pixels",
        coords:{x1:cx-hd*Math.cos(rad),y1:cy-hd*Math.sin(rad),x2:cx+hd*Math.cos(rad),y2:cy+hd*Math.sin(rad)},
        colorStops:colors.map((c,i)=>({offset:i/(colors.length-1),color:c}))
      }));
    } else { bgRect.set("fill",colors[0]||"#0f0f14"); }
    canvas.add(bgRect);

    const tc=t.textColor||"#fff", ac=t.accent||"#7c3aed";
    const [l0,l1,l2]=(t.lines||["HEADLINE","Subheading","CTA"]);
    const layout=t.layout||"hero", style=t.style||"";

    /* Style-specific decorative shapes */
    if (style.includes("dark-gradient")||style==="gradient-purple") {
      canvas.add(new fabric.Circle({left:W*.65,top:-H*.15,radius:H*.42,fill:"rgba(124,58,237,0.13)",strokeWidth:0}));
      canvas.add(new fabric.Circle({left:-W*.05,top:H*.5,radius:H*.28,fill:"rgba(236,72,153,0.09)",strokeWidth:0}));
    }
    if (style==="cyber") {
      canvas.add(new fabric.Rect({left:0,top:H*.1,width:W*.28,height:3,fill:ac,strokeWidth:0}));
      canvas.add(new fabric.Circle({left:W*.7,top:H*.6,radius:H*.25,fill:"rgba(0,255,159,0.06)",strokeWidth:0}));
    }
    if (style==="dark-gold"||style==="navy-gold") {
      canvas.add(new fabric.Rect({left:W*.08,top:H*.62,width:W*.84,height:1,fill:ac,opacity:.35,strokeWidth:0}));
      canvas.add(new fabric.Rect({left:W*.08,top:H*.18,width:W*.84,height:1,fill:ac,opacity:.2,strokeWidth:0}));
    }
    if (style==="gradient-teal") {
      canvas.add(new fabric.Circle({left:W*.65,top:-H*.1,radius:H*.5,fill:"rgba(6,182,212,0.12)",strokeWidth:0}));
    }
    if (style.includes("vivid")) {
      canvas.add(new fabric.Circle({left:W*.7,top:-H*.05,radius:H*.4,fill:"rgba(255,255,255,0.06)",strokeWidth:0}));
    }

    if (layout==="hero")           _tplHero(W,H,S,tc,ac,l0,l1,l2,style);
    else if (layout==="poster")    _tplPoster(W,H,S,tc,ac,l0,l1,l2);
    else if (layout==="editorial") _tplEditorial(W,H,S,tc,ac,l0,l1,l2);
    else                           _tplMinimal(W,H,S,tc,ac,l0,l1,l2);

    canvas.sendToBack(bgRect);
    canvas.sendToBack(pageRect);
    canvas.requestRenderAll();
    pushUndo();
    showToast(`Template "${t.name}" applied`,"success");
  }

  function _tplHero(W,H,S,tc,ac,l0,l1,l2,style) {
    const fs0=Math.round(S*.082),fs1=Math.round(S*.026),fsB=Math.round(S*.024);
    const yH=H*.28;
    canvas.add(new fabric.IText(l0||"HEADLINE",{
      left:W/2,top:yH,originX:"center",originY:"center",
      fontFamily:"Space Grotesk, sans-serif",fontSize:fs0,fontWeight:"800",
      fill:tc,textAlign:"center",charSpacing:-10,lineHeight:1.1
    }));
    canvas.add(new fabric.Rect({left:W/2-W*.08,top:yH+fs0*.56,width:W*.16,height:3,fill:ac,strokeWidth:0}));
    canvas.add(new fabric.IText(l1||"A bold subheading goes here",{
      left:W/2,top:yH+fs0*.84,originX:"center",
      fontFamily:"Inter, sans-serif",fontSize:fs1,fill:tc,textAlign:"center",opacity:.72,lineHeight:1.5
    }));
    const bW=Math.round(S*.24),bH=Math.round(S*.057),bY=H*.6;
    const isLight=style.includes("light")||style==="cream"||style==="museum"||style.includes("light-gradient");
    canvas.add(new fabric.Rect({
      left:W/2-bW/2,top:bY,width:bW,height:bH,
      fill:isLight?"rgba(26,26,26,0.9)":ac,rx:bH/3.5,ry:bH/3.5,strokeWidth:0,
      shadow:new fabric.Shadow({color:"rgba(0,0,0,0.3)",blur:20,offsetX:0,offsetY:6})
    }));
    canvas.add(new fabric.IText(l2||"Get Started →",{
      left:W/2,top:bY+bH/2,originX:"center",originY:"center",
      fontFamily:"Space Grotesk, sans-serif",fontSize:fsB,fontWeight:"700",fill:"#fff",textAlign:"center"
    }));
  }

  function _tplPoster(W,H,S,tc,ac,l0,l1,l2) {
    const fs0=Math.round(S*.11),fs1=Math.round(S*.027),fs2=Math.round(S*.018);
    const cy=H*.45;
    canvas.add(new fabric.Rect({left:W*.08,top:cy-fs0*.63,width:W*.84,height:1,fill:tc,opacity:.25,strokeWidth:0}));
    canvas.add(new fabric.IText((l0||"POSTER").toUpperCase(),{
      left:W/2,top:cy,originX:"center",originY:"center",
      fontFamily:"Bebas Neue, cursive",fontSize:fs0,fontWeight:"400",
      fill:tc,textAlign:"center",charSpacing:80
    }));
    canvas.add(new fabric.Rect({left:W*.08,top:cy+fs0*.64+fs1*1.8,width:W*.84,height:1,fill:tc,opacity:.25,strokeWidth:0}));
    canvas.add(new fabric.IText(l1||"Subtext line here",{
      left:W/2,top:cy+fs0*.66,originX:"center",
      fontFamily:"Inter, sans-serif",fontSize:fs1,fill:tc,textAlign:"center",opacity:.7
    }));
    canvas.add(new fabric.IText(l2||"Coming Soon",{
      left:W/2,top:H*.82,originX:"center",
      fontFamily:"Space Grotesk, sans-serif",fontSize:fs2,fill:ac,textAlign:"center",
      fontWeight:"700",charSpacing:60
    }));
  }

  function _tplEditorial(W,H,S,tc,ac,l0,l1,l2) {
    const fs0=Math.round(S*.072),fs1=Math.round(S*.023),fs2=Math.round(S*.015);
    const tagY=H*.2;
    canvas.add(new fabric.Rect({left:W*.09,top:tagY,width:4,height:fs0*2.6,fill:ac,strokeWidth:0}));
    canvas.add(new fabric.IText("✦  "+(l2||"FEATURED").toUpperCase(),{
      left:W*.13,top:tagY,
      fontFamily:"Space Grotesk, sans-serif",fontSize:fs2,fontWeight:"700",fill:ac,charSpacing:60
    }));
    canvas.add(new fabric.IText(l0||"Editorial\nHeadline",{
      left:W*.13,top:H*.28,
      fontFamily:"DM Serif Display, serif",fontSize:fs0,fontWeight:"400",
      fill:tc,textAlign:"left",lineHeight:1.1,width:W*.75
    }));
    canvas.add(new fabric.IText(l1||"A compelling subheadline that supports the creative vision.",{
      left:W*.13,top:H*.62,
      fontFamily:"Inter, sans-serif",fontSize:fs1,fill:tc,textAlign:"left",
      opacity:.68,width:W*.72,lineHeight:1.55
    }));
    canvas.add(new fabric.IText("→  Read more",{
      left:W*.13,top:H*.78,
      fontFamily:"Space Grotesk, sans-serif",fontSize:fs1*.88,fontWeight:"700",fill:ac
    }));
  }

  function _tplMinimal(W,H,S,tc,ac,l0,l1,l2) {
    const fs0=Math.round(S*.088),fs1=Math.round(S*.023);
    canvas.add(new fabric.IText(l0||"Minimal",{
      left:W/2,top:H*.36,originX:"center",originY:"center",
      fontFamily:"Outfit, sans-serif",fontSize:fs0,fontWeight:"800",fill:tc,textAlign:"center"
    }));
    canvas.add(new fabric.Rect({left:W/2-35,top:H*.5+8,width:70,height:2,fill:ac,strokeWidth:0}));
    canvas.add(new fabric.IText(l1||"Clean. Focused. Intentional.",{
      left:W/2,top:H*.56,originX:"center",
      fontFamily:"Inter, sans-serif",fontSize:fs1,fill:tc,textAlign:"center",opacity:.62,lineHeight:1.5
    }));
    if (l2) canvas.add(new fabric.IText(l2,{
      left:W/2,top:H*.74,originX:"center",
      fontFamily:"Space Grotesk, sans-serif",fontSize:fs1*.8,fill:ac,textAlign:"center",fontWeight:"600"
    }));
  }

  function getActiveStyle() {
    return document.querySelector(".style-chip.active")?.dataset.style || "all";
  }

  document.querySelectorAll(".cat-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderTemplates(btn.dataset.cat, document.getElementById("templateSearch")?.value || "", getActiveStyle());
    });
  });

  document.querySelectorAll(".style-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".style-chip").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = document.querySelector(".cat-chip.active")?.dataset.cat || "all";
      renderTemplates(cat, document.getElementById("templateSearch")?.value || "", btn.dataset.style);
    });
  });

  const templateSearchEl = document.getElementById("templateSearch");
  if (templateSearchEl) {
    templateSearchEl.addEventListener("input", e => {
      const cat = document.querySelector(".cat-chip.active")?.dataset.cat || "all";
      renderTemplates(cat, e.target.value, getActiveStyle());
    });
  }

  /* ══ ELEMENT LIBRARY ══════════════════════════════════════ */
  function renderElGrid(id, items) {
    const c = document.getElementById(id);
    if (!c) return;
    c.innerHTML = items.map(el=>`
      <div class="el-item" draggable="true" data-id="${el.id}" title="${el.label}">
        <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          ${el.svg||`<path d="${el.path}" fill="${el.fill==="none"?"none":(el.color||"#4b607f")}" stroke="${el.fill==="none"?(el.color||"#4b607f"):"none"}" stroke-width="${el.fill==="none"?2.5:0}" stroke-linecap="round" stroke-linejoin="round" transform="scale(0.72) translate(8 4)"/>`}
        </svg>
      </div>`).join("");
    const all=[...LINES_ELS,...SHAPES_ELS,...ICONS_ELS,...DECO_ELS];
    c.querySelectorAll(".el-item").forEach(item=>{
      const el=all.find(x=>x.id===item.dataset.id);
      if (!el) return;
      item.addEventListener("click", ()=>addElement(el));
      item.addEventListener("dragstart", e=>e.dataTransfer.setData("el-id",el.id));
    });
  }

  function addElement(el) {
    pushUndo();
    if (el.create) {
      const obj=el.create();
      obj.set({ left:PAGE_W/2-(obj.width||100)/2, top:PAGE_H/2-(obj.height||100)/2 });
      canvas.add(obj); canvas.setActiveObject(obj); canvas.requestRenderAll(); updateRightPanel();
    } else {
      const svgStr=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="100" height="100"><path d="${el.path}" fill="${el.fill==="none"?"none":(el.color||"#4b607f")}" stroke="${el.fill==="none"?(el.color||"#4b607f"):"none"}" stroke-width="${el.fill==="none"?3:0}" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      fabric.loadSVGFromString(svgStr,(objects,options)=>{
        const group=fabric.util.groupSVGElements(objects,options);
        group.scaleToWidth(100); group.set({left:PAGE_W/2-50,top:PAGE_H/2-50});
        canvas.add(group); canvas.setActiveObject(group); canvas.requestRenderAll(); updateRightPanel();
      });
    }
  }

  workspaceEl.addEventListener("dragover",e=>e.preventDefault());
  workspaceEl.addEventListener("drop",e=>{
    e.preventDefault();
    const id=e.dataTransfer.getData("el-id"); if(!id)return;
    const all=[...LINES_ELS,...SHAPES_ELS,...ICONS_ELS,...DECO_ELS];
    const el=all.find(x=>x.id===id); if(!el||!el.create)return;
    const rect=workspaceEl.getBoundingClientRect(), vpt=canvas.viewportTransform;
    const x=(e.clientX-rect.left-vpt[4])/vpt[0], y=(e.clientY-rect.top-vpt[5])/vpt[3];
    pushUndo();
    const obj=el.create();
    obj.set({left:x-(obj.width||100)/2, top:y-(obj.height||100)/2});
    canvas.add(obj); canvas.setActiveObject(obj); canvas.requestRenderAll();
  });

  /* ══ SHAPE FACTORIES ══════════════════════════════════════ */
  function makeArrow() {
    const body=new fabric.Line([0,0,200,0],{stroke:"#1a0f08",strokeWidth:2});
    const head=new fabric.Triangle({width:14,height:14,fill:"#1a0f08",angle:90,left:200-7,top:-7});
    return new fabric.Group([body,head]);
  }
  function makeDiamond() {
    return new fabric.Polygon([{x:100,y:0},{x:200,y:100},{x:100,y:200},{x:0,y:100}],{fill:"#e8d8c9"});
  }
  function makeRegPoly(sides, r) {
    const pts=Array.from({length:sides},(_,i)=>({ x:r+r*Math.cos((i*2*Math.PI/sides)-Math.PI/2), y:r+r*Math.sin((i*2*Math.PI/sides)-Math.PI/2) }));
    return new fabric.Polygon(pts,{fill:"#e8d8c9"});
  }
  function makeStar(n, outer, inner) {
    const pts=Array.from({length:n*2},(_,i)=>{
      const r=i%2===0?outer:inner, a=(i*Math.PI/n)-Math.PI/2;
      return {x:outer+r*Math.cos(a),y:outer+r*Math.sin(a)};
    });
    return new fabric.Polygon(pts,{fill:"#FFEC89"});
  }
  function makeDots() {
    return new fabric.Group([40,90,140,190].map(x=>new fabric.Circle({left:x-8,top:0,radius:8,fill:"#4b607f"})));
  }
  function makePlus() {
    return new fabric.Group([
      new fabric.Rect({left:42,top:0,width:16,height:100,rx:4,fill:"#4b607f"}),
      new fabric.Rect({left:0,top:42,width:100,height:16,rx:4,fill:"#4b607f"}),
    ]);
  }

  /* ══ TEXT ════════════════════════════════════════════════ */
  function getTextStyles() {
    return {
      heading:    { text:"Add a heading",                 fontSize:Math.round(PAGE_W*0.06), fontWeight:"800", fill:"#1a0f08", fontFamily:"Space Grotesk, sans-serif" },
      subheading: { text:"Add a subheading",              fontSize:Math.round(PAGE_W*0.035),fontWeight:"600", fill:"#1a0f08", fontFamily:"Space Grotesk, sans-serif" },
      body:       { text:"Add a little bit of body text", fontSize:Math.round(PAGE_W*0.018),fontWeight:"400", fill:"#5c4535", fontFamily:"Inter, sans-serif" },
    };
  }
  document.querySelectorAll(".text-adder-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      pushUndo();
      const s=getTextStyles()[btn.dataset.style]||getTextStyles().body;
      const o=new fabric.IText(s.text,{left:PAGE_W/2,top:PAGE_H/2,originX:"center",originY:"center",...s});
      canvas.add(o); canvas.setActiveObject(o); canvas.requestRenderAll(); updateRightPanel(); showFloatingToolbar(o);
    });
  });

  /* Font combos */
  const FONT_COMBOS=[
    {heading:"DM Serif Display",body:"Inter",       hFont:"DM Serif Display, serif",    bFont:"Inter, sans-serif"},
    {heading:"Space Grotesk",   body:"Inter",        hFont:"Space Grotesk, sans-serif",  bFont:"Inter, sans-serif"},
    {heading:"Outfit",          body:"Lato",          hFont:"Outfit, sans-serif",          bFont:"Lato, sans-serif"},
    {heading:"Playfair Display",body:"Lato",          hFont:"Playfair Display, serif",     bFont:"Lato, sans-serif"},
    {heading:"Bebas Neue",      body:"Outfit",        hFont:"Bebas Neue, sans-serif",      bFont:"Outfit, sans-serif"},
    {heading:"Abril Fatface",   body:"Nunito",        hFont:"Abril Fatface, display",      bFont:"Nunito, sans-serif"},
  ];
  const fcEl=document.getElementById("fontCombos");
  if(fcEl){
    FONT_COMBOS.forEach(fc=>{
      loadFont(fc.heading); loadFont(fc.body);
      const card=document.createElement("div"); card.className="font-combo-card";
      card.innerHTML=`<div class="fc-heading" style="font-family:${fc.hFont}">${fc.heading}</div><div class="fc-body" style="font-family:${fc.bFont}">${fc.body}</div>`;
      card.addEventListener("click",()=>{ const o=canvas.getActiveObject(); if(o&&(o.type==="i-text"||o.type==="textbox")){pushUndo();o.set("fontFamily",fc.hFont);canvas.requestRenderAll();} });
      fcEl.appendChild(card);
    });
  }

  /* ══ FLOATING TOOLBAR ════════════════════════════════════ */
  const ftEl=document.getElementById("floatingToolbar");
  function showFloatingToolbar(obj) {
    if(!obj||(obj.type!=="i-text"&&obj.type!=="textbox")){hideFloatingToolbar();return;}
    ftEl.classList.remove("hidden"); updateFloatingToolbar(); positionFT(obj);
  }
  function hideFloatingToolbar(){ftEl.classList.add("hidden");}
  function positionFT(obj){
    if(!obj)return;
    const br=obj.getBoundingRect(), vpt=canvas.viewportTransform, wsr=workspaceEl.getBoundingClientRect();
    const sx=br.left*vpt[0]+vpt[4]+wsr.left, sy=br.top*vpt[3]+vpt[5]+wsr.top;
    const ftW=ftEl.offsetWidth;
    ftEl.style.left=Math.max(8,Math.min(sx+(br.width*vpt[0]-ftW)/2,window.innerWidth-ftW-8))+"px";
    ftEl.style.top=Math.max(8,sy-ftEl.offsetHeight-10)+"px";
  }
  function updateFloatingToolbar(){
    const o=canvas.getActiveObject(); if(!o||(o.type!=="i-text"&&o.type!=="textbox"))return;
    document.getElementById("ftFontName").textContent=(o.fontFamily||"").split(",")[0].replace(/['"]/g,"").trim()||"Font";
    document.getElementById("ftFontSize").value=o.fontSize||24;
    document.getElementById("ftColorBar").style.background=typeof o.fill==="string"&&o.fill.startsWith("#")?o.fill:"#1a0f08";
    document.getElementById("ftBold")     .classList.toggle("active",o.fontWeight==="bold"||o.fontWeight>=700);
    document.getElementById("ftItalic")   .classList.toggle("active",o.fontStyle==="italic");
    document.getElementById("ftUnderline").classList.toggle("active",!!o.underline);
  }
  function modText(fn){const o=canvas.getActiveObject();if(!o)return;fn(o);canvas.requestRenderAll();updateFloatingToolbar();updateRightPanel();}
  document.getElementById("ftFontBtn")   .addEventListener("click",e=>{e.stopPropagation();activeFontEl=canvas.getActiveObject();showFontPicker(e.currentTarget);});
  document.getElementById("ftSizeDown")  .addEventListener("click",()=>modText(o=>o.set("fontSize",Math.max(6,(o.fontSize||24)-2))));
  document.getElementById("ftSizeUp")    .addEventListener("click",()=>modText(o=>o.set("fontSize",Math.min(800,(o.fontSize||24)+2))));
  document.getElementById("ftFontSize")  .addEventListener("input",e=>modText(o=>o.set("fontSize",parseInt(e.target.value)||24)));
  document.getElementById("ftColorBtn")  .addEventListener("click",e=>{e.stopPropagation();activeColorEl=canvas.getActiveObject();activeColorProp="fill";showColorPopup(e.currentTarget,activeColorEl?.fill||"#1a0f08");});
  document.getElementById("ftBold")      .addEventListener("click",()=>modText(o=>o.set("fontWeight",(o.fontWeight==="bold"||o.fontWeight>=700)?"400":"bold")));
  document.getElementById("ftItalic")    .addEventListener("click",()=>modText(o=>o.set("fontStyle",o.fontStyle==="italic"?"normal":"italic")));
  document.getElementById("ftUnderline") .addEventListener("click",()=>modText(o=>o.set("underline",!o.underline)));
  document.querySelectorAll(".ft-align").forEach(btn=>btn.addEventListener("click",()=>modText(o=>o.set("textAlign",btn.dataset.align))));
  document.getElementById("ftDeleteObj") .addEventListener("click",deleteActive);

  /* ══ FONT PICKER ══════════════════════════════════════════ */
  const fpEl=document.getElementById("fontPicker");
  function showFontPicker(anchor){
    fpEl.classList.remove("hidden");
    const r=anchor.getBoundingClientRect();
    fpEl.style.left=r.left+"px"; fpEl.style.top=(r.bottom+6)+"px";
    renderFontList(""); document.getElementById("fpSearch").focus();
  }
  function renderFontList(filter){
    const list=document.getElementById("fpList");
    const fonts=FONTS.filter(f=>!filter||f.toLowerCase().includes(filter.toLowerCase()));
    list.innerHTML=fonts.map(f=>`<div class="fp-font-item" style="font-family:'${f}',sans-serif" data-font="${f}">${f}</div>`).join("");
    list.querySelectorAll(".fp-font-item").forEach(item=>{
      item.addEventListener("click",()=>{
        const target=activeFontEl||canvas.getActiveObject();
        if(target){target.set("fontFamily",item.dataset.font+", sans-serif");canvas.requestRenderAll();updateFloatingToolbar();updateRightPanel();}
        fpEl.classList.add("hidden");
      });
    });
  }
  document.getElementById("fpSearch").addEventListener("input",e=>renderFontList(e.target.value));

  /* ══ COLOR POPUP ══════════════════════════════════════════ */
  const cpEl=document.getElementById("colorPopup");
  let colorCallback=null;

  function showColorPopup(anchor, initColor, cb){
    cpEl.classList.remove("hidden");
    const r=anchor.getBoundingClientRect();
    cpEl.style.left=Math.min(r.left,window.innerWidth-260)+"px";
    cpEl.style.top=(r.bottom+6)+"px";
    const safe=(initColor&&typeof initColor==="string"&&initColor.startsWith("#"))?initColor:"#f3701e";
    document.getElementById("cpNative").value=safe;
    document.getElementById("cpHex").value=safe.replace("#","");
    updateGradientPreview();
    colorCallback=cb||defaultColorCb;
    switchColorTab(gradientMode?"gradient":"solid");
  }

  function defaultColorCb(colorVal){
    if(!activeColorEl)return;
    activeColorEl.set(activeColorProp, colorVal);
    canvas.requestRenderAll(); updateRightPanel(); updateFloatingToolbar();
  }

  function switchColorTab(mode){
    gradientMode = mode==="gradient";
    document.getElementById("cpTabSolid").classList.toggle("active",!gradientMode);
    document.getElementById("cpTabGrad") .classList.toggle("active",gradientMode);
    document.getElementById("cpSolidPane").classList.toggle("hidden",gradientMode);
    document.getElementById("cpGradPane") .classList.toggle("hidden",!gradientMode);
  }

  document.getElementById("cpTabSolid").addEventListener("click",()=>switchColorTab("solid"));
  document.getElementById("cpTabGrad") .addEventListener("click",()=>switchColorTab("gradient"));
  document.getElementById("cpNative").addEventListener("input",e=>{
    const hex=e.target.value; document.getElementById("cpHex").value=hex.replace("#","");
    colorCallback?.(hex);
  });
  document.getElementById("cpHex").addEventListener("input",e=>{
    const raw=e.target.value.trim();
    if(raw.match(/^[0-9a-fA-F]{6}$/)){const hex="#"+raw; document.getElementById("cpNative").value=hex; colorCallback?.(hex);}
  });
  document.querySelectorAll(".cp-swatch").forEach(btn=>btn.addEventListener("click",()=>{
    const hex=btn.dataset.color;
    document.getElementById("cpNative").value=hex; document.getElementById("cpHex").value=hex.replace("#","");
    colorCallback?.(hex);
  }));

  /* Gradient pane */
  function updateGradientPreview(){
    const bar=document.getElementById("cpGradPreviewBar");
    if(bar) bar.style.background=`linear-gradient(${gradAngle}deg,${gradColor1},${gradColor2})`;
  }
  document.getElementById("cpGrad1").addEventListener("input",e=>{ gradColor1=e.target.value; updateGradientPreview(); });
  document.getElementById("cpGrad2").addEventListener("input",e=>{ gradColor2=e.target.value; updateGradientPreview(); });
  document.getElementById("cpGradAngle").addEventListener("input",e=>{ gradAngle=+e.target.value; document.getElementById("cpGradAngleVal").textContent=gradAngle+"°"; updateGradientPreview(); });
  document.getElementById("cpGradTypeLinear").addEventListener("click",()=>{ gradType="linear"; document.getElementById("cpGradTypeLinear").classList.add("active"); document.getElementById("cpGradTypeRadial").classList.remove("active"); updateGradientPreview(); });
  document.getElementById("cpGradTypeRadial").addEventListener("click",()=>{ gradType="radial";  document.getElementById("cpGradTypeLinear").classList.remove("active"); document.getElementById("cpGradTypeRadial").classList.add("active"); updateGradientPreview(); });
  document.getElementById("cpGradApply").addEventListener("click",()=>{ applyGradientToActive(); });

  function applyGradientToActive(){
    const obj=activeColorEl||canvas.getActiveObject(); if(!obj)return;
    pushUndo();
    const w=obj.width*(obj.scaleX||1), h=obj.height*(obj.scaleY||1);
    let gradient;
    if(gradType==="linear"){
      const rad=gradAngle*Math.PI/180;
      const cx=w/2, cy=h/2, halfDiag=Math.sqrt(w*w+h*h)/2;
      gradient=new fabric.Gradient({type:"linear",gradientUnits:"pixels",coords:{x1:cx-halfDiag*Math.cos(rad),y1:cy-halfDiag*Math.sin(rad),x2:cx+halfDiag*Math.cos(rad),y2:cy+halfDiag*Math.sin(rad)},colorStops:[{offset:0,color:gradColor1},{offset:1,color:gradColor2}]});
    } else {
      gradient=new fabric.Gradient({type:"radial",gradientUnits:"pixels",coords:{r1:0,r2:Math.max(w,h)/2,x1:w/2,y1:h/2,x2:w/2,y2:h/2},colorStops:[{offset:0,color:gradColor1},{offset:1,color:gradColor2}]});
    }
    obj.set("fill",gradient); canvas.requestRenderAll(); updateRightPanel();
    showToast("Gradient applied","success");
  }

  /* Eyedropper */
  const eyedropperEl=document.getElementById("cpEyedropper");
  if(eyedropperEl) eyedropperEl.addEventListener("click",async ()=>{
    if(!window.EyeDropper){showToast("Eyedropper not supported in this browser","info");return;}
    try{
      const dropper=new EyeDropper();
      const result=await dropper.open();
      const hex=result.sRGBHex;
      document.getElementById("cpNative").value=hex;
      document.getElementById("cpHex").value=hex.replace("#","");
      colorCallback?.(hex);
    }catch(e){}
  });

  /* ══ RIGHT PANEL ══════════════════════════════════════════ */
  function updateRightPanel(){
    const obj=canvas.getActiveObject();
    const emptyEl=document.getElementById("rpEmpty");
    const rpEl   =document.getElementById("rpContent");
    rpEl.querySelectorAll(".rp-section").forEach(s=>s.remove());
    if(!obj||obj===pageRect){emptyEl.classList.remove("hidden");return;}
    emptyEl.classList.add("hidden");
    const type=obj.type;
    const isText  = type==="i-text"||type==="textbox";
    const isImage = type==="image";
    const secs = isText  ? ["typography","textfx","position","animation","link","delete"]
               : isImage ? ["image","effects","position","animation","link","delete"]
               : ["fill","effects","position","animation","link","delete"];
    secs.forEach(s=>rpEl.appendChild(buildSection(s,obj)));
  }

  /* Helper element creators */
  function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
  function makeNum(val,min,max,cb){
    const w=el("div","rp-num");
    const dm=el("button","rp-num-btn","−"),inp=el("input","rp-num-inp"),ip=el("button","rp-num-btn","+");
    inp.type="number";inp.value=val;inp.min=min;inp.max=max;
    dm.addEventListener("click",()=>{inp.value=Math.max(min,parseFloat(inp.value)-1);cb(parseFloat(inp.value));});
    ip.addEventListener("click",()=>{inp.value=Math.min(max,parseFloat(inp.value)+1);cb(parseFloat(inp.value));});
    inp.addEventListener("input",()=>cb(parseFloat(inp.value)||0));
    w.append(dm,inp,ip);return w;
  }
  function makeSlider(label,val,min,max,step,cb,fmt){
    const row=el("div","rp-row"); row.style.flexWrap="wrap"; row.style.gap="4px";
    const lbl=el("label","rp-row-label",label),slider=el("input","rp-slider"),vspan=el("span","rp-slider-val",fmt?fmt(val):val);
    slider.type="range";slider.min=min;slider.max=max;slider.step=step;slider.value=val;
    slider.addEventListener("input",()=>{vspan.textContent=fmt?fmt(+slider.value):slider.value;cb(+slider.value);});
    row.append(lbl,slider,vspan);return row;
  }
  function makeColorRow(label,color,prop,obj){
    const row=el("div","rp-row");
    const lbl=el("span","rp-row-label",label),btn=el("button","rp-color-btn");
    btn.style.background=typeof color==="string"&&color.startsWith("#")?color:"#ccc";
    btn.addEventListener("click",e=>{e.stopPropagation();activeColorEl=obj;activeColorProp=prop;showColorPopup(e.currentTarget,color);});
    row.append(lbl,btn);return row;
  }

  function buildSection(name,obj){
    const sec=el("div","rp-section"); sec.dataset.section=name;
    const title=el("div","rp-sec-title");

    switch(name){
      case "typography":{
        title.textContent="Typography"; sec.appendChild(title);
        /* Font family */
        const fBtn=el("button","rp-font-btn");
        fBtn.innerHTML=`<span>${(obj.fontFamily||"").split(",")[0].replace(/['"]/g,"").trim()||"Font"}</span><span>▾</span>`;
        fBtn.style.marginBottom="8px";
        fBtn.addEventListener("click",e=>{e.stopPropagation();activeFontEl=obj;showFontPicker(e.currentTarget);});
        sec.appendChild(fBtn);
        /* Size */
        const sr=el("div","rp-row"); sr.append(el("span","rp-row-label","Size"),makeNum(obj.fontSize||24,6,800,v=>{obj.set("fontSize",v);canvas.requestRenderAll();updateFloatingToolbar();}));
        sec.appendChild(sr);
        /* B/I/U/S */
        const biu=el("div","rp-seg");
        [["B","fontWeight",()=>(obj.fontWeight==="bold"||obj.fontWeight>=700)?"400":"bold",()=>obj.fontWeight==="bold"||obj.fontWeight>=700],
         ["I","fontStyle",()=>obj.fontStyle==="italic"?"normal":"italic",()=>obj.fontStyle==="italic"],
         ["U","underline",()=>!obj.underline,()=>!!obj.underline],
         ["S","linethrough",()=>!obj.linethrough,()=>!!obj.linethrough],
        ].forEach(([lbl,prop,toggle,check])=>{
          const btn=el("button","rp-seg-btn",lbl);
          if(check())btn.classList.add("active");
          btn.addEventListener("click",()=>{obj.set(prop,toggle());canvas.requestRenderAll();updateRightPanel();updateFloatingToolbar();});
          biu.appendChild(btn);
        });
        sec.appendChild(biu);
        /* Alignment */
        const aSeg=el("div","rp-seg");
        [["←","left"],["⇔","center"],["→","right"],["⇹","justify"]].forEach(([icon,align])=>{
          const btn=el("button","rp-seg-btn",icon); btn.title=align;
          if((obj.textAlign||"left")===align)btn.classList.add("active");
          btn.addEventListener("click",()=>{obj.set("textAlign",align);canvas.requestRenderAll();updateRightPanel();});
          aSeg.appendChild(btn);
        });
        sec.appendChild(aSeg);
        /* Text transform */
        const txRow=el("div","rp-row"); txRow.style.marginTop="6px";
        const tLabel=el("span","rp-row-label","Transform");
        const txSeg=el("div","rp-seg");
        [["Aa","none"],["AA","uppercase"],["aa","lowercase"],["Ab","capitalize"]].forEach(([icon,val])=>{
          const btn=el("button","rp-seg-btn",icon);btn.title=val;
          btn.addEventListener("click",()=>{
            if(!obj._origText)obj._origText=obj.text;
            const base=obj._origText||obj.text;
            if(val==="uppercase")obj.set("text",base.toUpperCase());
            else if(val==="lowercase")obj.set("text",base.toLowerCase());
            else if(val==="capitalize")obj.set("text",base.replace(/\b\w/g,c=>c.toUpperCase()));
            else obj.set("text",base);
            canvas.requestRenderAll();
          });
          txSeg.appendChild(btn);
        });
        txRow.append(tLabel,txSeg); sec.appendChild(txRow);
        /* Letter spacing */
        sec.appendChild(makeSlider("Letter spacing",obj.charSpacing||0,-200,800,10,v=>{obj.set("charSpacing",v);canvas.requestRenderAll();}));
        /* Line height */
        sec.appendChild(makeSlider("Line height",(obj.lineHeight||1.2)*10,8,30,1,v=>{obj.set("lineHeight",v/10);canvas.requestRenderAll();},(v)=>(v/10).toFixed(1)));
        /* Color */
        const fillColor=typeof obj.fill==="string"&&obj.fill.startsWith("#")?obj.fill:"#1a0f08";
        sec.appendChild(makeColorRow("Color",fillColor,"fill",obj));
        break;
      }

      case "textfx":{
        title.textContent="Text Effects"; sec.appendChild(title);
        /* Shadow */
        const shadowRow=el("div","rp-row");
        const sLbl=el("span","rp-row-label","Shadow"),sBtn=el("button","rp-seg-btn",obj.shadow?"On":"Off");
        sBtn.style.cssText="flex:0 0 auto;padding:5px 12px;border-radius:var(--r-sm)";
        if(obj.shadow)sBtn.classList.add("active");
        sBtn.addEventListener("click",()=>{
          if(obj.shadow)obj.set("shadow",null);
          else obj.set("shadow",new fabric.Shadow({color:"rgba(0,0,0,0.25)",blur:10,offsetX:2,offsetY:2}));
          canvas.requestRenderAll();updateRightPanel();
        });
        shadowRow.append(sLbl,sBtn);sec.appendChild(shadowRow);
        if(obj.shadow){
          sec.appendChild(makeSlider("Blur",obj.shadow.blur||10,0,40,1,v=>{obj.shadow.blur=v;obj.set("shadow",obj.shadow);canvas.requestRenderAll();}));
          sec.appendChild(makeSlider("OffsetX",obj.shadow.offsetX||0,-30,30,1,v=>{obj.shadow.offsetX=v;obj.set("shadow",obj.shadow);canvas.requestRenderAll();}));
          sec.appendChild(makeSlider("OffsetY",obj.shadow.offsetY||0,-30,30,1,v=>{obj.shadow.offsetY=v;obj.set("shadow",obj.shadow);canvas.requestRenderAll();}));
        }
        /* Stroke */
        const strokeRow=el("div","rp-row");
        const strokeLbl=el("span","rp-row-label","Stroke");
        const strokeColor=typeof obj.stroke==="string"&&obj.stroke.startsWith("#")?obj.stroke:"#1a0f08";
        const strokeBtn=el("button","rp-color-btn"); strokeBtn.style.background=strokeColor;
        strokeBtn.addEventListener("click",e=>{e.stopPropagation();activeColorEl=obj;activeColorProp="stroke";showColorPopup(e.currentTarget,strokeColor);});
        const strokeNum=makeNum(obj.strokeWidth||0,0,20,v=>{obj.set("strokeWidth",v);canvas.requestRenderAll();});
        strokeRow.append(strokeLbl,strokeBtn,strokeNum);sec.appendChild(strokeRow);
        /* Opacity */
        sec.appendChild(makeSlider("Opacity",Math.round((obj.opacity||1)*100),0,100,1,v=>{obj.set("opacity",v/100);canvas.requestRenderAll();}));
        break;
      }

      case "fill":{
        title.textContent="Style"; sec.appendChild(title);
        /* Fill */
        const fillColor=typeof obj.fill==="string"&&obj.fill.startsWith("#")?obj.fill:"#e8d8c9";
        const fillRow=el("div","rp-row");
        const fLbl=el("span","rp-row-label","Fill");
        const fBtn=el("button","rp-color-btn"); fBtn.style.background=fillColor;
        fBtn.addEventListener("click",e=>{e.stopPropagation();activeColorEl=obj;activeColorProp="fill";showColorPopup(e.currentTarget,fillColor);});
        const gradBtn=el("button","rp-grad-mini-btn","⬟"); gradBtn.title="Apply gradient";
        gradBtn.addEventListener("click",e=>{e.stopPropagation();activeColorEl=obj;showColorPopup(e.currentTarget,fillColor);switchColorTab("gradient");});
        fillRow.append(fLbl,fBtn,gradBtn); sec.appendChild(fillRow);
        /* Stroke */
        const strokeColor=typeof obj.stroke==="string"&&obj.stroke.startsWith("#")?obj.stroke:"#c4a88a";
        const sRow=el("div","rp-row");
        const sLbl=el("span","rp-row-label","Stroke");
        const sBtn=el("button","rp-color-btn"); sBtn.style.background=strokeColor;
        sBtn.addEventListener("click",e=>{e.stopPropagation();activeColorEl=obj;activeColorProp="stroke";showColorPopup(e.currentTarget,strokeColor);});
        const sNum=makeNum(obj.strokeWidth||0,0,40,v=>{obj.set("strokeWidth",v);canvas.requestRenderAll();});
        sRow.append(sLbl,sBtn,sNum);sec.appendChild(sRow);
        /* Corner radius */
        if(obj.type==="rect") sec.appendChild(makeSlider("Corner radius",obj.rx||0,0,200,1,v=>{obj.set("rx",v);obj.set("ry",v);canvas.requestRenderAll();}));
        /* Opacity */
        sec.appendChild(makeSlider("Opacity",Math.round((obj.opacity||1)*100),0,100,1,v=>{obj.set("opacity",v/100);canvas.requestRenderAll();}));
        break;
      }

      case "effects":{
        title.textContent="Effects"; sec.appendChild(title);
        sec.appendChild(makeSlider("Opacity",Math.round((obj.opacity||1)*100),0,100,1,v=>{obj.set("opacity",v/100);canvas.requestRenderAll();}));
        /* Shadow */
        const row=el("div","rp-row");
        const rLbl=el("span","rp-row-label","Shadow");
        const rBtn=el("button","rp-seg-btn",obj.shadow?"On":"Off");
        rBtn.style.cssText="flex:0 0 auto;padding:5px 12px;border-radius:var(--r-sm)";
        if(obj.shadow)rBtn.classList.add("active");
        rBtn.addEventListener("click",()=>{
          if(obj.shadow)obj.set("shadow",null);
          else obj.set("shadow",new fabric.Shadow({color:"rgba(0,0,0,0.18)",blur:16,offsetX:0,offsetY:4}));
          canvas.requestRenderAll();updateRightPanel();
        });
        row.append(rLbl,rBtn);sec.appendChild(row);
        if(obj.shadow){
          sec.appendChild(makeSlider("Blur",obj.shadow.blur||16,0,60,1,v=>{obj.shadow.blur=v;obj.set("shadow",obj.shadow);canvas.requestRenderAll();}));
        }
        /* Image filters */
        if(obj.type==="image"){
          const fLabel=el("div","rp-sec-title","Filters"); fLabel.style.marginTop="8px";sec.appendChild(fLabel);
          const fg=el("div","filter-grid");
          [
            {name:"None",     fn:img=>{img.filters=[];img.applyFilters();}},
            {name:"Grayscale",fn:img=>{img.filters=[new fabric.Image.filters.Grayscale()];img.applyFilters();}},
            {name:"Sepia",    fn:img=>{img.filters=[new fabric.Image.filters.Sepia()];img.applyFilters();}},
            {name:"Invert",   fn:img=>{img.filters=[new fabric.Image.filters.Invert()];img.applyFilters();}},
            {name:"Blur",     fn:img=>{img.filters=[new fabric.Image.filters.Blur({blur:0.08})];img.applyFilters();}},
            {name:"Bright+",  fn:img=>{img.filters=[new fabric.Image.filters.Brightness({brightness:0.15})];img.applyFilters();}},
          ].forEach(f=>{const b=el("button","filter-btn",f.name);b.addEventListener("click",()=>{pushUndo();f.fn(obj);canvas.requestRenderAll();});fg.appendChild(b);});
          sec.appendChild(fg);
        }
        break;
      }

      case "image":{
        title.textContent="Image"; sec.appendChild(title);
        sec.appendChild(makeSlider("Opacity",Math.round((obj.opacity||1)*100),0,100,1,v=>{obj.set("opacity",v/100);canvas.requestRenderAll();}));
        const rRow=el("div","rp-row");
        const rLbl=el("span","rp-row-label","Rounded");
        const rNum=makeNum(obj.rx||0,0,200,v=>{obj.set("rx",v);obj.set("ry",v);canvas.requestRenderAll();});
        rRow.append(rLbl,rNum);sec.appendChild(rRow);
        break;
      }

      case "position":{
        title.textContent="Position & Size"; sec.appendChild(title);
        const grid=el("div","pos-grid");
        [["X",Math.round(obj.left||0),v=>obj.set("left",v)],
         ["Y",Math.round(obj.top||0),v=>obj.set("top",v)],
         ["W",Math.round(obj.getScaledWidth?.()||100),v=>{if(obj.scaleX!==undefined)obj.set("scaleX",v/(obj.width||v));canvas.requestRenderAll();}],
         ["H",Math.round(obj.getScaledHeight?.()||100),v=>{if(obj.scaleY!==undefined)obj.set("scaleY",v/(obj.height||v));canvas.requestRenderAll();}],
         ["°",Math.round(obj.angle||0),v=>obj.set("angle",v)],
        ].forEach(([label,val,cb])=>{
          const f=el("div","pos-field"),lbl=el("label","",label),inp=el("input","pos-inp");
          inp.type="number";inp.value=val;
          inp.addEventListener("input",()=>{cb(parseFloat(inp.value)||0);canvas.requestRenderAll();});
          f.append(lbl,inp);grid.appendChild(f);
        });
        sec.appendChild(grid);
        /* Flip */
        const fr=el("div","flip-row"); fr.style.marginTop="8px";
        const fh=el("button","flip-btn","⇆ H"),fv=el("button","flip-btn","⇅ V");
        fh.addEventListener("click",()=>{obj.set("flipX",!obj.flipX);canvas.requestRenderAll();});
        fv.addEventListener("click",()=>{obj.set("flipY",!obj.flipY);canvas.requestRenderAll();});
        fr.append(fh,fv);sec.appendChild(fr);
        /* Arrange */
        const ar=el("div","arrange-row");
        const AF=el("button","arrange-btn","↑ Front"),AB=el("button","arrange-btn","↓ Back"),BF=el("button","arrange-btn","↑ Fwd"),BB=el("button","arrange-btn","↓ Bwd");
        AF.addEventListener("click",()=>{canvas.bringToFront(obj);canvas.requestRenderAll();});
        AB.addEventListener("click",()=>{canvas.sendToBack(obj);canvas.sendToBack(pageRect);canvas.requestRenderAll();});
        BF.addEventListener("click",()=>{canvas.bringForward(obj);canvas.requestRenderAll();});
        BB.addEventListener("click",()=>{canvas.sendBackwards(obj);canvas.requestRenderAll();});
        ar.append(AF,AB,BF,BB);sec.appendChild(ar);
        break;
      }

      case "animation":{
        title.textContent="Animation"; sec.appendChild(title);
        const ANIM_TYPES=[
          {id:"none",  icon:"✕",label:"None"},   {id:"fade",   icon:"◌",label:"Fade"},
          {id:"slide",  icon:"→",label:"Slide"},  {id:"rise",   icon:"↑",label:"Rise"},
          {id:"pop",    icon:"⬤",label:"Pop"},    {id:"zoom",   icon:"◎",label:"Zoom"},
          {id:"rotate", icon:"↻",label:"Rotate"}, {id:"bounce", icon:"⋀",label:"Bounce"},
          {id:"drift",  icon:"〜",label:"Drift"},  {id:"blur",   icon:"⁕",label:"Blur"},
        ];
        const curAnim=obj.animationType||"none";
        const grid=el("div","anim-grid");
        ANIM_TYPES.forEach(a=>{
          const btn=el("button","anim-type-btn");
          btn.dataset.anim=a.id;
          btn.innerHTML=`<span class="anim-icon">${a.icon}</span><span>${a.label}</span>`;
          if(curAnim===a.id)btn.classList.add("active");
          btn.addEventListener("click",()=>{
            obj.animationType=a.id;
            grid.querySelectorAll(".anim-type-btn").forEach(b=>b.classList.toggle("active",b.dataset.anim===a.id));
          });
          grid.appendChild(btn);
        });
        sec.appendChild(grid);
        sec.appendChild(makeSlider("Duration",obj.animDuration||600,100,5000,100,v=>{obj.animDuration=v;},v=>(v/1000).toFixed(1)+"s"));
        sec.appendChild(makeSlider("Delay",obj.animDelay||0,0,3000,100,v=>{obj.animDelay=v;},v=>(v/1000).toFixed(1)+"s"));
        const prevBtn=el("button","anim-preview-btn","▶ Preview animation");
        prevBtn.addEventListener("click",()=>previewAnimation(obj));
        sec.appendChild(prevBtn);
        /* AI suggest */
        if(window.DoodleAI){
          const aiSuggestBtn=el("button","rp-ai-suggest-btn","✦ AI Suggest");
          aiSuggestBtn.addEventListener("click",()=>{
            document.querySelectorAll(".anim-suggest-list").forEach(l=>l.remove());
            const suggestions=DoodleAI.suggestAnimations(obj);
            const list=el("div","anim-suggest-list");
            suggestions.forEach(s=>{
              const item=el("div","anim-suggest-item");
              item.innerHTML=`<span class="as-icon">${s.icon}</span><div><strong>${s.label}</strong><div class="as-reason">${s.reason}</div></div>`;
              item.addEventListener("click",()=>{
                obj.animationType=s.id;
                grid.querySelectorAll(".anim-type-btn").forEach(b=>b.classList.toggle("active",b.dataset.anim===s.id));
                list.remove(); previewAnimation(obj);
              });
              list.appendChild(item);
            });
            prevBtn.after(list);
          });
          sec.appendChild(aiSuggestBtn);
        }
        break;
      }

      case "link":{
        title.textContent="Link"; sec.appendChild(title);
        const typeRow=el("div","rp-row");
        const tLbl=el("span","rp-row-label","Type");
        const typeSel=document.createElement("select"); typeSel.className="rp-select";
        [["none","None"],["url","URL"],["page","Page"],["email","Email"],["phone","Phone"],["section","Section ID"]].forEach(([v,lbl])=>{
          const opt=document.createElement("option"); opt.value=v; opt.textContent=lbl;
          if((obj.linkType||"none")===v)opt.selected=true;
          typeSel.appendChild(opt);
        });
        typeSel.addEventListener("change",()=>{obj.linkType=typeSel.value;updateRightPanel();});
        typeRow.append(tLbl,typeSel);sec.appendChild(typeRow);
        if(obj.linkType&&obj.linkType!=="none"){
          const urlRow=el("div","rp-row");
          const uLbl=el("span","rp-row-label","Target");
          const uInp=el("input","link-input");
          const ph={url:"https://...",page:"Page name",email:"email@example.com",phone:"+1234567890",section:"#section-id"};
          uInp.type="text"; uInp.placeholder=ph[obj.linkType]||"Value";
          uInp.value=obj.linkTarget||"";
          uInp.addEventListener("input",()=>{obj.linkTarget=uInp.value;});
          urlRow.append(uLbl,uInp);sec.appendChild(urlRow);
        }
        break;
      }

      case "delete":{
        sec.style.borderBottom="none";
        const delBtn=el("button","rp-delete-btn","Delete element");
        delBtn.addEventListener("click",deleteActive);
        sec.appendChild(delBtn);
        /* Save style */
        const saveStyleBtn=el("button","rp-save-style-btn","Save as style");
        saveStyleBtn.addEventListener("click",()=>{
          const styleName=prompt("Style name:","My Style"); if(!styleName)return;
          const s={name:styleName,props:{fill:obj.fill,stroke:obj.stroke,fontFamily:obj.fontFamily,fontSize:obj.fontSize,fontWeight:obj.fontWeight,rx:obj.rx}};
          savedStyles.push(s); localStorage.setItem("du_styles",JSON.stringify(savedStyles));
          renderSavedStyles(); showToast(`Style "${styleName}" saved`,"success");
        });
        sec.appendChild(saveStyleBtn);
        break;
      }
    }
    return sec;
  }

  /* ══ ANIMATION ENGINE ═════════════════════════════════════ */
  function previewAnimation(obj){
    if(!obj)return;
    const type=obj.animationType||"none";
    const dur=obj.animDuration||600, delay=obj.animDelay||0;
    const oL=obj.left,oT=obj.top,oOp=obj.opacity??1,oSX=obj.scaleX||1,oSY=obj.scaleY||1;
    const restore=()=>{ obj.set({left:oL,top:oT,opacity:oOp,scaleX:oSX,scaleY:oSY}); canvas.requestRenderAll(); };
    const ease=fabric.util.ease.easeOutCubic;
    const easeElastic=fabric.util.ease.easeOutElastic||ease;
    const easeBounce=fabric.util.ease.easeOutBounce||ease;
    setTimeout(()=>{
      switch(type){
        case "fade":   obj.set("opacity",0); obj.animate("opacity",oOp,{duration:dur,easing:ease,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        case "slide":  obj.set({left:oL-120,opacity:0}); obj.animate({left:oL,opacity:oOp},{duration:dur,easing:ease,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        case "rise":   obj.set({top:oT+80,opacity:0}); obj.animate({top:oT,opacity:oOp},{duration:dur,easing:ease,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        case "pop":    obj.set({scaleX:0.2,scaleY:0.2,opacity:0}); obj.animate({scaleX:oSX,scaleY:oSY,opacity:oOp},{duration:dur,easing:easeElastic,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        case "zoom":   obj.set({scaleX:oSX*2,scaleY:oSY*2,opacity:0}); obj.animate({scaleX:oSX,scaleY:oSY,opacity:oOp},{duration:dur,easing:ease,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        case "rotate": obj.set({angle:(obj.angle||0)-90,opacity:0}); obj.animate({angle:obj.angle+90,opacity:oOp},{duration:dur,easing:ease,onChange:()=>canvas.requestRenderAll(),onComplete:()=>{obj.set("angle",obj.angle-90);restore();}}); break;
        case "bounce": obj.set({top:oT-70,opacity:0}); obj.animate({top:oT,opacity:oOp},{duration:dur,easing:easeBounce,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        case "drift":  obj.set({left:oL+60,opacity:0}); obj.animate({left:oL,opacity:oOp},{duration:dur*1.6,easing:fabric.util.ease.easeInOutSine||ease,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        case "blur":   obj.set({opacity:0}); obj.animate("opacity",oOp,{duration:dur,easing:ease,onChange:()=>canvas.requestRenderAll(),onComplete:restore}); break;
        default: break;
      }
    },delay);
  }

  /* ══ DELETE / DUPLICATE ═══════════════════════════════════ */
  function deleteActive(){
    const o=canvas.getActiveObject(); if(!o||o===pageRect)return;
    pushUndo();
    if(o._objects)o._objects.forEach(x=>canvas.remove(x));
    canvas.remove(o); canvas.discardActiveObject(); canvas.requestRenderAll(); updateRightPanel(); hideFloatingToolbar();
  }
  function duplicateActive(){
    const o=canvas.getActiveObject(); if(!o||o===pageRect)return;
    o.clone(c=>{c.set({left:(o.left||0)+20,top:(o.top||0)+20});pushUndo();canvas.add(c);canvas.setActiveObject(c);canvas.requestRenderAll();});
  }

  /* ══ UPLOADS ══════════════════════════════════════════════ */
  const fileUploadEl=document.getElementById("fileUpload");
  if(fileUploadEl) fileUploadEl.addEventListener("change",e=>{
    Array.from(e.target.files).forEach(file=>{
      const reader=new FileReader();
      reader.onload=ev=>{
        fabric.Image.fromURL(ev.target.result,img=>{
          img.scaleToWidth(Math.min(420,PAGE_W*0.42));
          img.set({left:PAGE_W/2-img.getScaledWidth()/2,top:PAGE_H/2-img.getScaledHeight()/2});
          pushUndo(); canvas.add(img); canvas.setActiveObject(img); canvas.requestRenderAll(); updateRightPanel();
          const ug=document.getElementById("uploadsGrid");
          if(ug){
            const thumb=el("div","upload-thumb"),imgEl=document.createElement("img");
            imgEl.src=ev.target.result; thumb.appendChild(imgEl);
            thumb.addEventListener("click",()=>{
              fabric.Image.fromURL(ev.target.result,img2=>{
                img2.scaleToWidth(Math.min(420,PAGE_W*0.42));
                img2.set({left:PAGE_W/2-img2.getScaledWidth()/2,top:PAGE_H/2-img2.getScaledHeight()/2});
                pushUndo();canvas.add(img2);canvas.setActiveObject(img2);canvas.requestRenderAll();
              });
            });
            ug.appendChild(thumb);
          }
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value="";
  });
  const uploadZone=document.getElementById("uploadZone");
  if(uploadZone){
    uploadZone.addEventListener("dragover",e=>e.preventDefault());
    uploadZone.addEventListener("drop",e=>{e.preventDefault();if(fileUploadEl){fileUploadEl.files=e.dataTransfer.files;fileUploadEl.dispatchEvent(new Event("change"));}});
  }

  /* ══ BRAND ════════════════════════════════════════════════ */
  document.querySelectorAll(".brand-color-swatch").forEach(btn=>btn.addEventListener("click",()=>{
    const o=canvas.getActiveObject(); if(!o)return;
    pushUndo();o.set("fill",btn.dataset.color);canvas.requestRenderAll();updateRightPanel();
  }));
  document.querySelectorAll(".brand-font-row").forEach(btn=>btn.addEventListener("click",()=>{
    const o=canvas.getActiveObject(); if(!o||(o.type!=="i-text"&&o.type!=="textbox"))return;
    pushUndo();o.set("fontFamily",btn.dataset.font+", sans-serif");canvas.requestRenderAll();updateFloatingToolbar();updateRightPanel();
  }));

  /* ══ SAVED STYLES ═════════════════════════════════════════ */
  function renderSavedStyles(){
    const container=document.getElementById("savedStylesList"); if(!container)return;
    container.innerHTML="";
    savedStyles.forEach((s)=>{
      const item=el("div","saved-style-item");
      const preview=el("div","ss-preview"); preview.style.background=typeof s.props.fill==="string"&&s.props.fill.startsWith("#")?s.props.fill:"#e8d8c9";
      const name=el("span","ss-name",s.name);
      const applyBtn=el("button","ss-apply-btn","Apply");
      applyBtn.addEventListener("click",()=>{
        const o=canvas.getActiveObject(); if(!o)return;
        pushUndo();
        Object.entries(s.props).forEach(([k,v])=>{ if(v!==null&&v!==undefined)o.set(k,v); });
        canvas.requestRenderAll();updateRightPanel();showToast(`Style "${s.name}" applied`,"success");
      });
      item.append(preview,name,applyBtn);container.appendChild(item);
    });
  }

  /* ══ PAGES ════════════════════════════════════════════════ */
  function saveCurrentPage(){
    // Commit any active text editing before serializing
    const activeObj=canvas.getActiveObject();
    if(activeObj?.isEditing) activeObj.exitEditing();
    canvas.discardActiveObject();
    const json=canvas.toJSON(["selectable","evented","excludeFromExport","animationType","animDuration","animDelay","linkType","linkTarget"]);
    json.pageSize={w:PAGE_W,h:PAGE_H};
    pages[currentPageIdx].json=json;
    // Generate async thumbnail in an offscreen StaticCanvas (no flicker)
    _captureThumb(currentPageIdx, json);
  }

  function _captureThumb(idx, json){
    if(!json) return;
    try {
      // Dock strip needs ~80px; stack view needs ~700px. Capture at 640px for both.
      const TW=640, TH=Math.round(PAGE_H/PAGE_W*640);
      const el=document.createElement('canvas'); el.width=TW; el.height=TH;
      const tmp=new fabric.StaticCanvas(el,{width:TW,height:TH,backgroundColor:'#fff'});
      const scale=TW/PAGE_W;
      tmp.setViewportTransform([scale,0,0,scale,0,0]);
      tmp.loadFromJSON(json,()=>{
        tmp.getObjects().forEach(o=>{ if(o.excludeFromExport) tmp.remove(o); });
        tmp.renderAll();
        try{
          pages[idx].thumb=tmp.toDataURL({format:'jpeg',quality:0.85});
          renderPagesNav();
          // Refresh the snapshot img in the stack view without full re-render
          const snapImg=document.querySelector(`.ps-page-snapshot[data-idx="${idx}"]`);
          if(snapImg) snapImg.src=pages[idx].thumb;
        }catch(e){}
        tmp.dispose();
      });
    }catch(e){}
  }

  function loadPage(idx){
    const page=pages[idx]; if(!page)return;
    if(page.json){
      const ps=page.json.pageSize; if(ps){PAGE_W=ps.w;PAGE_H=ps.h;}
      canvas.loadFromJSON(page.json,()=>{
        canvas.backgroundColor="#dde0e3";
        pageRect=canvas.getObjects().find(o=>o.excludeFromExport);
        if(!pageRect){pageRect=makePageRect();canvas.add(pageRect);}
        canvas.sendToBack(pageRect); canvas.requestRenderAll(); fitPage();
      });
    } else { initPage(); }
  }

  function renderPagesNav(){
    const strip=document.getElementById("pagesStrip"); if(!strip)return;
    // Render all page thumbnails + inline "+ Page" button at the end
    strip.innerHTML=pages.map((p,i)=>`
      <button class="page-thumb-btn${i===currentPageIdx?" active":""}" data-idx="${i}" title="${p.name||"Page "+(i+1)}">
        <div class="page-thumb-frame">
          ${p.thumb?`<img src="${p.thumb}" alt="Page ${i+1}" draggable="false">`:`<span>${i+1}</span>`}
          ${i===0?'<span class="page-thumb-badge">Home</span>':''}
        </div>
        <div class="page-thumb-num">${p.name||"Page "+(i+1)}</div>
      </button>`).join("")
      + `<button class="add-page-btn" id="addPageBtn" title="Add new page">+</button>`;

    strip.querySelectorAll(".page-thumb-btn").forEach(btn=>{
      const idx=+btn.dataset.idx;

      // Left-click: switch page
      btn.addEventListener("click",()=>{
        if(idx===currentPageIdx)return;
        saveCurrentPage();
        localStorage.setItem(SAVE_KEY+activeProjectId, JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
        currentPageIdx=idx; loadPage(idx); renderPagesNav();
      });

      // Right-click: context menu
      btn.addEventListener("contextmenu",(e)=>{
        e.preventDefault();
        _showPageCtxMenu(e.clientX, e.clientY, idx);
      });
    });

    // Wire the inline + button
    document.getElementById("addPageBtn")?.addEventListener("click", _addNewPage);
  }

  /* ══ STACKED PAGE VIEW ════════════════════════════════════ */
  function renderPageStack(){
    const stack = document.getElementById("pageStack"); if(!stack) return;
    const scale  = _getStackScale();
    const dW = Math.round(PAGE_W * scale);
    const dH = Math.round(PAGE_H * scale);

    stack.innerHTML = "";

    pages.forEach((p, i) => {
      // ── Header
      const hdr = document.createElement("div");
      hdr.className = "ps-page-header";
      hdr.style.width = dW + "px";
      hdr.innerHTML = `
        <div class="ps-page-title">
          <span class="ps-page-title-num">Page ${i+1}</span>
          <span class="ps-page-title-sep">·</span>
          <span class="ps-page-title-name" contenteditable="true" spellcheck="false" data-placeholder="Add page title">${_esc((p.name && p.name !== "Page "+(i+1)) ? p.name : "")}</span>
        </div>
        <div class="ps-page-controls">
          ${i>0?`<button class="ps-ctrl-btn" data-action="up" data-idx="${i}" title="Move up">↑</button>`:""}
          ${i<pages.length-1?`<button class="ps-ctrl-btn" data-action="down" data-idx="${i}" title="Move down">↓</button>`:""}
          <button class="ps-ctrl-btn" data-action="copy" data-idx="${i}" title="Copy page">⎘</button>
          <button class="ps-ctrl-btn" data-action="dup" data-idx="${i}" title="Duplicate page">⧉</button>
          <button class="ps-ctrl-btn" data-action="paste" data-idx="${i}" title="Paste copied page after this">⎋</button>
          ${pages.length>1?`<button class="ps-ctrl-btn ps-danger" data-action="del" data-idx="${i}" title="Delete page">🗑</button>`:""}
        </div>`;

      // Inline name editing
      hdr.querySelector(".ps-page-title-name").addEventListener("blur", e=>{
        const name = e.target.textContent.trim();
        pages[i].name = name || "Page "+(i+1);
        renderPagesNav();
      });
      hdr.querySelector(".ps-page-title-name").addEventListener("keydown", e=>{
        if(e.key==="Enter"){ e.preventDefault(); e.target.blur(); }
      });

      // Header control buttons
      hdr.querySelectorAll(".ps-ctrl-btn[data-action]").forEach(btn=>{
        btn.addEventListener("click", e=>{
          e.stopPropagation();
          const act=btn.dataset.action, idx2=+btn.dataset.idx;
          if(act==="up" && idx2>0){
            saveCurrentPage();
            [pages[idx2-1],pages[idx2]]=[pages[idx2],pages[idx2-1]];
            currentPageIdx=idx2-1; renderPageStack(); renderPagesNav();
            localStorage.setItem(SAVE_KEY+activeProjectId,JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
          } else if(act==="down" && idx2<pages.length-1){
            saveCurrentPage();
            [pages[idx2],pages[idx2+1]]=[pages[idx2+1],pages[idx2]];
            currentPageIdx=idx2+1; renderPageStack(); renderPagesNav();
            localStorage.setItem(SAVE_KEY+activeProjectId,JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
          } else if(act==="dup"){
            saveCurrentPage();
            const src=pages[idx2];
            const copy={id:"p"+Date.now(),name:(src.name||"Page "+(idx2+1))+" (copy)",json:src.json?JSON.parse(JSON.stringify(src.json)):null,thumb:src.thumb||null};
            pages.splice(idx2+1,0,copy);
            undoStacks[copy.id]=[]; redoStacks[copy.id]=[];
            currentPageIdx=idx2+1; loadPage(currentPageIdx);
            renderPageStack(); renderPagesNav();
            localStorage.setItem(SAVE_KEY+activeProjectId,JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
          } else if(act==="copy"){
            if(window._pageCopyHelper) window._pageCopyHelper(idx2);
          } else if(act==="paste"){
            if(window._pagePasteHelper) window._pagePasteHelper(idx2);
            else showToast("No page copied yet","error");
          } else if(act==="del"){
            if(pages.length<=1){showToast("Cannot delete the only page","error");return;}
            if(!confirm(`Delete "${pages[idx2].name||"Page "+(idx2+1)}"?`))return;
            pages.splice(idx2,1);
            currentPageIdx=Math.min(currentPageIdx,pages.length-1);
            loadPage(currentPageIdx); renderPageStack(); renderPagesNav();
            localStorage.setItem(SAVE_KEY+activeProjectId,JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
          }
        });
      });

      // ── Body (canvas area)
      const body = document.createElement("div");
      body.className = "ps-page-body";
      body.id = "ps-body-"+i;
      body.style.width  = dW+"px";
      body.style.height = dH+"px";

      if(i === currentPageIdx){
        // Use canvas.wrapperEl — safe even when the element was detached by stack.innerHTML=""
        const cc = canvas.wrapperEl;
        if(cc){
          cc.style.position="absolute"; cc.style.top="0"; cc.style.left="0";
          cc.style.width=dW+"px"; cc.style.height=dH+"px";
          body.appendChild(cc);
          // Resize canvas to match page section
          canvas.setWidth(dW); canvas.setHeight(dH);
          canvas.setViewportTransform([scale,0,0,scale,0,0]);
          if(canvas.upperCanvasEl){canvas.upperCanvasEl.style.width=dW+"px";canvas.upperCanvasEl.style.height=dH+"px";}
          canvas.calcOffset(); canvas.requestRenderAll();
        }
      } else {
        // Inactive page — show snapshot or placeholder
        if(p.thumb){
          const img=document.createElement("img");
          img.src=p.thumb; img.className="ps-page-snapshot"; img.dataset.idx=i;
          img.draggable=false; body.appendChild(img);
        } else {
          body.innerHTML=`<div class="ps-page-placeholder">${i+1}</div>`;
        }
        body.addEventListener("click", ()=>switchToPageStack(i));
      }

      // ── Wrapper
      const wrap = document.createElement("div");
      wrap.className = "ps-page"+(i===currentPageIdx?" active":"");
      wrap.dataset.idx = i;
      wrap.appendChild(hdr);
      wrap.appendChild(body);
      stack.appendChild(wrap);

      // Gap between pages
      if(i < pages.length-1){
        const gap=document.createElement("div");
        gap.className="ps-page-gap"; stack.appendChild(gap);
      }
    });

    // ── Bottom "Add page" button
    const addBtn=document.createElement("button");
    addBtn.className="ps-add-page-inline"; addBtn.id="addPageBtn";
    addBtn.innerHTML=`<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Add page`;
    addBtn.addEventListener("click", _addNewPage);
    // size it to match page width
    addBtn.style.width=Math.round(PAGE_W*scale)+"px";
    stack.appendChild(addBtn);
  }

  function switchToPageStack(idx){
    if(idx===currentPageIdx) return;
    saveCurrentPage();

    // Detach canvas from current body, put snapshot there
    const cc = canvas.wrapperEl; // always valid, even after DOM detach
    const oldBody=document.getElementById("ps-body-"+currentPageIdx);
    const oldIdx=currentPageIdx;
    if(cc && oldBody && oldBody.contains(cc)) oldBody.removeChild(cc);
    if(oldBody){
      oldBody.innerHTML="";
      if(pages[oldIdx].thumb){
        const img=document.createElement("img");
        img.src=pages[oldIdx].thumb; img.className="ps-page-snapshot"; img.dataset.idx=oldIdx;
        img.draggable=false; oldBody.appendChild(img);
      } else {
        oldBody.innerHTML=`<div class="ps-page-placeholder">${oldIdx+1}</div>`;
      }
      oldBody.addEventListener("click", ()=>switchToPageStack(oldIdx));
    }
    document.querySelector('.ps-page.active')?.classList.remove("active");

    currentPageIdx=idx;
    loadPage(idx);

    // Attach canvas to new body
    const newBody=document.getElementById("ps-body-"+idx);
    if(newBody && cc){
      newBody.innerHTML="";
      newBody.style.cursor="default";
      const scale=_getStackScale();
      const dW=Math.round(PAGE_W*scale), dH=Math.round(PAGE_H*scale);
      cc.style.position="absolute"; cc.style.top="0"; cc.style.left="0";
      cc.style.width=dW+"px"; cc.style.height=dH+"px";
      newBody.appendChild(cc);
      canvas.setWidth(dW); canvas.setHeight(dH);
      canvas.setViewportTransform([scale,0,0,scale,0,0]);
      if(canvas.upperCanvasEl){canvas.upperCanvasEl.style.width=dW+"px";canvas.upperCanvasEl.style.height=dH+"px";}
      canvas.calcOffset(); canvas.requestRenderAll();
      newBody.closest(".ps-page")?.classList.add("active");
    }

    // Scroll new page into view
    newBody?.scrollIntoView({behavior:"smooth", block:"center"});
    renderPagesNav();
  }

  function _esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

  /* ── Page context menu ────────────────────────────────── */
  let _ctxPageIdx = -1;
  const _pageCtxMenu = document.getElementById("pageCtxMenu");

  function _showPageCtxMenu(x, y, idx){
    _ctxPageIdx = idx;
    if(!_pageCtxMenu) return;
    _pageCtxMenu.classList.remove("hidden");
    // Keep inside viewport
    const mw=170, mh=150;
    _pageCtxMenu.style.left = Math.min(x, window.innerWidth-mw-8)+"px";
    _pageCtxMenu.style.top  = Math.min(y, window.innerHeight-mh-8)+"px";
  }

  function _hidePageCtxMenu(){ _pageCtxMenu?.classList.add("hidden"); _ctxPageIdx=-1; }
  document.addEventListener("click", _hidePageCtxMenu);
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") _hidePageCtxMenu(); });

  document.getElementById("pageCtxRename")?.addEventListener("click",()=>{
    if(_ctxPageIdx<0) return;
    const cur=pages[_ctxPageIdx].name||"Page "+(_ctxPageIdx+1);
    const name=prompt("Rename page:", cur);
    if(name && name.trim()){ pages[_ctxPageIdx].name=name.trim(); renderPagesNav(); }
  });

  document.getElementById("pageCtxDuplicate")?.addEventListener("click",()=>{
    if(_ctxPageIdx<0) return;
    saveCurrentPage();
    const src=pages[_ctxPageIdx];
    const newId="p"+Date.now();
    const copy={id:newId, name:(src.name||"Page "+(_ctxPageIdx+1))+" (copy)", json:JSON.parse(JSON.stringify(src.json||null)), thumb:src.thumb||null};
    pages.splice(_ctxPageIdx+1, 0, copy);
    undoStacks[newId]=[]; redoStacks[newId]=[];
    currentPageIdx=_ctxPageIdx+1;
    loadPage(currentPageIdx); renderPagesNav();
    localStorage.setItem(SAVE_KEY+activeProjectId, JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
  });

  document.getElementById("pageCtxSetHome")?.addEventListener("click",()=>{
    if(_ctxPageIdx<=0) return;
    const [page]=pages.splice(_ctxPageIdx,1);
    pages.unshift(page);
    currentPageIdx=0;
    renderPagesNav();
    localStorage.setItem(SAVE_KEY+activeProjectId, JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
    showToast("Set as home page","success");
  });

  document.getElementById("pageCtxDelete")?.addEventListener("click",()=>{
    if(_ctxPageIdx<0) return;
    if(pages.length<=1){ showToast("Cannot delete the only page","error"); return; }
    if(!confirm(`Delete "${pages[_ctxPageIdx].name||"Page "+(_ctxPageIdx+1)}"?`)) return;
    pages.splice(_ctxPageIdx,1);
    currentPageIdx=Math.min(currentPageIdx, pages.length-1);
    loadPage(currentPageIdx); renderPagesNav();
    localStorage.setItem(SAVE_KEY+activeProjectId, JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
  });

  function _addNewPage(){
    saveCurrentPage();
    localStorage.setItem(SAVE_KEY+activeProjectId, JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
    const newId="p"+Date.now();
    const pageNum=pages.length+1;
    pages.push({id:newId, name:"Page "+pageNum, json:null, thumb:null});
    if(!undoStacks[newId])undoStacks[newId]=[];
    if(!redoStacks[newId])redoStacks[newId]=[];
    currentPageIdx=pages.length-1;
    initPage(); renderPageStack(); renderPagesNav();
    showToast("Page "+pageNum+" added","success");
    // Scroll to bottom of stack so new page is visible
    setTimeout(()=>{ const s=document.getElementById("pageStack"); if(s) s.lastElementChild?.scrollIntoView({behavior:"smooth"}); },100);
  }

  /* ══ SAVE / LOAD ══════════════════════════════════════════ */
  function saveProject(){
    saveCurrentPage();
    localStorage.setItem(SAVE_KEY+activeProjectId, JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
    const projs=JSON.parse(localStorage.getItem(PROJ_KEY)||"[]");
    const idx=projs.findIndex(p=>p.id===activeProjectId);
    if(idx!==-1){projs[idx].name=projectName;localStorage.setItem(PROJ_KEY,JSON.stringify(projs));}
  }
  function loadProject(){
    const saved=localStorage.getItem(SAVE_KEY+activeProjectId);
    if(saved){
      try{
        const m=JSON.parse(saved);
        const loadedPages = m.pages;
        // Guard: never allow an empty pages array
        pages = (loadedPages && loadedPages.length > 0) ? loadedPages : [{id:"p1",name:"Page 1",json:null,thumb:null}];
        projectName=m.projectName||projectName;
        PAGE_W=m.pageW||PAGE_W; PAGE_H=m.pageH||PAGE_H;
      }catch(e){ /* corrupt save — keep defaults */ }
    } else {
      const projs=JSON.parse(localStorage.getItem(PROJ_KEY)||"[]");
      const proj=projs.find(p=>p.id===activeProjectId);
      if(proj) projectName=proj.name;
    }
    const nameEl=document.getElementById("designName"); if(nameEl)nameEl.value=projectName;
    currentPageIdx=0; loadPage(0);
    // Small delay so Fabric.js canvas finishes rendering before we build the stack
    setTimeout(()=>{ renderPageStack(); renderPagesNav(); },150);
    renderSavedStyles();
  }
  const designNameEl=document.getElementById("designName");
  if(designNameEl) designNameEl.addEventListener("input",e=>projectName=e.target.value);

  /* ── Auto-save indicator ──────────────────────────────────── */
  let _autoSaveDirty = false;
  const _autoSaveDot   = document.getElementById("autoSaveDot");
  const _autoSaveLabel = document.getElementById("autoSaveLabel");
  function setAutoSaveState(state) {
    if (!_autoSaveDot || !_autoSaveLabel) return;
    _autoSaveDot.className    = "auto-save-dot " + state;
    _autoSaveLabel.textContent = state === "saving" ? "Saving…" : state === "dirty" ? "Unsaved" : "Saved";
  }
  function setAutoSaveSaved() {
    setAutoSaveState("saving");
    saveProject();
    _autoSaveDirty = false;
    setTimeout(() => setAutoSaveState("saved"), 400);
  }
  canvas.on("object:modified", () => { _autoSaveDirty = true; setAutoSaveState("dirty"); });
  canvas.on("object:added",    () => { _autoSaveDirty = true; setAutoSaveState("dirty"); });
  canvas.on("object:removed",  () => { _autoSaveDirty = true; setAutoSaveState("dirty"); });
  setInterval(() => {
    if (!_autoSaveDirty) return;
    setAutoSaveSaved();
  }, 8000);

  /* ══ DOWNLOAD ═════════════════════════════════════════════ */
  document.getElementById("downloadBtn").addEventListener("click",()=>document.getElementById("downloadModal").classList.remove("hidden"));
  document.getElementById("downloadClose")    .addEventListener("click",()=>document.getElementById("downloadModal").classList.add("hidden"));
  document.getElementById("downloadCancelBtn").addEventListener("click",()=>document.getElementById("downloadModal").classList.add("hidden"));
  let dlFormat="png", dlQuality=2;
  document.querySelectorAll(".dl-fmt").forEach(btn=>btn.addEventListener("click",()=>{ document.querySelectorAll(".dl-fmt").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); dlFormat=btn.dataset.fmt; }));
  document.getElementById("dlQuality").addEventListener("input",e=>{ dlQuality=+e.target.value; document.getElementById("dlQualityVal").textContent=dlQuality+"×"; });
  document.getElementById("downloadConfirmBtn").addEventListener("click",()=>{
    const prev=canvas.getActiveObject(); canvas.discardActiveObject(); canvas.requestRenderAll();
    setTimeout(()=>{
      if(dlFormat==="svg"){ const svg=canvas.toSVG(); triggerDownload(URL.createObjectURL(new Blob([svg],{type:"image/svg+xml"})),projectName+".svg"); }
      else { triggerDownload(canvas.toDataURL({format:dlFormat==="jpeg"?"jpeg":"png",multiplier:dlQuality,quality:0.92}),projectName+"."+(dlFormat==="jpeg"?"jpg":dlFormat)); }
      document.getElementById("downloadModal").classList.add("hidden");
      if(prev){canvas.setActiveObject(prev);canvas.requestRenderAll();}
    },60);
  });
  function triggerDownload(url,name){const a=document.createElement("a");a.href=url;a.download=name;a.click();}

  /* ══ RESIZE ═══════════════════════════════════════════════ */
  document.getElementById("resizeDesignBtn").addEventListener("click",()=>{
    document.getElementById("resizeW").value=PAGE_W; document.getElementById("resizeH").value=PAGE_H;
    document.getElementById("resizeModal").classList.remove("hidden");
  });
  document.getElementById("resizeClose")    .addEventListener("click",()=>document.getElementById("resizeModal").classList.add("hidden"));
  document.getElementById("resizeCancelBtn").addEventListener("click",()=>document.getElementById("resizeModal").classList.add("hidden"));
  document.querySelectorAll(".resize-preset").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".resize-preset").forEach(b=>b.classList.remove("active")); btn.classList.add("active");
      document.getElementById("resizeW").value=btn.dataset.w; document.getElementById("resizeH").value=btn.dataset.h;
    });
  });
  document.getElementById("resizeApplyBtn").addEventListener("click",()=>{
    PAGE_W=parseInt(document.getElementById("resizeW").value)||PAGE_W;
    PAGE_H=parseInt(document.getElementById("resizeH").value)||PAGE_H;
    if(pageRect){pageRect.set({width:PAGE_W,height:PAGE_H});}
    fitPage(); canvas.requestRenderAll();
    document.getElementById("resizeModal").classList.add("hidden");
    showToast("Canvas resized to "+PAGE_W+"×"+PAGE_H,"success");
  });

  /* ══ PREVIEW ══════════════════════════════════════════════ */
  document.getElementById("previewBtn").addEventListener("click",()=>{
    saveCurrentPage();
    openSlideshow(currentPageIdx);
  });

  /* ══ SLIDESHOW / PRESENTATION MODE ══════════════════════════════ */
  (function initSlideshow(){
    const overlay    = document.getElementById("slideshowOverlay");
    const toolbar    = document.getElementById("slToolbar");
    const bottom     = document.getElementById("slBottom");
    const frameEl    = document.getElementById("slCanvasFrame");
    const snapEl     = document.getElementById("slTransSnap");
    const snapImg    = document.getElementById("slTransImg");
    const dotsEl     = document.getElementById("slDots");
    const counterEl  = document.getElementById("slCounter");
    const pageNameEl = document.getElementById("slPageName");
    const loadingEl  = document.getElementById("slLoading");
    const fillEl     = document.getElementById("slProgressFill");
    const projNameEl = document.getElementById("slProjectName");
    const selTrans   = document.getElementById("slTransition");
    const selAuto    = document.getElementById("slAutoTime");
    const btnPlay    = document.getElementById("slPlayPause");
    const btnFS      = document.getElementById("slFullscreen");
    const btnClose   = document.getElementById("slClose");
    const btnPrev    = document.getElementById("slPrev");
    const btnNext    = document.getElementById("slNext");

    let slides        = [];   // [{json, name}]
    let curIdx        = 0;
    let isPlaying     = false;
    let autoTimer     = null;
    let uiHideTimer   = null;
    let animTimers    = [];   // per-element animation setTimeout IDs
    let slFabric      = null; // dedicated fabric.Canvas for playback
    let transLocked   = false;

    /* ── Live fabric canvas ──────────────────────────────── */
    function ensureSlCanvas(){
      if(!slFabric){
        const el=document.createElement("canvas");
        frameEl.appendChild(el);
        // StaticCanvas: single <canvas> element, no opaque upper-canvas layer,
        // no interaction conflicts with the editor canvas.
        slFabric=new fabric.StaticCanvas(el,{ renderOnAddRemove:false });
      }
      return slFabric;
    }

    function _calcSlScale(pW, pH){
      const fw=(frameEl.clientWidth  || window.innerWidth)  - 48;
      const fh=(frameEl.clientHeight || (window.innerHeight - 115)) - 48;
      return Math.min(fw/pW, fh/pH, 0.999);
    }

    function applySlViewport(fc, pW, pH){
      const scl=_calcSlScale(pW, pH);
      const cW=Math.max(Math.round(pW*scl), 1);
      const cH=Math.max(Math.round(pH*scl), 1);
      fc.setDimensions({width:cW, height:cH});
      // Reset viewport transform — loadFromJSON may have restored the editor's
      // pan/zoom state, which would offset all content offscreen.
      fc.setViewportTransform([scl,0,0,scl,0,0]);
    }

    function loadIntoSlCanvas(pageJson, onDone){
      const fc=ensureSlCanvas();
      const pW=(pageJson&&pageJson.pageSize)?pageJson.pageSize.w:PAGE_W;
      const pH=(pageJson&&pageJson.pageSize)?pageJson.pageSize.h:PAGE_H;

      const finish=()=>{
        // Re-apply viewport AFTER loadFromJSON (it restores the editor's transform)
        applySlViewport(fc, pW, pH);
        fc.getObjects().forEach(o=>{ o.selectable=false; o.evented=false; });
        fc.renderAll();
        onDone&&onDone();
      };
      if(!pageJson){
        fc.clear(); fc.backgroundColor="#ffffff";
        applySlViewport(fc, PAGE_W, PAGE_H);
        fc.renderAll(); onDone&&onDone();
      } else {
        fc.loadFromJSON(pageJson, finish);
      }
    }

    /* ── Element animations ──────────────────────────────── */
    function cancelElemAnims(){
      animTimers.forEach(clearTimeout);
      animTimers=[];
    }

    function playElemAnims(){
      if(!slFabric) return;
      cancelElemAnims();
      const fc=slFabric;
      const ease=fabric.util.ease.easeOutCubic;
      const easeElastic=fabric.util.ease.easeOutElastic||ease;
      const easeBounce =fabric.util.ease.easeOutBounce||ease;
      const easeSine   =fabric.util.ease.easeInOutSine||ease;

      fc.getObjects().forEach(obj=>{
        const type=obj.animationType;
        if(!type||type==="none") return;
        const dur =obj.animDuration||600;
        const delay=obj.animDelay  ||0;

        // Snapshot original state
        const oL=obj.left, oT=obj.top, oOp=obj.opacity??1;
        const oSX=obj.scaleX||1, oSY=obj.scaleY||1, oAng=obj.angle||0;
        const onChange=()=>fc.requestRenderAll();
        const onComplete=()=>{
          obj.set({left:oL,top:oT,opacity:oOp,scaleX:oSX,scaleY:oSY,angle:oAng});
          fc.requestRenderAll();
        };

        // Set initial hidden/offset state
        switch(type){
          case "fade":   obj.set({opacity:0}); break;
          case "slide":  obj.set({left:oL-130,opacity:0}); break;
          case "rise":   obj.set({top:oT+90,opacity:0}); break;
          case "pop":    obj.set({scaleX:0.1,scaleY:0.1,opacity:0}); break;
          case "zoom":   obj.set({scaleX:oSX*2.2,scaleY:oSY*2.2,opacity:0}); break;
          case "rotate": obj.set({angle:oAng-90,opacity:0}); break;
          case "bounce": obj.set({top:oT-80,opacity:0}); break;
          case "drift":  obj.set({left:oL+70,opacity:0}); break;
          case "blur":   obj.set({opacity:0}); break;
        }
        fc.requestRenderAll();

        const t=setTimeout(()=>{
          switch(type){
            case "fade":   obj.animate("opacity",oOp,{duration:dur,easing:ease,onChange,onComplete}); break;
            case "slide":  obj.animate({left:oL,opacity:oOp},{duration:dur,easing:ease,onChange,onComplete}); break;
            case "rise":   obj.animate({top:oT,opacity:oOp},{duration:dur,easing:ease,onChange,onComplete}); break;
            case "pop":    obj.animate({scaleX:oSX,scaleY:oSY,opacity:oOp},{duration:dur,easing:easeElastic,onChange,onComplete}); break;
            case "zoom":   obj.animate({scaleX:oSX,scaleY:oSY,opacity:oOp},{duration:dur,easing:ease,onChange,onComplete}); break;
            case "rotate": obj.animate({angle:oAng,opacity:oOp},{duration:dur,easing:ease,onChange,onComplete:()=>{obj.set("angle",oAng);onComplete();}}); break;
            case "bounce": obj.animate({top:oT,opacity:oOp},{duration:dur,easing:easeBounce,onChange,onComplete}); break;
            case "drift":  obj.animate({left:oL,opacity:oOp},{duration:Math.round(dur*1.6),easing:easeSine,onChange,onComplete}); break;
            case "blur":   obj.animate("opacity",oOp,{duration:dur,easing:ease,onChange,onComplete}); break;
          }
        },delay);
        animTimers.push(t);
      });
    }

    /* ── Dots ─────────────────────────────────────────────── */
    function buildDots(){
      dotsEl.innerHTML="";
      slides.forEach((_,i)=>{
        const d=document.createElement("button");
        d.className="sl-dot"+(i===curIdx?" active":"");
        d.title=slides[i].name;
        d.addEventListener("click",()=>goTo(i,i>curIdx?"next":"prev"));
        dotsEl.appendChild(d);
      });
    }
    function updateDots(){
      dotsEl.querySelectorAll(".sl-dot").forEach((d,i)=>d.classList.toggle("active",i===curIdx));
    }

    /* ── Show slide ──────────────────────────────────────── */
    function showSlide(idx, dir){
      if(idx<0||idx>=slides.length) return;
      if(transLocked) return;

      curIdx=idx;
      const slide=slides[idx];
      counterEl.textContent=`${idx+1} / ${slides.length}`;
      pageNameEl.textContent=slide.name;
      btnPrev.disabled=(idx===0);
      btnNext.disabled=(idx===slides.length-1);
      updateDots();
      cancelElemAnims();

      const TRANS=560;
      const type=selTrans.value;

      // No transition: just load and play
      if(!dir||type==="none"){
        loadIntoSlCanvas(slide.json,()=>playElemAnims());
        return;
      }

      transLocked=true;

      // 1. Snapshot the current canvas → place on top as the "old slide"
      let snap="";
      try{ snap=slFabric?slFabric.toDataURL({format:"jpeg",quality:0.85}):""; }catch(e){}
      snapImg.src=snap;
      // Reset any leftover animation classes from a previous transition
      snapEl.className="sl-trans-snap";
      frameEl.className="sl-canvas-frame";

      // 2. Load next page into the frame (invisible under snapshot)
      loadIntoSlCanvas(slide.json,()=>{
        // 3. Pick CSS animations:
        //    - exitCls  → snapshot (old slide) exits
        //    - enterCls → frame   (new slide) enters
        let enterCls="", exitCls="";
        if(type==="fade"){
          // Pure cross-dissolve: only snapshot fades; frame is already underneath
          exitCls="sl-anim-fade-exit";
        }else if(type==="slide"&&dir==="next"){
          enterCls="sl-anim-slide-enter"; exitCls="sl-anim-slide-exit";
        }else if(type==="slide"&&dir==="prev"){
          enterCls="sl-anim-slideback-enter"; exitCls="sl-anim-slideback-exit";
        }else if(type==="zoom"){
          enterCls="sl-anim-zoom-enter"; exitCls="sl-anim-zoom-exit";
        }else if(type==="rise"){
          exitCls="sl-anim-rise-exit"; enterCls="sl-anim-rise-enter";
        }else if(type==="flip"){
          enterCls="sl-anim-flip-enter"; exitCls="sl-anim-flip-exit";
        }else{
          exitCls="sl-anim-fade-exit";
        }

        // 4. Force a reflow so the browser registers the reset classes
        //    before we add the animation classes.
        void snapEl.offsetWidth;
        void frameEl.offsetWidth;

        // 5. Start both animations simultaneously
        if(enterCls) frameEl.classList.add(enterCls);
        if(exitCls)  snapEl.classList.add(exitCls);

        setTimeout(()=>{
          if(enterCls) frameEl.classList.remove(enterCls);
          if(exitCls)  snapEl.classList.remove(exitCls);
          snapEl.classList.add("hidden");
          transLocked=false;
          // 6. Element animations play after the page transition finishes
          playElemAnims();
        },TRANS);
      });
    }

    function goTo(idx,dir){
      stopProgress();
      showSlide(idx,dir);
      if(isPlaying) startProgress();
    }

    function nextSlide(){
      if(curIdx>=slides.length-1){ if(isPlaying) setPlaying(false); return; }
      goTo(curIdx+1,"next");
    }
    function prevSlide(){ goTo(curIdx-1,"prev"); }

    /* ── Progress bar ─────────────────────────────────────── */
    function startProgress(){
      stopProgress();
      const ms=parseInt(selAuto.value)||0;
      if(!ms) return;
      fillEl.style.transition="none";
      fillEl.style.width="0%";
      void fillEl.offsetWidth;
      fillEl.style.transition=`width ${ms}ms linear`;
      fillEl.style.width="100%";
      autoTimer=setTimeout(()=>nextSlide(),ms);
    }
    function stopProgress(){
      clearTimeout(autoTimer);
      fillEl.style.transition="none";
      fillEl.style.width="0%";
    }

    /* ── Play / pause ─────────────────────────────────────── */
    function setPlaying(val){
      isPlaying=val;
      document.getElementById("slPlayIcon").style.display=val?"none":"";
      document.getElementById("slPauseIcon").style.display=val?"":"none";
      btnPlay.classList.toggle("sl-playing",val);
      if(val) startProgress(); else stopProgress();
    }

    /* ── Fullscreen ─────────────────────────────────────────── */
    function toggleFullscreen(){
      if(!document.fullscreenElement) overlay.requestFullscreen&&overlay.requestFullscreen();
      else document.exitFullscreen&&document.exitFullscreen();
    }

    /* ── UI auto-hide during playback ────────────────────── */
    function showUI(){
      toolbar.classList.remove("sl-hidden");
      bottom.classList.remove("sl-hidden");
      clearTimeout(uiHideTimer);
      if(isPlaying){
        uiHideTimer=setTimeout(()=>{
          toolbar.classList.add("sl-hidden");
          bottom.classList.add("sl-hidden");
        },3000);
      }
    }

    /* ── Open ─────────────────────────────────────────────── */
    window.openSlideshow=function(startIdx){
      saveCurrentPage();
      curIdx=startIdx||0;
      transLocked=false;
      cancelElemAnims();
      dotsEl.innerHTML="";
      projNameEl.textContent=projectName||"Presentation";
      counterEl.textContent="…";
      pageNameEl.textContent="";
      snapEl.classList.add("hidden");
      overlay.classList.remove("hidden");
      setPlaying(false);

      // Collect page JSONs (instant — no pre-rendering)
      slides=pages.map((pg,i)=>({
        json: pg.json||null,
        name: pg.name||("Page "+(i+1))
      }));
      buildDots();

      // Double rAF: first frame processes hidden→visible, second has layout
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        showSlide(curIdx, null);
        if(parseInt(selAuto.value)>0) setTimeout(()=>setPlaying(true),800);
      }));
    };

    function closeSlideshow(){
      setPlaying(false);
      cancelElemAnims();
      overlay.classList.add("hidden");
      if(document.fullscreenElement) document.exitFullscreen();
    }

    /* ── Wiring ──────────────────────────────────────────── */
    btnClose.addEventListener("click", closeSlideshow);
    btnPrev.addEventListener("click",  prevSlide);
    btnNext.addEventListener("click",  nextSlide);
    btnPlay.addEventListener("click",  ()=>setPlaying(!isPlaying));
    btnFS.addEventListener("click",    toggleFullscreen);
    selAuto.addEventListener("change", ()=>{ if(isPlaying){ stopProgress(); startProgress(); }});

    overlay.addEventListener("mousemove", showUI);
    overlay.addEventListener("click",     showUI);

    document.getElementById("slStage").addEventListener("click",e=>{
      if(snapEl.contains(e.target)||loadingEl.contains(e.target)) return;
      nextSlide();
    });

    document.addEventListener("keydown",e=>{
      if(overlay.classList.contains("hidden")) return;
      if(e.key==="Escape")                        closeSlideshow();
      else if(e.key==="ArrowRight"||e.key===" "){ e.preventDefault(); nextSlide(); }
      else if(e.key==="ArrowLeft"){               e.preventDefault(); prevSlide(); }
      else if(e.key==="f"||e.key==="F")          toggleFullscreen();
      else if(e.key==="p"||e.key==="P")          setPlaying(!isPlaying);
    });
  })();

  /* ══ AI COPILOT PANEL ══════════════════════════════════════ */
  const aiFabEl=document.getElementById("aiFab");
  const aiDrawerEl=document.getElementById("aiDrawer");
  const aiCloseEl=document.getElementById("aiClose");
  if(aiFabEl)   aiFabEl.addEventListener("click",()=>aiDrawerEl?.classList.toggle("hidden"));
  if(aiCloseEl) aiCloseEl.addEventListener("click",()=>aiDrawerEl?.classList.add("hidden"));

  /* AI Tabs */
  document.querySelectorAll(".ai-tab-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".ai-tab-btn").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".ai-tab-pane").forEach(p=>p.classList.add("hidden"));
      btn.classList.add("active");
      document.getElementById("ai-pane-"+btn.dataset.tab)?.classList.remove("hidden");
    });
  });

  /* Analyze Design */
  const aiAnalyzeBtn=document.getElementById("aiAnalyzeBtn");
  if(aiAnalyzeBtn) aiAnalyzeBtn.addEventListener("click",()=>{
    const suggestions=window.DoodleAI ? DoodleAI.analyzeDesign(canvas, PAGE_W, PAGE_H) : [];
    const container=document.getElementById("analysisResults"); if(!container)return;
    if(!suggestions.length){ container.innerHTML='<div class="analysis-empty">Design looks great — no major issues found!</div>'; return; }
    container.innerHTML=suggestions.map(s=>`
      <div class="analysis-card" data-id="${s.id}">
        <div class="analysis-head"><span class="analysis-icon">${s.icon}</span><strong>${s.title}</strong></div>
        <p class="analysis-desc">${s.description}</p>
        ${s.apply?`<button class="analysis-apply-btn" data-id="${s.id}">Apply fix</button>`:""}
      </div>`).join("");
    container.querySelectorAll(".analysis-apply-btn").forEach(btn=>{
      const sg=suggestions.find(s=>s.id===btn.dataset.id);
      if(sg?.apply) btn.addEventListener("click",()=>{ pushUndo(); sg.apply(canvas); btn.textContent="Applied ✓"; btn.disabled=true; showToast(sg.title+" fixed","success"); });
    });
  });

  /* Improve Selected */
  const aiImproveBtn=document.getElementById("aiImproveBtn");
  if(aiImproveBtn) aiImproveBtn.addEventListener("click",()=>{
    const obj=canvas.getActiveObject();
    const container=document.getElementById("analysisResults"); if(!container)return;
    if(!obj||obj===pageRect){ container.innerHTML='<div class="analysis-empty">Select an element first.</div>'; return; }
    const suggestions=window.DoodleAI ? DoodleAI.improveElement(obj) : [];
    if(!suggestions.length){ container.innerHTML='<div class="analysis-empty">Element looks good!</div>'; return; }
    container.innerHTML=suggestions.map((s,i)=>`
      <div class="analysis-card">
        <div class="analysis-head"><span class="analysis-icon">${s.icon}</span><strong>${s.title}</strong></div>
        <p class="analysis-desc">${s.desc}</p>
        ${s.action&&s.fn?`<button class="analysis-apply-btn" data-idx="${i}">${s.action}</button>`:""}
      </div>`).join("");
    container.querySelectorAll(".analysis-apply-btn").forEach(btn=>{
      const sg=suggestions[+btn.dataset.idx];
      if(sg?.fn) btn.addEventListener("click",()=>{ pushUndo(); sg.fn(); canvas.requestRenderAll(); btn.textContent="Applied ✓"; btn.disabled=true; updateRightPanel(); });
    });
  });

  /* Style presets grid */
  const spGrid=document.getElementById("stylePresetsGrid");
  if(spGrid&&window.DoodleAI){
    Object.entries(DoodleAI.STYLE_PRESETS).forEach(([key,P])=>{
      const card=el("div","style-preset-card");
      card.innerHTML=`<span class="sp-emoji">${P.emoji}</span><div class="sp-info"><strong>${P.name}</strong><div class="sp-desc">${P.desc||""}</div></div>`;
      card.addEventListener("click",()=>{
        pushUndo();
        const applied=DoodleAI.applyStylePreset(key,canvas);
        canvas.requestRenderAll();
        showToast("Applied: "+applied,"success");
        document.querySelectorAll(".style-preset-card").forEach(c=>c.classList.remove("active"));
        card.classList.add("active");
      });
      spGrid.appendChild(card);
    });
  }

  /* AI Color palette */
  const aiPaletteBtn=document.getElementById("aiPaletteBtn");
  if(aiPaletteBtn) aiPaletteBtn.addEventListener("click",()=>{
    const mood=document.getElementById("aiPaletteMood")?.value||"professional";
    const palette=window.DoodleAI ? DoodleAI.generatePalette(mood) : null;
    const container=document.getElementById("aiPaletteResult"); if(!container)return;
    if(!palette){container.innerHTML="<em>AI not loaded</em>";return;}
    container.innerHTML=`<div class="palette-name">${palette.name}</div>
      <div class="palette-swatches">${palette.colors.map(c=>`<button class="palette-swatch-btn" data-color="${c}" style="background:${c}" title="${c}"></button>`).join("")}</div>`;
    container.querySelectorAll(".palette-swatch-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const o=canvas.getActiveObject(); if(!o)return;
        pushUndo();o.set("fill",btn.dataset.color);canvas.requestRenderAll();updateRightPanel();showToast("Color applied","success");
      });
    });
  });

  /* AI Chat */
  const aiSendEl=document.getElementById("aiSend");
  if(aiSendEl) aiSendEl.addEventListener("click",sendChat);
  const aiInputEl=document.getElementById("aiInput");
  if(aiInputEl) aiInputEl.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!e.shiftKey)sendChat(); });

  function sendChat(){
    const input=document.getElementById("aiInput"); if(!input)return;
    const msg=input.value.trim(); if(!msg)return;
    input.value=""; appendMsg("user",msg);
    const bubble=appendMsg("reply","✦ Analyzing…");
    if(!window.DoodleAI){bubble.textContent="AI module not loaded.";return;}
    DoodleAI.ask(msg,(err,result)=>{
      bubble.remove();
      if(err){appendMsg("reply","Error — please try again.");return;}
      const rb=appendMsg("reply",result.reply);
      if(result.palette){
        const sw=el("div","chat-palette-swatches");
        result.palette.colors.forEach(c=>{
          const s=el("button","chat-swatch"); s.style.background=c; s.title=c;
          s.addEventListener("click",()=>{ const o=canvas.getActiveObject(); if(!o)return; pushUndo();o.set("fill",c);canvas.requestRenderAll();updateRightPanel(); });
          sw.appendChild(s);
        });
        rb.appendChild(sw);
      }
    });
  }
  function appendMsg(role,text){
    const container=document.getElementById("aiMessages"); if(!container)return el("div");
    const b=el("div","ai-msg-bubble ai-msg-"+role);
    b.innerHTML=text.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
    container.appendChild(b); container.scrollTop=container.scrollHeight; return b;
  }

  /* ══ CLOSE POPUPS ═════════════════════════════════════════ */
  function closeAllPopups(){
    fpEl?.classList.add("hidden");
    cpEl?.classList.add("hidden");
  }
  document.addEventListener("click",e=>{
    if(fpEl&&!fpEl.classList.contains("hidden")&&!fpEl.contains(e.target)&&!e.target.closest("[id^='ft']")&&!e.target.closest(".rp-font-btn")) fpEl.classList.add("hidden");
    if(cpEl&&!cpEl.classList.contains("hidden")&&!cpEl.contains(e.target)&&!e.target.closest(".rp-color-btn")&&!e.target.closest(".ft-color-btn")&&!e.target.closest(".rp-grad-mini-btn")) cpEl.classList.add("hidden");
  });

  /* ══ TOAST ════════════════════════════════════════════════ */
  function showToast(msg,type){
    let c=document.querySelector(".toast-container");
    if(!c){c=document.createElement("div");c.className="toast-container";document.body.appendChild(c);}
    const t=el("div","toast "+(type||"info"),msg);
    c.appendChild(t); setTimeout(()=>{t.style.opacity="0";t.style.transition="opacity 0.3s";setTimeout(()=>t.remove(),300);},2400);
  }

  /* ══ WORKSPACE HINT ═══════════════════════════════════════ */
  const hint=document.getElementById("wsHint");
  if(hint)setTimeout(()=>hint.classList.add("hide"),3500);

  /* ══ INIT ═════════════════════════════════════════════════ */
  renderElGrid("elLines",    LINES_ELS);
  renderElGrid("elShapes",   SHAPES_ELS);
  renderElGrid("elIcons",    ICONS_ELS);
  renderElGrid("elDecorative",DECO_ELS);
  renderTemplates("all","");
  loadProject();

  /* ══ ELEMENT ACTION BAR + CLIPBOARD + CONTEXT MENUS ══════════ */
  (function initElementActions(){
    let _elemClipboard = null;  // internal element clipboard
    let _pageClipboard = null;  // internal page clipboard

    // ── Position the action bar above the selection ──────────
    const eabEl = document.getElementById("elemActionBar");
    function _positionEab(){
      if(!eabEl || eabEl.classList.contains("hidden")) return;
      const activeObjs = canvas.getActiveObjects();
      if(!activeObjs.length){ eabEl.classList.add("hidden"); return; }
      // Get combined bounding rect in viewport (canvas element) space
      const sel = canvas.getActiveObject();
      const br = sel.getBoundingRect(true, true);
      const upperEl = canvas.upperCanvasEl;
      const cr = upperEl.getBoundingClientRect();
      const barLeft = cr.left + br.left + br.width / 2;
      const barTop  = cr.top  + br.top  - 44;
      eabEl.style.left = barLeft + "px";
      eabEl.style.top  = Math.max(cr.top + 6, barTop) + "px";
    }

    function showEab(obj){
      if(!eabEl || !obj || obj === pageRect) return;
      eabEl.classList.remove("hidden");
      _positionEab();
    }
    function hideEab(){ eabEl?.classList.add("hidden"); }

    // Reposition on transform events
    canvas.on("selection:created",  e => showEab(e.selected?.[0]));
    canvas.on("selection:updated",  e => showEab(e.selected?.[0]));
    canvas.on("selection:cleared",  ()=> hideEab());
    canvas.on("object:moving",      ()=> _positionEab());
    canvas.on("object:scaling",     ()=> _positionEab());
    canvas.on("object:rotating",    ()=> _positionEab());
    canvas.on("after:render",       ()=> { if(!canvas.getActiveObject()) hideEab(); });

    // ── Rotate ────────────────────────────────────────────────
    function rotateActive(deg){
      const o = canvas.getActiveObject(); if(!o || o===pageRect) return;
      pushUndo();
      o.set("angle", ((o.angle||0) + deg + 360) % 360);
      canvas.requestRenderAll();
      _positionEab();
    }
    document.getElementById("eabRotateCW") ?.addEventListener("click", ()=> rotateActive(+90));
    document.getElementById("eabRotateCCW")?.addEventListener("click", ()=> rotateActive(-90));

    // ── Copy / Paste ──────────────────────────────────────────
    function copyActive(){
      const o = canvas.getActiveObject(); if(!o || o===pageRect) return;
      o.clone(cloned => {
        _elemClipboard = cloned;
        showToast("Copied", "success");
      }, ["excludeFromExport","hoverCursor"]);
    }
    function pasteFromClipboard(){
      if(!_elemClipboard) return;
      _elemClipboard.clone(cloned => {
        cloned.set({ left: (cloned.left||0)+20, top: (cloned.top||0)+20 });
        // If it's a group (multi-select clone), expand objects
        if(cloned._objects){
          cloned._objects.forEach(obj => {
            obj.set({ left: obj.left + cloned.left + 20, top: obj.top + cloned.top + 20 });
            canvas.add(obj);
          });
        } else {
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
        }
        pushUndo(); canvas.requestRenderAll(); updateRightPanel();
      }, ["excludeFromExport","hoverCursor"]);
    }

    document.getElementById("eabCopy")     ?.addEventListener("click", copyActive);
    document.getElementById("eabPaste")    ?.addEventListener("click", pasteFromClipboard);
    document.getElementById("eabDuplicate")?.addEventListener("click", duplicateActive);
    document.getElementById("eabDelete")   ?.addEventListener("click", deleteActive);

    // ── Ctrl+C / Ctrl+V keyboard shortcuts ───────────────────
    document.addEventListener("keydown", e => {
      const tag = document.activeElement.tagName;
      if(["INPUT","TEXTAREA"].includes(tag)) return;
      if(e.key==="c" && (e.ctrlKey||e.metaKey)){ e.preventDefault(); copyActive(); }
      if(e.key==="v" && (e.ctrlKey||e.metaKey)){ e.preventDefault(); pasteFromClipboard(); }
    });

    // ── Canvas right-click context menu ──────────────────────
    const cctxMenu = document.getElementById("canvasCtxMenu");
    function _hideCCtx(){ cctxMenu?.classList.add("hidden"); }

    canvas.upperCanvasEl.addEventListener("contextmenu", e => {
      e.preventDefault();
      const hasObj = !!canvas.getActiveObject();
      document.getElementById("cctxCopy")     .style.display = hasObj ? "" : "none";
      document.getElementById("cctxDuplicate").style.display = hasObj ? "" : "none";
      document.getElementById("cctxDelete")   .style.display = hasObj ? "" : "none";
      document.getElementById("cctxPaste")    .style.display = _elemClipboard ? "" : "none";
      // Show separator only if paste visible
      const sep = cctxMenu.querySelector(".ctx-sep");
      if(sep) sep.style.display = (hasObj||_elemClipboard) ? "" : "none";

      cctxMenu.classList.remove("hidden");
      const mw = 170, mh = 160;
      cctxMenu.style.left = Math.min(e.clientX, window.innerWidth  - mw - 8) + "px";
      cctxMenu.style.top  = Math.min(e.clientY, window.innerHeight - mh - 8) + "px";
    });

    document.getElementById("cctxCopy")     ?.addEventListener("click", ()=>{ copyActive();       _hideCCtx(); });
    document.getElementById("cctxPaste")    ?.addEventListener("click", ()=>{ pasteFromClipboard();_hideCCtx(); });
    document.getElementById("cctxDuplicate")?.addEventListener("click", ()=>{ duplicateActive();   _hideCCtx(); });
    document.getElementById("cctxDelete")   ?.addEventListener("click", ()=>{ deleteActive();       _hideCCtx(); });

    document.addEventListener("click",  _hideCCtx);
    document.addEventListener("keydown", e=>{ if(e.key==="Escape") _hideCCtx(); });

    // ── Page copy / paste ─────────────────────────────────────
    function copyPage(idx){
      saveCurrentPage();
      const src = pages[idx];
      _pageClipboard = {name: src.name||"Page "+(idx+1), json: src.json ? JSON.parse(JSON.stringify(src.json)) : null, thumb: src.thumb||null};
      showToast("Page copied", "success");
    }
    function pastePage(afterIdx){
      if(!_pageClipboard) return;
      const newId = "p"+Date.now();
      const copy = {id:newId, name:_pageClipboard.name+" (copy)", json:_pageClipboard.json ? JSON.parse(JSON.stringify(_pageClipboard.json)) : null, thumb:_pageClipboard.thumb||null};
      pages.splice(afterIdx+1, 0, copy);
      undoStacks[newId]=[]; redoStacks[newId]=[];
      currentPageIdx = afterIdx+1;
      loadPage(currentPageIdx); renderPageStack(); renderPagesNav();
      localStorage.setItem(SAVE_KEY+activeProjectId, JSON.stringify({pages,projectName,pageW:PAGE_W,pageH:PAGE_H}));
      showToast("Page pasted", "success");
    }

    // Wire Copy Page / Paste Page in context menu
    document.getElementById("pageCtxCopy")?.addEventListener("click", ()=>{
      if(_ctxPageIdx < 0) return;
      copyPage(_ctxPageIdx);
    });
    document.getElementById("pageCtxPaste")?.addEventListener("click", ()=>{
      if(_ctxPageIdx < 0) return;
      pastePage(_ctxPageIdx);
    });

    // Add "Copy Page" & "Paste Page" controls to each page header in renderPageStack
    // Wire into page stack header — we expose helpers for renderPageStack to call
    window._pageCopyHelper  = copyPage;
    window._pagePasteHelper = pastePage;
    window._hasPageClipboard = () => !!_pageClipboard;
  })();

  /* ══ CODE GENERATION ENGINE ════════════════════════════════ */
  let codeActiveLang = "html";

  const ANIM_CSS = {
    fade:   `@keyframes du-fade{from{opacity:0}to{opacity:1}}`,
    slide:  `@keyframes du-slide{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:none}}`,
    rise:   `@keyframes du-rise{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}`,
    pop:    `@keyframes du-pop{from{opacity:0;transform:scale(0.3)}to{opacity:1;transform:scale(1)}}`,
    zoom:   `@keyframes du-zoom{from{opacity:0;transform:scale(1.8)}to{opacity:1;transform:scale(1)}}`,
    rotate: `@keyframes du-rotate{from{opacity:0;transform:rotate(-90deg)}to{opacity:1;transform:rotate(0)}}`,
    bounce: `@keyframes du-bounce{0%{opacity:0;transform:translateY(-50px)}60%{transform:translateY(10px)}80%{transform:translateY(-6px)}100%{opacity:1;transform:none}}`,
    drift:  `@keyframes du-drift{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:none}}`,
    blur:   `@keyframes du-blur{from{opacity:0;filter:blur(12px)}to{opacity:1;filter:none}}`,
  };

  function getFillCSS(obj) {
    if (!obj.fill) return "transparent";
    if (typeof obj.fill === "object" && obj.fill.type) {
      const stops = obj.fill.colorStops || [];
      const c1 = stops[0]?.color || "#fff";
      const c2 = stops[stops.length-1]?.color || "#000";
      if (obj.fill.type === "radial") return `radial-gradient(circle, ${c1}, ${c2})`;
      const coords = obj.fill.coords || {};
      const w = (obj.width||100)*(obj.scaleX||1), h = (obj.height||100)*(obj.scaleY||1);
      const dx = (coords.x2||w) - (coords.x1||0), dy = (coords.y2||h) - (coords.y1||0);
      const angle = Math.round(Math.atan2(dx, dy) * 180 / Math.PI);
      return `linear-gradient(${angle}deg, ${c1}, ${c2})`;
    }
    return obj.fill;
  }

  function getShadowCSS(shadow) {
    if (!shadow) return "";
    return `${shadow.offsetX||0}px ${shadow.offsetY||0}px ${shadow.blur||0}px ${shadow.color||"transparent"}`;
  }

  function escapeHTML(str) {
    return String(str||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function generateCode(lang, opts) {
    const withComments  = opts.comments;
    const withAnimations= opts.animations;
    const responsive    = opts.responsive;

    /* collect non-page objects */
    const objs = canvas.getObjects().filter(o => !o.excludeFromExport);
    const usedFonts  = new Set();
    const usedAnims  = new Set();

    /* ── Build per-element data ─────────────────────────── */
    const elements = objs.map((obj, i) => {
      const cls   = `du-el-${i+1}`;
      const lraw  = obj.left || 0;
      const traw  = obj.top  || 0;
      const w     = Math.round((obj.width  || 100) * (obj.scaleX || 1));
      const h     = Math.round((obj.height || 100) * (obj.scaleY || 1));
      const l     = Math.round(lraw);
      const t     = Math.round(traw);
      const op    = obj.opacity ?? 1;
      const angle = obj.angle || 0;
      const type  = obj.type;
      const fill  = getFillCSS(obj);
      const anim  = withAnimations ? (obj.animationType || "none") : "none";
      const dur   = (obj.animDuration || 600) + "ms";
      const delay = (obj.animDelay   || 0)   + "ms";
      const link  = obj.linkType && obj.linkType !== "none" ? obj.linkTarget : null;
      const linkType = obj.linkType || "none";

      if (anim !== "none" && ANIM_CSS[anim]) usedAnims.add(anim);

      let cssProps = [
        `  position: absolute;`,
        `  left: ${responsive ? ((l/PAGE_W*100).toFixed(2)+"%;") : (l+"px;")}`,
        `  top: ${responsive ? ((t/PAGE_H*100).toFixed(2)+"%;") : (t+"px;")}`,
        `  width: ${responsive ? ((w/PAGE_W*100).toFixed(2)+"%;") : (w+"px;")}`,
        `  height: ${responsive ? ((h/PAGE_H*100).toFixed(2)+"%;") : (h+"px;")}`,
      ];
      if (op !== 1) cssProps.push(`  opacity: ${op};`);
      if (angle)    cssProps.push(`  transform: rotate(${angle}deg);`);
      if (anim !== "none") cssProps.push(`  animation: du-${anim} ${dur} ease ${delay} both;`);

      let htmlTag = "div", htmlInner = "", cssExtra = [], reactTag = "div", reactStyle = {};

      if (type === "i-text" || type === "textbox") {
        const family = (obj.fontFamily||"Inter, sans-serif").split(",")[0].replace(/['"]/g,"").trim();
        usedFonts.add(family);
        const size   = obj.fontSize || 16;
        const weight = obj.fontWeight || 400;
        const style  = obj.fontStyle || "normal";
        const align  = obj.textAlign || "left";
        const color  = typeof obj.fill === "string" ? obj.fill : "#000";
        const lh     = obj.lineHeight || 1.2;
        const ls     = obj.charSpacing ? ((obj.charSpacing/1000).toFixed(3)+"em") : "normal";
        const td     = obj.underline ? "underline" : obj.linethrough ? "line-through" : "none";
        const stroke = obj.strokeWidth ? `  -webkit-text-stroke: ${obj.strokeWidth}px ${obj.stroke||"transparent"};` : "";
        const shadow = obj.shadow ? `  text-shadow: ${getShadowCSS(obj.shadow)};` : "";
        cssExtra = [
          `  font-family: '${family}', sans-serif;`,
          `  font-size: ${responsive ? `clamp(${Math.round(size*0.6)}px, ${(size/PAGE_W*100).toFixed(2)}vw, ${size}px)` : size+"px"};`,
          `  font-weight: ${weight};`,
          `  font-style: ${style};`,
          `  color: ${color};`,
          `  text-align: ${align};`,
          `  line-height: ${lh};`,
          `  letter-spacing: ${ls};`,
          `  text-decoration: ${td};`,
          `  white-space: pre-wrap;`,
          `  pointer-events: none;`,
          stroke, shadow,
        ].filter(Boolean);
        htmlTag = link ? "a" : "p";
        const safeText = escapeHTML(obj.text || "");
        htmlInner = safeText;
      } else if (type === "rect" || type === "group") {
        const isFillGrad = fill.includes("gradient");
        const rx  = obj.rx ? `  border-radius: ${Math.round(obj.rx)}px;` : "";
        const str = obj.strokeWidth ? `  border: ${Math.round(obj.strokeWidth)}px solid ${obj.stroke||"transparent"};` : "";
        const shd = obj.shadow ? `  box-shadow: ${getShadowCSS(obj.shadow)};` : "";
        cssExtra = [
          `  background: ${fill};`,
          rx, str, shd,
        ].filter(Boolean);
      } else if (type === "circle" || type === "ellipse") {
        const str = obj.strokeWidth ? `  border: ${Math.round(obj.strokeWidth)}px solid ${obj.stroke||"transparent"};` : "";
        const shd = obj.shadow ? `  box-shadow: ${getShadowCSS(obj.shadow)};` : "";
        cssExtra = [
          `  background: ${fill};`,
          `  border-radius: 50%;`,
          str, shd,
        ].filter(Boolean);
      } else if (type === "triangle" || type === "polygon") {
        cssExtra = [`  background: ${fill};`];
      } else if (type === "image") {
        htmlTag = "img";
        const str = obj.strokeWidth ? `  border: ${Math.round(obj.strokeWidth)}px solid ${obj.stroke||"transparent"};` : "";
        const rx  = obj.rx ? `  border-radius: ${Math.round(obj.rx)}px;` : "";
        cssExtra = [`  object-fit: cover;`, str, rx].filter(Boolean);
      } else if (type === "line") {
        cssExtra = [
          `  border-top: ${Math.round(obj.strokeWidth||1)}px solid ${obj.stroke||"#000"};`,
          `  height: 0 !important;`,
        ];
      } else if (type === "path") {
        cssExtra = [`  background: ${fill};`];
      }

      return { cls, l, t, w, h, type, htmlTag, htmlInner, cssProps, cssExtra, link, linkType, anim, obj };
    });

    const googleFontURL = usedFonts.size
      ? `https://fonts.googleapis.com/css2?${[...usedFonts].map(f=>`family=${encodeURIComponent(f)}:wght@400;500;600;700;800&display=swap`).join("&")}`
      : "";

    /* ── HTML ─────────────────────────────────────────────── */
    if (lang === "html") {
      const cm = withComments ? "\n  <!-- Generated by DoodleUp! —— https://doodleup.io -->" : "";
      let out = `<div class="du-canvas">${cm}\n`;
      elements.forEach(e => {
        let tag = e.htmlTag;
        let attrs = `class="${e.cls}"`;
        if (e.link) {
          if (e.linkType === "url")     attrs += ` href="${escapeHTML(e.link)}" target="_blank" rel="noopener"`;
          if (e.linkType === "email")   attrs += ` href="mailto:${escapeHTML(e.link)}"`;
          if (e.linkType === "phone")   attrs += ` href="tel:${escapeHTML(e.link)}"`;
          if (e.linkType === "section") attrs += ` href="${escapeHTML(e.link)}"`;
          if (e.linkType === "page")    attrs += ` href="${escapeHTML(e.link)}"`;
        }
        if (tag === "img") {
          out += `  <${tag} ${attrs} src="image-${e.cls}.jpg" alt="" />\n`;
        } else if (tag === "p" || tag === "a") {
          out += `  <${tag} ${attrs}>${e.htmlInner}</${tag}>\n`;
        } else {
          out += `  <${tag} ${attrs}></${tag}>\n`;
        }
      });
      out += `</div>`;
      return out;
    }

    /* ── CSS ─────────────────────────────────────────────── */
    if (lang === "css") {
      let out = "";
      if (withComments) out += `/* ============================================\n   DoodleUp! — Generated CSS\n   Design: ${projectName} (${PAGE_W}×${PAGE_H})\n   ============================================ */\n\n`;
      if (googleFontURL) out += `@import url('${googleFontURL}');\n\n`;
      if (usedAnims.size) {
        if (withComments) out += `/* Animations */\n`;
        usedAnims.forEach(a => { if(ANIM_CSS[a]) out += ANIM_CSS[a]+"\n"; });
        out += "\n";
      }
      out += `.du-canvas {\n  position: relative;\n  width: ${PAGE_W}px;\n  height: ${PAGE_H}px;\n  overflow: hidden;\n  background: #ffffff;\n}\n`;
      if (responsive) out += `\n@media (max-width: 768px) {\n  .du-canvas {\n    width: 100%;\n    height: auto;\n    aspect-ratio: ${PAGE_W}/${PAGE_H};\n  }\n}\n`;
      elements.forEach(e => {
        if (withComments && e.type) out += `\n/* ${e.cls} — ${e.type}${e.obj.animationType&&e.obj.animationType!=="none" ? " | anim:"+e.obj.animationType : ""} */\n`;
        else out += "\n";
        out += `.${e.cls} {\n${[...e.cssProps,...e.cssExtra].filter(Boolean).join("\n")}\n}\n`;
      });
      return out;
    }

    /* ── JavaScript ─────────────────────────────────────── */
    if (lang === "js") {
      const animated = elements.filter(e => e.anim !== "none");
      let out = "";
      if (withComments) out += `/**\n * DoodleUp! — Generated JavaScript\n * Design: ${projectName}\n * Handles animations using IntersectionObserver for scroll-triggered effects\n */\n\n`;
      out += `(function() {\n`;
      if (animated.length) {
        out += `  const observer = new IntersectionObserver((entries) => {\n`;
        out += `    entries.forEach(entry => {\n`;
        out += `      if (entry.isIntersecting) {\n`;
        out += `        entry.target.style.animationPlayState = 'running';\n`;
        out += `        observer.unobserve(entry.target);\n`;
        out += `      }\n`;
        out += `    });\n`;
        out += `  }, { threshold: 0.15 });\n\n`;
        out += `  // Initially pause all animations\n`;
        out += `  document.querySelectorAll('.du-canvas [class^="du-el-"]').forEach(el => {\n`;
        out += `    el.style.animationPlayState = 'paused';\n`;
        out += `    observer.observe(el);\n`;
        out += `  });\n\n`;

        animated.forEach(e => {
          out += `  ${withComments?"// "+e.cls+" — "+e.anim+" animation\n":""}`;
        });
      } else {
        out += `  ${withComments?"// No animations set — add animation types in the right panel\n":""}\n`;
      }

      /* Link handling */
      const linked = elements.filter(e => e.link);
      if (linked.length) {
        out += `\n  ${withComments?"// Linked elements — click navigation\n":""}`;
        linked.forEach(e => {
          if (e.linkType === "page") {
            out += `  document.querySelector('.${e.cls}').addEventListener('click', () => window.location.href = '${e.link}');\n`;
          }
        });
      }

      out += `})();\n`;
      return out;
    }

    /* ── React ───────────────────────────────────────────── */
    if (lang === "react") {
      let out = "";
      if (withComments) out += `// DoodleUp! — Generated React Component\n// Design: ${projectName} (${PAGE_W}×${PAGE_H})\n\n`;
      if (googleFontURL) out += `// Add to your <head>:\n// <link href="${googleFontURL}" rel="stylesheet" />\n\n`;
      out += `import React from 'react';\nimport './DuDesign.css'; // export the CSS tab alongside\n\n`;
      out += `export default function DuDesign() {\n  return (\n    <div className="du-canvas">\n`;
      elements.forEach(e => {
        const Tag = e.htmlTag === "p" ? "p" : e.htmlTag === "a" ? "a" : e.htmlTag === "img" ? "img" : "div";
        const hrefProp = e.link ? ` href="${escapeHTML(e.link)}"` : "";
        const targetProp = e.linkType==="url" ? ` target="_blank" rel="noopener"` : "";
        if (Tag === "img") {
          out += `      <img className="${e.cls}" src="images/image-${e.cls}.jpg" alt="" />\n`;
        } else if (Tag === "p") {
          out += `      <${Tag} className="${e.cls}"${hrefProp}${targetProp}>${escapeHTML(e.obj.text||"")}</${Tag}>\n`;
        } else {
          out += `      <${Tag} className="${e.cls}"${hrefProp}${targetProp}></${Tag}>\n`;
        }
      });
      out += `    </div>\n  );\n}\n`;
      return out;
    }

    /* ── Full Page ───────────────────────────────────────── */
    if (lang === "full") {
      const htmlBody = generateCode("html", opts);
      const cssBody  = generateCode("css",  opts);
      const jsBody   = generateCode("js",   opts);
      const fontLink = googleFontURL ? `\n  <link href="${googleFontURL}" rel="stylesheet" />` : "";
      return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>${escapeHTML(projectName)}</title>${fontLink}\n  <style>\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f5f5f5; }\n\n${cssBody.split("\n").map(l=>"    "+l).join("\n")}\n  </style>\n</head>\n<body>\n\n${htmlBody.split("\n").map(l=>"  "+l).join("\n")}\n\n  <script>\n${jsBody.split("\n").map(l=>"    "+l).join("\n")}\n  <\/script>\n</body>\n</html>`;
    }

    return "";
  }

  function openCodeModal() {
    document.getElementById("codeModal").classList.remove("hidden");
    refreshCode();
  }
  function closeCodeModal() {
    document.getElementById("codeModal").classList.add("hidden");
  }
  function getCodeOpts() {
    return {
      comments:   document.getElementById("codeOptComments")?.checked ?? true,
      animations: document.getElementById("codeOptAnimations")?.checked ?? true,
      responsive: document.getElementById("codeOptResponsive")?.checked ?? true,
    };
  }
  function refreshCode() {
    const opts = getCodeOpts();
    const code = generateCode(codeActiveLang, opts);
    const el = document.getElementById("codeContent");
    if (el) {
      el.textContent = code;
      syntaxHighlight(el, codeActiveLang);
    }
    const objs = canvas.getObjects().filter(o => !o.excludeFromExport);
    const info = document.getElementById("codeInfo");
    if (info) info.textContent = `${objs.length} element${objs.length!==1?"s":""}  ·  ${PAGE_W}×${PAGE_H}`;
  }

  /* Very lightweight syntax highlighter */
  function syntaxHighlight(el, lang) {
    let code = el.textContent;
    if (lang === "css" || lang === "full") {
      code = code
        .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, m=>`<span class="sh-comment">${m}</span>`)
        .replace(/(#[0-9a-fA-F]{3,8})\b/g, m=>`<span class="sh-string">${m}</span><span class="sh-color-dot" style="background:${m}"></span>`)
        .replace(/\b(position|display|width|height|left|top|font-family|font-size|font-weight|color|background|border|border-radius|opacity|transform|animation|margin|padding|overflow|object-fit|text-align|line-height|letter-spacing|text-decoration|white-space|box-shadow|text-shadow|pointer-events|aspect-ratio)\b/g, m=>`<span class="sh-prop">${m}</span>`);
    } else if (lang === "html") {
      code = code
        .replace(/(&lt;\/?[\w-]+)/g, m=>`<span class="sh-tag">${m}</span>`)
        .replace(/(class|href|src|alt|target|rel)=/g, m=>`<span class="sh-attr">${m}</span>`)
        .replace(/("([^"]*)")/g, m=>`<span class="sh-string">${m}</span>`)
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, m=>`<span class="sh-comment">${m}</span>`);
    } else if (lang === "js" || lang === "react") {
      code = code
        .replace(/(\/\/[^\n]*)/g, m=>`<span class="sh-comment">${m}</span>`)
        .replace(/\/\*[\s\S]*?\*\//g, m=>`<span class="sh-comment">${m}</span>`)
        .replace(/\b(const|let|var|function|return|import|export|default|from|if|else|new|class|extends|this|typeof|null|undefined|true|false|async|await|for|forEach|of|in)\b/g, m=>`<span class="sh-kw">${m}</span>`)
        .replace(/('[^']*'|"[^"]*"|`[^`]*`)/g, m=>`<span class="sh-string">${m}</span>`);
    }
    el.innerHTML = code;
  }

  /* Code modal wiring */
  document.getElementById("codeBtn")?.addEventListener("click", openCodeModal);
  document.getElementById("codeClose")?.addEventListener("click", closeCodeModal);
  document.getElementById("codeModal")?.addEventListener("click", e => { if(e.target===e.currentTarget) closeCodeModal(); });

  document.querySelectorAll(".code-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".code-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      codeActiveLang = btn.dataset.lang;
      refreshCode();
    });
  });

  document.querySelectorAll(".code-opt input").forEach(inp => {
    inp.addEventListener("change", refreshCode);
  });

  document.getElementById("codeCopyBtn")?.addEventListener("click", () => {
    const code = document.getElementById("codeContent")?.textContent || "";
    navigator.clipboard.writeText(code).then(() => {
      const btn = document.getElementById("codeCopyBtn");
      const orig = btn.innerHTML;
      btn.textContent = "Copied ✓";
      setTimeout(() => btn.innerHTML = orig, 1800);
    });
  });

  document.getElementById("codeDownloadBtn")?.addEventListener("click", () => {
    const opts = getCodeOpts();
    const html = generateCode("html", opts);
    const css  = generateCode("css",  opts);
    const js   = generateCode("js",   opts);
    const full = generateCode("full", opts);
    const safe = projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    function dl(content, name) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([content], {type:"text/plain"}));
      a.download = name; a.click();
    }

    dl(full, safe + ".html");
    setTimeout(() => dl(css,  safe + ".css"),  200);
    setTimeout(() => dl(js,   safe + ".js"),   400);
    showToast("Code files downloaded", "success");
  });

  /* ══ AI SETTINGS MODAL ══════════════════════════════════════════════════ */
  (function initAISettings() {
    const modal   = document.getElementById("aiSettingsModal");
    const openBtn = document.getElementById("aiSettingsBtn");
    const closeBtn= document.getElementById("aiSettingsClose");
    const saveBtn = document.getElementById("aiSettingsSave");
    const clearBtn= document.getElementById("aiSettingsClear");
    const testBtn = document.getElementById("aiSettingsTest");
    const keyInp  = document.getElementById("aiKeyInput");
    const toggleBtn=document.getElementById("aiKeyToggle");
    const modelSel= document.getElementById("aiModelSelect");
    const statusEl= document.getElementById("aiSettingsStatus");
    if (!modal || !openBtn) return;

    let selectedProvider = "";

    function openModal() {
      const s = window.DoodleAI?.getAPISettings() || {};
      selectedProvider = s.provider || "";
      if (keyInp) keyInp.value = s.apiKey || "";
      updateProviderUI();
      updateModelOptions();
      if (modelSel && s.model) modelSel.value = s.model;
      setStatus("", "");
      modal.classList.remove("hidden");
    }
    function closeModal() { modal.classList.add("hidden"); }

    function updateProviderUI() {
      document.querySelectorAll(".ai-provider-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.provider === selectedProvider);
      });
    }

    function updateModelOptions() {
      if (!modelSel) return;
      modelSel.innerHTML = "";
      const provider = window.DoodleAI?.PROVIDERS?.[selectedProvider];
      if (!provider) { modelSel.innerHTML = '<option value="">Select provider first…</option>'; return; }
      provider.models.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m; opt.textContent = m;
        modelSel.appendChild(opt);
      });
      modelSel.value = provider.defaultModel;
    }

    function setStatus(text, type) {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.className = "ai-settings-status" + (type ? " ai-status-" + type : "");
    }

    openBtn.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

    document.querySelectorAll(".ai-provider-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedProvider = btn.dataset.provider;
        updateProviderUI();
        updateModelOptions();
        const provider = window.DoodleAI?.PROVIDERS?.[selectedProvider];
        if (provider && keyInp) keyInp.placeholder = provider.placeholder || "Paste API key…";
      });
    });

    toggleBtn?.addEventListener("click", () => {
      keyInp.type = keyInp.type === "password" ? "text" : "password";
    });

    saveBtn?.addEventListener("click", () => {
      const key = keyInp?.value.trim();
      if (!selectedProvider) { setStatus("Select a provider first.", "error"); return; }
      if (!key) { setStatus("Enter your API key.", "error"); return; }
      window.DoodleAI?.saveAPISettings({ provider: selectedProvider, model: modelSel?.value || "", apiKey: key });
      setStatus("Settings saved! AI features are now enabled.", "success");
      setTimeout(closeModal, 1200);
    });

    clearBtn?.addEventListener("click", () => {
      window.DoodleAI?.saveAPISettings({});
      if (keyInp) keyInp.value = "";
      selectedProvider = "";
      updateProviderUI();
      updateModelOptions();
      setStatus("API key cleared.", "info");
    });

    testBtn?.addEventListener("click", async () => {
      const key = keyInp?.value.trim();
      if (!selectedProvider || !key) { setStatus("Save settings first, then test.", "error"); return; }
      setStatus("Testing connection…", "info");
      try {
        const tmp = { provider: selectedProvider, model: modelSel?.value || "", apiKey: key };
        const orig = window.DoodleAI?.getAPISettings();
        window.DoodleAI?.saveAPISettings(tmp);
        const reply = await window.DoodleAI?.callLLM([
          { role:"user", content:"Reply with exactly: 'Connection OK'" }
        ]);
        window.DoodleAI?.saveAPISettings(orig);
        setStatus("✓ Connection successful! Reply: " + (reply||"").slice(0,40), "success");
      } catch(err) {
        setStatus("✗ " + (err.message || "Connection failed"), "error");
      }
    });
  })();

  /* ══ ENHANCE DESIGN ══════════════════════════════════════════════════════ */
  (function initEnhance() {
    const modal      = document.getElementById("enhanceModal");
    const enhanceBtn = document.getElementById("enhanceBtn");
    const closeBtn   = document.getElementById("enhanceClose");
    const cancelBtn  = document.getElementById("enhanceCancelBtn");
    const applyBtn   = document.getElementById("enhanceApplyBtn");
    const retryBtn   = document.getElementById("enhanceRetryBtn");
    const rerunBtn   = document.getElementById("enhanceRerunBtn");
    const settingsBtn= document.getElementById("enhanceSettingsBtn");
    const styleSel   = document.getElementById("enhanceStyleSelect");
    const selectAllBtn  = document.getElementById("enhanceSelectAll");
    const deselectAllBtn= document.getElementById("enhanceDeselectAll");
    if (!modal || !enhanceBtn) return;

    let pendingResult = null;
    let pendingChanges= [];

    /* Populate style selector */
    if (styleSel && window.DoodleAI?.STYLE_PRESETS) {
      Object.entries(DoodleAI.STYLE_PRESETS).forEach(([k,P]) => {
        const opt = document.createElement("option");
        opt.value = k; opt.textContent = P.emoji + " " + P.name;
        styleSel.appendChild(opt);
      });
    }

    function openModal() {
      modal.classList.remove("hidden");
      showLoading("Analyzing your design…");
      runEnhancement();
    }
    function closeModal() { modal.classList.add("hidden"); pendingResult = null; pendingChanges = []; }

    function showLoading(text) {
      document.getElementById("enhanceLoading").classList.remove("hidden");
      document.getElementById("enhanceResults").classList.add("hidden");
      document.getElementById("enhanceError").classList.add("hidden");
      document.getElementById("enhanceLoadingText").textContent = text || "Analyzing…";
      if (applyBtn) applyBtn.disabled = true;
    }

    function showError(msg) {
      document.getElementById("enhanceLoading").classList.add("hidden");
      document.getElementById("enhanceResults").classList.add("hidden");
      document.getElementById("enhanceError").classList.remove("hidden");
      document.getElementById("enhanceErrorText").textContent = msg;
    }

    function showResults(result) {
      document.getElementById("enhanceLoading").classList.add("hidden");
      document.getElementById("enhanceError").classList.add("hidden");
      document.getElementById("enhanceResults").classList.remove("hidden");

      /* Scores */
      const scoresEl = document.getElementById("enhanceScores");
      if (scoresEl && result.scores) {
        const SCORE_LABELS = {
          visualHierarchy:"Hierarchy", typography:"Typography", accessibility:"Accessibility",
          spacing:"Spacing", consistency:"Consistency", modernity:"Modernity",
          conversion:"Conversion", overall:"Overall"
        };
        scoresEl.innerHTML = Object.entries(SCORE_LABELS).map(([k,label]) => {
          const v = result.scores[k] || 0;
          const cls = v >= 75 ? "score-good" : v >= 50 ? "score-mid" : "score-low";
          return `<div class="enhance-score-card ${cls}"><div class="esc-value">${v}</div><div class="esc-label">${label}</div><div class="esc-bar"><div class="esc-fill" style="width:${v}%"></div></div></div>`;
        }).join("");
      }

      /* Summary */
      const summaryEl = document.getElementById("enhanceSummary");
      if (summaryEl) summaryEl.textContent = result.summary || "";

      /* Changes list */
      pendingChanges = (result.changes || []).map(c => ({...c, selected: true}));
      renderChangesList();
      if (applyBtn) applyBtn.disabled = pendingChanges.length === 0;

      /* Palette */
      const paletteEl = document.getElementById("enhancePaletteSwatches");
      const palSection = document.getElementById("enhancePaletteSection");
      if (paletteEl && result.palette?.length) {
        palSection?.classList.remove("hidden");
        paletteEl.innerHTML = result.palette.map(c =>
          `<button class="enhance-swatch" style="background:${c}" title="${c}" data-color="${c}"></button>`
        ).join("");
        paletteEl.querySelectorAll(".enhance-swatch").forEach(btn => {
          btn.addEventListener("click", () => {
            const obj = canvas.getActiveObject();
            if (!obj) { showToast("Select an element first", "info"); return; }
            pushUndo(); obj.set("fill", btn.dataset.color); canvas.requestRenderAll(); updateRightPanel();
          });
        });
      } else {
        palSection?.classList.add("hidden");
      }
    }

    function renderChangesList() {
      const list = document.getElementById("enhanceChangesList");
      if (!list) return;
      if (!pendingChanges.length) {
        list.innerHTML = '<div class="enhance-empty">No specific changes proposed — check the palette and style suggestions above.</div>';
        return;
      }
      list.innerHTML = pendingChanges.map((c, i) => {
        const objs = canvas.getObjects().filter(o=>!o.excludeFromExport);
        const el = objs[c.elementId];
        const label = el?.type === "i-text" || el?.type === "textbox"
          ? `"${(el.text||"").slice(0,20)}"`
          : (el?.type || "element " + c.elementId);
        const propDisplay = c.property + ": " + JSON.stringify(c.value);
        return `<div class="enhance-change-item ${c.selected?"selected":""}">
          <label class="ecc-check-wrap">
            <input type="checkbox" class="ecc-check" data-idx="${i}" ${c.selected?"checked":""}>
            <span class="ecc-label">${label}</span>
          </label>
          <span class="ecc-prop">${propDisplay}</span>
          <span class="ecc-reason">${c.reason || ""}</span>
        </div>`;
      }).join("");
      list.querySelectorAll(".ecc-check").forEach(cb => {
        cb.addEventListener("change", () => {
          pendingChanges[+cb.dataset.idx].selected = cb.checked;
          cb.closest(".enhance-change-item").classList.toggle("selected", cb.checked);
          const anySelected = pendingChanges.some(c => c.selected);
          if (applyBtn) applyBtn.disabled = !anySelected;
        });
      });
    }

    async function runEnhancement() {
      if (!window.DoodleAI) { showError("AI module not loaded."); return; }
      if (!DoodleAI.hasAPIKey()) {
        showError("No API key configured. Add your key in AI Settings to use AI enhancement.\n\nYou can still use local analysis: click Analyze Design in the AI panel.");
        return;
      }
      try {
        showLoading("Sending design to AI…");
        await new Promise(r => setTimeout(r, 100));
        document.getElementById("enhanceLoadingText").textContent = "AI is reviewing your design…";
        const styleKey = styleSel?.value || "";
        const result = await DoodleAI.enhanceDesign(canvas, PAGE_W, PAGE_H, styleKey);
        pendingResult = result;
        showResults(result);
        showToast("Enhancement ready — review and apply", "success");
      } catch(err) {
        showError(err.message || "Enhancement failed. Please try again.");
      }
    }

    function applySelectedChanges() {
      if (!pendingResult) return;
      const objs = canvas.getObjects().filter(o=>!o.excludeFromExport);
      pushUndo();
      let applied = 0;
      pendingChanges.filter(c => c.selected).forEach(c => {
        const obj = objs[c.elementId];
        if (!obj) return;
        try {
          if (c.property === "shadow" && typeof c.value === "object" && c.value) {
            obj.set("shadow", new fabric.Shadow(c.value));
          } else if (c.property === "fill" && typeof c.value === "object" && c.value?.type) {
            /* gradient fill from LLM - skip for safety */
          } else {
            obj.set(c.property, c.value);
          }
          applied++;
        } catch {}
      });

      /* Add new elements if any */
      (pendingResult.newElements || []).forEach(ne => {
        try {
          if (ne.type === "rect") {
            const r = new fabric.Rect({ left:ne.x||0, top:ne.y||0, width:ne.w||100, height:ne.h||40, fill:ne.fill||"#f3701e", rx:ne.rx||0, ry:ne.rx||0 });
            canvas.add(r);
          } else if (ne.type === "i-text") {
            const t = new fabric.IText(ne.text||"Text", { left:ne.x||0, top:ne.y||0, fontSize:ne.fontSize||24, fontFamily:ne.fontFamily||"Inter, sans-serif", fontWeight:ne.fontWeight||"400", fill:ne.color||"#1a0f08" });
            canvas.add(t);
          }
          applied++;
        } catch {}
      });

      canvas.requestRenderAll();
      updateRightPanel();
      saveCurrentPage();
      showToast(`Applied ${applied} improvements`, "success");
      closeModal();
    }

    enhanceBtn.addEventListener("click", openModal);
    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    applyBtn?.addEventListener("click", applySelectedChanges);
    retryBtn?.addEventListener("click", runEnhancement);
    rerunBtn?.addEventListener("click", runEnhancement);
    settingsBtn?.addEventListener("click", () => { closeModal(); document.getElementById("aiSettingsModal")?.classList.remove("hidden"); });
    selectAllBtn?.addEventListener("click", () => {
      pendingChanges.forEach(c => c.selected = true);
      renderChangesList();
      if (applyBtn) applyBtn.disabled = false;
    });
    deselectAllBtn?.addEventListener("click", () => {
      pendingChanges.forEach(c => c.selected = false);
      renderChangesList();
      if (applyBtn) applyBtn.disabled = true;
    });

    /* LLM-powered Analyze button (replaces local-only version when key is set) */
    const aiAnalyzeTab = document.getElementById("aiAnalyzeBtn");
    if (aiAnalyzeTab) {
      aiAnalyzeTab.addEventListener("click", async () => {
        if (window.DoodleAI?.hasAPIKey()) {
          const container = document.getElementById("analysisResults"); if (!container) return;
          container.innerHTML = '<div class="analysis-empty">🔍 Running AI analysis…</div>';
          try {
            const result = await DoodleAI.analyzeWithLLM(canvas, PAGE_W, PAGE_H);
            const items = result.improvements || [];
            const scores = result.scores || {};

            const scoreBar = Object.entries(scores).map(([k,v]) => {
              const labels={visualHierarchy:"Hier",typography:"Type",accessibility:"A11y",spacing:"Space",consistency:"Cons",modernity:"Mod",conversion:"Conv",overall:"Overall"};
              const cls = v>=75?"score-good":v>=50?"score-mid":"score-low";
              return `<div class="inline-score ${cls}"><span>${v}</span><span>${labels[k]||k}</span></div>`;
            }).join("");

            container.innerHTML = `<div class="inline-scores">${scoreBar}</div>
              <p class="analysis-summary">${result.summary||""}</p>
              ${items.map((s,i)=>`
              <div class="analysis-card">
                <div class="analysis-head"><span class="analysis-icon">${s.priority==="high"?"🔴":s.priority==="medium"?"🟡":"🟢"}</span><strong>${s.title}</strong><span class="analysis-priority">${s.priority||""}</span></div>
                <p class="analysis-desc">${s.reason} — ${s.action}</p>
              </div>`).join("")}`;

            if (result.palette?.length) {
              const palRow = document.createElement("div");
              palRow.className="palette-swatch-row";
              palRow.innerHTML = result.palette.map(c=>`<button class="palette-swatch-btn" style="background:${c}" title="${c}" data-color="${c}"></button>`).join("");
              palRow.querySelectorAll(".palette-swatch-btn").forEach(btn=>{
                btn.addEventListener("click",()=>{
                  const o=canvas.getActiveObject(); if(!o)return;
                  pushUndo(); o.set("fill",btn.dataset.color); canvas.requestRenderAll(); updateRightPanel();
                });
              });
              container.appendChild(palRow);
            }
          } catch(err) {
            container.innerHTML = `<div class="analysis-empty">AI error: ${err.message}</div>`;
          }
        }
        /* Local analysis handled by the original event listener registered earlier */
      }, true);
    }
  })();

  /* ══ GRID TOGGLE ════════════════════════════════════════════════════════ */
  (function initGrid() {
    const btn = document.getElementById("gridToggleBtn");
    const ws  = document.getElementById("workspace");
    if (!btn || !ws) return;
    btn.addEventListener("click", () => {
      const on = ws.classList.toggle("show-grid");
      btn.classList.toggle("active", on);
      btn.title = on ? "Hide Grid" : "Show Grid (G)";
    });
    document.addEventListener("keydown", e => {
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        btn.click();
      }
    });
  })();

  /* ══ SNAP TOGGLE ═════════════════════════════════════════════════════════ */
  (function initSnap() {
    const btn = document.getElementById("snapToggleBtn");
    if (!btn) return;
    let snapEnabled = true;
    btn.classList.add("active");
    btn.title = "Snap: ON";
    btn.addEventListener("click", () => {
      snapEnabled = !snapEnabled;
      btn.classList.toggle("active", snapEnabled);
      btn.title = "Snap: " + (snapEnabled ? "ON" : "OFF");
      window._snapEnabled = snapEnabled;
    });
    window._snapEnabled = true;
  })();

  /* ══ DEVICE PREVIEW ═══════════════════════════════════════════════════════ */
  (function initDevicePreview() {
    const ws = document.getElementById("workspace");
    if (!ws) return;
    document.querySelectorAll(".tb-device-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tb-device-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        ws.classList.remove("device-tablet", "device-mobile");
        const dev = btn.dataset.device;
        if (dev === "tablet")  ws.classList.add("device-tablet");
        if (dev === "mobile")  ws.classList.add("device-mobile");
        setTimeout(() => { if (typeof fitPage === "function") fitPage(); }, 50);
      });
    });
  })();

  /* ══ BOTTOM DOCK ══════════════════════════════════════════════════════════ */
  (function initBottomDock() {
    const dock       = document.getElementById("bottomDock");
    const collapseBtn= document.getElementById("dockCollapseBtn");
    if (!dock) return;

    collapseBtn?.addEventListener("click", () => dock.classList.toggle("collapsed"));

    document.querySelectorAll(".dock-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".dock-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const key = tab.dataset.dock;
        document.querySelectorAll(".dock-pane").forEach(p => p.classList.remove("active"));
        document.getElementById("dock-pane-" + key)?.classList.add("active");
        if (dock.classList.contains("collapsed")) dock.classList.remove("collapsed");
        if (key === "layers") renderDockLayers();
        if (key === "history") renderHistory();
        if (key === "pages") renderPagesNav();
      });
    });
  })();

  /* ══ HISTORY TRACKING ════════════════════════════════════════════════════ */
  const historyLog = [];
  const MAX_HISTORY = 40;

  function logHistory(action) {
    historyLog.unshift({ action, ts: Date.now() });
    if (historyLog.length > MAX_HISTORY) historyLog.pop();
  }

  const _origPushUndo = pushUndo;

  function renderHistory() {
    const list = document.getElementById("historyList");
    if (!list) return;
    if (!historyLog.length) {
      list.innerHTML = '<div class="dock-empty">Actions will appear here as you edit.</div>';
      return;
    }
    list.innerHTML = historyLog.map((h, i) => `
      <div class="history-item ${i===0?"current":""}">
        <div class="history-dot"></div>
        <span>${h.action}</span>
      </div>`).join("");
  }

  /* Override pushUndo to log */
  const origPushUndoFn = window.pushUndo || (() => {});

  /* ══ LAYERS PANEL ════════════════════════════════════════════════════════ */
  const TYPE_ICONS = {
    "i-text":"T", "textbox":"T",
    "rect":"▭", "circle":"●", "ellipse":"◎",
    "polygon":"⬠", "triangle":"△", "line":"—",
    "image":"🖼", "path":"✏", "group":"⊞",
  };

  function getLayerName(obj, idx) {
    if (obj._layerName) return obj._layerName;
    const t = obj.type;
    if ((t==="i-text"||t==="textbox") && obj.text) return '"' + obj.text.slice(0,18) + '"';
    return (TYPE_ICONS[t] || "◆") + " " + (t||"Object") + " " + (idx+1);
  }

  function renderLayersPanel() {
    const list  = document.getElementById("layersList");
    const empty = document.getElementById("layersEmpty");
    if (!list) return;
    const objs = canvas.getObjects().filter(o => !o.excludeFromExport).reverse();
    if (!objs.length) { if(empty)empty.style.display="block"; list.innerHTML=""; return; }
    if(empty)empty.style.display="none";
    const active = canvas.getActiveObject();
    list.innerHTML = objs.map((obj, i) => {
      const realIdx = canvas.getObjects().filter(o=>!o.excludeFromExport).length - 1 - i;
      const name = getLayerName(obj, realIdx);
      const icon = TYPE_ICONS[obj.type] || "◆";
      const isSelected = obj === active || (active?.getObjects?.()?.includes(obj));
      const isHidden = !obj.visible;
      const isLocked = !obj.selectable;
      return `<div class="layer-item ${isSelected?"selected":""} ${isHidden?"hidden-layer":""} ${isLocked?"locked-layer":""}" data-idx="${realIdx}">
        <div class="layer-thumb">${icon}</div>
        <span class="layer-name" title="${name}">${name}</span>
        <div class="layer-actions">
          <button class="layer-action-btn layer-visibility-btn ${isHidden?"active":""}" data-idx="${realIdx}" title="${isHidden?"Show":"Hide"}">
            ${isHidden ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M5 2.5A5 5 0 0 1 11 6M1 6a5 5 0 0 0 7.5 3.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>' : '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="1.8" fill="currentColor"/><path d="M1 6c1.5-3 8.5-3 10 0-1.5 3-8.5 3-10 0z" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>'}
          </button>
          <button class="layer-action-btn layer-lock-btn ${isLocked?"active":""}" data-idx="${realIdx}" title="${isLocked?"Unlock":"Lock"}">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2.5" y="5.5" width="7" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M4 5.5V4a2 2 0 0 1 4 0v1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
          <button class="layer-action-btn layer-delete-btn" data-idx="${realIdx}" title="Delete">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4 3V2h4v1M5 5v4M7 5v4M2 3l.7 7.5a.8.8 0 0 0 .8.7h5a.8.8 0 0 0 .8-.7L10 3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>`;
    }).join("");

    list.querySelectorAll(".layer-item").forEach(item => {
      item.addEventListener("click", e => {
        if (e.target.closest(".layer-actions")) return;
        const idx = +item.dataset.idx;
        const allObjs = canvas.getObjects().filter(o=>!o.excludeFromExport);
        const obj = allObjs[idx];
        if (!obj) return;
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        updateRightPanel();
        renderLayersPanel();
      });
    });

    list.querySelectorAll(".layer-visibility-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const obj = canvas.getObjects().filter(o=>!o.excludeFromExport)[+btn.dataset.idx];
        if (!obj) return;
        obj.visible = !obj.visible;
        canvas.requestRenderAll();
        renderLayersPanel();
        renderDockLayers();
      });
    });

    list.querySelectorAll(".layer-lock-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const obj = canvas.getObjects().filter(o=>!o.excludeFromExport)[+btn.dataset.idx];
        if (!obj) return;
        const lock = obj.selectable;
        obj.selectable = !lock; obj.evented = !lock;
        canvas.discardActiveObject(); canvas.requestRenderAll();
        renderLayersPanel();
      });
    });

    list.querySelectorAll(".layer-delete-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const obj = canvas.getObjects().filter(o=>!o.excludeFromExport)[+btn.dataset.idx];
        if (!obj) return;
        pushUndo(); canvas.remove(obj); canvas.requestRenderAll();
        saveCurrentPage(); renderLayersPanel(); renderDockLayers(); updateRightPanel();
      });
    });
  }

  function renderDockLayers() {
    const container = document.getElementById("dockLayersList");
    if (!container) return;
    const objs = canvas.getObjects().filter(o=>!o.excludeFromExport).reverse();
    if (!objs.length) {
      container.innerHTML = '<div class="dock-empty">No elements yet.</div>';
      return;
    }
    const active = canvas.getActiveObject();
    container.innerHTML = objs.map((obj, i) => {
      const realIdx = canvas.getObjects().filter(o=>!o.excludeFromExport).length - 1 - i;
      const name = getLayerName(obj, realIdx);
      const icon = TYPE_ICONS[obj.type] || "◆";
      const isSelected = obj === active;
      return `<div class="dock-layer-chip ${isSelected?"selected":""}" data-idx="${realIdx}">
        <span class="dlc-icon">${icon}</span>
        <span class="dlc-name">${name.slice(0,20)}</span>
      </div>`;
    }).join("");

    container.querySelectorAll(".dock-layer-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const obj = canvas.getObjects().filter(o=>!o.excludeFromExport)[+chip.dataset.idx];
        if (!obj) return;
        canvas.setActiveObject(obj); canvas.requestRenderAll(); updateRightPanel();
        renderDockLayers(); renderLayersPanel();
      });
    });
  }

  /* Wire layers panel refresh */
  document.getElementById("layersRefreshBtn")?.addEventListener("click", () => { renderLayersPanel(); renderDockLayers(); });

  /* Auto-refresh layers when canvas changes */
  canvas.on("object:added",   () => { renderLayersPanel(); renderDockLayers(); logHistory("Add element"); });
  canvas.on("object:removed", () => { renderLayersPanel(); renderDockLayers(); logHistory("Delete element"); });
  canvas.on("object:modified",() => { renderLayersPanel(); renderDockLayers(); logHistory("Modify element"); });

  // Clip all free-draw strokes to the page rect so they can't spill into the grey workspace
  canvas.on("path:created", (e) => {
    const path = e.path;
    if (!path) return;
    path.clipPath = new fabric.Rect({
      left: 0, top: 0,
      width: PAGE_W, height: PAGE_H,
      absolutePositioned: true // coordinates are in canvas space, not path-local space
    });
    canvas.requestRenderAll();
  });
  canvas.on("selection:created", () => { renderLayersPanel(); renderDockLayers(); });
  canvas.on("selection:updated", () => { renderLayersPanel(); renderDockLayers(); });
  canvas.on("selection:cleared", () => { renderLayersPanel(); renderDockLayers(); });

  /* Open layers panel via rail */
  document.querySelector('.rail-btn[data-panel="layers"]')?.addEventListener("click", () => {
    setTimeout(renderLayersPanel, 50);
  });

  /* ══ DRAW MODE (PROCREATE STYLE) ════════════════════════════════════════ */
  (function initDrawMode() {
    let isDrawing = false;
    let activeTool = "pencil";
    let drawColor = "#1a0f08";
    let drawSize  = 12;
    let drawOpacity = 1;
    let drawDecimate = 3;

    const enterBtn   = document.getElementById("drawEnterBtn");
    const clearBtn   = document.getElementById("drawClearBtn");
    const colorInp   = document.getElementById("drawColor");
    const sizeInp    = document.getElementById("drawSize");
    const sizeVal    = document.getElementById("drawSizeVal");
    const opacInp    = document.getElementById("drawOpacity");
    const opacVal    = document.getElementById("drawOpacityVal");
    const smoothInp  = document.getElementById("drawSmoothing");
    const smoothVal  = document.getElementById("drawSmoothVal");
    const indicator  = document.getElementById("drawModeIndicator");
    const previewCvs = document.getElementById("brushPreview");
    const previewCtx = previewCvs?.getContext("2d");

    function applyBrush() {
      if (!canvas.isDrawingMode) return;
      const opacity = drawOpacity;

      if (activeTool === "spray") {
        canvas.freeDrawingBrush = new fabric.SprayBrush(canvas);
        canvas.freeDrawingBrush.width = drawSize * 4;
        canvas.freeDrawingBrush.density = 20;
        canvas.freeDrawingBrush.dotWidth = 2;
        canvas.freeDrawingBrush.color = drawColor;
        canvas.freeDrawingBrush.opacity = opacity;
      } else {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = drawColor;
        canvas.freeDrawingBrush.decimate = drawDecimate;
        if (activeTool === "pencil") {
          canvas.freeDrawingBrush.width = drawSize;
          canvas.freeDrawingBrush.strokeLineCap = "round";
        } else if (activeTool === "pen") {
          canvas.freeDrawingBrush.width = Math.max(1, drawSize * 0.5);
          canvas.freeDrawingBrush.strokeLineCap = "round";
          canvas.freeDrawingBrush.decimate = 1;
        } else if (activeTool === "brush") {
          canvas.freeDrawingBrush.width = drawSize * 2.5;
          canvas.freeDrawingBrush.strokeLineCap = "round";
        } else if (activeTool === "marker") {
          canvas.freeDrawingBrush.width = drawSize * 1.8;
          canvas.freeDrawingBrush.strokeLineCap = "square";
        } else if (activeTool === "eraser") {
          canvas.freeDrawingBrush.color = "#ffffff";
          canvas.freeDrawingBrush.width = drawSize * 2;
        }
      }
      canvas.freeDrawingBrush.opacity = opacity;
      updateBrushPreview();
    }

    function updateBrushPreview() {
      if (!previewCtx || !previewCvs) return;
      const w = previewCvs.width, h = previewCvs.height;
      previewCtx.clearRect(0, 0, w, h);
      previewCtx.strokeStyle = activeTool === "eraser" ? "#888" : drawColor;
      previewCtx.lineWidth   = activeTool === "pen" ? drawSize*0.5 : activeTool === "brush" ? drawSize*2.5 : drawSize;
      previewCtx.lineCap     = activeTool === "marker" ? "square" : "round";
      previewCtx.globalAlpha = drawOpacity;
      previewCtx.beginPath();
      previewCtx.moveTo(12, h/2 + 8);
      previewCtx.bezierCurveTo(w*0.2, h/2 - 12, w*0.5, h/2 + 14, w*0.7, h/2 - 6);
      previewCtx.lineTo(w - 12, h/2 + 4);
      previewCtx.stroke();
      previewCtx.globalAlpha = 1;
    }

    function enterDrawMode() {
      isDrawing = true;
      canvas.isDrawingMode = true;
      applyBrush();
      document.body.classList.add("draw-mode");
      if (enterBtn) { enterBtn.textContent = "Exit Draw Mode"; enterBtn.classList.add("active-draw"); }
      if (indicator) indicator.classList.remove("hidden");
      showToast("Draw mode ON — " + activeTool, "info");
    }

    function exitDrawMode() {
      isDrawing = false;
      canvas.isDrawingMode = false;
      document.body.classList.remove("draw-mode");
      if (enterBtn) { enterBtn.textContent = "Enter Draw Mode"; enterBtn.classList.remove("active-draw"); }
      if (indicator) indicator.classList.add("hidden");
      showToast("Draw mode OFF", "info");
    }

    enterBtn?.addEventListener("click", () => {
      if (isDrawing) exitDrawMode(); else enterDrawMode();
    });

    clearBtn?.addEventListener("click", () => {
      pushUndo();
      const drawPaths = canvas.getObjects().filter(o => o.type === "path");
      drawPaths.forEach(p => canvas.remove(p));
      canvas.requestRenderAll(); saveCurrentPage();
      showToast("Drawing cleared", "info");
    });

    document.querySelectorAll(".draw-tool-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".draw-tool-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        activeTool = btn.dataset.tool;
        applyBrush();
        if (isDrawing) showToast(activeTool + " selected", "info");
      });
    });

    colorInp?.addEventListener("input", () => { drawColor = colorInp.value; applyBrush(); });

    document.querySelectorAll(".dqc").forEach(btn => {
      btn.addEventListener("click", () => {
        drawColor = btn.dataset.c;
        if (colorInp) colorInp.value = drawColor;
        document.querySelectorAll(".dqc").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        applyBrush();
      });
    });

    sizeInp?.addEventListener("input", () => {
      drawSize = +sizeInp.value;
      if (sizeVal) sizeVal.textContent = drawSize;
      applyBrush();
    });

    opacInp?.addEventListener("input", () => {
      drawOpacity = +opacInp.value / 100;
      if (opacVal) opacVal.textContent = opacInp.value + "%";
      applyBrush();
    });

    smoothInp?.addEventListener("input", () => {
      drawDecimate = +smoothInp.value;
      if (smoothVal) smoothVal.textContent = smoothInp.value;
      applyBrush();
    });

    /* Exit draw mode when switching to another rail tab */
    document.querySelectorAll(".rail-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (btn.dataset.panel !== "draw" && isDrawing) exitDrawMode();
      });
    });

    /* Keyboard shortcut: D to toggle draw mode */
    document.addEventListener("keydown", e => {
      if (e.key === "d" && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        if (isDrawing) exitDrawMode(); else {
          /* Switch to draw panel */
          document.querySelector('.rail-btn[data-panel="draw"]')?.click();
          enterDrawMode();
        }
      }
    });

    updateBrushPreview();
  })();

  /* ══ SECTIONS / COMPONENTS ═══════════════════════════════════════════════ */
  (function initComponents() {
    const COMPONENTS = {
      "hero-dark": [
        { type:"rect",   left:0,       top:0,    width:PAGE_W, height:PAGE_H*0.55, fill:"#111116", rx:0 },
        { type:"i-text", left:PAGE_W/2, top:80,  text:"BOLD HEADLINE", fontSize:Math.round(PAGE_W*0.07), fontFamily:"Space Grotesk, sans-serif", fontWeight:"800", fill:"#f0f0f5", textAlign:"center", originX:"center" },
        { type:"i-text", left:PAGE_W/2, top:220, text:"Subheadline text goes here — make it compelling.", fontSize:Math.round(PAGE_W*0.022), fontFamily:"Inter, sans-serif", fill:"#a0a0b8", textAlign:"center", originX:"center" },
        { type:"rect",   left:PAGE_W/2-80, top:300, width:160, height:48, fill:"#7c3aed", rx:8 },
      ],
      "hero-light": [
        { type:"rect",   left:0, top:0, width:PAGE_W, height:PAGE_H, fill:"#fafafa", rx:0 },
        { type:"i-text", left:PAGE_W/2, top:100, text:"Your Big Idea", fontSize:Math.round(PAGE_W*0.08), fontFamily:"Playfair Display, serif", fontWeight:"700", fill:"#1a0f08", textAlign:"center", originX:"center" },
        { type:"i-text", left:PAGE_W/2, top:260, text:"A short description that captures attention immediately.", fontSize:Math.round(PAGE_W*0.022), fontFamily:"Inter, sans-serif", fill:"#6b6b7b", textAlign:"center", originX:"center" },
      ],
      "hero-split": [
        { type:"rect", left:0, top:0, width:PAGE_W*0.5, height:PAGE_H, fill:"#1a1a1f", rx:0 },
        { type:"rect", left:PAGE_W*0.5, top:0, width:PAGE_W*0.5, height:PAGE_H, fill:"#f3701e", rx:0 },
        { type:"i-text", left:PAGE_W*0.25, top:PAGE_H*0.3, text:"Your\nBrand", fontSize:Math.round(PAGE_W*0.07), fontFamily:"Bebas Neue, cursive", fill:"#ffffff", textAlign:"center", originX:"center", lineHeight:1.1 },
        { type:"i-text", left:PAGE_W*0.75, top:PAGE_H*0.3, text:"Bold\nStatement", fontSize:Math.round(PAGE_W*0.07), fontFamily:"Bebas Neue, cursive", fill:"#1a1a1f", textAlign:"center", originX:"center", lineHeight:1.1 },
      ],
      "hero-center": [
        { type:"i-text", left:PAGE_W/2, top:PAGE_H*0.35, text:"Centered Hero", fontSize:Math.round(PAGE_W*0.09), fontFamily:"Outfit, sans-serif", fontWeight:"800", fill:"#1a0f08", textAlign:"center", originX:"center", originY:"center" },
        { type:"i-text", left:PAGE_W/2, top:PAGE_H*0.52, text:"Simple. Powerful. Memorable.", fontSize:Math.round(PAGE_W*0.025), fontFamily:"Inter, sans-serif", fill:"#6b6b7b", textAlign:"center", originX:"center", originY:"center" },
        { type:"rect", left:PAGE_W/2-70, top:PAGE_H*0.62, width:140, height:44, fill:"#1a0f08", rx:6 },
      ],
      "cta-banner": [
        { type:"rect", left:40, top:PAGE_H*0.35, width:PAGE_W-80, height:120, fill:"#7c3aed", rx:16, shadow:{color:"rgba(124,58,237,0.35)",blur:32,offsetX:0,offsetY:8} },
        { type:"i-text", left:PAGE_W/2, top:PAGE_H*0.35+36, text:"Ready to get started?", fontSize:Math.round(PAGE_W*0.04), fontFamily:"Space Grotesk, sans-serif", fontWeight:"700", fill:"#fff", textAlign:"center", originX:"center" },
        { type:"rect", left:PAGE_W/2+60, top:PAGE_H*0.35+70, width:130, height:36, fill:"#fff", rx:8 },
      ],
      "cta-card": [
        { type:"rect", left:PAGE_W/2-160, top:PAGE_H*0.25, width:320, height:240, fill:"#1a1a1f", rx:20, shadow:{color:"rgba(0,0,0,0.4)",blur:40,offsetX:0,offsetY:12} },
        { type:"i-text", left:PAGE_W/2, top:PAGE_H*0.25+40, text:"Start Free Trial", fontSize:Math.round(PAGE_W*0.038), fontFamily:"Space Grotesk, sans-serif", fontWeight:"700", fill:"#f0f0f5", textAlign:"center", originX:"center" },
        { type:"i-text", left:PAGE_W/2, top:PAGE_H*0.25+100, text:"No credit card required.", fontSize:Math.round(PAGE_W*0.02), fontFamily:"Inter, sans-serif", fill:"#a0a0b8", textAlign:"center", originX:"center" },
        { type:"rect", left:PAGE_W/2-70, top:PAGE_H*0.25+148, width:140, height:40, fill:"#7c3aed", rx:10 },
      ],
      "features-3col": [
        { type:"i-text", left:PAGE_W/2, top:40, text:"Features", fontSize:Math.round(PAGE_W*0.055), fontFamily:"Space Grotesk, sans-serif", fontWeight:"700", fill:"#1a0f08", textAlign:"center", originX:"center" },
        ...[0,1,2].map(i => ([
          { type:"rect", left:60+i*(PAGE_W-120)/3+10, top:160, width:(PAGE_W-120)/3-20, height:220, fill:"#fafafa", rx:14, shadow:{color:"rgba(0,0,0,0.08)",blur:16,offsetX:0,offsetY:4} },
          { type:"i-text", left:60+i*(PAGE_W-120)/3+10+(PAGE_W-120)/6, top:190, text:["✦ Faster","✦ Smarter","✦ Better"][i], fontSize:Math.round(PAGE_W*0.028), fontFamily:"Space Grotesk, sans-serif", fontWeight:"700", fill:"#7c3aed", textAlign:"center", originX:"center" },
          { type:"i-text", left:60+i*(PAGE_W-120)/3+10+(PAGE_W-120)/6, top:250, text:"Short feature description goes here in two lines.", fontSize:Math.round(PAGE_W*0.018), fontFamily:"Inter, sans-serif", fill:"#6b6b7b", textAlign:"center", originX:"center", width:(PAGE_W-120)/3-40 },
        ])).flat(),
      ],
      "features-2col": [
        { type:"i-text", left:PAGE_W/2, top:40, text:"Why Choose Us", fontSize:Math.round(PAGE_W*0.05), fontFamily:"Playfair Display, serif", fontWeight:"700", fill:"#1a0f08", textAlign:"center", originX:"center" },
        ...[0,1].map(i => [
          { type:"rect", left:40+i*(PAGE_W/2-20)+10, top:140, width:PAGE_W/2-60, height:260, fill:"#fafafa", rx:16, shadow:{color:"rgba(0,0,0,0.07)",blur:20,offsetX:0,offsetY:4} },
          { type:"i-text", left:40+i*(PAGE_W/2-20)+10+(PAGE_W/2-60)/2, top:180, text:["Feature One","Feature Two"][i], fontSize:Math.round(PAGE_W*0.032), fontFamily:"Space Grotesk, sans-serif", fontWeight:"700", fill:"#1a0f08", textAlign:"center", originX:"center" },
        ]).flat(),
      ],
      "testimonial-card": [
        { type:"rect", left:PAGE_W/2-180, top:PAGE_H*0.2, width:360, height:280, fill:"#ffffff", rx:20, shadow:{color:"rgba(0,0,0,0.1)",blur:30,offsetX:0,offsetY:8} },
        { type:"i-text", left:PAGE_W/2, top:PAGE_H*0.2+40, text:"\"This changed everything for us.\nAbsolutely incredible product.\"", fontSize:Math.round(PAGE_W*0.025), fontFamily:"Merriweather, serif", fill:"#1a0f08", textAlign:"center", originX:"center", lineHeight:1.5, width:300, fontStyle:"italic" },
        { type:"i-text", left:PAGE_W/2, top:PAGE_H*0.2+200, text:"— Jane Smith, CEO at Acme", fontSize:Math.round(PAGE_W*0.018), fontFamily:"Inter, sans-serif", fill:"#8888a0", textAlign:"center", originX:"center", fontWeight:"600" },
      ],
      "testimonial-row": [
        { type:"i-text", left:60, top:80, text:"What our users say", fontSize:Math.round(PAGE_W*0.04), fontFamily:"Space Grotesk, sans-serif", fontWeight:"700", fill:"#1a0f08" },
        ...[0,1,2].map(i => [
          { type:"rect", left:40+i*((PAGE_W-80)/3+8), top:160, width:(PAGE_W-80)/3-8, height:180, fill:"#fafafa", rx:12, shadow:{color:"rgba(0,0,0,0.06)",blur:12,offsetX:0,offsetY:3} },
          { type:"i-text", left:40+i*((PAGE_W-80)/3+8)+(PAGE_W-80)/6, top:185, text:'"Great product!"', fontSize:Math.round(PAGE_W*0.022), fontFamily:"Merriweather, serif", fill:"#1a0f08", textAlign:"center", originX:"center", fontStyle:"italic" },
        ]).flat(),
      ],
    };

    document.querySelectorAll(".comp-card").forEach(card => {
      card.addEventListener("click", () => {
        const key = card.dataset.comp;
        const def = COMPONENTS[key];
        if (!def) { showToast("Section not available yet", "info"); return; }
        pushUndo();
        def.forEach(spec => {
          let obj;
          if (spec.type === "rect") {
            obj = new fabric.Rect({
              left:spec.left, top:spec.top, width:spec.width, height:spec.height,
              fill:spec.fill||"#ffffff", rx:spec.rx||0, ry:spec.rx||0, selectable:true
            });
            if (spec.shadow) obj.set("shadow", new fabric.Shadow(spec.shadow));
          } else if (spec.type === "i-text") {
            obj = new fabric.IText(spec.text||"Text", {
              left:spec.left, top:spec.top,
              fontSize:spec.fontSize||20,
              fontFamily:spec.fontFamily||"Inter, sans-serif",
              fontWeight:spec.fontWeight||"400",
              fontStyle:spec.fontStyle||"normal",
              fill:spec.fill||"#1a0f08",
              textAlign:spec.textAlign||"left",
              lineHeight:spec.lineHeight||1.3,
              originX:spec.originX||"left",
              originY:spec.originY||"top",
              width:spec.width||undefined,
            });
          }
          if (obj) { loadFont((spec.fontFamily||"").split(",")[0].trim()); canvas.add(obj); }
        });
        canvas.requestRenderAll();
        saveCurrentPage();
        renderLayersPanel();
        renderDockLayers();
        showToast("Section added — customize it!", "success");
      });
    });
  })();

  /* Initial render */
  setTimeout(() => { renderLayersPanel(); renderDockLayers(); }, 600);

  /* Upgrade AI chat to pass canvas context */
  (function upgradeChat() {
    const orig = document.getElementById("aiSend");
    if (!orig) return;
    /* Remove old listener by cloning the node */
    const fresh = orig.cloneNode(true);
    orig.parentNode.replaceChild(fresh, orig);

    function sendChatV2() {
      const input = document.getElementById("aiInput"); if (!input) return;
      const msg = input.value.trim(); if (!msg) return;
      input.value = "";
      const container = document.getElementById("aiMessages"); if (!container) return;

      const addBubble = (role, text) => {
        const b = document.createElement("div");
        b.className = "ai-msg-bubble ai-msg-" + role;
        b.innerHTML = text.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br>");
        container.appendChild(b); container.scrollTop = container.scrollHeight; return b;
      };

      addBubble("user", msg);
      const bubble = addBubble("reply", "✦ Thinking…");

      if (!window.DoodleAI) { bubble.textContent = "AI module not loaded."; return; }

      DoodleAI.ask(msg, (err, result) => {
        bubble.remove();
        if (err) { addBubble("reply", "Error — please try again."); return; }
        const rb = addBubble("reply", result.reply);
        if (result.palette) {
          const sw = document.createElement("div");
          sw.className = "chat-palette-swatches";
          result.palette.colors.forEach(c => {
            const s = document.createElement("button");
            s.className = "chat-swatch"; s.style.background = c; s.title = c;
            s.addEventListener("click", () => { const o = canvas.getActiveObject(); if (!o) return; pushUndo(); o.set("fill",c); canvas.requestRenderAll(); updateRightPanel(); });
            sw.appendChild(s);
          });
          rb.appendChild(sw);
        }
      }, canvas, PAGE_W, PAGE_H);
    }

    fresh.addEventListener("click", sendChatV2);
    document.getElementById("aiInput")?.addEventListener("keydown", e => { if (e.key==="Enter"&&!e.shiftKey) sendChatV2(); });
  })();

  /* ══ AI DESIGN CHAT (GPT-4o canvas enhancement) ════════════════ */
  (function initDesignChat(){
    const dcInput   = document.getElementById("dcInput");
    const dcSend    = document.getElementById("dcSend");
    const dcMessages= document.getElementById("dcMessages");
    const modal     = document.getElementById("dcPreviewModal");
    const dcApply   = document.getElementById("dcApply");
    const dcDiscard = document.getElementById("dcDiscard");
    const dcClose   = document.getElementById("dcPreviewClose");
    const dcGenCode = document.getElementById("dcGenCode");
    const dcLoading = document.getElementById("dcLoading");
    const dcOrig    = document.getElementById("dcOriginalImg");
    const dcEnhanced= document.getElementById("dcEnhancedImg");
    const dcPromptDisp = document.getElementById("dcPromptDisplay");
    const codeModal = document.getElementById("dcCodeModal");
    const codeClose = document.getElementById("dcCodeClose");
    const codeCopy  = document.getElementById("dcCopyCode");
    const codeBlock = document.getElementById("dcCodeBlock");

    if(!dcInput || !dcSend) return;

    let pendingEnhancedJSON = null;
    let _generatedCodes = {html:"", css:"", react:""};

    function addMsg(text, type="ai"){
      const div = document.createElement("div");
      div.className = `dc-msg dc-msg-${type}`;
      div.textContent = text;
      dcMessages.appendChild(div);
      dcMessages.scrollTop = dcMessages.scrollHeight;
    }

    async function sendChat(){
      const prompt = dcInput.value.trim();
      if(!prompt) return;

      const settings = window.DoodleAI?.getAPISettings?.() || {};

      addMsg(prompt, "user");
      dcInput.value = "";
      dcSend.disabled = true;
      dcSend.classList.add("loading");
      addMsg("Enhancing your design with GPT-4o…", "ai");

      // Capture current design
      const originalDataURL = canvas.toDataURL({format:"png", quality:0.75, multiplier:1});
      const canvasJSON = canvas.toJSON(["excludeFromExport","hoverCursor","perPixelTargetFind","selectable","evented"]);
      canvasJSON.pageSize = {w:PAGE_W, h:PAGE_H};
      // Strip page background rect (excludeFromExport) to keep JSON clean for GPT
      const cleanObjs = (canvasJSON.objects||[]).filter(o=>!o.excludeFromExport);
      const sendJSON = {...canvasJSON, objects:cleanObjs};

      const canvasJSONStr = JSON.stringify(sendJSON);
      // If JSON is very large, send a simplified summary instead to avoid token limits
      const useFullJSON = canvasJSONStr.length < 8000;
      const designContext = useFullJSON
        ? `Current design JSON (Fabric.js 5.x — modify and return this):\n${canvasJSONStr}`
        : `Current design has ${sendJSON.objects?.length||0} objects. Canvas: ${PAGE_W}×${PAGE_H}px. Return a NEW enhanced version based on what you see in the image.`;

      const systemPrompt = `You are an expert UI/UX designer and Fabric.js 5.x developer.
You will receive a canvas design image and JSON. Apply the user's enhancement request and return the IMPROVED design as JSON.

CRITICAL: Your entire response must be ONLY a JSON object. No markdown, no explanation, no code blocks.

Required JSON structure:
{"version":"5.3.0","background":"","objects":[...array of Fabric.js objects...]}

Object types you can use: textbox, i-text, rect, circle, ellipse, path, image, group
Required fields per object: type, left, top, width, height (plus type-specific fields)
Text objects need: text, fontSize, fontFamily, fill, fontWeight
Shape objects need: fill, stroke, strokeWidth
Gradients: {"type":"linear","gradientUnits":"pixels","coords":{"x1":0,"y1":0,"x2":${PAGE_W},"y2":${PAGE_H}},"colorStops":[{"offset":0,"color":"#hex"},{"offset":1,"color":"#hex"}]}
Shadows: {"color":"rgba(0,0,0,0.35)","blur":24,"offsetX":0,"offsetY":8}

Rules:
- Keep ALL existing objects unless user asks to remove them
- Do NOT include "excludeFromExport":true objects
- Set "background" to "" always
- Canvas size is ${PAGE_W}×${PAGE_H}px — keep objects within bounds
- Apply the enhancement while preserving layout and content`;

      const messages = [
        {role:"system", content:systemPrompt},
        {role:"user", content:[
          {type:"text", text:`Enhancement request: "${prompt}"\n\n${designContext}`},
          {type:"image_url", image_url:{url:originalDataURL, detail:"low"}}
        ]}
      ];

      // Show preview modal immediately with loading state
      dcOrig.src = originalDataURL;
      dcEnhanced.src = "";
      dcEnhanced.style.display = "none";
      dcLoading.classList.remove("hidden");
      dcApply.disabled = true;
      dcGenCode.disabled = true;
      dcPromptDisp.textContent = `"${prompt}"`;
      modal.classList.remove("hidden");

      try {
        // Call OpenAI with json_object mode to force valid JSON response
        const res = await fetch("/api/ai/proxy",{
          method:"POST",
          headers:{"Content-Type":"application/json",...(settings.apiKey?{"Authorization":`Bearer ${settings.apiKey}`}:{})},
          body:JSON.stringify({
            model:"gpt-4o",
            messages,
            max_tokens:4096,
            temperature:0.5,
            response_format:{type:"json_object"}
          })
        });

        if(!res.ok){
          const err = await res.json().catch(()=>({}));
          throw new Error(err.error?.message || `OpenAI API error ${res.status}. Check that your API key is a valid OpenAI key.`);
        }

        const data = await res.json();
        const text = data.choices[0].message.content;
        // response_format:json_object guarantees valid JSON; still use parseJSON for safety
        const parsed = window.DoodleAI?.parseJSON?.(text) || JSON.parse(text);
        if(!parsed || !Array.isArray(parsed.objects)){
          // Try to salvage: if GPT returned objects under a different key
          const keys = Object.keys(parsed||{});
          const objKey = keys.find(k=>Array.isArray(parsed[k]) && parsed[k].length);
          if(objKey){
            parsed.objects = parsed[objKey];
          } else {
            throw new Error("GPT didn't return a valid canvas design. Try a different prompt — e.g. 'make it more modern' or 'use a dark color scheme'.");
          }
        }

        // Ensure page rect is not duplicated
        parsed.objects = (parsed.objects||[]).filter(o=>!o.excludeFromExport);
        pendingEnhancedJSON = parsed;

        // Render enhanced design to preview image via offscreen StaticCanvas
        const el = document.createElement("canvas");
        el.width = PAGE_W; el.height = PAGE_H;
        const tmp = new fabric.StaticCanvas(el, {width:PAGE_W, height:PAGE_H, backgroundColor:"#ffffff"});
        tmp.loadFromJSON(parsed, ()=>{
          tmp.renderAll();
          try {
            const enhURL = tmp.toDataURL({format:"png", quality:0.8, multiplier:0.6});
            dcEnhanced.src = enhURL;
            dcEnhanced.style.display = "block";
          } catch(e){}
          tmp.dispose();
          dcLoading.classList.add("hidden");
          dcApply.disabled = false;
          dcGenCode.disabled = false;
        });

        addMsg("Done! Review the enhanced design and choose to apply or keep the original.", "ai");

      } catch(err) {
        dcLoading.classList.add("hidden");
        addMsg("Error: " + err.message, "error");
        modal.classList.add("hidden");
      }

      dcSend.disabled = false;
      dcSend.classList.remove("loading");
    }

    // Apply enhanced design to canvas
    dcApply.addEventListener("click", ()=>{
      if(!pendingEnhancedJSON) return;
      saveCurrentPage();
      canvas.loadFromJSON(pendingEnhancedJSON, ()=>{
        canvas.backgroundColor = "#dde0e3";
        pageRect = canvas.getObjects().find(o=>o.excludeFromExport);
        if(!pageRect){ pageRect = makePageRect(); canvas.add(pageRect); }
        canvas.sendToBack(pageRect);
        fitPage();
        canvas.requestRenderAll();
        pushUndo();
        saveCurrentPage();
        renderPageStack();
        renderPagesNav();
        showToast("Enhanced design applied!", "success");
      });
      modal.classList.add("hidden");
      pendingEnhancedJSON = null;
    });

    function closePreview(){
      modal.classList.add("hidden");
      pendingEnhancedJSON = null;
    }
    dcDiscard.addEventListener("click", closePreview);
    dcClose.addEventListener("click", closePreview);
    modal.addEventListener("click", e=>{ if(e.target===modal) closePreview(); });

    // Generate code from the enhanced design
    dcGenCode.addEventListener("click", async ()=>{
      if(!pendingEnhancedJSON) return;
      const settings = window.DoodleAI?.getAPISettings?.() || {};

      dcGenCode.textContent = "Generating…";
      dcGenCode.disabled = true;

      const designDesc = window.DoodleAI?.serializeCanvas?.(canvas, PAGE_W, PAGE_H) || {};

      const codePrompt = `You are a frontend developer. Convert this Fabric.js canvas design to clean HTML/CSS code.

Canvas JSON: ${JSON.stringify(pendingEnhancedJSON).slice(0,5000)}
Canvas size: ${PAGE_W}×${PAGE_H}px

Return ONLY a JSON object with three fields:
{
  "html": "<!-- full self-contained HTML with inline styles or linked CSS class names -->",
  "css": "/* all CSS rules */",
  "react": "// React functional component using inline styles"
}

Make the HTML/CSS pixel-accurate to the design. Use flexbox/absolute positioning. All text, colors, fonts, sizes must match.`;

      try {
        const res = await fetch("/api/ai/proxy",{
          method:"POST",
          headers:{"Content-Type":"application/json",...(settings.apiKey?{"Authorization":`Bearer ${settings.apiKey}`}:{})},
          body:JSON.stringify({model:"gpt-4o", messages:[
            {role:"system", content:"You are an expert frontend developer. Convert designs to clean, production-ready code. Return ONLY valid JSON with html, css, react fields."},
            {role:"user", content:codePrompt}
          ], max_tokens:4000, temperature:0.4})
        });

        if(!res.ok){ const e=await res.json(); throw new Error(e.error?.message||`${res.status}`); }
        const data = await res.json();
        const parsed = window.DoodleAI?.parseJSON?.(data.choices[0].message.content);
        if(parsed && (parsed.html||parsed.css||parsed.react)){
          _generatedCodes = {html:parsed.html||"", css:parsed.css||"", react:parsed.react||""};
          codeBlock.querySelector("code").textContent = _generatedCodes.html;
          // Reset tabs
          document.querySelectorAll(".dc-code-tab").forEach(t=>t.classList.toggle("active", t.dataset.lang==="html"));
          codeModal.classList.remove("hidden");
        } else {
          throw new Error("Could not parse code response");
        }
      } catch(err){
        showToast("Code generation failed: "+err.message, "error");
      }

      dcGenCode.innerHTML = `<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4 3L1 6.5 4 10M9 3l3 3.5-3 3.5M7 2l-1 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg> Generate Code`;
      dcGenCode.disabled = false;
    });

    // Code modal tabs
    document.querySelectorAll(".dc-code-tab").forEach(tab=>{
      tab.addEventListener("click", ()=>{
        document.querySelectorAll(".dc-code-tab").forEach(t=>t.classList.remove("active"));
        tab.classList.add("active");
        codeBlock.querySelector("code").textContent = _generatedCodes[tab.dataset.lang] || "(no code generated)";
      });
    });

    codeCopy.addEventListener("click", ()=>{
      const text = codeBlock.querySelector("code").textContent;
      navigator.clipboard.writeText(text).then(()=>showToast("Code copied!","success"));
    });
    codeClose.addEventListener("click", ()=>codeModal.classList.add("hidden"));
    codeModal.addEventListener("click", e=>{ if(e.target===codeModal) codeModal.classList.add("hidden"); });

    // ── File/Photo attachment ─────────────────────────────
    const dcAttachBtn  = document.getElementById("dcAttachBtn");
    const dcFileInput  = document.getElementById("dcFileInput");
    const dcAttachStrip= document.getElementById("dcAttachStrip");

    // attachments = [{type:'image', dataURL, name} | {type:'text', content, name}]
    let _attachments = [];

    function renderAttachStrip(){
      dcAttachStrip.innerHTML = "";
      if(!_attachments.length){ dcAttachStrip.classList.add("hidden"); return; }
      dcAttachStrip.classList.remove("hidden");
      _attachments.forEach((att, i)=>{
        const thumb = document.createElement("div");
        thumb.className = "dc-attach-thumb";
        if(att.type === "image"){
          const img = document.createElement("img");
          img.src = att.dataURL;
          thumb.appendChild(img);
        } else {
          thumb.innerHTML = `<div class="dc-attach-thumb-file">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="10" height="13" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            <span>${att.name.slice(-8)}</span>
          </div>`;
        }
        const rm = document.createElement("button");
        rm.className = "dc-attach-remove";
        rm.textContent = "✕";
        rm.addEventListener("click", ()=>{ _attachments.splice(i,1); renderAttachStrip(); });
        thumb.appendChild(rm);
        dcAttachStrip.appendChild(thumb);
      });
    }

    dcAttachBtn?.addEventListener("click", ()=> dcFileInput?.click());

    dcFileInput?.addEventListener("change", ()=>{
      const files = Array.from(dcFileInput.files||[]);
      dcFileInput.value = "";
      files.forEach(file=>{
        const reader = new FileReader();
        if(file.type.startsWith("image/")){
          reader.onload = ev => {
            _attachments.push({type:"image", dataURL:ev.target.result, name:file.name});
            renderAttachStrip();
          };
          reader.readAsDataURL(file);
        } else {
          // Text-based files
          reader.onload = ev => {
            _attachments.push({type:"text", content:ev.target.result.slice(0,3000), name:file.name});
            renderAttachStrip();
          };
          reader.readAsText(file);
        }
      });
    });

    // ── Voice input ───────────────────────────────────────
    const dcVoiceBtn  = document.getElementById("dcVoiceBtn");
    const dcVoiceBar  = document.getElementById("dcVoiceBar");
    const dcVoiceStop = document.getElementById("dcVoiceStop");
    const dcVoiceLabel= document.getElementById("dcVoiceLabel");
    let _recognition  = null;
    let _isRecording  = false;

    function startVoice(){
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR){ showToast("Voice input not supported in this browser. Try Chrome.", "error"); return; }

      _recognition = new SR();
      _recognition.lang = "en-US";
      _recognition.continuous = true;
      _recognition.interimResults = true;

      let finalTranscript = "";
      _recognition.onstart = ()=>{
        _isRecording = true;
        dcVoiceBtn?.classList.add("active");
        dcVoiceBar?.classList.remove("hidden");
        dcVoiceLabel.textContent = "Listening…";
        finalTranscript = dcInput.value;
      };
      _recognition.onresult = e=>{
        let interim = "";
        for(let i = e.resultIndex; i < e.results.length; i++){
          if(e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
          else interim = e.results[i][0].transcript;
        }
        dcInput.value = finalTranscript + interim;
        dcVoiceLabel.textContent = "Listening… " + (interim ? `"${interim.slice(0,30)}"` : "");
      };
      _recognition.onerror = e=>{
        showToast("Voice error: " + e.error, "error");
        stopVoice();
      };
      _recognition.onend = ()=> stopVoice();
      _recognition.start();
    }

    function stopVoice(){
      _isRecording = false;
      _recognition?.stop();
      _recognition = null;
      dcVoiceBtn?.classList.remove("active");
      dcVoiceBar?.classList.add("hidden");
    }

    dcVoiceBtn?.addEventListener("click", ()=>{ if(_isRecording) stopVoice(); else startVoice(); });
    dcVoiceStop?.addEventListener("click", ()=> stopVoice());

    // ── Updated send — include attachments ────────────────
    // Patch sendChat to inject attached images into messages
    const _origSendChat = sendChat;
    // Override the inner sendChat logic for attachments
    async function sendChatWithAttachments(){
      const prompt = dcInput.value.trim();
      const hasAttachments = _attachments.length > 0;
      if(!prompt && !hasAttachments){ dcInput.focus(); return; }

      // Build the user message display
      const displayParts = [];
      if(prompt) displayParts.push(prompt);
      if(hasAttachments) displayParts.push(`[+${_attachments.length} attachment${_attachments.length>1?"s":""}]`);

      const settings = window.DoodleAI?.getAPISettings?.() || {};

      // Show user message bubble with attachment count
      if(prompt || hasAttachments){
        const div = document.createElement("div");
        div.className = "dc-msg dc-msg-user";
        if(prompt){ const t=document.createElement("div"); t.textContent=prompt; div.appendChild(t); }
        if(hasAttachments){
          _attachments.forEach(att=>{
            if(att.type==="image"){
              const img=document.createElement("img");
              img.src=att.dataURL; img.style.cssText="width:100%;border-radius:5px;margin-top:5px;display:block;";
              div.appendChild(img);
            } else {
              const f=document.createElement("div");
              f.style.cssText="font-size:10px;opacity:0.6;margin-top:3px;";
              f.textContent="📎 "+att.name;
              div.appendChild(f);
            }
          });
        }
        dcMessages.appendChild(div);
        dcMessages.scrollTop = dcMessages.scrollHeight;
      }

      dcInput.value = "";
      const snapshot = [..._attachments];
      _attachments = []; renderAttachStrip();
      stopVoice();
      dcSend.disabled = true;
      dcSend.classList.add("loading");
      addMsg("Enhancing your design with GPT-4o…", "ai");

      // Capture current design
      const originalDataURL = canvas.toDataURL({format:"png", quality:0.75, multiplier:1});
      const canvasJSON = canvas.toJSON(["excludeFromExport","hoverCursor","perPixelTargetFind","selectable","evented"]);
      canvasJSON.pageSize = {w:PAGE_W, h:PAGE_H};
      const cleanObjs = (canvasJSON.objects||[]).filter(o=>!o.excludeFromExport);
      const sendJSON = {...canvasJSON, objects:cleanObjs};

      const canvasJSONStr = JSON.stringify(sendJSON);
      const useFullJSON = canvasJSONStr.length < 8000;
      const designContext = useFullJSON
        ? `Current design JSON (Fabric.js 5.x — modify and return this):\n${canvasJSONStr}`
        : `Current design has ${sendJSON.objects?.length||0} objects. Canvas: ${PAGE_W}×${PAGE_H}px. Return a NEW enhanced version based on what you see in the image.`;

      const systemPrompt = `You are an expert UI/UX designer and Fabric.js 5.x developer.
You will receive a canvas design image and JSON. Apply the user's enhancement request and return the IMPROVED design as JSON.

CRITICAL: Your entire response must be ONLY a JSON object. No markdown, no explanation, no code blocks.

Required JSON structure:
{"version":"5.3.0","background":"","objects":[...array of Fabric.js objects...]}

Object types you can use: textbox, i-text, rect, circle, ellipse, path, image, group
Required fields per object: type, left, top, width, height (plus type-specific fields)
Text objects need: text, fontSize, fontFamily, fill, fontWeight
Shape objects need: fill, stroke, strokeWidth
Gradients: {"type":"linear","gradientUnits":"pixels","coords":{"x1":0,"y1":0,"x2":${PAGE_W},"y2":${PAGE_H}},"colorStops":[{"offset":0,"color":"#hex"},{"offset":1,"color":"#hex"}]}
Shadows: {"color":"rgba(0,0,0,0.35)","blur":24,"offsetX":0,"offsetY":8}

Rules:
- Keep ALL existing objects unless user asks to remove them
- Do NOT include "excludeFromExport":true objects
- Set "background" to "" always
- Canvas size is ${PAGE_W}×${PAGE_H}px — keep objects within bounds
- If reference images are attached, use their colors/style as inspiration`;

      // Build user content array — always include canvas image + any attached images/text
      const userContentParts = [
        {type:"text", text:`Enhancement request: "${prompt||"Improve the design"}"\n\n${designContext}`},
        {type:"image_url", image_url:{url:originalDataURL, detail:"low"}}
      ];
      // Append user-attached images
      snapshot.forEach(att=>{
        if(att.type==="image"){
          userContentParts.push({type:"image_url", image_url:{url:att.dataURL, detail:"low"}});
          userContentParts.push({type:"text", text:`[Reference image: ${att.name} — use its style/colors as inspiration]`});
        } else {
          userContentParts.push({type:"text", text:`[Attached file "${att.name}"]: ${att.content}`});
        }
      });

      const messages = [
        {role:"system", content:systemPrompt},
        {role:"user", content:userContentParts}
      ];

      // Show preview modal
      dcOrig.src = originalDataURL;
      dcEnhanced.src = "";
      dcEnhanced.style.display = "none";
      dcLoading.classList.remove("hidden");
      dcApply.disabled = true;
      dcGenCode.disabled = true;
      dcPromptDisp.textContent = `"${prompt||"Design enhancement"}"`;
      modal.classList.remove("hidden");

      try {
        const res = await fetch("/api/ai/proxy",{
          method:"POST",
          headers:{"Content-Type":"application/json",...(settings.apiKey?{"Authorization":`Bearer ${settings.apiKey}`}:{})},
          body:JSON.stringify({
            model:"gpt-4o", messages, max_tokens:4096, temperature:0.5,
            response_format:{type:"json_object"}
          })
        });
        if(!res.ok){
          const err = await res.json().catch(()=>({}));
          throw new Error(err.error?.message || `OpenAI API error ${res.status}. Check your API key.`);
        }
        const data = await res.json();
        const text = data.choices[0].message.content;
        const parsed = window.DoodleAI?.parseJSON?.(text) || JSON.parse(text);
        if(!parsed || !Array.isArray(parsed.objects)){
          const keys = Object.keys(parsed||{});
          const objKey = keys.find(k=>Array.isArray(parsed[k]) && parsed[k].length);
          if(objKey){ parsed.objects = parsed[objKey]; }
          else throw new Error("GPT didn't return a valid canvas design. Try: 'make it more modern' or 'use a dark color scheme'.");
        }
        parsed.objects = (parsed.objects||[]).filter(o=>!o.excludeFromExport);
        pendingEnhancedJSON = parsed;

        // Render enhanced design preview
        const el = document.createElement("canvas");
        el.width = PAGE_W; el.height = PAGE_H;
        const tmp = new fabric.StaticCanvas(el, {width:PAGE_W, height:PAGE_H, backgroundColor:"#ffffff"});
        tmp.loadFromJSON(parsed, ()=>{
          tmp.renderAll();
          try {
            const enhURL = tmp.toDataURL({format:"png", quality:0.8, multiplier:0.6});
            dcEnhanced.src = enhURL;
            dcEnhanced.style.display = "block";
          } catch(e){}
          dcLoading.classList.add("hidden");
          dcApply.disabled = false;
          dcGenCode.disabled = false;
          try { tmp.dispose(); } catch(e){}
        });
        addMsg("Done! Review the enhanced design and choose to apply or keep the original.", "ai");
      } catch(err){
        addMsg("Error: "+err.message, "error");
        dcLoading.classList.add("hidden");
        modal.classList.add("hidden");
      } finally {
        dcSend.disabled = false;
        dcSend.classList.remove("loading");
      }
    }

    dcSend.addEventListener("click", sendChatWithAttachments);
    dcInput.addEventListener("keydown", e=>{
      if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendChatWithAttachments(); }
    });
  })();

})();
