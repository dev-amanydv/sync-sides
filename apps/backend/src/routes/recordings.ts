import express from "express";

const router = express.Router();

router.post("/", (req, res) => {
  res.send("Chunk received");
});

export default router;