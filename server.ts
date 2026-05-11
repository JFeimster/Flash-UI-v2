import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import crypto from 'crypto';
import cors from "cors";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors()); // Enable CORS for all routes (important for external MCP clients)
  app.use(cookieParser());
  app.use(express.json());

  // === OAuth 2.0 In-Memory Store ===
  const oauthCodes = new Map<string, { userId: string, redirectUri: string }>();
  const validTokens = new Set<string>();
  const lastHits: string[] = [];
  const CLIENT_ID = "flash_ui_client";
  const CLIENT_SECRET = "flash_ui_secret_123";

  function addLog(msg: string) {
    const entry = `[${new Date().toISOString()}] ${msg}`;
    console.log(entry);
    lastHits.unshift(entry);
    if (lastHits.length > 100) lastHits.pop();
  }

  // === OAuth Endpoints ===

  app.get("/oauth/authorize", (req, res) => {
    addLog(`OAuth: Authorize hit - client_id: ${req.query.client_id}`);
    const { client_id, redirect_uri, state } = req.query;
    if (client_id !== CLIENT_ID) return res.status(400).send("Invalid client_id");
    
    res.send(`
      <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0d0d12; color: white;">
        <div style="background: #1a1a24; padding: 2.5rem; border-radius: 1.5rem; border: 1px solid rgba(236,72,153,0.3); text-align: center; max-width: 400px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
          <div style="background: rgba(236,72,153,0.1); width: 64px; height: 64px; border-radius: 1rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;">
            <svg style="width: 32px; height: 32px; color: #ec4899;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Secure Access</h2>
          <p style="color: rgba(255,255,255,0.6); margin-bottom: 2rem; font-size: 0.9rem;">Authorize ChatGPT to generate and save UI code to your Flash UI library.</p>
          <form method="POST" action="/oauth/approve">
            <input type="hidden" name="redirect_uri" value="${redirect_uri}">
            <input type="hidden" name="state" value="${state}">
            <button type="submit" style="background: #ec4899; color: white; border: none; padding: 1rem; border-radius: 0.75rem; font-weight: 600; cursor: pointer; width: 100%; font-size: 1rem; transition: transform 0.1s;">
              Approve Connection
            </button>
          </form>
        </div>
      </div>
    `);
  });

  app.post("/oauth/approve", express.urlencoded({ extended: true }), (req, res) => {
    addLog(`OAuth: Approve hit - redirect_uri: ${req.body.redirect_uri}`);
    const { redirect_uri, state } = req.body;
    const code = crypto.randomBytes(16).toString('hex');
    oauthCodes.set(code, { userId: "owner", redirectUri: redirect_uri as string });
    const callbackUrl = new URL(redirect_uri as string);
    callbackUrl.searchParams.append('code', code);
    if (state) callbackUrl.searchParams.append('state', state as string);
    res.redirect(callbackUrl.toString());
  });

  app.post("/oauth/token", express.urlencoded({ extended: true }), (req, res) => {
    addLog(`OAuth: Token request received - grant_type: ${req.body.grant_type}`);
    console.log("MCP: Token request received", { 
      grant_type: req.body.grant_type,
      has_code: !!req.body.code,
      has_client_id: !!req.body.client_id
    });

    let { client_id, client_secret, code, grant_type } = req.body;

    // Support Basic Auth (ChatGPT may use this instead of client_secret_post)
    if (req.headers.authorization && req.headers.authorization.startsWith('Basic ')) {
      try {
        const decoded = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString();
        const [id, secret] = decoded.split(':');
        client_id = id;
        client_secret = secret;
      } catch (e) {
        console.error("MCP: Failed to decode Basic Auth", e);
      }
    }

    if (grant_type !== 'authorization_code') {
      console.error("MCP: Unsupported grant type", grant_type);
      return res.status(400).json({ error: "unsupported_grant_type" });
    }

    if (client_id !== CLIENT_ID || client_secret !== CLIENT_SECRET) {
      console.error("MCP: Invalid client credentials", { 
        received_id: client_id, 
        expected_id: CLIENT_ID,
        secret_match: client_secret === CLIENT_SECRET 
      });
      return res.status(401).json({ error: "invalid_client" });
    }
    
    const savedCode = oauthCodes.get(code as string);
    if (!savedCode) {
      console.error("MCP: Invalid or expired code", code);
      return res.status(400).json({ error: "invalid_grant" });
    }
    
    oauthCodes.delete(code as string);
    const accessToken = crypto.randomBytes(32).toString('hex');
    validTokens.add(accessToken);

    addLog(`OAuth: Token issued successfully - Total valid tokens: ${validTokens.size}`);
    console.log("MCP: Token issued successfully");
    res.json({ access_token: accessToken, token_type: "Bearer", expires_in: 3600 });
  });

  // === MCP Shared State ===
// Holds requests and generated results from ChatGPT
let gptSessions: any[] = [];
const pendingGptRequests: any[] = [];

