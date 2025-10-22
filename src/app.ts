// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import storeRoutes from "./routes/stores.routes";
import posRoutes from "./routes/pos.routes";
import ordersRoutes from "./routes/orders.routes";
import webhooksRoutes from "./routes/webhooks.routes";
import mlUsersRoutes from "./routes/ml-users.routes"; // 🆕 nueva ruta Mercado Libre Users

dotenv.config();

const app = express();

// ────────────────────────────────────────────────
// Middlewares globales
// ────────────────────────────────────────────────

// Configuración CORS: ajustar origins según tus dominios de frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",              // desarrollo local
      "https://app-web-front2.vercel.app",  // tu front en Vercel
      /\.vercel\.app$/,                     // cualquier otro subdominio de Vercel permitido
    ],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// ────────────────────────────────────────────────
// Rutas de la API
// ────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api", storeRoutes);
app.use("/api/cajas", posRoutes);
app.use("/api", ordersRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/mp", mlUsersRoutes); // 🆕 endpoint para user-info

// ────────────────────────────────────────────────
// Health check
// ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.status(200).send("ok"));

export default app;
