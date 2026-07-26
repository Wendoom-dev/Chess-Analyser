# Chess Commentary AI

An AI-powered chess analysis platform that combines Stockfish with a local Large Language Model to generate natural-language commentary for every move in a chess game. The application parses PGN files, evaluates every position using Stockfish, and explains the game in plain English using Llama 3.2 running locally through Ollama.

Originally built to explore integrating classical chess engines with LLMs while keeping the entire inference pipeline offline.

---

## Stack

**Frontend**

- React
- Chessground

**Backend**

- Node.js
- Express
- Chess.js
- pgn-parser

**AI**

- Python
- Flask
- LangChain
- Ollama
- Llama 3.2 3B

**Chess Engine**

- Stockfish (UCI)

---

## How it works

The application is split into three independent components.

### React Frontend

Responsible for

- displaying the chessboard
- move navigation
- engine evaluations
- AI commentary
- playback controls

---

### Express Backend

Acts as the orchestration layer.

The backend

- parses PGN files
- reconstructs every board position
- generates FEN strings
- evaluates every position using Stockfish
- forwards engine analysis to the AI service
- returns the combined response to the frontend

---

### Commentary Service

Implemented as an independent Flask microservice.

Receives Stockfish analysis and uses LangChain with Ollama to generate commentary in batches before returning structured JSON back to the backend.

Separating the LLM into its own service keeps the backend independent from the inference engine and makes it easy to swap models in the future.

---

## Request Flow

```
PGN

↓

React Frontend

↓

POST /api/analysis/analyze-with-engine

↓

Express Backend

↓

Chess.js + PGN Parser

↓

Stockfish Analysis

↓

Flask Commentary Service

↓

LangChain

↓

Ollama

↓

Llama 3.2 3B

↓

Commentary JSON

↓

React Frontend
```

---

## API

### POST `/api/analysis/analyze`

Parses the PGN and reconstructs the game.

Returns

- moves
- FEN positions
- metadata

---

### POST `/api/analysis/analyze-with-engine`

Runs complete engine analysis.

Returns

- Stockfish evaluations
- best moves
- AI commentary
- game statistics

---

## Project Structure

```
frontend/
    components/
        Board.jsx
        MoveAnalysisBar.jsx
        Navbar.jsx

    App.jsx

backend/

    src/

        controllers/
            analysis_controller.js

        services/
            chess_service.js
            engine_service.js

        routes/
            analysis_routes.js

    commentary_service.py
```

---

## Engine Analysis

Each board position is analysed independently by Stockfish.

For every position the engine extracts

- best move
- centipawn evaluation
- mate detection
- evaluation text

The backend stores the result as a structured analysis object before passing it to the commentary service.

---

## AI Commentary

The commentary service batches engine analysis into groups of moves.

For each batch the LLM receives

- move number
- side to move
- played move
- Stockfish recommendation
- evaluation

The model returns one concise commentary for every move in JSON format.

Model

```
Llama 3.2 3B
```

Runtime

```
Ollama
```

Framework

```
LangChain
```

All inference runs locally without any external APIs.

---

## Running the project

### Backend

```bash
cd backend
npm install
npm start
```

### Commentary Service

```bash
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt

python commentary_service.py
```

### Frontend

```bash
cd frontend

npm install
npm run dev
```

---

## Future Improvements

- Upload custom PGNs
- MultiPV analysis
- Opening recognition
- Blunder classification
- Evaluation graph
- Streaming commentary
- Stronger local LLMs (Qwen, Llama 3.1, Mistral)

---

## Why this project?

Traditional chess engines provide evaluations but little explanation.

This project combines deterministic engine analysis with LLM-generated natural language to produce commentary that is easier for human players to understand, while keeping the entire pipeline local and offline.
