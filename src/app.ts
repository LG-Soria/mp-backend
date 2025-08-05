// src/app.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import storeRoutes from "./routes/stores.routes";
import posRoutes from "./routes/pos.routes";
import ordersRoutes from "./routes/orders.routes";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api", storeRoutes);
app.use("/api/cajas", posRoutes);
app.use("/api", ordersRoutes);

export default app;
