from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_ollama import ChatOllama
import json

app = Flask(__name__)
CORS(app)

llm = ChatOllama(
    model="llama3.2:3b",
    temperature=0.2,
    num_predict=2048,      # enough tokens for ~10 commentaries
    num_ctx=8192,           # larger context window
    # repeat_penalty=1.05,
    # top_p=0.9,
    # top_k=40,
)

BATCH_SIZE = 10


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "ok",
        "service": "commentary-service"
    })


def build_prompt(batch):
    prompt = """
You are an expert chess commentator.

Generate commentary for EVERY move below.

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
- Mention who is better if evaluation is large.

Positions:

"""

    for p in batch:

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

"""

    return prompt


def parse_json(text):

    text = text.replace("```json", "")
    text = text.replace("```", "")
    text = text.strip()

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
            return jsonify({
                "success": False,
                "error": "No analysis provided"
            }), 400

        positions = [
            p for p in analysis
            if p["plyNumber"] != 0
        ]

        print(f"\n🎯 Generating commentary for {len(positions)} moves")

        all_commentaries = []

        total_batches = (len(positions) + BATCH_SIZE - 1) // BATCH_SIZE

        for batch_number in range(total_batches):

            start = batch_number * BATCH_SIZE
            end = start + BATCH_SIZE

            batch = positions[start:end]

            print(
                f"\nBatch {batch_number+1}/{total_batches} "
                f"({len(batch)} moves)"
            )

            prompt = build_prompt(batch)

            try:

                response = llm.invoke(prompt)

                batch_commentaries = parse_json(response.content)

                if len(batch_commentaries) != len(batch):
                    print(
                        f"⚠ Expected {len(batch)} comments "
                        f"got {len(batch_commentaries)}"
                    )

                all_commentaries.extend(batch_commentaries)

                print(f"✓ Batch {batch_number+1} complete")

            except Exception as e:

                print(f"Retrying batch {batch_number+1}")

                try:

                    response = llm.invoke(prompt)

                    batch_commentaries = parse_json(response.content)

                    all_commentaries.extend(batch_commentaries)

                    print(f"✓ Retry successful")

                except Exception as retry_error:

                    print(
                        f"❌ Batch {batch_number+1} failed: "
                        f"{retry_error}"
                    )

                    # Return placeholder commentary instead of failing
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

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":

    print("=" * 60)
    print("♟ Chess Commentary Service")
    print("=" * 60)
    print("LLM: llama3.2:3b")
    print(f"Batch Size: {BATCH_SIZE}")
    print("Mode: Batched Generation")
    print("Running at: http://localhost:5002")
    print("=" * 60)

    app.run(
        host="0.0.0.0",
        port=5002,
        debug=False
    )