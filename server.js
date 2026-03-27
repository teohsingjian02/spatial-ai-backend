import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "public");
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

app.use("/public", express.static(publicDir));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Spatial AI backend is running.");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a friendly AI assistant inside a Spatial world. Keep replies short and clear."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "No reply.";

    let audioUrl = null;

    if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID) {
      const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`;

      const ttsResponse = await fetch(elevenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: reply,
          model_id: "eleven_multilingual_v2"
        })
      });

      if (!ttsResponse.ok) {
        const errText = await ttsResponse.text();
        console.error("ElevenLabs error:", errText);
      } else {
        const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
        const fileName = `${crypto.randomUUID()}.mp3`;
        const filePath = path.join(publicDir, fileName);

        fs.writeFileSync(filePath, audioBuffer);

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        audioUrl = `${baseUrl}/public/${fileName}`;
      }
    }

    res.json({
      reply,
      audioUrl
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      reply: "Server error.",
      audioUrl: null
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});