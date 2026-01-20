# Trustify 🛡️

**Trustify** is a full-stack, AI-powered fact-checking application. It combines a verified vector database with live Google Search to provide accurate, real-time answers to your questions, all wrapped in a modern React interface.

Unlike standard chatbots, Trustify follows a strict "Truth First" protocol:

1. **Check Verified DB:** It first searches a curated database of trusted fact-checks (Snopes, Reuters, AP).
2. **Live Search Fallback:** If the database is empty or outdated, it uses Google Search to find real-time information (aware of the current date).
3. **Strict Citations:** It cites its sources, whether they come from the DB or the live web.

## 🚀 Features

* **Hybrid Intelligence:** Seamlessly switches between Vector Search (RAG) and Live Google Search.
* **Modern UI:** A clean, responsive React frontend styled with Bootstrap and custom animations.
* **Time-Aware:** Understands the current date to prevent hallucinating "future" events.
* **Vector Database:** Uses DataStax Astra DB for semantic search.
* **LLM Power:** Powered by Google Gemini 3 Flash.

## 🛠️ Prerequisites

* Node.js (v18 or higher)
* A Google AI Studio API Key
* A DataStax Astra DB Database

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/trustify.git
cd trustify

```

### 2. Setup Backend (Root Folder)

Install the dependencies for the server and database tools.

```bash
npm install

```

Create a `.env` file in the **root** folder and add your keys:

```env
# Google Gemini Integration
GEMINI_API_KEY=your_actual_gemini_key_here

# DataStax Vector DB Integration
ASTRA_DB_ENDPOINT=your_astra_db_endpoint_url
ASTRA_DB_APPLICATION_TOKEN=your_astra_token
ASTRA_DB_NAMESPACE=default_keyspace
ASTRA_DB_COLLECTION=trustify

```

### 3. Setup Frontend (React Folder)

Navigate to the frontend folder and install its dependencies.

```bash
cd trustify-frontend
npm install

```

## 🏃‍♂️ Usage

You will need two terminal windows open to run the full stack.

### Terminal 1: Start the Backend

From the **root** folder (`trustify/`):

```bash
node server.js

```

*This starts the API server on `http://localhost:3000`.*

### Terminal 2: Start the Frontend

From the **frontend** folder (`trustify/trustify-frontend/`):

```bash
npm run dev

```

*This launches the React app. Open the link shown (usually `http://localhost:5173`) in your browser.*

## 🧠 Optional: Seeding Data

If you want to populate your database with initial fact-checks, run the seeder script from the root folder:

```bash
node seed.js

```

## 🧰 Tech Stack

**Frontend:**

* React (Vite)
* Bootstrap 5
* CSS3 Animations

**Backend:**

* Node.js & Express
* Google Gemini 3 Flash (`@google/genai`)
* DataStax Astra DB (`@datastax/astra-db-ts`)
* Cheerio & LangChain (for data scraping)

## 📄 License

This project is open-source and available under the MIT License.
