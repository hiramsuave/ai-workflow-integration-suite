import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRouter from "./routes/chat"; // ✅ Make sure this is at the top (not below app.listen)

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("🚀 AI Chat API is running!");
});

// ✅ Mount all chat routes
app.use("/api/chat", chatRouter);

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
