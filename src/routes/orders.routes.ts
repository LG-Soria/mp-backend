
import express from "express";
import { createOrder } from "../controllers/orders.controller";
import { getOrder } from "../controllers/orders.controller";

const router = express.Router();

router.post("/ordenes", createOrder);

router.get("/ordenes/:orderId", getOrder);

export default router;
