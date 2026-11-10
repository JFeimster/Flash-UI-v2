import type { Response } from "express";

export function extractPromptText(contents: any): string {
  if (!contents) return "";
  if (typeof contents === "string") return contents;
  if (Array.isArray(contents)) {
    return contents
      .map((c: any) => {
        if (typeof c === "string") return c;
        if (c?.parts && Array.isArray(c.parts)) {
          return c.parts.map((p: any) => p?.text || "").join(" ");
        }
        return c?.text || "";
      })
      .join(" ");
  }
  if (contents.parts && Array.isArray(contents.parts)) {
    return contents.parts.map((p: any) => p?.text || "").join(" ");
  }
  return String(contents);
}

export function generateFreeAccessContent(contents: any): string {
  const promptText = extractPromptText(contents);

  // 1. Dynamic Placeholders
  if (promptText.includes("Generate 20 creative, short, diverse UI component prompts")) {
    return JSON.stringify([
      "Bioluminescent task matrix with pulsating progress rings",
      "Cyberpunk telemetry synth sequencer with neon sliders",
      "Neomorphic glassmorphism cryptocurrency portfolio tracker",
      "Retro-futuristic CRT flight radar terminal",
      "Minimalist Scandinavian recipe card with nutrition dials",
      "Holographic generative AI prompt playground",
      "Vintage analog VU meter and tube soundboard panel",
      "Sleek Obsidian dark-mode checkout modal",
      "Isometric smart home climate control dashboard",
      "Tactile mechanical keyboard switch frequency soundboard",
      "Zen meditation tea timer with calming breath pacing",
      "Sleek aerospace HUD navigation wayfinder",
      "Brutalist typography event flyer and ticket pass",
      "Bento-grid AI prompt engineering workbench",
      "Steampunk brass barometer and atmospheric gauge",
      "Claymorphic 3D playful budget savings jar tracker",
      "Nordic woodcraft furniture dimension visualizer",
      "Midnight indigo cryptocurrency order book depth chart",
      "Prismatic chromatic-aberration music album player",
      "Clean SaaS developer API webhook inspector"
    ]);
  }

  // 2. Style suggestions
  if (promptText.includes("suggest 3 distinct visual names/styles")) {
    const lower = promptText.toLowerCase();
    if (lower.includes("cyber") || lower.includes("synth") || lower.includes("future")) {
      return JSON.stringify(["Cyberpunk Neon Matrix", "Holographic High-Tech HUD", "Dark Industrial Monolith"]);
    }
    if (lower.includes("finance") || lower.includes("crypto") || lower.includes("bank") || lower.includes("ledger")) {
      return JSON.stringify(["Obsidian FinTech Minimal", "Emerald Glass Ledger", "Swiss Modern Banking"]);
    }
    if (lower.includes("audio") || lower.includes("music") || lower.includes("sound")) {
      return JSON.stringify(["Analog Vacuum Tube Warmth", "Spectral Neon Visualizer", "Minimalist Matte Audio"]);
    }
    return JSON.stringify(["Bioluminescent Flow", "Frosted Glassmorphism", "Sleek Obsidian Dark"]);
  }

  // 3. Recommended Pages
  if (promptText.includes("Return ONLY a JSON array of objects with the following structure:") && promptText.includes("fileStructure")) {
    return JSON.stringify([
      {
        title: "Analytics & Telemetry Overview",
        description: "Comprehensive multi-metric reporting view with real-time stream status.",
        fileStructure: ["components/AnalyticsDashboard.tsx", "components/MetricCard.tsx", "utils/telemetry.ts"]
      },
      {
        title: "Interactive Settings & Preferences",
        description: "Granular customization modal with theme toggle and live API status.",
        fileStructure: ["components/SettingsModal.tsx", "components/ThemeToggle.tsx"]
      },
      {
        title: "Audit Log & History Explorer",
        description: "Filterable timeline showing granular state transitions and historical data.",
        fileStructure: ["components/HistoryTimeline.tsx", "components/FilterBar.tsx"]
      }
    ]);
  }

  // 4. Tailored recommendations
  if (promptText.includes("Return ONLY a JSON object with this exact schema:") && promptText.includes("components")) {
    return JSON.stringify({
      components: [
        "Interactive KPI Stream Card with animated sparkline",
        "Floating Glass Action Dock with responsive quick-actions",
        "Contextual Filter Bar with animated tag selection"
      ],
      integrations: [
        "Gemini Live Summarizer: Real-time contextual analysis pipeline",
        "One-Click Bundle Export: Instant React + Tailwind compilation"
      ],
      apis: [
        "/api/v1/telemetry: Ingest real-time event stream payloads",
        "/api/v1/sync: Bi-directional state persistence webhook"
      ]
    });
  }

  // 5. Idea Suggestions
  if (promptText.includes("Return ONLY a JSON object with this exact structure:") && promptText.includes("concepts")) {
    return JSON.stringify({
      concepts: [
        {
          title: "Modular Reactive Telemetry Hub",
          desc: "Event-driven reactive dashboard architecture with sub-10ms UI updates.",
          advantages: "Ultra-low latency with zero frame drops during heavy data ingestion."
        },
        {
          title: "Adaptive Command Palette & Omnibar",
          desc: "Keyboard-first navigation with fuzzy-search action triggers.",
          advantages: "Multiplies power-user navigation speed by 4x."
        },
        {
          title: "Micro-Interaction Feedback Canvas",
          desc: "Physics-based haptic animations and smooth state morphing.",
          advantages: "Dramatically improves user retention and perceived application quality."
        }
      ],
      dependencies: [
        { name: "lucide-react", reason: "Lightweight, tree-shakable iconography with consistent stroke weight." },
        { name: "clsx & tailwind-merge", reason: "Bulletproof dynamic class construction without style collisions." },
        { name: "zustand", reason: "Minimalistic boilerplate-free reactive state coordination." }
      ],
      integrations: [
        { tool: "n8n", route: "Ingest webhook events directly into the pipeline", outcome: "Automated end-to-end telemetry sync." },
        { tool: "Notion", route: "Publish structured component definitions", outcome: "Centralized live design system documentation." },
        { tool: "Make", route: "Trigger downstream notification dispatches", outcome: "Real-time alerts on state change." }
      ]
    });
  }

  // 6. Suggested Components
  if (promptText.includes("suggest 4 relevant UI components")) {
    return JSON.stringify([
      { name: "Interactive Waveform", icon: "📈", prompt: "Create a modern audio waveform card with scrubbing controls" },
      { name: "Quick Action Dock", icon: "⚡", prompt: "Create a floating glassmorphic action dock with smooth hover scale effects" },
      { name: "KPI Metric Matrix", icon: "📊", prompt: "Create a responsive 3-column KPI metric card set with delta tags" },
      { name: "Live Event Stream", icon: "🔔", prompt: "Create a modern real-time activity stream with timestamped badges" }
    ]);
  }

  // 7. Component Variations
  if (promptText.includes("Required JSON Output Format") || promptText.includes("Invent a unique design persona name")) {
    const rawUserReqMatch = promptText.match(/USER REQUEST:?\s*["']?([^"\n\r]+)/i);
    const userReq = rawUserReqMatch ? rawUserReqMatch[1] : "Interactive UI Component";
    
    return [
      JSON.stringify({
        name: "Obsidian Core Edition",
        html: generateRichComponentHtml(userReq, "Obsidian Core (Deep Matte Dark, Emerald Accents, Precision Grid)")
      }),
      JSON.stringify({
        name: "Bioluminescent Glass Edition",
        html: generateRichComponentHtml(userReq, "Bioluminescent Glass (Cyan/Teal Glow, Refractive Glassmorphism)")
      }),
      JSON.stringify({
        name: "Cyberpunk Telemetry Edition",
        html: generateRichComponentHtml(userReq, "Cyberpunk Telemetry (High-Contrast Neon, Amber HUD, Mono Typography)")
      })
    ].join("\n");
  }

  // 8. Code Refactoring / Magic tools / Animation
  if (promptText.includes("Refactor the following code snippet based on this instruction:") || promptText.includes("Enhance the following UI component")) {
    const codeMatch = promptText.match(/```html\s*([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) {
      let code = codeMatch[1].trim();
      // Apply clean enhancements
      if (!code.includes("transition-all")) {
        code = code.replace(/<button /g, '<button class="transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] " ');
      }
      return code;
    }
  }

  // 9. Complementary export files
  if (promptText.includes("Generate a single complementary file") || promptText.includes("EXPORT PROJECT COMPLEMENTARY FILE")) {
    if (promptText.includes(".css")) {
      return `/* Flash UI Component Theme */
:root {
  --primary-accent: #10b981;
  --bg-dark: #09090b;
  --card-bg: #18181b;
  --border-subtle: rgba(255, 255, 255, 0.08);
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.02); }
}

