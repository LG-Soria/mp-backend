// src/routes/stores.routes.ts
import { Router } from "express";
import { getStores, createStore } from "../controllers/stores.controller";

const router = Router();

// ✅ Listar sucursales (usa _e y _m por query, no por :userId)
router.get("/sucursales", getStores);

// ✅ Crear sucursal
router.post("/sucursales", createStore);

export default router;