// === UI Generation Service (Server-side) ===
async function generateUIServerSide(prompt: string, context?: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment");

    const client = new GoogleGenAI({ apiKey });

    const systemPrompt = `
You are a master UI Engineer. Create a high-fidelity, production-ready UI component based on the user's request.
USER REQUEST: "${prompt}"
${context ? `ADDITIONAL CONTEXT: ${context}` : ""}

STRICT REQUIREMENTS:
- Return ONLY raw HTML/CSS. 
- Ensure it is a complete, standalone component.
- Use modern CSS (Flexbox/Grid), expressive typography, and polished aesthetics.
- No Markdown, no explanations, no chat commentary.
`.trim();

    const response = await client.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
    });
    
    return response.text.trim();
  } catch (error: any) {
    console.error("Server-side generation error:", error);
    throw error;
  }
}

// === MCP Server Implementation ===
const mcpServer = new Server(
  {
    name: "flash-ui-connector",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP Tools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_ui",
      description: "Generates production-ready HTML/CSS code for a UI component based on a prompt. The code is returned directly to you and also saved to the user's Flash UI dashboard.",
      inputSchema: {
        type: "object",
        properties: {
          prompt: {
            type: "string",
            description: "Detailed description of the UI to build."
          },
          context: {
            type: "string",
            description: "Optional context or reference data."
          }
        },
        required: ["prompt"]
      }
    },
    {
      name: "get_history",
      description: "Retrieves the history of UI components generated via ChatGPT.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    }
  ],
}));

mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "generate_ui": {
      const prompt = String(request.params.arguments?.prompt);
      const context = String(request.params.arguments?.context || "");
      
      // Perform actual generation
      const code = await generateUIServerSide(prompt, context);
      
      const gptSession = {
        id: Math.random().toString(36).substring(7),
        prompt,
        code,
        timestamp: Date.now(),
        source: 'ChatGPT'
      };
      
      gptSessions.push(gptSession);
      
      return {
        content: [
          {
            type: "text",
            text: `UI Generated Successfully!\n\nPROMPT: ${prompt}\n\nThis component has also been saved to your Flash UI "ChatGPT History" library.\n\nCODE:\n\`\`\`html\n${code}\n\`\`\``
          }
        ]
      };
    }
    case "get_history": {
      const historySummary = gptSessions.map(s => `- [${new Date(s.timestamp).toLocaleTimeString()}] ${s.prompt}`).join('\n');
      return {
        content: [
          {
            type: "text",
            text: gptSessions.length > 0 
              ? `Here are your recent Flash UI generations via ChatGPT:\n\n${historySummary}`
              : "No ChatGPT generations found in the current session history."
          }
        ]
      };
    }
    default:
      throw new Error("Tool not found");
  }
});

// MCP SSE Endpoints
let transport: SSEServerTransport | null = null;

app.get("/api/mcp/sse", async (req, res) => {
    addLog(`MCP: SSE connection attempt - headers: ${JSON.stringify(req.headers)}`);
    // Handle CORS preflight explicitly if needed, though app.use(cors()) usually handles it
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check for Bearer token for security
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1] || req.query.token as string;

  if (!token || !validTokens.has(token)) {
    addLog(`MCP: Unauthorized SSE attempt - token provided: ${!!token}`);
    console.log("Blocked unauthorized MCP attempt");
    // Standard OAuth 2.0 challenge header
    res.setHeader('WWW-Authenticate', 'Bearer realm="Flash UI", error="invalid_token"');
    return res.status(401).json({ 
      error: "unauthorized", 
      message: "Authentication required. Use OAuth to obtain a Bearer token." 
    });
  }

  addLog(`MCP: SSE Authenticated connection success`);
  console.log("New MCP SSE connection attempt - Authenticated");
  transport = new SSEServerTransport("/api/mcp/messages", res);
  await mcpServer.connect(transport);
});

// Debug endpoint to check status
app.get("/api/mcp/debug", (req, res) => {
  res.json({
    validTokensCount: validTokens.size,
    pendingCodesCount: oauthCodes.size,
    historyCount: gptSessions.length,
    recentHits: lastHits,
    env: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV
    }
  });
});

app.post("/api/mcp/messages", async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No active SSE transport");
  }
});

// Endpoint for Flash UI frontend to check for ChatGPT requests
app.get("/api/mcp/pending", (req, res) => {
  res.json(pendingGptRequests);
});

app.post("/api/mcp/clear", (req, res) => {
  const { id } = req.body;
  const index = pendingGptRequests.findIndex(r => r.id === id);
  if (index !== -1) {
    pendingGptRequests.splice(index, 1);
  }
  res.json({ success: true });
});

// Endpoint for Flash UI frontend to get history
app.get("/api/mcp/history", (req, res) => {
  res.json(gptSessions);
});

