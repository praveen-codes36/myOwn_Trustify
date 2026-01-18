# Trustify 🛡️

**Trustify** is a lightweight, AI-powered fact-checking assistant. It combines a verified vector database with live Google Search to provide accurate, real-time answers to your questions.

Unlike standard chatbots, Trustify follows a strict "Truth First" protocol:

1. **Check Verified DB:** It first searches a curated database of trusted fact-checks (Snopes, Reuters, AP).
2. **Live Search Fallback:** If the database is empty or outdated, it uses Google Search to find real-time information (aware of the current date).
3. **Strict Citations:** It cites its sources, whether they come from the DB or the live web.

## 🚀 Features

* **Hybrid Intelligence:** Seamlessly switches between Vector Search (RAG) and Live Google Search.
* **Gemini API Integration:** Powered by Google's **Gemini 3 Flash**, utilizing its native "Search Tool" capability for real-time grounding.
* **Time-Aware:** Understands the current date to prevent hallucinating "future" events.
* **Vector Database:** Uses DataStax Astra DB for semantic search.

## 🛠️ Prerequisites

Before you begin, you need the following keys:

1. **Google Gemini API Key:**
* Get it for free at [Google AI Studio](https://aistudio.google.com/).
* *Note: Ensure your key has access to `gemini-3-flash-preview`.*


2. **DataStax Astra DB:**
* Create a free vector database at [DataStax Astra](https://astra.datastax.com/).
* You will need the **API Endpoint** and an **Application Token**.



## 📦 Installation

1. **Clone the repository:**
```bash
git clone https://github.com/shourya-shukla/trustify.git
cd trustify

```


2. **Install dependencies:**
```bash
npm i

```


3. **Configure Environment Variables:**
Create a file named `.env` in the root folder. Paste your keys exactly like this:
```env
# Google Gemini Integration
GEMINI_API_KEY="your_actual_gemini_key_here"

# DataStax Vector DB Integration
ASTRA_DB_ENDPOINT="your_astra_db_endpoint_url"
ASTRA_DB_APPLICATION_TOKEN="your_astra_token"
ASTRA_DB_NAMESPACE="default_keyspace"
ASTRA_DB_COLLECTION="trustify"

```



## 🏃‍♂️ Usage

### 1. Seed the Database (Optional)

Populate your Vector Database with the latest fact-checks from trusted sources (Snopes, Politifact, etc.).

```bash
node seed.js

```

### 2. Run the Server

Start the backend server and serve the frontend.

```bash
node server.js

```

### 3. Open the App

Visit **`http://localhost:3000`** in your browser.

## 🧠 How the API Integration Works

Trustify uses a smart **Decision Engine** inside `server.js`:

1. **Embedding:** It uses the Gemini Embedding model (`text-embedding-004`) to convert your question into a vector.
2. **Vector Search:** It queries Astra DB to see if we have *verified* matches.
3. **Dynamic Prompting:**
* **If matches found:** It feeds the data to Gemini and instructs it to act as a strict **Fact Checker**.
* **If no matches:** It activates Gemini's **Google Search Tool**, allowing the model to query the live web for real-time answers.



## 🧰 Tech Stack

* **Backend:** Node.js, Express
* **AI Model:** Google Gemini 3 Flash (`@google/genai`)
* **Database:** DataStax Astra DB (`@datastax/astra-db-ts`)
* **Frontend:** HTML5, Tailwind CSS (via CDN)
* **Scraping:** Cheerio, LangChain

## 📄 License

This project is open-source and available under the MIT License.