.component-glow {
  box-shadow: 0 0 25px rgba(16, 185, 129, 0.15);
}`;
    }
    if (promptText.includes(".js") || promptText.includes(".ts")) {
      return `// Flash UI Interactive Handlers
export function initializeComponentInteractivity() {
  console.log("Component interactive hooks initialized successfully.");
}`;
    }
  }

  // 10. Primary UI Component Generation
  const reqMatch = promptText.match(/USER REQUEST:\s*["']?([^"\n\r]+)/i);
  const styleMatch = promptText.match(/STYLE INSPIRATION:\s*([^\n\r]+)/i);
  
  const userReq = reqMatch ? reqMatch[1] : (promptText.substring(0, 100).replace(/["'`]/g, "").trim() || "Interactive Application Widget");
  const styleDesc = styleMatch ? styleMatch[1] : "Hyper-Modern Glass & Tailwind Dark";

  return generateRichComponentHtml(userReq, styleDesc);
}

export async function streamFreeAccessContent(
  contents: any, 
  res: Response
): Promise<void> {
  const fullContent = generateFreeAccessContent(contents);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("x-gemini-engine", "free-access-generator");

  // Stream in realistic chunks
  const chunkSize = 40;
  for (let i = 0; i < fullContent.length; i += chunkSize) {
    const chunk = fullContent.slice(i, i + chunkSize);
    res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    // Micro delay to simulate streaming and allow real-time UI animation
    if (i % (chunkSize * 4) === 0) {
      await new Promise(resolve => setTimeout(resolve, 8));
    }
  }

  res.write("data: [DONE]\n\n");
  res.end();
}

