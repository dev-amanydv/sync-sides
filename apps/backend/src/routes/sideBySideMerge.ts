import express from "express";
import { mergeSideBySide } from "../controllers/sideBySideMergeController";

const router = express.Router();

router.post("/", mergeSideBySide);

export default router;