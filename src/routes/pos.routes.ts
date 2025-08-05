// src/routes/pos.routes.ts
import express from "express";
import { getPOS, createPOS } from "../controllers/pos.controller";

const router = express.Router();

router.get("/", getPOS);
router.post("/", createPOS);

export default router;
