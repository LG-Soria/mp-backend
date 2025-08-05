// src/routes/store.routes.ts
import { Router } from "express";
import { createStore, getStores } from "../controllers/stores.controller";

const router = Router();

// Esta es la ruta que estás intentando usar en Postman
router.get("/sucursales/:userId", getStores);

// Crear sucursal
router.post("/sucursales", createStore);

export default router;
