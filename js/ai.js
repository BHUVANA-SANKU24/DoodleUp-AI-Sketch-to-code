(function (global) {
  "use strict";

  /* ══ COLOR UTILITIES ════════════════════════════════════════════════════ */
  function hexToRgb(hex) {
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return {r,g,b};
  }
  function luminance(hex) {
    const {r,g,b}=hexToRgb(hex);
    const[rv,gv,bv]=[r,g,b].map(c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);});
    return 0.2126*rv+0.7152*gv+0.0722*bv;
  }
  function contrastRatio(h1,h2){const l1=luminance(h1),l2=luminance(h2),li=Math.max(l1,l2),da=Math.min(l1,l2);return(li+0.05)/(da+0.05);}
  function isDark(hex){return luminance(hex)<0.3;}
  function hexToHsl(hex){const{r,g,b}=hexToRgb(hex);const R=r/255,G=g/255,B=b/255;const mx=Math.max(R,G,B),mn=Math.min(R,G,B);let h,s,l=(mx+mn)/2;if(mx===mn){h=s=0;}else{const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);switch(mx){case R:h=(G-B)/d+(G<B?6:0);break;case G:h=(B-R)/d+2;break;case B:h=(R-G)/d+4;break;}h/=6;}return{h:h*360,s,l};}
  function hslToHex(h,s,l){h/=360;const q=l<0.5?l*(1+s):l+s-l*s,p=2*l-q;function hue(t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}const r=Math.round(hue(h+1/3)*255),g=Math.round(hue(h)*255),b=Math.round(hue(h-1/3)*255);return`#${[r,g,b].map(x=>x.toString(16).padStart(2,"0")).join("")}`;}

  function colorHarmony(baseHex) {
    const {h,s,l}=hexToHsl(baseHex);
    return {
      complementary:[baseHex,hslToHex((h+180)%360,s,l)],
      triadic:[baseHex,hslToHex((h+120)%360,s,l),hslToHex((h+240)%360,s,l)],
      analogous:[hslToHex((h-30+360)%360,s,l),baseHex,hslToHex((h+30)%360,s,l)],
      shades:[hslToHex(h,s,Math.min(0.95,l+0.28)),hslToHex(h,s,Math.min(0.8,l+0.14)),baseHex,hslToHex(h,s,Math.max(0.1,l-0.14)),hslToHex(h,s,Math.max(0.05,l-0.28))],
      tints:[baseHex,hslToHex(h,s*0.5,l+(1-l)*0.4),hslToHex(h,s*0.2,l+(1-l)*0.7)],
    };
  }

  /* ══ LLM PROVIDER SYSTEM ════════════════════════════════════════════════ */
  const PROVIDERS = {
    openai: {
      name:"OpenAI", label:"OpenAI (GPT-4o)", placeholder:"sk-...",
      models:["gpt-4o","gpt-4o-mini","gpt-4-turbo","gpt-3.5-turbo"], defaultModel:"gpt-4o",
      async call(apiKey, model, messages) {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`},
          body:JSON.stringify({model, messages, max_tokens:2000, temperature:0.3})
        });
        if (!res.ok) { const e=await res.json(); throw new Error(e.error?.message||`OpenAI ${res.status}`); }
        return (await res.json()).choices[0].message.content;
      }
    },
    anthropic: {
      name:"Anthropic", label:"Anthropic (Claude)", placeholder:"sk-ant-...",
      models:["claude-opus-4-8","claude-sonnet-4-6","claude-haiku-4-5-20251001"], defaultModel:"claude-sonnet-4-6",
      async call(apiKey, model, messages) {
        const system = messages.find(m=>m.role==="system")?.content||"";
        const userMsgs = messages.filter(m=>m.role!=="system");
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({model, messages:userMsgs, system, max_tokens:2000})
        });
        if (!res.ok) { const e=await res.json(); throw new Error(e.error?.message||`Anthropic ${res.status}`); }
        return (await res.json()).content[0].text;
      }
    },
    gemini: {
      name:"Google Gemini", label:"Google Gemini", placeholder:"AIza...",
      models:["gemini-1.5-pro","gemini-1.5-flash","gemini-pro"], defaultModel:"gemini-1.5-flash",
      async call(apiKey, model, messages) {
        const parts = messages.filter(m=>m.role!=="system").map(m=>({text:m.content}));
        const sysInst = messages.find(m=>m.role==="system")?.content;
        const body = {contents:[{role:"user",parts}], generationConfig:{maxOutputTokens:2000, temperature:0.3}};
        if (sysInst) body.systemInstruction = {parts:[{text:sysInst}]};
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)
        });
        if (!res.ok) { const e=await res.json(); throw new Error(e.error?.message||`Gemini ${res.status}`); }
        return (await res.json()).candidates[0].content.parts[0].text;
      }
    },
    openrouter: {
      name:"OpenRouter", label:"OpenRouter (multi-model)", placeholder:"sk-or-...",
      models:["anthropic/claude-sonnet-4-6","openai/gpt-4o","google/gemini-flash-1.5","meta-llama/llama-3.3-70b-instruct","mistralai/mistral-7b-instruct"],
      defaultModel:"anthropic/claude-sonnet-4-6",
      async call(apiKey, model, messages) {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${apiKey}`,"HTTP-Referer":window.location.origin,"X-Title":"SketchCode AI"},
          body:JSON.stringify({model, messages, max_tokens:2000, temperature:0.3})
        });
        if (!res.ok) { const e=await res.json(); throw new Error(e.error?.message||`OpenRouter ${res.status}`); }
        return (await res.json()).choices[0].message.content;
      }
    }
  };

  function getAPISettings() { try { return JSON.parse(localStorage.getItem("du_ai_settings")||"{}"); } catch { return {}; } }
  function saveAPISettings(s) { localStorage.setItem("du_ai_settings", JSON.stringify(s)); }
  function hasAPIKey() { const s=getAPISettings(); return !!(s.apiKey&&s.provider); }

  async function callLLM(messages) {
    const s = getAPISettings();
    if (!s.provider||!s.apiKey) throw new Error("No API key. Click ⚙ AI Settings to add your key.");
    const provider = PROVIDERS[s.provider];
    if (!provider) throw new Error(`Unknown provider: ${s.provider}`);
    return await provider.call(s.apiKey, s.model||provider.defaultModel, messages);
  }

  function parseJSON(text) {
    const m = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
    if (m) { try { return JSON.parse(m[1]); } catch {} }
    try { return JSON.parse(text); } catch {}
    return null;
  }

  /* ══ CANVAS SERIALIZER ══════════════════════════════════════════════════ */
  function serializeCanvas(canvas, pageW, pageH) {
    const objs = canvas.getObjects().filter(o=>!o.excludeFromExport);
    const elements = objs.map((o,i) => {
      const base = { id:i, type:o.type, x:Math.round(o.left), y:Math.round(o.top), w:Math.round(o.getScaledWidth()), h:Math.round(o.getScaledHeight()), opacity:+(o.opacity||1).toFixed(2) };
      if (o.type==="i-text"||o.type==="textbox") {
        return {...base, text:(o.text||"").slice(0,80), fontSize:Math.round(o.fontSize||16), fontFamily:(o.fontFamily||"").split(",")[0].replace(/['"]/g,"").trim(), fontWeight:o.fontWeight, color:typeof o.fill==="string"?o.fill:"gradient", align:o.textAlign, shadow:!!o.shadow };
      }
      if (["rect","circle","ellipse","polygon","triangle"].includes(o.type)) {
        const fill = typeof o.fill==="string"?o.fill:(o.fill?.type?`${o.fill.type}-gradient`:"unknown");
        return {...base, fill, stroke:o.stroke||null, strokeWidth:o.strokeWidth||0, rx:o.rx||0, shadow:!!o.shadow };
      }
      if (o.type==="image") return {...base, hasImage:true };
      return base;
    });
    return { size:{w:pageW,h:pageH}, count:elements.length, elements };
  }

  /* ══ DESIGN ANALYSIS (LLM) ══════════════════════════════════════════════ */
  const ANALYSIS_SYSTEM = `You are a senior UI/UX designer reviewing a Fabric.js canvas design. Analyze the design JSON and provide honest, specific feedback. Score 30-60 for typical amateur designs, 70-85 for good designs, 85+ for exceptional. Return ONLY valid JSON, no markdown.`;

  const ANALYSIS_SCHEMA = `{
  "scores": { "visualHierarchy":<0-100>, "typography":<0-100>, "accessibility":<0-100>, "spacing":<0-100>, "consistency":<0-100>, "modernity":<0-100>, "conversion":<0-100>, "overall":<0-100> },
  "improvements": [
    { "elementId":<number|null>, "title":"<short>", "priority":"high|medium|low", "reason":"<why>", "action":"<what to change>", "property":"<fabric property>", "value":<suggested value or null> }
  ],
  "palette": ["#hex1","#hex2","#hex3","#hex4","#hex5"],
  "fontPair": { "heading":"<name>", "body":"<name>" },
  "summary": "<2-3 sentence critique>",
  "styleLabel": "<Minimal|Modern SaaS|Editorial|Corporate|Startup|Luxury>"
}`;

  async function analyzeWithLLM(canvas, pageW, pageH) {
    const design = serializeCanvas(canvas, pageW, pageH);
    const text = await callLLM([
      { role:"system", content:ANALYSIS_SYSTEM },
      { role:"user", content:`Analyze this design (${pageW}×${pageH}px):\n\n${JSON.stringify(design.elements, null, 2)}\n\nReturn JSON matching this schema:\n${ANALYSIS_SCHEMA}` }
    ]);
    const result = parseJSON(text);
    if (!result?.scores) throw new Error("LLM returned invalid response. Please try again.");
    return result;
  }

  /* ══ ENHANCE DESIGN (LLM) ═══════════════════════════════════════════════ */
  const ENHANCE_SYSTEM = `You are a senior UI/UX designer transforming amateur designs to professional quality. Be bold: dramatically increase key font sizes, fix hierarchy, improve contrast, add elegant spacing. Think Framer, Stripe, Linear. Return ONLY valid JSON.`;

  async function enhanceDesign(canvas, pageW, pageH, stylePresetKey) {
    const design = serializeCanvas(canvas, pageW, pageH);
    const style = stylePresetKey && STYLE_PRESETS[stylePresetKey];
    const styleInstr = style
      ? `Apply the "${style.name}" style: ${style.desc}. Headings in ${style.fontH}, body in ${style.fontB}. Accent color: ${style.accent}.`
      : "Make it modern, professional, and visually stunning.";

    const text = await callLLM([
      { role:"system", content:ENHANCE_SYSTEM },
      { role:"user", content:`Transform this design (${pageW}×${pageH}px) to professional quality:\n\n${JSON.stringify(design.elements, null, 2)}\n\nStyle direction: ${styleInstr}\n\nReturn JSON:\n{\n  "changes": [\n    { "elementId":<number>, "property":"fontSize|fontFamily|fill|fontWeight|opacity|rx|left|top|textAlign|lineHeight|charSpacing|stroke|strokeWidth", "value":<new value>, "reason":"<why>" }\n  ],\n  "newElements": [\n    { "type":"rect|i-text", "x":<n>, "y":<n>, "w":<n>, "h":<n>, "fill":"#hex", "text":"<if text>", "fontSize":<n>, "fontFamily":"<name>", "fontWeight":"<w>", "color":"#hex", "rx":<n>, "purpose":"<what this adds>" }\n  ],\n  "palette": ["#h1","#h2","#h3","#h4","#h5"],\n  "summary": "<what improved>",\n  "scores": { "before":<0-100>, "after":<0-100> }\n}` }
    ]);

    const result = parseJSON(text);
    if (!result?.changes) throw new Error("Enhancement failed: invalid LLM response. Please try again.");
    return result;
  }

  /* ══ LOCAL FALLBACK: DESIGN ANALYSIS ═══════════════════════════════════ */
  function analyzeDesign(canvas, pageW, pageH) {
    const all   = canvas.getObjects().filter(o=>!o.excludeFromExport);
    const texts = all.filter(o=>o.type==="i-text"||o.type==="textbox");
    const shapes= all.filter(o=>["rect","circle","ellipse","polygon","triangle"].includes(o.type));
    const suggestions = [];

    if (all.length===0) {
      suggestions.push({id:"empty",icon:"🎨",title:"Canvas is empty",description:"Add a template, text, or shape to get started.",action:null});
      return suggestions;
    }

    if (texts.length>=2) {
      const sizes=texts.map(t=>t.fontSize||16).sort((a,b)=>b-a);
      if (sizes[0]/sizes[1]<1.3) suggestions.push({id:"hier-text",icon:"📐",title:"Weak typographic hierarchy",description:`Largest text is ${Math.round(sizes[0])}px, next is ${Math.round(sizes[1])}px — ratio ${(sizes[0]/sizes[1]).toFixed(1)}× (aim for 1.5×+).`,action:"Increase heading size",apply(c){const h=texts.reduce((a,b)=>a.fontSize>b.fontSize?a:b);h.set({fontSize:Math.round(h.fontSize*1.5),fontWeight:"800"});c.requestRenderAll();}});
    }

    if (texts.length>0&&texts.every(t=>(t.fontSize||16)<36)&&pageW>600) {
      suggestions.push({id:"focal",icon:"🎯",title:"No clear focal point",description:"Every element looks equally important. Make your main message much larger.",action:"Create strong headline",apply(c){const m=texts[0];m.set({fontSize:Math.round(pageW*0.065),fontWeight:"800"});m.set("left",pageW/2-m.getScaledWidth()/2);c.requestRenderAll();}});
    }

    texts.forEach(t=>{
      const tc=typeof t.fill==="string"&&t.fill.startsWith("#")?t.fill:null;
      if (!tc) return;
      shapes.forEach(s=>{
        const bc=typeof s.fill==="string"&&s.fill.startsWith("#")?s.fill:null;
        if (!bc) return;
        const tb=t.getBoundingRect(),sb=s.getBoundingRect();
        const ov=!(tb.left>sb.left+sb.width||tb.left+tb.width<sb.left||tb.top>sb.top+sb.height||tb.top+tb.height<sb.top);
        if (!ov) return;
        const ratio=contrastRatio(tc,bc);
        if (ratio<4.5) suggestions.push({id:`contrast-${t._id}`,icon:"👁",title:"Low text contrast",description:`"${(t.text||"").slice(0,24).trim()}" vs background: ${ratio.toFixed(1)}:1 (WCAG AA requires 4.5:1).`,action:"Fix contrast",apply(c){t.set("fill",isDark(bc)?"#ffffff":"#1a0f08");c.requestRenderAll();}});
      });
    });

    const margin=Math.min(pageW,pageH)*0.04;
    all.forEach(o=>{
      if (o.left<margin-2||o.top<margin-2) suggestions.push({id:`edge-${o._id}`,icon:"📏",title:"Element touching page edge",description:`Element within ${Math.round(margin)}px of the edge. Add breathing room.`,action:"Push inside margins",apply(c){o.set({left:Math.max(margin,o.left),top:Math.max(margin,o.top)});c.requestRenderAll();}});
    });

    const families=[...new Set(texts.map(t=>(t.fontFamily||"").split(",")[0].replace(/['"]/g,"").trim()))];
    if (families.length>3) suggestions.push({id:"fonts-many",icon:"🔤",title:`Too many fonts (${families.length})`,description:`Using ${families.length} font families creates visual noise. Limit to 2.`,action:"Unify to 2 fonts",apply(c){texts.forEach((t,i)=>t.set("fontFamily",i===0?"Space Grotesk, sans-serif":"Inter, sans-serif"));c.requestRenderAll();}});

    if (shapes.length>0&&shapes.every(s=>!s.shadow)&&all.length>=4) suggestions.push({id:"shadow-none",icon:"🌑",title:"Design looks flat",description:"No elements have shadows. A subtle drop shadow adds depth and separates layers.",action:"Add depth shadows",apply(c){shapes.slice(0,2).forEach(s=>s.set("shadow",new fabric.Shadow({color:"rgba(0,0,0,0.15)",blur:14,offsetX:0,offsetY:4})));c.requestRenderAll();}});

    return suggestions.slice(0,5);
  }

  /* ══ ELEMENT IMPROVEMENT ════════════════════════════════════════════════ */
  function improveElement(obj) {
    const suggestions = [];
    const t = obj.type;
    const isText  = t==="i-text"||t==="textbox";
    const isImage = t==="image";
    const isShape = ["rect","circle","ellipse","polygon","triangle"].includes(t);
    if (isText) {
      const fs=obj.fontSize||16;
      if (fs<14) suggestions.push({icon:"📏",title:"Font too small",desc:`${fs}px. Use 14px+ for body, 32px+ for headings.`,action:"Set 16px",fn:()=>obj.set("fontSize",16)});
      if (fs>=28&&(obj.fontWeight!=="bold"&&obj.fontWeight<700)) suggestions.push({icon:"💪",title:"Bold the heading",desc:"Large headings look authoritative with weight 700–900.",action:"Make bold",fn:()=>obj.set("fontWeight","800")});
      if (!obj.shadow&&fs>44) suggestions.push({icon:"✨",title:"Add text shadow",desc:"A subtle shadow adds depth and improves readability.",action:"Add shadow",fn:()=>obj.set("shadow",new fabric.Shadow({color:"rgba(0,0,0,0.22)",blur:8,offsetX:0,offsetY:2}))});
    }
    if (isImage&&!obj.shadow) suggestions.push({icon:"🌑",title:"Add image frame",desc:"A drop shadow separates the image from background.",action:"Add shadow",fn:()=>obj.set("shadow",new fabric.Shadow({color:"rgba(0,0,0,0.28)",blur:22,offsetX:0,offsetY:6}))});
    if (isShape) {
      if (!obj.shadow) suggestions.push({icon:"🌑",title:"Add elevation",desc:"A drop shadow lifts the shape.",action:"Add shadow",fn:()=>obj.set("shadow",new fabric.Shadow({color:"rgba(0,0,0,0.15)",blur:16,offsetX:0,offsetY:4}))});
      if (t==="rect"&&(!obj.rx||obj.rx===0)) suggestions.push({icon:"🔲",title:"Round the corners",desc:"Rounded corners feel modern and approachable.",action:"16px radius",fn:()=>{obj.set("rx",16);obj.set("ry",16);}});
    }
    if (suggestions.length===0) suggestions.push({icon:"✅",title:"Element looks great!",desc:"Consider adding an animation for extra polish.",action:null});
    return suggestions;
  }

  /* ══ STYLE PRESETS (21) ═════════════════════════════════════════════════ */
  const STYLE_PRESETS = {
    minimal:         {name:"Minimal",         emoji:"⬜",desc:"Max whitespace, monochrome, Outfit",             fontH:"Outfit, sans-serif",           fontB:"Outfit, sans-serif",           accent:"#1a0f08",bg:null,      radius:4, shadowBlur:0,  dark:false},
    modern_saas:     {name:"Modern SaaS",     emoji:"🚀",desc:"Clean Inter, high contrast, orange CTAs",        fontH:"Inter, sans-serif",            fontB:"Inter, sans-serif",            accent:"#f3701e",bg:null,      radius:8, shadowBlur:10, dark:false},
    apple_inspired:  {name:"Apple Inspired",  emoji:"🍎",desc:"Clarity, large type, generous whitespace",       fontH:"Outfit, sans-serif",           fontB:"Outfit, sans-serif",           accent:"#0d3d3a",bg:null,      radius:14,shadowBlur:8,  dark:false},
    stripe_inspired: {name:"Stripe Inspired", emoji:"💳",desc:"Gradient hero, Crimson Pro, indigo accents",     fontH:"Crimson Pro, serif",           fontB:"Inter, sans-serif",            accent:"#635BFF",bg:null,      radius:6, shadowBlur:12, dark:false},
    linear_inspired: {name:"Linear Inspired", emoji:"⬡",desc:"Dark mode, mono font, purple glow",              fontH:"Space Grotesk, sans-serif",    fontB:"Space Grotesk, sans-serif",    accent:"#5E6AD2",bg:"#0F0F11", radius:8, shadowBlur:20, dark:true},
    notion_inspired: {name:"Notion Inspired", emoji:"📄",desc:"Cream bg, neutral, Merriweather editorial",      fontH:"Merriweather, serif",          fontB:"Inter, sans-serif",            accent:"#1a0f08",bg:"#faf9f7", radius:4, shadowBlur:4,  dark:false},
    glassmorphism:   {name:"Glassmorphism",   emoji:"🔮",desc:"Frosted glass, Syne, vivid gradient bg",         fontH:"Syne, sans-serif",             fontB:"Inter, sans-serif",            accent:"#ffffff",bg:"#1a1040", radius:16,shadowBlur:24, dark:true},
    neumorphism:     {name:"Neumorphism",     emoji:"🪨",desc:"Soft clay, inset shadows, Nunito",               fontH:"Nunito, sans-serif",           fontB:"Nunito, sans-serif",           accent:"#f3701e",bg:"#e8e8ec", radius:20,shadowBlur:12, dark:false},
    luxury:          {name:"Luxury",          emoji:"💎",desc:"Deep burgundy, gold accents, DM Serif",          fontH:"DM Serif Display, serif",      fontB:"Lato, sans-serif",             accent:"#FFEC89",bg:"#1a0f08", radius:0, shadowBlur:4,  dark:true},
    corporate:       {name:"Corporate",       emoji:"🏢",desc:"Navy/white, Barlow Condensed, structured",       fontH:"Barlow Condensed, sans-serif", fontB:"Barlow, sans-serif",           accent:"#1a3a6b",bg:null,      radius:2, shadowBlur:6,  dark:false},
    creative_agency: {name:"Creative Agency", emoji:"🎨",desc:"Bold Bebas, electric orange, asymmetric",        fontH:"Bebas Neue, cursive",          fontB:"Space Grotesk, sans-serif",    accent:"#f3701e",bg:"#0d0d0d", radius:0, shadowBlur:0,  dark:true},
    startup:         {name:"Startup",         emoji:"⚡",desc:"Energy, Space Grotesk, gradient CTAs",           fontH:"Space Grotesk, sans-serif",    fontB:"Inter, sans-serif",            accent:"#f3701e",bg:null,      radius:6, shadowBlur:14, dark:false},
    cyberpunk:       {name:"Cyberpunk",       emoji:"🤖",desc:"Neon on black, Orbitron, electric accents",      fontH:"Orbitron, sans-serif",         fontB:"Share Tech, sans-serif",       accent:"#00ff9f",bg:"#0d0d0d", radius:0, shadowBlur:28, dark:true},
    editorial:       {name:"Editorial",       emoji:"📰",desc:"Gloock + Inter, ink black, timeless type",       fontH:"Gloock, serif",                fontB:"Inter, sans-serif",            accent:"#1a0f08",bg:"#fdfcf9", radius:0, shadowBlur:0,  dark:false},
    magazine:        {name:"Magazine",        emoji:"📖",desc:"Fraunces + Outfit, dynamic, expressive",         fontH:"Fraunces, serif",              fontB:"Outfit, sans-serif",           accent:"#BA3801",bg:null,      radius:4, shadowBlur:8,  dark:false},
    portfolio:       {name:"Portfolio",       emoji:"🖼",desc:"Instrument Serif, monochrome, gallery feel",     fontH:"Instrument Serif, serif",      fontB:"Inter, sans-serif",            accent:"#1a0f08",bg:"#f8f8f6", radius:2, shadowBlur:4,  dark:false},
    brutalist:       {name:"Brutalist",       emoji:"⬛",desc:"Thick borders, no decoration, bold contrast",    fontH:"Bebas Neue, cursive",          fontB:"Space Grotesk, sans-serif",    accent:"#f3701e",bg:"#ffffff", radius:0, shadowBlur:0,  dark:false},
    retro:           {name:"Retro",           emoji:"📺",desc:"Warm cream, Abril Fatface, 70s nostalgia",       fontH:"Abril Fatface, cursive",       fontB:"Karla, sans-serif",            accent:"#BA3801",bg:"#f4dabf", radius:8, shadowBlur:6,  dark:false},
    premium:         {name:"Premium Serif",   emoji:"🏆",desc:"Playfair Display, gold, elegant spacing",        fontH:"Playfair Display, serif",      fontB:"Lato, sans-serif",             accent:"#FFEC89",bg:null,      radius:0, shadowBlur:6,  dark:false},
    futuristic:      {name:"Futuristic",      emoji:"🌌",desc:"Dark, neon blue, Space Grotesk",                 fontH:"Space Grotesk, sans-serif",    fontB:"Space Grotesk, sans-serif",    accent:"#4A69B3",bg:"#0d0d12", radius:2, shadowBlur:20, dark:true},
    playful:         {name:"Playful",         emoji:"🎈",desc:"Rounded, Nunito, bright yellow pops",            fontH:"Nunito, sans-serif",           fontB:"Nunito, sans-serif",           accent:"#FFEC89",bg:null,      radius:24,shadowBlur:16, dark:false},
  };

  function applyStylePreset(key, canvas) {
    const P = STYLE_PRESETS[key];
    if (!P) return;
    const objs = canvas.getObjects().filter(o=>!o.excludeFromExport);
    objs.forEach(o => {
      const isH  = (o.type==="i-text"||o.type==="textbox")&&(o.fontSize||16)>=28;
      const isB  = (o.type==="i-text"||o.type==="textbox")&&(o.fontSize||16)<28;
      const isSh = ["rect","circle","ellipse","polygon","triangle"].includes(o.type);
      if (isH) o.set("fontFamily", P.fontH);
      if (isB) o.set("fontFamily", P.fontB);
      if (isSh&&o.type==="rect") { o.set("rx",P.radius); o.set("ry",P.radius); }
      if (isSh&&P.shadowBlur>0) o.set("shadow",new fabric.Shadow({color:`rgba(0,0,0,${P.shadowBlur>14?0.28:0.15})`,blur:P.shadowBlur,offsetX:0,offsetY:Math.round(P.shadowBlur/3)}));
      if (isSh&&P.shadowBlur===0) o.set("shadow",null);
    });
    if (P.bg) {
      const bgRect = canvas.getObjects().find(o=>o.left<=5&&o.top<=5&&o.getScaledWidth()>=canvas.width*0.8);
      if (bgRect) bgRect.set("fill",P.bg);
    }
    canvas.requestRenderAll();
    return P.name;
  }

  /* ══ PALETTE LIBRARY ════════════════════════════════════════════════════ */
  const PALETTES = [
    {name:"Sunset Brand",    moods:["warm","orange","energy","bold","startup","fire"],     colors:["#f3701e","#BA3801","#FFEC89","#f4dabf","#1a0f08"]},
    {name:"Deep Teal",       moods:["teal","trust","professional","calm","focus"],         colors:["#0d3d3a","#0a2e2c","#FFEC89","#e8d8c9","#ffffff"]},
    {name:"Navy Digital",    moods:["blue","navy","saas","tech","digital","corporate"],    colors:["#4A69B3","#4b607f","#f4dabf","#ffffff","#1a0f08"]},
    {name:"Luxury Gold",     moods:["luxury","premium","gold","elegant","dark","rich"],    colors:["#1a0f08","#6C171E","#FFEC89","#f4dabf","#ffffff"]},
    {name:"Soft Blush",      moods:["pink","soft","feminine","romantic","gentle","light"], colors:["#f5b8c4","#fdf7f2","#BA3801","#1a0f08","#f3701e"]},
    {name:"Fresh Greens",    moods:["green","nature","eco","health","fresh","organic"],    colors:["#2d7d5a","#1a4d37","#c8eadc","#f5f7f5","#1a0f08"]},
    {name:"Clean Minimal",   moods:["minimal","white","clean","simple","pure","airy"],     colors:["#ffffff","#f5f5f5","#1a0f08","#f3701e","#e0e0e0"]},
    {name:"Dark Futuristic", moods:["dark","night","space","neon","cyber","future"],       colors:["#0d0d12","#1a1d2e","#4A69B3","#FFEC89","#ffffff"]},
    {name:"Warm Burgundy",   moods:["burgundy","wine","autumn","harvest","cozy"],          colors:["#6C171E","#BA3801","#f4dabf","#FFEC89","#fdf7f2"]},
    {name:"Ocean Breeze",    moods:["ocean","sea","water","cool","fresh","coastal"],       colors:["#0d3d3a","#4A69B3","#e8f4f3","#f4dabf","#ffffff"]},
    {name:"Electric Purple", moods:["purple","stripe","payment","fintech","modern"],       colors:["#635BFF","#1a1040","#ffffff","#f0efff","#e8e7ff"]},
    {name:"Linear Dark",     moods:["linear","app","dark","productivity","saas","tool"],   colors:["#0F0F11","#5E6AD2","#ffffff","#8b8fa8","#1f1f23"]},
  ];

  function generatePalette(mood) {
    const lower = mood.toLowerCase();
    const scored = PALETTES.map(p=>({p,score:p.moods.filter(k=>lower.includes(k)).length}));
    scored.sort((a,b)=>b.score-a.score);
    return scored[0].p;
  }

  /* ══ CONTRAST + ANIMATION ═══════════════════════════════════════════════ */
  function checkContrast(fg, bg) {
    const r=contrastRatio(fg,bg);
    return {ratio:+r.toFixed(2),AA:r>=4.5,AAA:r>=7,AALarge:r>=3,level:r>=7?"AAA ✓":r>=4.5?"AA ✓":r>=3?"AA Large only":"Fail ✗"};
  }

  const ANIM_META = {
    none:  {id:"none",  label:"None",   icon:"✕", reason:"No entrance animation"},
    fade:  {id:"fade",  label:"Fade",   icon:"◌", reason:"Subtle and professional"},
    slide: {id:"slide", label:"Slide",  icon:"→", reason:"Adds direction and energy"},
    rise:  {id:"rise",  label:"Rise",   icon:"↑", reason:"Elegant upward reveal — great for text"},
    pop:   {id:"pop",   label:"Pop",    icon:"⬤", reason:"Springy — perfect for buttons"},
    zoom:  {id:"zoom",  label:"Zoom",   icon:"◎", reason:"Dramatic zoom — great for hero images"},
    rotate:{id:"rotate",label:"Rotate", icon:"↻", reason:"Spinning entrance — dynamic"},
    bounce:{id:"bounce",label:"Bounce", icon:"⋀", reason:"Playful — for decorative elements"},
    drift: {id:"drift", label:"Drift",  icon:"〜",reason:"Slow float — ethereal"},
    blur:  {id:"blur",  label:"Blur in",icon:"⁕", reason:"Cinematic reveal from blur"},
  };

  function suggestAnimations(obj) {
    const isText=obj.type==="i-text"||obj.type==="textbox";
    const isImg=obj.type==="image";
    const isGrp=obj.type==="group";
    if (isText) return ["rise","fade","slide"].map(a=>ANIM_META[a]).filter(Boolean);
    if (isImg)  return ["zoom","fade","rise"].map(a=>ANIM_META[a]).filter(Boolean);
    if (isGrp)  return ["pop","bounce","fade"].map(a=>ANIM_META[a]).filter(Boolean);
    return ["pop","rotate","bounce"].map(a=>ANIM_META[a]).filter(Boolean);
  }

  /* ══ CHAT ══════════════════════════════════════════════════════════════ */
  const INTENTS = [
    {name:"analyze",    tests:[/analyz|improve design|review|audit|check|fix|what.?s wrong|problem|suggestion/i]},
    {name:"style",      tests:[/make.*(look|feel|more|like|style)|modern|premium|minimal|futuristic|playful|apple|startup|luxury|stripe|linear|notion|glass|neo|retro|brutalist|corporate|editorial|magazine|portfolio|cyberpunk|creative/i]},
    {name:"color",      tests:[/palette|colou?rs?|scheme|hue|tint|shade/i]},
    {name:"typography", tests:[/font|typeface|heading|text style|letter|kerning|tracking/i]},
    {name:"animation",  tests:[/animat|motion|transition|move|effect|entrance/i]},
    {name:"layout",     tests:[/layout|arrange|structure|grid|column|balance|composition/i]},
    {name:"spacing",    tests:[/spacing|margin|padding|whitespace|gap|breathing/i]},
    {name:"access",     tests:[/access|contrast|wcag|readable|legib/i]},
    {name:"general",    tests:[/.*/]},
  ];

  const REPLIES = {
    analyze: ()=>"Click **✦ Analyze Design** (Analyze tab) to scan your canvas for hierarchy, contrast, spacing, and alignment issues — each with a one-click fix. Or use **✨ Enhance Design** in the top bar for full AI-powered improvement.",
    style: p=>{const k=Object.keys(STYLE_PRESETS).find(k=>p.toLowerCase().includes(STYLE_PRESETS[k].name.split(" ")[0].toLowerCase()))||"modern_saas";const P=STYLE_PRESETS[k];return `**${P.emoji} ${P.name}**: ${P.desc}\n\nOpen the **Styles tab** in the AI panel and click it to apply instantly.`;},
    color: p=>{const pal=generatePalette(p);return `**${pal.name}** — ${pal.moods.slice(0,3).join(", ")}:\n\n${pal.colors.join("  ·  ")}\n\nSwatches added below. Click any to apply to the selected element.`;},
    typography: ()=>"**Typographic scale:**\n• Display: 64–96px · weight 800\n• H1: 40–60px · weight 700–800\n• H2: 28–38px · weight 600–700\n• Body: 15–18px · line-height 1.5\n• Caption: 11–13px · uppercase\n\n**Best pairings:**\n• DM Serif Display + Inter — editorial\n• Space Grotesk + Outfit — modern tech\n• Playfair Display + Lato — premium",
    animation: ()=>"**Animation principles:**\n• Timing: 300–600ms\n• Text: Rise or Fade\n• Buttons: Pop\n• Hero images: Zoom\n• Decorative: Drift or Rotate\n\nSelect element → right panel → Animation.",
    layout: ()=>"**Composition patterns:**\n• **Center-stage** — single bold element centered\n• **F-pattern** — headline top-left, CTA top-right\n• **Z-pattern** — logo → CTA → content → CTA",
    spacing: ()=>"**8pt spacing system:**\n• 4px — micro gaps\n• 8px — related elements\n• 16px — items in list\n• 32px — components\n• 64px — section breaks\n\nMinimum 4–5% margin from page edges.",
    access: ()=>{const r=checkContrast("#1a0f08","#ffffff");return `**WCAG 2.1:**\n• Normal text: 4.5:1 (AA)\n• Large text: 3:1 (AA)\n\nDark on white = ${r.ratio}:1 → ${r.level}\n\nRun **Analyze Design** to auto-check all text.`;},
    general: ()=>"**I'm your AI Design Copilot.** Try:\n• Analyze my design\n• Make this minimal\n• Suggest a warm palette\n• How should I animate this?\n• Check my contrast\n\n💡 Add an API key in **⚙ AI Settings** to unlock AI-powered enhancement.",
  };

  async function askWithLLM(message, canvas, pageW, pageH) {
    const design = canvas ? serializeCanvas(canvas, pageW, pageH) : null;
    const context = design ? `\n\nCanvas (${pageW}×${pageH}px):\n${JSON.stringify(design.elements.slice(0,10))}` : "";
    return await callLLM([
      {role:"system", content:"You are an expert UI/UX design assistant. Give concise, actionable advice in 3-5 sentences. Use markdown formatting."},
      {role:"user",   content: message + context}
    ]);
  }

  function process(message) {
    const lower = message.toLowerCase();
    const intent = INTENTS.find(i=>i.tests.some(t=>t.test(lower)))?.name||"general";
    const reply = (REPLIES[intent]||REPLIES.general)(message);
    const palette = intent==="color" ? generatePalette(message) : null;
    return {intent, reply, palette, elements:[]};
  }

  function ask(message, callback, canvas, pageW, pageH) {
    if (hasAPIKey() && canvas) {
      askWithLLM(message, canvas, pageW, pageH)
        .then(text => callback(null, {intent:"llm", reply:text, palette:null, elements:[]}))
        .catch(() => callback(null, process(message)));
    } else {
      setTimeout(() => { try { callback(null, process(message)); } catch(e) { callback(e, null); } }, 350+Math.random()*280);
    }
  }

  /* ══ EXPORT ════════════════════════════════════════════════════════════ */
  global.DoodleAI = {
    ask, process, callLLM, hasAPIKey,
    getAPISettings, saveAPISettings,
    PROVIDERS,
    analyzeDesign, analyzeWithLLM,
    enhanceDesign,
    improveElement,
    applyStylePreset,
    generatePalette,
    checkContrast,
    colorHarmony,
    suggestAnimations,
    serializeCanvas,
    parseJSON,
    STYLE_PRESETS, PALETTES, ANIM_META, isDark,
    classify: m=>INTENTS.find(i=>i.tests.some(t=>t.test(m)))?.name||"general",
  };
})(window);
