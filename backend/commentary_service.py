import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_ollama import ChatOllama
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

app = Flask(__name__)
CORS(app)

# -----------------------------------------------------------------------------
# 1. LLM Initialization
# -----------------------------------------------------------------------------
llm = ChatOllama(
    model="llama3.2:3b",
    temperature=0.2,
    num_predict=2048,
    num_ctx=8192,
)

BATCH_SIZE = 10

# -----------------------------------------------------------------------------
# 2. Vector DB Setup (Runs once on server boot)
# -----------------------------------------------------------------------------
DATA_DIR = "./data"
PERSIST_DIR = "./chroma_db"

print("\n--- Initializing RAG Knowledge Base ---")
if os.path.exists(DATA_DIR) and os.listdir(DATA_DIR):
    # Explicitly using TextLoader avoids needing the heavy 'unstructured' library dependency
    loader = DirectoryLoader(
        DATA_DIR,
        glob="**/*.txt",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"}
    )
    raw_documents = loader.load()

    # Split documents into small readable chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=40)
    chunks = text_splitter.split_documents(raw_documents)

    # Fast local embeddings (runs locally on CPU/Apple Silicon)
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    # Create Chroma vector store and retriever
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=PERSIST_DIR
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
    print(f"✅ RAG Ready: Ingested {len(chunks)} text chunks from {DATA_DIR}\n")
else:
    print(f"⚠️ Warning: No files found in {DATA_DIR}. Service will run without RAG.\n")
    retriever = None


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "commentary-service",
        "rag_active": retriever is not None
    })


def build_prompt(batch):
    prompt = """
You are an expert chess commentator.

Generate commentary for EVERY move below using the played move, engine analysis, and strategic/tactical context.

Return ONLY valid JSON.

Format:

[
 {
   "plyNumber": 1,
   "moveNumber": 1,
   "commentary": "..."
 }
]

Rules:

- Return EXACTLY one JSON object for every position.
- Do not skip any move.
- Do not use markdown.
- Do not explain anything.
- Commentary should be 2 concise sentences.
- Mention whether the move follows or differs from Stockfish.
- Incorporate strategic ideas from the retrieved context when relevant.

Positions:

"""

    for p in batch:
        rag_context = ""
        
        # --- THE 1-LINE RAG LOOKUP ---
        if retriever:
            search_query = f"Move {p['playedMove']} evaluation {p['evaluationText']} tactics positional principle strategy"
            docs = retriever.invoke(search_query)
            rag_context = " ".join([d.page_content.replace("\n", " ").strip() for d in docs])

        prompt += f"""
--------------------------------
Ply Number: {p["plyNumber"]}
Move Number: {p["moveNumber"]}
Side: {"White" if p["isWhiteMove"] else "Black"}

Played Move:
{p["playedMove"]}

Engine Best Move:
{p["engineBestMove"]}

Evaluation:
{p["evaluationText"]}

Strategic & Tactical Context:
{rag_context if rag_context else "N/A"}

"""

    return prompt


def parse_json(text):
    text = text.replace("```json", "").replace("```", "").strip()
    start = text.find("[")
    end = text.rfind("]")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


@app.route("/generate-commentary", methods=["POST"])
def generate_commentary():
    try:
        data = request.json
        analysis = data.get("analysis", [])

        if not analysis:
            return jsonify({"success": False, "error": "No analysis provided"}), 400

        positions = [p for p in analysis if p["plyNumber"] != 0]
        print(f"\n🎯 Generating commentary for {len(positions)} moves")

        all_commentaries = []
        total_batches = (len(positions) + BATCH_SIZE - 1) // BATCH_SIZE

        for batch_number in range(total_batches):
            start = batch_number * BATCH_SIZE
            end = start + BATCH_SIZE
            batch = positions[start:end]

            print(f"Batch {batch_number+1}/{total_batches} ({len(batch)} moves)")
            prompt = build_prompt(batch)

            try:
                response = llm.invoke(prompt)
                batch_commentaries = parse_json(response.content)

                if len(batch_commentaries) != len(batch):
                    print(f"⚠️ Expected {len(batch)} comments, got {len(batch_commentaries)}")

                all_commentaries.extend(batch_commentaries)
                print(f"✓ Batch {batch_number+1} complete")

            except Exception as e:
                print(f"Retrying batch {batch_number+1} due to error: {e}")
                try:
                    response = llm.invoke(prompt)
                    batch_commentaries = parse_json(response.content)
                    all_commentaries.extend(batch_commentaries)
                    print("✓ Retry successful")
                except Exception as retry_error:
                    print(f"❌ Batch {batch_number+1} failed: {retry_error}")
                    for pos in batch:
                        all_commentaries.append({
                            "plyNumber": pos["plyNumber"],
                            "moveNumber": pos["moveNumber"],
                            "commentary": "Commentary generation failed for this move."
                        })

        print(f"\n✅ Generated {len(all_commentaries)} commentaries\n")
        return jsonify({
            "success": True,
            "commentaries": all_commentaries,
            "total": len(all_commentaries)
        })

    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("♟ Chess Commentary Service (RAG Active)")
    print("=" * 60)
    print("LLM: llama3.2:3b")
    print(f"Batch Size: {BATCH_SIZE}")
    print("Running at: http://localhost:5002")
    print("=" * 60)

    app.run(host="0.0.0.0", port=5002, debug=False)