import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";
import { DataAPIClient } from "@datastax/astra-db-ts";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const { 
  ASTRA_DB_NAMESPACE, 
  ASTRA_DB_COLLECTION, 
  ASTRA_DB_ENDPOINT, 
  ASTRA_DB_APPLICATION_TOKEN, 
  GEMINI_API_KEY 
} = process.env;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

app.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        let docContext = "";
        let strategy = "general"; 

        // SEARCH DATABASE FIRST
        try {
            const embedding = await ai.models.embedContent({
                model: "text-embedding-004",
                contents: [{ parts: [{ text: message }] }]
            });
            
            const collection = await db.collection(ASTRA_DB_COLLECTION);
            const cursor = collection.find(null, {
                sort: { $vector: embedding.embeddings[0].values },
                limit: 3
            });
            const documents = await cursor.toArray();
            
            if (documents.length > 0) {
                docContext = documents.map(doc => 
                    `Source: ${doc.source_url}\nContent: ${doc.text}`
                ).join("\n\n");
                strategy = "db";
            }
        } catch (e) {
            console.log("DB Error:", e);
        }

        // We get the real current date from your machine
        const TODAY_DATE = new Date().toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        });

        let systemPrompt;
        let tools = [];

        if (strategy === "db") {
            console.log("🔍 Using Database Context");
            // We force the AI to accept the date
            systemPrompt = `
            CURRENT DATE: ${TODAY_DATE}.
            You are a Fact Checker.
            
            User Question: "${message}"
            Verified Evidence from Database: ${docContext}
            
            STRICT INSTRUCTIONS:
            1. The "Current Date" is ${TODAY_DATE}. 
            2. If the evidence is dated in ${TODAY_DATE}, IT IS REAL. Do not call it "future" or "fictional."
            3. Answer using ONLY the evidence above. Cite your sources.
            4. If the evidence is irrelevant, IGNORE IT and use your Search tool.
            `;
            
            tools = [{ googleSearch: {} }]; 
        } else {
            console.log("🌐 Database empty. Using Google Search.");
            // We force the AI to accept search results as truth
            systemPrompt = `
            CURRENT DATE: ${TODAY_DATE}.
            You are a helpful AI Assistant.
            
            User Question: "${message}"
            
            INSTRUCTIONS:
            1. The User is asking about Real-World Events happening NOW (${TODAY_DATE}).
            2. USE GOOGLE SEARCH to find the answer.
            3. TRUST THE DATES in the search results.
            4. Do not speculate. Summarize the search results directly.
            `;
            
            tools = [{ googleSearch: {} }];
        }

        // GENERATE
        const result = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{
                role: "user",
                parts: [{ text: systemPrompt }]
            }],
            tools: tools
        });

        // --- 4. EXTRACT RESPONSE ---
        const candidate = result.candidates?.[0];
        let finalText = "I found some info but couldn't summarize it. Please try again.";
        
        if (candidate?.content?.parts) {
            const textParts = candidate.content.parts
                .filter(part => part.text)
                .map(part => part.text);
            
            if (textParts.length > 0) {
                finalText = textParts.join(' ');
            }
        }

        res.json({ reply: finalText });

    } catch (error) {
        console.error("AI Error:", error);
        res.status(500).json({ error: "Failed to fetch response." });
    }
});

app.listen(3000, () => console.log('✅ Server running at http://localhost:3000'));