app.post("/api/mcp/delete-history", (req, res) => {
  const { id } = req.body;
  gptSessions = gptSessions.filter(s => s.id !== id);
  res.json({ success: true });
});

  // === GitHub OAuth Routes ===

  // 1. Get Auth URL
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID not configured' });
    }

    // Determine redirect URI - using window.location.origin on client is best, 
    // but on server we can use the request host header or a predefined one.
    // As per skill guidelines, the client should ideally pass this or we construct it.
    // Use the protocol from the X-Forwarded-Proto header if available (behind proxy)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const redirectUri = `${protocol}://${host}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'repo gist', // Request access to repos and gists
      state: Math.random().toString(36).substring(7)
    });

    res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
  });

  // 2. Callback Handler
  app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send('Missing code or configuration');
    }

    try {
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      const { access_token } = tokenResponse.data;

      if (access_token) {
        // Set HTTP-only cookie with iframe compatibility
        res.cookie('github_token', access_token, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Send success message to window.opener as per oauth-integration skill
        res.send(`
          <html>
            <head><title>Authentication Successful</title></head>
            <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #000; color: #fff;">
              <script>
                if (window.opener) {
                  window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'github' }, '*');
                  window.close();
                } else {
                  window.location.href = '/';
                }
              </script>
              <div style="background: #111; padding: 2rem; border-radius: 12px; border: 1px solid #333; text-align: center;">
                <h1 style="color: #10b981;">Connected!</h1>
                <p>GitHub authentication successful. This window will close automatically.</p>
              </div>
            </body>
          </html>
        `);
      } else {
        res.status(400).send('Failed to obtain access token');
      }
    } catch (error) {
      console.error('GitHub Auth Error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // 3. Check Status
  app.get('/api/github/status', (req, res) => {
    const token = req.cookies.github_token;
    res.json({ connected: !!token });
  });

  // 4. Logout
  app.post('/api/github/logout', (req, res) => {
    res.clearCookie('github_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    res.json({ success: true });
  });

  // 5. Deploy to New Repo
  app.post('/api/github/deploy', async (req, res) => {
    const token = req.cookies.github_token;
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated with GitHub' });
    }

    const { repoName, description, files, isPrivate = false } = req.body;

    if (!repoName) {
      return res.status(400).json({ error: 'Repository name is required' });
    }

    try {
      // 1. Create Repository
      const repoRes = await axios.post('https://api.github.com/user/repos', {
        name: repoName,
        description: description || 'Generated by Flash UI',
        private: isPrivate,
        auto_init: true
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      const fullRepoName = repoRes.data.full_name;
      const defaultBranch = repoRes.data.default_branch || 'main';

      // 2. Upload Files
      // Note: This is a simplified sequential upload. For many files, a tree-based upload is better.
      const uploadPromises = Object.entries(files).map(async ([path, content]) => {
        try {
          return await axios.put(`https://api.github.com/repos/${fullRepoName}/contents/${path}`, {
            message: `Initial commit: ${path}`,
            content: Buffer.from(content as string).toString('base64'),
            branch: defaultBranch
          }, {
            headers: { 
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json'
            }
          });
        } catch (err: any) {
          console.error(`Failed to upload ${path}:`, err.response?.data || err.message);
          throw err;
        }
      });

      await Promise.all(uploadPromises);

      res.json({ 
        success: true, 
        url: repoRes.data.html_url,
        fullName: fullRepoName
      });
    } catch (error: any) {
      console.error('GitHub Deployment Error:', error.response?.data || error.message);
      res.status(500).json({ 
        error: 'Failed to deploy to GitHub', 
        details: error.response?.data?.message || error.message 
      });
    }
  });

  // === Custom APIs ===

  // Example API: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Example API: User Settings (JSON storage simulation)
  let mockDatabase = { settings: { theme: 'dark', notifications: true } };
  app.get("/api/settings", (req, res) => {
    res.json(mockDatabase.settings);
  });

  app.post("/api/settings", (req, res) => {
    mockDatabase.settings = { ...mockDatabase.settings, ...req.body };
    res.json({ success: true, settings: mockDatabase.settings });
  });

  // === Webhook Receiver ===

  /**
   * Webhook handler for external services (e.g., Stripe, Shopify, GitHub)
   * In a real app, you would verify the signature here.
   */
  app.post("/api/webhooks/incoming", (req, res) => {
    const payload = req.body;
    const signature = req.headers['x-webhook-signature']; // Example header

    console.log("Received Webhook Payload:", payload);
    
    // Process the webhook asynchronously
    if (payload.event === 'order.created') {
      console.log(`Processing new order: ${payload.orderId}`);
    }

    // Always respond quickly with 200 or 202 to the sender
    res.status(202).json({ received: true });
  });

  // === URL Context Proxy ===
  app.post("/api/proxy/fetch-url", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000
      });
      
      // Simple text extraction (strip scripts and styles)
      let html = response.data;
      if (typeof html === 'string') {
        const text = html
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
          .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
          .replace(/<[^>]*>/gm, ' ')
          .replace(/\s+/gm, ' ')
          .trim()
          .substring(0, 10000); // Truncate to avoid huge payloads

        return res.json({ content: text, url });
      }
      
      res.json({ content: "Found non-text content", url });
    } catch (error: any) {
      console.error("Proxy Error:", error.message);
      res.status(500).json({ error: "Failed to fetch URL", details: error.message });
    }
  });

  // === Vite Middleware ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
