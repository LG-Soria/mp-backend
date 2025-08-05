import { Router } from "express";
import { getTokenFromPHP } from "../controllers/auth.controller";

const router = Router();

// Ruta para obtener el token desde el backend PHP y guardarlo
router.get("/token", getTokenFromPHP);

export default router;
