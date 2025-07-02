import express from "express";
import { mergeChunks } from "../controllers/mergeController";

const router = express.Router();

router.post("/", mergeChunks);

export default router;