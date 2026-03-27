import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Spatial AI backend is running.");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful Spatial AI." },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content || "No reply.";
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Server error." });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});