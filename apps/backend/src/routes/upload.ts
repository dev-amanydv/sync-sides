
import express from "express";
import multer from "multer";
import { uploadChunk } from "../controllers/uploadController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage })

router.post("/", upload.single("chunk"), uploadChunk);

export default router; 