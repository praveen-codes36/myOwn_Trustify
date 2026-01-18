import { DataAPIClient } from "@datastax/astra-db-ts";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { GoogleGenAI } from "@google/genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import * as cheerio from "cheerio"; 
import "dotenv/config";


const { 
  ASTRA_DB_NAMESPACE, 
  ASTRA_DB_COLLECTION, 
  ASTRA_DB_ENDPOINT, 
  ASTRA_DB_APPLICATION_TOKEN, 
  GEMINI_API_KEY 
} = process.env;

// SOURCES
const sources = [
    'https://www.snopes.com/fact-check/',
    'https://www.politifact.com/truth-o-meter/rulings/false/',
    'https://www.factcheck.org/fake-news/',
    'https://www.reuters.com/fact-check',
    'https://apnews.com/hub/ap-fact-check',
    'https://en.wikipedia.org/wiki/List_of_common_misconceptions',
];


const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_ENDPOINT, { keyspace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

// LINK EXTRACTION
const extractLinks = async (baseUrl) => {
    console.log(`🔍 Automator: Scanning ${baseUrl}...`);
    try {
        const response = await fetch(baseUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0 Safari/537.36' }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        const links = [];
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (!href) return;

            try {
                const absoluteUrl = href.startsWith('http') ? href : new URL(href, baseUrl).toString();
                
                const isArticle = 
                    absoluteUrl.includes('/fact-check/') || 
                    absoluteUrl.includes('/article/') || 
                    absoluteUrl.includes('/news/') ||
                    absoluteUrl.includes('/wiki/') || 
                    absoluteUrl.includes('/story/') || 
                    /\/\d{4}\/\d{2}\//.test(absoluteUrl);

                const isJunk = absoluteUrl.includes('privacy') || absoluteUrl.includes('login') || absoluteUrl.includes('signup') || absoluteUrl.includes('#');

                if (isArticle && !isJunk && !links.includes(absoluteUrl) && links.length < 15) { 
                    links.push(absoluteUrl);
                }
            } catch (e) {}
        });
        
        console.log(`   -> Found ${links.length} articles.`);
        return links;
    } catch (e) {
        console.error(`   -> Error scanning ${baseUrl}:`, e);
        return [];
    }
}

// SCRAPER
const scrapePage = async (url) => {
    try {
        const loader = new CheerioWebBaseLoader(url, { selector: "p" });
        const docs = await loader.load();
        return docs[0]?.pageContent.replace(/\s+/g, ' ').trim();
    } catch (e) {
        return null;
    }
}

// MAIN PIPELINE
const run = async () => {
    try { await db.dropCollection(ASTRA_DB_COLLECTION); } catch (e) {}
    
    // Note: Creating collection is optional if it exists, but good for setup
    try {
        const collection = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: { dimension: 768, metric: "dot_product" }
        });
        console.log("✅ Collection ready.");
    } catch (e) {
        console.log("ℹ️ Collection likely exists, continuing...");
    }

    const collection = await db.collection(ASTRA_DB_COLLECTION);

    let articleUrls = [];
    for (const source of sources) {
        const foundLinks = await extractLinks(source);
        articleUrls = [...articleUrls, ...foundLinks];
    }

    console.log(`🚀 Starting processing for ${articleUrls.length} articles...`);

    for (const url of articleUrls) {
        process.stdout.write(`Processing: ${url.slice(0, 40)}... `);
        const content = await scrapePage(url);
        
        if (!content || content.length < 100) {
            console.log("Skipped (too short)");
            continue;
        }

        const chunks = await splitter.splitText(content);
        let insertedCount = 0;

        for (const chunk of chunks) {
            const embedding = await ai.models.embedContent({
                model: "text-embedding-004",
                contents: [{ parts: [{ text: chunk }] }]
            });
            
            const vector = embedding.embeddings?.[0]?.values;

            if (vector) {
                await collection.insertOne({ 
                    $vector: vector, 
                    text: chunk, 
                    source_url: url 
                });
                insertedCount++;
            }
        }
        console.log(`Done (${insertedCount} chunks)`);
    }
}

run();
