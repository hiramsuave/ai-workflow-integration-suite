import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat";
import { withRequestId, errorHandler } from "./middleware/http";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(withRequestId);
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("🚀 AI Chat API is running!");
});

app.use("/api/chat", chatRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
