import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import cookieParser from "cookie-parser";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json());

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
