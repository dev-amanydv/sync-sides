import express from "express";
import { login, signup, stats, update } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login)
router.post("/update", update)
router.post("/stats", stats)


export default router;