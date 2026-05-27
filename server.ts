import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API constraints: Generate a quiz based on text
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { text, sectionMarks, difficulty, classLevel, subject, examType, chapterName, totalMarksTarget, images, apiKey, imageInstruction } = req.body;

      if (!text && (!images || images.length === 0)) {
        return res.status(400).json({ error: "Text or image content is required" });
      }

      // Initialize AI client using provided key if passed
      const client = apiKey ? new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" },
        },
      }) : ai;

      // Structure definitions for Gemini structured JSON response
      const responseSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "The generated title for the quiz based on the text.",
          },
          examType: { type: Type.STRING, description: "The type of assessment, e.g., Class Test, Terminal Exam" },
          chapterName: { type: Type.STRING, description: "The chapter name if provided" },
          totalMarks: { type: Type.INTEGER, description: "The total marks for the assessment" },
          subject: { type: Type.STRING, description: "The subject of the assessment" },
          classLevel: { type: Type.STRING, description: "The class or grade level" },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: {
                  type: Type.STRING,
                  description: "Question type: multiple_choice, true_false, fill_in_blank, matching, word_meaning, jumble, missing_letter, short_answer",
                },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Options for multiple choice, matching, etc. Optional.",
                },
                answer: { type: Type.STRING, description: "The correct answer or answer key." },
                marks: { type: Type.INTEGER, description: "Recommended marks for this question." },
                complexity: { type: Type.STRING, description: "Bloom's taxonomy level: Remember, Understand, Apply, Analyze, Evaluate, or Create" },
              },
              required: ["id", "type", "question", "answer", "marks"],
            },
          },
        },
        required: ["title", "questions"],
      };

      const classContext = classLevel ? ` for Class/Grade Level: ${classLevel}` : "";
      const subjectContext = subject ? ` on Subject: ${subject}` : "";
      const chapterContext = chapterName ? ` for Chapter: ${chapterName}` : "";
      const examTypeContext = examType ? ` This assessment is a ${examType}.` : "";
      const marksContext = totalMarksTarget ? ` The total marks for all questions MUST sum up exactly to ${totalMarksTarget} marks.` : "";
      const sentenceContext = (subject && (subject.toLowerCase().includes('english') || subject.toLowerCase().includes('hindi') || subject.toLowerCase().includes('language'))) ? " For language subjects, ensure that short answers and explanatory questions are answered in complete, grammatically correct full sentences rather than one-word or short phrases." : " For short answer questions, kindly provide complete sentence answers where appropriate.";
      const systemInstruction = `You are a helpful teaching assistant AI. Your task is to generate a comprehensive and educational assessment based on the provided text and/or images${classContext}${subjectContext}${chapterContext}.${examTypeContext}${marksContext} The output MUST follow the provided JSON schema EXACTLY. Produce a diverse mix of different question types (Multiple Choice, True/False, Fill in the Blanks, Match the Column, Short Answer, Word Meaning, Jumble Letters, Missing Letters) as appropriate for the content. For 'word_meaning' questions, proactively include translations from Hindi to English and from English to Hindi. For 'matching' questions, the 'options' array MUST contain strings formatted as 'Left Item|Right Item'. Ensure the Right Items are shuffled.${sentenceContext} Also assign an appropriate Bloom's Taxonomy complexity level (Remember, Understand, Apply, Analyze, Evaluate, Create) to each question. Ensure clear, unambiguous questions and a definitive answer key. Difficulty: ${difficulty || "Medium"}.`;

      let baseText = `Create a quiz based on this content:\n===\n${text}\n===`;
      if (imageInstruction) {
        baseText += `\n\nUser's Specific Instructions for the provided content/images:\n${imageInstruction}`;
      }

      const parts: any[] = [
        { text: baseText }
      ];

      if (images && images.length > 0) {
        for (const img of images) {
          parts.push({
            inlineData: {
              data: img.base64,
              mimeType: img.mimeType
            }
          });
        }
      }

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.7,
        },
      });

      if (!response.text) {
        throw new Error("No response generated");
      }

      const generatedQuiz = JSON.parse(response.text);
      res.json(generatedQuiz);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      let errorMessage = error.message || "Failed to generate quiz";
      
      try {
        const parsed = JSON.parse(error.message);
        if (parsed.error && parsed.error.message) {
            errorMessage = parsed.error.message;
        }
      } catch (e) {}

      if (errorMessage.toLowerCase().includes("quota") || errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "API Quota exceeded. Please add your own valid Gemini API key in the Settings page and ensure it has billing enabled if needed.";
      }

      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
