import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authRoute } from "./routes/authRoutes.js";
import { bookRoute } from "./routes/bookRoutes.js";
import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 3000;

dotenv.config();
app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoute);
app.use("/api/books", bookRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