/**
 * Builds a gorgeous, fully interactive component styled with Tailwind CSS,
 * custom SVG icons, interactive buttons, tabs, live state, and responsive layout.
 */
export function generateRichComponentHtml(userRequest: string, styleInspiration: string): string {
  const cleanTitle = userRequest.length > 55 ? userRequest.substring(0, 55) + "..." : userRequest;
  
  const isLandingPage = /landing\s*page|saas|marketing|hero|startup/i.test(userRequest);
  const isDashboard = /dashboard|analytics|telemetry|monitor|metrics/i.test(userRequest);
  const isPortfolio = /portfolio|showcase|agency|case\s*study|designer|photographer/i.test(userRequest);
  const isEcommerce = /ecommerce|e-commerce|store|product|shop|cart|checkout/i.test(userRequest);
  const isEmbedWidget = /embed|widget|calculator|converter|mini-tool/i.test(userRequest);
  const isAuth = /auth|login|signup|signin|split-screen/i.test(userRequest);
  const isDocs = /documentation|docs|api\s*reference/i.test(userRequest);
  const isAudio = /music|audio|sound|player|track|synth|podcast/i.test(userRequest);
  const isFinance = /payroll|crypto|bitcoin|trade|finance|wallet|cash|bank|stock|invoice/i.test(userRequest);

  const isNeobrutalist = /neobrutal|brutalist/i.test(styleInspiration) || /neobrutal/i.test(userRequest);
  const isCyberpunk = /cyberpunk|neon|hud/i.test(styleInspiration) || /cyberpunk/i.test(userRequest);
  const isBioluminescent = /bioluminescent|deep-sea/i.test(styleInspiration) || /bioluminescent/i.test(userRequest);
  const isRetroCrt = /retro|crt|vintage/i.test(styleInspiration) || /retro/i.test(userRequest);
  const isFuturistic = /futuristic/i.test(styleInspiration) || /futuristic/i.test(userRequest);

  // Styling theme tokens
  let themeBg = "bg-zinc-950";
  let cardBg = "bg-zinc-900/90";
  let borderStyle = "border border-white/10";
  let textAccent = "text-emerald-400";
  let buttonPrimary = "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold shadow-lg shadow-emerald-500/20";
  let tagStyle = "bg-white/5 border border-white/10 text-emerald-400";
  let shadowStyle = "shadow-2xl";

  if (isNeobrutalist) {
    themeBg = "bg-[#f4f0ea] text-zinc-900";
    cardBg = "bg-white text-zinc-900";
    borderStyle = "border-2 border-black";
    textAccent = "text-black font-black";
    buttonPrimary = "bg-[#ffea00] hover:bg-[#ffe100] text-black font-extrabold border-2 border-black shadow-[4px_4px_0px_0px_#000]";
    tagStyle = "bg-[#a3e635] text-black border-2 border-black font-extrabold shadow-[2px_2px_0px_0px_#000]";
    shadowStyle = "shadow-[8px_8px_0px_0px_#000]";
  } else if (isCyberpunk) {
    themeBg = "bg-[#06070d] text-cyan-100";
    cardBg = "bg-[#0c0e1a]/95 text-cyan-50";
    borderStyle = "border border-cyan-500/30";
    textAccent = "text-cyan-400 font-mono";
    buttonPrimary = "bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-lg shadow-cyan-500/30 font-mono tracking-wider";
    tagStyle = "bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono";
    shadowStyle = "shadow-[0_0_35px_rgba(6,182,212,0.15)]";
  } else if (isBioluminescent) {
    themeBg = "bg-[#020b14] text-teal-100";
    cardBg = "bg-[#051524]/90 text-teal-50";
    borderStyle = "border border-teal-500/25";
    textAccent = "text-teal-300";
    buttonPrimary = "bg-gradient-to-r from-teal-400 to-cyan-400 text-slate-950 font-bold shadow-lg shadow-teal-500/25";
    tagStyle = "bg-teal-500/10 border border-teal-500/20 text-teal-300";
    shadowStyle = "shadow-[0_0_40px_rgba(20,184,166,0.15)]";
  } else if (isRetroCrt) {
    themeBg = "bg-[#0f0a02] text-amber-100";
    cardBg = "bg-[#181104]/95 text-amber-50";
    borderStyle = "border border-amber-500/30";
    textAccent = "text-amber-400 font-mono";
    buttonPrimary = "bg-amber-500 hover:bg-amber-400 text-black font-bold font-mono shadow-lg shadow-amber-500/20";
    tagStyle = "bg-amber-500/10 border border-amber-500/25 text-amber-400 font-mono";
    shadowStyle = "shadow-[0_0_30px_rgba(245,158,11,0.15)]";
  } else if (isFuturistic) {
    themeBg = "bg-black text-white";
    cardBg = "bg-zinc-950/90 text-zinc-100";
    borderStyle = "border border-white/15";
    textAccent = "text-white";
    buttonPrimary = "bg-white hover:bg-zinc-200 text-black font-bold shadow-lg";
    tagStyle = "bg-white/10 border border-white/20 text-white";
    shadowStyle = "shadow-2xl";
  }

  let specificUiContent = "";

  if (isLandingPage) {
    specificUiContent = `
      <!-- SaaS & Product Landing Page -->
      <div class="space-y-6">
        <!-- Hero Section -->
        <div class="text-center py-6 border-b ${isNeobrutalist ? 'border-black' : 'border-white/10'}">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono ${tagStyle} mb-3 font-semibold">
            ✨ Next-Gen Product Release v2.4
          </span>
          <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            Build Intelligent Workflows at the Speed of Thought
          </h1>
          <p class="text-xs sm:text-sm ${isNeobrutalist ? 'text-zinc-700' : 'text-stone-400'} max-w-lg mx-auto mb-6">
            Autonomous agent orchestration, sub-second telemetry, and full-stack component generation in one unified workspace.
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <button onclick="handleAction('Start Free Trial')" class="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer ${buttonPrimary}">
              Start Free 14-Day Trial &rarr;
            </button>
            <button onclick="handleAction('Schedule Demo')" class="px-5 py-2.5 rounded-xl text-xs font-semibold ${isNeobrutalist ? 'bg-white border-2 border-black hover:bg-zinc-100 shadow-[3px_3px_0px_#000]' : 'bg-white/5 border border-white/15 hover:bg-white/10 text-stone-200'} transition-all cursor-pointer">
              Explore Live Demo
            </button>
          </div>
        </div>

        <!-- 3-Column Features Bento Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div class="p-4 rounded-xl ${isNeobrutalist ? 'bg-[#fff59d] border-2 border-black shadow-[3px_3px_0px_#000]' : 'bg-black/30 border border-white/10'}">
            <div class="text-2xl mb-2">⚡</div>
            <h4 class="text-sm font-bold mb-1">Sub-10ms Pipeline</h4>
            <p class="text-[11px] ${isNeobrutalist ? 'text-zinc-800' : 'text-stone-400'} leading-relaxed">Reactive streaming engine designed for zero lag under extreme concurrent throughput.</p>
          </div>
          <div class="p-4 rounded-xl ${isNeobrutalist ? 'bg-[#a7f3d0] border-2 border-black shadow-[3px_3px_0px_#000]' : 'bg-black/30 border border-white/10'}">
            <div class="text-2xl mb-2">🛡️</div>
            <h4 class="text-sm font-bold mb-1">SOC-2 Type II Ready</h4>
            <p class="text-[11px] ${isNeobrutalist ? 'text-zinc-800' : 'text-stone-400'} leading-relaxed">Enterprise compliance validation with automated role-based access isolation.</p>
          </div>
          <div class="p-4 rounded-xl ${isNeobrutalist ? 'bg-[#bae6fd] border-2 border-black shadow-[3px_3px_0px_#000]' : 'bg-black/30 border border-white/10'}">
            <div class="text-2xl mb-2">🌐</div>
            <h4 class="text-sm font-bold mb-1">Edge Mesh Sync</h4>
            <p class="text-[11px] ${isNeobrutalist ? 'text-zinc-800' : 'text-stone-400'} leading-relaxed">Distributed state synchronization across 35 edge clusters worldwide.</p>
          </div>
        </div>

        <!-- Interactive Pricing Tier Toggle -->
        <div class="p-4 rounded-xl ${isNeobrutalist ? 'bg-white border-2 border-black shadow-[4px_4px_0px_#000]' : 'bg-black/40 border border-white/10'} flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div class="text-xs font-mono uppercase font-bold ${textAccent}">PRO SUITE &bull; LIMITED BETA</div>
            <div class="text-xl font-extrabold font-mono mt-0.5">$79<span class="text-xs font-normal opacity-70"> / seat / mo</span></div>
            <div class="text-[11px] opacity-70">Includes unlimited generation tokens & 24/7 dedicated support.</div>
          </div>
          <button onclick="handleAction('Upgrade to Pro Suite')" class="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer ${buttonPrimary}">
            Claim Early Access &rarr;
          </button>
        </div>
      </div>
    `;
  } else if (isPortfolio) {
    specificUiContent = `
      <!-- Portfolio Grid & Showcase -->
      <div class="space-y-6">
        <div class="flex items-center gap-4 pb-4 border-b ${isNeobrutalist ? 'border-black' : 'border-white/10'}">
          <div class="w-14 h-14 rounded-2xl ${isNeobrutalist ? 'bg-[#ff6b6b] border-2 border-black shadow-[3px_3px_0px_#000]' : 'bg-gradient-to-tr from-violet-600 to-indigo-500'} flex items-center justify-center text-white text-xl font-black">
            ✦
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-extrabold">Spatial Engineering & UI Studio</h3>
            <p class="text-xs ${isNeobrutalist ? 'text-zinc-700' : 'text-stone-400'}">Designing high-impact digital experiences for frontier tech startups.</p>
          </div>
          <button onclick="handleAction('Schedule Intro Call')" class="px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${buttonPrimary}">
            Hire Studio
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button onclick="filterPortfolio('all')" class="px-3 py-1.5 rounded-lg ${isNeobrutalist ? 'bg-black text-white font-bold' : 'bg-white/15 text-white font-semibold'} transition-all cursor-pointer">All Projects</button>
          <button onclick="filterPortfolio('saas')" class="px-3 py-1.5 rounded-lg ${isNeobrutalist ? 'bg-white border-2 border-black text-black font-bold' : 'bg-white/5 text-stone-300 hover:text-white'} transition-all cursor-pointer">SaaS Apps</button>
          <button onclick="filterPortfolio('fintech')" class="px-3 py-1.5 rounded-lg ${isNeobrutalist ? 'bg-white border-2 border-black text-black font-bold' : 'bg-white/5 text-stone-300 hover:text-white'} transition-all cursor-pointer">Fintech</button>
          <button onclick="filterPortfolio('hardware')" class="px-3 py-1.5 rounded-lg ${isNeobrutalist ? 'bg-white border-2 border-black text-black font-bold' : 'bg-white/5 text-stone-300 hover:text-white'} transition-all cursor-pointer">Hardware HUD</button>
        </div>

        <!-- Case Study Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="rounded-xl overflow-hidden ${isNeobrutalist ? 'bg-[#fed7aa] border-2 border-black shadow-[4px_4px_0px_#000]' : 'bg-black/40 border border-white/10'} p-4 transition-all hover:-translate-y-1 cursor-pointer" onclick="handleAction('View Apex Case Study')">
            <div class="text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${textAccent}">FinTech &bull; 2026</div>
            <h4 class="text-sm font-bold mb-1.5">Apex Capital Prime Brokerage</h4>
            <p class="text-[11px] ${isNeobrutalist ? 'text-zinc-800' : 'text-stone-400'} mb-3">Sub-millisecond institutional crypto order routing & margin audit engine.</p>
            <span class="text-xs font-bold underline">Case Study &rarr;</span>
          </div>

          <div class="rounded-xl overflow-hidden ${isNeobrutalist ? 'bg-[#ddd6fe] border-2 border-black shadow-[4px_4px_0px_#000]' : 'bg-black/40 border border-white/10'} p-4 transition-all hover:-translate-y-1 cursor-pointer" onclick="handleAction('View Orbit Case Study')">
            <div class="text-[10px] font-mono font-bold uppercase tracking-wider mb-1 ${textAccent}">Aerospace &bull; 2026</div>
            <h4 class="text-sm font-bold mb-1.5">Orbit Dynamics Constellation</h4>
            <p class="text-[11px] ${isNeobrutalist ? 'text-zinc-800' : 'text-stone-400'} mb-3">Real-time low-earth orbit constellation telemetry & optical links dashboard.</p>
            <span class="text-xs font-bold underline">Case Study &rarr;</span>
          </div>
        </div>
      </div>
    `;
  } else if (isEcommerce) {
    specificUiContent = `
      <!-- Modern Ecommerce Storefront & Product -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        <!-- Product Visual Card -->
        <div class="p-6 rounded-2xl ${isNeobrutalist ? 'bg-[#fef08a] border-2 border-black shadow-[5px_5px_0px_#000]' : 'bg-black/50 border border-white/10'} text-center relative">
          <span class="absolute top-3 left-3 px-2 py-0.5 text-[10px] font-mono font-bold rounded-md ${tagStyle}">IN STOCK &bull; SHIPS TODAY</span>
          <div class="w-32 h-32 mx-auto my-4 rounded-2xl bg-gradient-to-tr from-stone-800 to-zinc-700 flex items-center justify-center text-5xl shadow-xl">
            ⌨️
          </div>
          <div class="text-xs font-mono opacity-60">Matte Obsidian Alloy Chassis</div>
        </div>

        <!-- Product Actions -->
        <div class="space-y-4">
          <div>
            <div class="text-xs font-mono uppercase tracking-wider ${textAccent} font-bold">Limited Studio Drop #09</div>
            <h3 class="text-xl font-extrabold tracking-tight mt-0.5">CyberClack 75 Pro Keyboard</h3>
            <div class="text-2xl font-black font-mono mt-1">$289.00</div>
          </div>

          <!-- Color Swatches -->
          <div>
            <label class="text-[11px] font-mono uppercase font-bold opacity-70 block mb-1.5">Switch Type</label>
            <div class="flex items-center gap-2">
              <button onclick="handleAction('Selected Linear Glacier')" class="px-3 py-1 text-xs rounded-lg ${isNeobrutalist ? 'bg-[#a3e635] border-2 border-black font-bold' : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-medium'}">Linear Glacier</button>
              <button onclick="handleAction('Selected Tactile Amber')" class="px-3 py-1 text-xs rounded-lg ${isNeobrutalist ? 'bg-white border-2 border-black' : 'bg-white/5 border border-white/10 text-stone-300'}">Tactile Amber</button>
            </div>
          </div>

          <!-- Quantity & Add to Cart -->
          <div class="flex items-center gap-3 pt-2">
            <div class="flex items-center border ${isNeobrutalist ? 'border-2 border-black bg-white' : 'border-white/20 bg-black/40'} rounded-xl px-3 py-2 text-xs font-mono font-bold">
              <button onclick="handleAction('Qty Decreased')" class="px-1.5 hover:opacity-70">&minus;</button>
              <span class="px-3" id="cart-qty">1</span>
              <button onclick="handleAction('Qty Increased')" class="px-1.5 hover:opacity-70">&plus;</button>
            </div>
            <button onclick="handleAction('Added CyberClack 75 to Cart')" class="flex-1 py-3 px-4 rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${buttonPrimary}">
              Add to Bag &bull; $289 &rarr;
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (isEmbedWidget) {
    specificUiContent = `
      <!-- Compact Embeddable Widget -->
      <div class="p-5 rounded-2xl ${isNeobrutalist ? 'bg-white border-2 border-black shadow-[4px_4px_0px_#000]' : 'bg-black/50 border border-white/10'} space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-xs font-mono uppercase font-bold">Embeddable Staking Yield Calculator</span>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">LIVE APY 14.8%</span>
        </div>

        <div>
          <div class="flex items-center justify-between text-xs font-mono mb-1">
            <span>Staked Amount:</span>
            <span class="font-bold text-sm" id="stake-display">10,000 USDC</span>
          </div>
          <input type="range" min="1000" max="100000" step="1000" value="10000" oninput="updateStake(this.value)" class="w-full accent-emerald-500 cursor-pointer" />
        </div>

        <div class="p-3 rounded-xl ${isNeobrutalist ? 'bg-[#e0e7ff] border-2 border-black' : 'bg-zinc-950/80 border border-white/10'} flex items-center justify-between">
          <div>
            <div class="text-[10px] font-mono uppercase opacity-70">Estimated 30-Day Earnings</div>
            <div class="text-lg font-bold font-mono text-emerald-400" id="yield-display">+$123.33 USDC</div>
          </div>
          <button onclick="handleAction('Executed One-Click Stake')" class="px-3.5 py-2 rounded-lg text-xs font-bold ${buttonPrimary} transition-all cursor-pointer">
            Stake Now
          </button>
        </div>

        <div class="pt-2 flex items-center justify-between text-[11px] opacity-70 border-t ${isNeobrutalist ? 'border-black' : 'border-white/10'}">
          <span>Embed Widget ID: #FW-8492</span>
          <button onclick="handleAction('Embed Code Copied')" class="hover:underline font-mono font-bold cursor-pointer">&lt;/&gt; Copy Embed Snippet</button>
        </div>
      </div>
    `;
  } else if (isAuth) {
    specificUiContent = `
      <!-- Authentication Flow -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        <div class="p-6 rounded-2xl ${isNeobrutalist ? 'bg-[#c7d2fe] border-2 border-black shadow-[4px_4px_0px_#000]' : 'bg-black/50 border border-white/10'} space-y-3">
          <div class="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black">✦</div>
          <h3 class="text-lg font-black">Welcome Back</h3>
          <p class="text-xs ${isNeobrutalist ? 'text-zinc-800' : 'text-stone-400'}">Access your high-performance design environment and cloud workspace.</p>
          <div class="text-[11px] font-mono opacity-80 pt-2">&check; Hardware security keys supported</div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="text-[11px] font-mono uppercase block mb-1 font-bold">Email Address</label>
            <input type="email" placeholder="engineer@frontier.io" class="w-full p-2.5 rounded-xl text-xs ${isNeobrutalist ? 'bg-white border-2 border-black' : 'bg-black/60 border border-white/15 text-white'} focus:outline-none" />
          </div>
          <div>
            <label class="text-[11px] font-mono uppercase block mb-1 font-bold">Password</label>
            <input type="password" value="••••••••••••" class="w-full p-2.5 rounded-xl text-xs ${isNeobrutalist ? 'bg-white border-2 border-black' : 'bg-black/60 border border-white/15 text-white'} focus:outline-none" />
          </div>
          <button onclick="handleAction('Signed in successfully')" class="w-full py-3 rounded-xl text-xs uppercase tracking-wider font-bold transition-all cursor-pointer ${buttonPrimary}">
            Sign In to Workspace &rarr;
          </button>
        </div>
      </div>
    `;
  } else if (isDocs) {
    specificUiContent = `
      <!-- Developer Documentation Hub -->
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b ${isNeobrutalist ? 'border-black' : 'border-white/10'}">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-400 font-bold">POST</span>
            <code class="text-xs font-mono font-bold">/v1/agent/synthesize</code>
          </div>
          <span class="text-[11px] font-mono opacity-70">Rate Limit: 5,000 req/min</span>
        </div>

        <div class="p-3.5 rounded-xl ${isNeobrutalist ? 'bg-zinc-950 text-emerald-400 border-2 border-black font-mono' : 'bg-black/70 border border-white/10 font-mono'} text-xs overflow-x-auto">
<pre class="leading-relaxed"><code>{
  "model": "gemini-3.8-flash",
  "temperature": 0.7,
  "stream": true,
  "target": "luxury-bento-dashboard"
}</code></pre>
        </div>

        <div class="flex items-center justify-between pt-2">
          <span class="text-xs font-mono opacity-70">Status: 200 OK (8.2ms latency)</span>
          <button onclick="handleAction('Executed API Test Request')" class="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${buttonPrimary}">
            Send Test Request &rarr;
          </button>
        </div>
      </div>
    `;
  } else if (isFinance) {
    specificUiContent = `
      <!-- Financial Cockpit / Ledger -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="p-4 ${cardBg} rounded-xl ${borderStyle}">
          <div class="text-[11px] font-mono uppercase text-emerald-400 font-bold mb-1 flex items-center justify-between">
            <span>Liquid Solvency</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div class="text-2xl font-bold font-mono">$142,850.00</div>
          <div class="text-[10px] text-emerald-400/80 mt-1 font-semibold">&uarr; +14.2% vs last cycle</div>
        </div>
        <div class="p-4 ${cardBg} rounded-xl ${borderStyle}">
          <div class="text-[11px] font-mono uppercase opacity-70 font-semibold mb-1">Payroll Obligation</div>
          <div class="text-2xl font-bold font-mono">$68,200.00</div>
          <div class="text-[10px] text-amber-400 mt-1 font-semibold">Due in: 3 Days (100% Funded)</div>
        </div>
        <div class="p-4 ${cardBg} rounded-xl ${borderStyle}">
          <div class="text-[11px] font-mono uppercase opacity-70 font-semibold mb-1">Trapped Receivables</div>
          <div class="text-2xl font-bold text-cyan-400 font-mono">$89,410.00</div>
          <div class="text-[10px] text-cyan-400/80 mt-1 font-semibold">12 Invoices Eligible</div>
        </div>
      </div>

      <div class="p-4 ${cardBg} rounded-xl ${borderStyle} mb-4 flex items-center justify-between">
        <div>
          <h4 class="text-xs font-mono uppercase font-bold">Fast Factoring & Runway Bridge</h4>
          <p class="text-[11px] opacity-70">Instant liquidity release with zero dilution.</p>
        </div>
        <button onclick="handleAction('Unlock Trapped Receivables')" class="px-4 py-2 rounded-lg text-xs font-bold ${buttonPrimary} transition-all cursor-pointer">
          Unlock Capital &rarr;
        </button>
      </div>
    `;
  } else {
    // Default interactive dashboard / telemetry cockpit
    specificUiContent = `
      <!-- Primary Interactive Matrix -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="p-5 ${cardBg} ${borderStyle} rounded-xl hover:border-white/30 transition-all">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase tracking-wider opacity-70">Operational Pulse</span>
            <span class="px-2 py-0.5 text-[10px] font-mono rounded-full font-bold ${tagStyle}">ACTIVE</span>
          </div>
          <div class="text-3xl font-extrabold font-mono tracking-tight">99.98%</div>
          <p class="text-xs opacity-70 mt-2">Zero packet drop detected over last 24-hour cycle.</p>
          <div class="w-full bg-zinc-800/80 h-1.5 rounded-full mt-4 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[94%]"></div>
          </div>
        </div>

        <div class="p-5 ${cardBg} ${borderStyle} rounded-xl hover:border-white/30 transition-all">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase tracking-wider opacity-70">Response Velocity</span>
            <span class="px-2 py-0.5 text-[10px] font-mono rounded-full font-bold ${tagStyle}">TURBO</span>
          </div>
          <div class="text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">8.4ms</div>
          <p class="text-xs opacity-70 mt-2">Edge-accelerated query distribution across 18 regions.</p>
          <div class="w-full bg-zinc-800/80 h-1.5 rounded-full mt-4 overflow-hidden">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[88%]"></div>
          </div>
        </div>
      </div>

      <div class="p-4 ${cardBg} rounded-xl ${borderStyle} mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold">
            ⚡
          </div>
          <div>
            <div class="text-sm font-bold">Continuous Telemetry Engine</div>
            <div class="text-xs opacity-70">Production build active & fully verified</div>
          </div>
        </div>
        <button onclick="handleAction('Run Live Diagnostics')" class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold ${buttonPrimary} transition-all cursor-pointer">
          Run Diagnostics
        </button>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="${themeBg} min-h-screen p-4 sm:p-8 flex items-center justify-center antialiased">
  <div class="w-full max-w-2xl ${cardBg} ${borderStyle} rounded-3xl p-6 sm:p-8 ${shadowStyle} relative overflow-hidden backdrop-blur-xl">
    <!-- Header Section -->
    <div class="flex items-start justify-between gap-4 mb-6 relative z-10">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono ${tagStyle} mb-2 font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          <span>${styleInspiration}</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">${cleanTitle}</h2>
      </div>
      <button onclick="handleAction('Component Options')" class="p-2.5 rounded-xl ${isNeobrutalist ? 'bg-white border-2 border-black' : 'bg-white/5 border border-white/10 text-stone-300'} transition-all cursor-pointer" title="Options">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      </button>
    </div>

    <!-- Core Content Body -->
    <div class="relative z-10">
      ${specificUiContent}
    </div>

    <!-- Feedback Toast Container -->
    <div id="toast" class="hidden fixed bottom-6 right-6 ${isNeobrutalist ? 'bg-[#ffea00] border-2 border-black text-black' : 'bg-zinc-900 border border-emerald-500/40 text-emerald-400'} px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono font-semibold transition-all duration-300 transform translate-y-2">
      Action Executed Successfully
    </div>

    <!-- Footer Controls -->
    <div class="pt-4 border-t ${isNeobrutalist ? 'border-black' : 'border-white/10'} flex items-center justify-between text-xs opacity-70 relative z-10">
      <span class="font-mono text-[11px]">Flash UI &bull; Production Ready</span>
      <div class="flex items-center gap-2 font-medium">
        <button onclick="handleAction('Export React Code')" class="hover:underline cursor-pointer">React JSX</button>
        <span>&bull;</span>
        <button onclick="handleAction('Export Tailwind')" class="hover:underline cursor-pointer">Tailwind CSS</button>
      </div>
    </div>
  </div>

  <script>
    function handleAction(name) {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = '✨ ' + name;
        toast.classList.remove('hidden');
        toast.classList.remove('translate-y-2');
        setTimeout(() => {
          toast.classList.add('hidden');
          toast.classList.add('translate-y-2');
        }, 2200);
      }
    }

    function updateStake(val) {
      const num = parseInt(val, 10);
      const disp = document.getElementById('stake-display');
      const yieldDisp = document.getElementById('yield-display');
      if (disp) disp.textContent = num.toLocaleString() + ' USDC';
      if (yieldDisp) {
        const est = (num * 0.148 / 12).toFixed(2);
        yieldDisp.textContent = '+$' + parseFloat(est).toLocaleString() + ' USDC';
      }
    }

    function filterPortfolio(category) {
      handleAction('Filtered portfolio by ' + category);
    }
  </script>
</body>
</html>`;
}
