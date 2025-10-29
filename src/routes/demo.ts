// src/routes/demo.ts
import express from "express";
import path from "path";

const router = express.Router();

router.get("/", (_req, res) => {
  const filePath = path.resolve("public", "rag-demo.html");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("❌ Failed to send demo file:", err);
      res.status(500).send("Internal Server Error while loading demo.");
    }
  });
});

export default router;
