import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const PORT = 5000; // Change if needed

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple login route
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email || !email.includes("@")) {
    return res.status(400).json({ message: "Invalid email address" });
  }

  console.log("✅ Login request received for:", email);
  return res.json({ message: "Login successful!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});