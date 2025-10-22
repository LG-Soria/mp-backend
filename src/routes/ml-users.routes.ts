// src/routes/ml-users.routes.ts
import { Router } from "express";
import { postUserInfo, postUserInfoByTokenDev } from "../controllers/ml-users.controller";

const router = Router();

// Producción: resolver nombre por parámetros de negocio (empresa/modo/app)
router.post("/user-info", postUserInfo);

// Desarrollo: resolver nombre por token (deshabilitar en producción)
router.post("/user-info/by-token", postUserInfoByTokenDev);

export default router;
