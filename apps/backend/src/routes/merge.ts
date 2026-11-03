import express from "express";
import { mergeChunks } from "../controllers/mergeController.js";

const router = express.Router();

router.post("/", mergeChunks);

export default router;