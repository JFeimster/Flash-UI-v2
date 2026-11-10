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
  const cleanTitle = userRequest.length > 50 ? userRequest.substring(0, 50) + "..." : userRequest;
  const isAudio = /music|audio|sound|player|track|synth|podcast/i.test(userRequest);
  const isFinance = /payroll|crypto|bitcoin|trade|finance|wallet|cash|bank|stock|invoice/i.test(userRequest);
  const isTask = /task|todo|kanban|board|project|planner|check/i.test(userRequest);
  const isWeather = /weather|climate|forecast|temp|radar/i.test(userRequest);

  let specificUiContent = "";

  if (isAudio) {
    specificUiContent = `
      <!-- Audio Waveform & Player -->
      <div class="bg-black/40 rounded-2xl p-6 border border-white/10 mb-6 backdrop-blur-md">
        <div class="flex items-center gap-4 mb-5">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-xs font-mono uppercase tracking-widest text-violet-400 font-semibold">Now Playing</div>
            <h3 class="text-base font-bold text-white truncate">Neon Spectral Drift (Hi-Fi Master)</h3>
            <p class="text-xs text-stone-400">Synthesizer Odyssey &bull; 48kHz 24-bit Lossless</p>
          </div>
          <span class="px-2.5 py-1 text-[10px] font-mono bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full font-bold">LIVE STREAM</span>
        </div>

        <!-- Simulated Frequency Spectrum Bars -->
        <div class="flex items-end justify-between h-16 gap-1 px-2 mb-4 bg-zinc-950/60 rounded-xl p-3 border border-white/5">
          <span class="w-1.5 bg-violet-500 rounded-full h-[65%] animate-pulse"></span>
          <span class="w-1.5 bg-violet-400 rounded-full h-[85%]"></span>
          <span class="w-1.5 bg-indigo-500 rounded-full h-[40%]"></span>
          <span class="w-1.5 bg-cyan-400 rounded-full h-[95%] animate-pulse"></span>
          <span class="w-1.5 bg-violet-500 rounded-full h-[60%]"></span>
          <span class="w-1.5 bg-indigo-400 rounded-full h-[75%]"></span>
          <span class="w-1.5 bg-cyan-300 rounded-full h-[50%] animate-pulse"></span>
          <span class="w-1.5 bg-violet-600 rounded-full h-[90%]"></span>
          <span class="w-1.5 bg-indigo-500 rounded-full h-[30%]"></span>
          <span class="w-1.5 bg-cyan-400 rounded-full h-[80%] animate-pulse"></span>
          <span class="w-1.5 bg-violet-400 rounded-full h-[70%]"></span>
          <span class="w-1.5 bg-indigo-600 rounded-full h-[45%]"></span>
        </div>

        <!-- Player Controls -->
        <div class="flex items-center justify-between pt-2">
          <span class="text-[11px] font-mono text-stone-400" id="time-display">02:41 / 04:15</span>
          <div class="flex items-center gap-3">
            <button onclick="skipPrev()" class="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
            </button>
            <button onclick="togglePlay()" id="play-btn" class="w-11 h-11 bg-white text-zinc-950 hover:bg-violet-400 hover:text-white rounded-full flex items-center justify-center font-bold transition-all shadow-lg shadow-white/10 cursor-pointer">
              <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button onclick="skipNext()" class="p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
            <input type="range" class="w-16 accent-violet-500 cursor-pointer" value="80" />
          </div>
        </div>
      </div>
    `;
  } else if (isFinance) {
    specificUiContent = `
      <!-- Financial Cockpit / Ledger -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="p-4 bg-zinc-900/80 rounded-xl border border-emerald-500/20">
          <div class="text-[11px] font-mono uppercase text-emerald-400 font-bold mb-1 flex items-center justify-between">
            <span>Liquid Solvency</span>
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div class="text-2xl font-bold text-white font-mono">$142,850.00</div>
          <div class="text-[10px] text-emerald-400/80 mt-1 font-semibold">&uarr; +14.2% vs last cycle</div>
        </div>
        <div class="p-4 bg-zinc-900/80 rounded-xl border border-white/10">
          <div class="text-[11px] font-mono uppercase text-stone-400 font-semibold mb-1">Payroll Obligation</div>
          <div class="text-2xl font-bold text-white font-mono">$68,200.00</div>
          <div class="text-[10px] text-amber-400 mt-1 font-semibold">Due in: 3 Days (100% Funded)</div>
        </div>
        <div class="p-4 bg-zinc-900/80 rounded-xl border border-white/10">
          <div class="text-[11px] font-mono uppercase text-stone-400 font-semibold mb-1">Trapped Receivables</div>
          <div class="text-2xl font-bold text-cyan-400 font-mono">$89,410.00</div>
          <div class="text-[10px] text-cyan-400/80 mt-1 font-semibold">12 Invoices Eligible</div>
        </div>
      </div>

      <div class="p-4 bg-black/40 rounded-xl border border-white/10 mb-6">
        <div class="flex items-center justify-between mb-3">
          <h4 class="text-xs font-mono uppercase font-bold text-stone-300">Fast Factoring & Runway Actions</h4>
          <span class="text-[11px] text-emerald-400 font-mono">Instant Liquidity Enabled</span>
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="handleAction('Advance Invoices')" class="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-500/20 cursor-pointer">
            &darr; Unlock Trapped Cash
          </button>
          <button onclick="handleAction('Audit Ledger')" class="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-stone-200 font-semibold text-xs rounded-lg border border-white/10 transition-all cursor-pointer">
            Run DD+7 Audit
          </button>
        </div>
      </div>
    `;
  } else if (isTask) {
    specificUiContent = `
      <!-- Interactive Task Matrix -->
      <div class="space-y-2 mb-6" id="task-list">
        <div class="task-item p-3.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 rounded-xl flex items-center justify-between transition-all cursor-pointer" onclick="toggleTask(this)">
          <div class="flex items-center gap-3">
            <div class="checkbox-circle w-5 h-5 rounded-md border-2 border-emerald-500/40 flex items-center justify-center text-transparent hover:border-emerald-400 transition-all">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
            </div>
            <div>
              <div class="text-sm font-semibold text-white">Synthesize Production Schema</div>
              <div class="text-[11px] text-stone-400">Database &bull; High Priority</div>
            </div>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-md font-bold">READY</span>
        </div>

        <div class="task-item p-3.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 rounded-xl flex items-center justify-between transition-all cursor-pointer" onclick="toggleTask(this)">
          <div class="flex items-center gap-3">
            <div class="checkbox-circle w-5 h-5 rounded-md border-2 border-emerald-500/40 flex items-center justify-center text-transparent hover:border-emerald-400 transition-all">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
            </div>
            <div>
              <div class="text-sm font-semibold text-white">Deploy Telemetry Microservice</div>
              <div class="text-[11px] text-stone-400">DevOps &bull; Sub-10ms Latency SLA</div>
            </div>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/25 rounded-md font-bold">IN PROGRESS</span>
        </div>

        <div class="task-item p-3.5 bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/10 rounded-xl flex items-center justify-between transition-all cursor-pointer" onclick="toggleTask(this)">
          <div class="flex items-center gap-3">
            <div class="checkbox-circle w-5 h-5 rounded-md border-2 border-emerald-500/40 flex items-center justify-center text-transparent hover:border-emerald-400 transition-all">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
            </div>
            <div>
              <div class="text-sm font-semibold text-white">Run Security & Compliance Audit</div>
              <div class="text-[11px] text-stone-400">Security &bull; SOC-2 Type II Check</div>
            </div>
          </div>
          <span class="px-2.5 py-0.5 text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25 rounded-md font-bold">PENDING</span>
        </div>
      </div>
    `;
  } else {
    // Default interactive cockpit
    specificUiContent = `
      <!-- Primary Interactive Matrix -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div class="p-5 bg-zinc-900/70 border border-white/10 rounded-xl hover:border-white/20 transition-all">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase tracking-wider text-stone-400">Operational Pulse</span>
            <span class="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 rounded-full font-bold">ACTIVE</span>
          </div>
          <div class="text-3xl font-extrabold text-white font-mono tracking-tight">99.98%</div>
          <p class="text-xs text-stone-400 mt-2">Zero packet drop detected over last 24-hour cycle.</p>
          <div class="w-full bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div class="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-[94%]"></div>
          </div>
        </div>

        <div class="p-5 bg-zinc-900/70 border border-white/10 rounded-xl hover:border-white/20 transition-all">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-mono uppercase tracking-wider text-stone-400">Response Velocity</span>
            <span class="px-2 py-0.5 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 rounded-full font-bold">TURBO</span>
          </div>
          <div class="text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">8.4ms</div>
          <p class="text-xs text-stone-400 mt-2">Edge-accelerated query distribution across 18 regions.</p>
          <div class="w-full bg-zinc-800 h-1.5 rounded-full mt-4 overflow-hidden">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-[88%]"></div>
          </div>
        </div>
      </div>

      <div class="p-4 bg-zinc-950/60 rounded-xl border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 font-bold">
            ⚡
          </div>
          <div>
            <div class="text-sm font-bold text-white">Continuous Generation Engine</div>
            <div class="text-xs text-stone-400">Autonomous optimization active & ready for export</div>
          </div>
        </div>
        <button onclick="handleAction('Initialize Telemetry Stream')" class="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer">
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
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8 flex items-center justify-center antialiased selection:bg-emerald-500 selection:text-black">
  <div class="w-full max-w-2xl bg-zinc-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
    <!-- Ambient Gradient Orb -->
    <div class="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Header Section -->
    <div class="flex items-start justify-between gap-4 mb-6 relative z-10">
      <div>
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] font-mono text-emerald-400 mb-2 font-medium">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>${styleInspiration}</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-extrabold text-white tracking-tight">${cleanTitle}</h2>
      </div>
      <button onclick="handleAction('Settings & Preferences')" class="p-2.5 bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer" title="Component Preferences">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
      </button>
    </div>

    <!-- Core Content Body -->
    <div class="relative z-10">
      ${specificUiContent}
    </div>

    <!-- Feedback Toast Container -->
    <div id="toast" class="hidden fixed bottom-6 right-6 bg-zinc-900 border border-emerald-500/40 text-emerald-400 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-mono font-semibold transition-all duration-300 transform translate-y-2">
      Action Executed Successfully
    </div>

    <!-- Footer Controls -->
    <div class="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-stone-400 relative z-10">
      <span class="font-mono text-[11px]">Flash UI &bull; Production Ready</span>
      <div class="flex items-center gap-2">
        <button onclick="handleAction('Export React Code')" class="hover:text-emerald-400 transition-colors font-medium cursor-pointer">React JSX</button>
        <span>&bull;</span>
        <button onclick="handleAction('Export Tailwind')" class="hover:text-emerald-400 transition-colors font-medium cursor-pointer">Tailwind CSS</button>
      </div>
    </div>
  </div>

  <script>
    function handleAction(name) {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = '✨ ' + name + ' Triggered';
        toast.classList.remove('hidden');
        toast.classList.remove('translate-y-2');
        setTimeout(() => {
          toast.classList.add('hidden');
          toast.classList.add('translate-y-2');
        }, 2200);
      }
    }

    function toggleTask(el) {
      const check = el.querySelector('.checkbox-circle');
      if (check) {
        const isDone = check.classList.contains('bg-emerald-500');
        if (isDone) {
          check.classList.remove('bg-emerald-500', 'text-black');
          check.classList.add('text-transparent');
          el.classList.remove('opacity-60');
        } else {
          check.classList.add('bg-emerald-500', 'text-black');
          check.classList.remove('text-transparent');
          el.classList.add('opacity-60');
          handleAction('Task Marked Completed');
        }
      }
    }

    let isPlaying = false;
    function togglePlay() {
      isPlaying = !isPlaying;
      const btn = document.getElementById('play-btn');
      if (btn) {
        btn.innerHTML = isPlaying 
          ? '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
          : '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      }
      handleAction(isPlaying ? 'Playback Started' : 'Playback Paused');
    }

    function skipPrev() { handleAction('Previous Track'); }
    function skipNext() { handleAction('Next Track'); }
  </script>
</body>
</html>`;
}
