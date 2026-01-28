from flask import Flask, request, jsonify
from flask_cors import CORS
from freeflow_llm import FreeFlowClient, NoProvidersAvailableError
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)
CORS(app)  # Allow Node.js to call this service

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check"""
    return jsonify({'status': 'ok', 'service': 'commentary-service'})

@app.route('/test-providers', methods=['GET'])
def test_providers():
    """Test which LLM providers are available"""
    try:
        with FreeFlowClient() as client:
            providers = client.list_providers()
            return jsonify({
                'success': True,
                'available_providers': providers,
                'count': len(providers)
            })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/generate-commentary', methods=['POST'])
def generate_commentary():
    """Generate chess commentary from Stockfish analysis"""
    try:
        data = request.json
        analysis_array = data.get('analysis', [])
        
        if not analysis_array:
            return jsonify({'error': 'No analysis data provided'}), 400
        
        print(f"\n🎯 Generating commentary for {len(analysis_array)} positions...")
        
        commentaries = []
        
        with FreeFlowClient() as client:
            for i, position in enumerate(analysis_array):
                try:
                    # Skip starting position
                    if position.get('plyNumber') == 0:
                        continue
                    
                    # Build prompt
                    prompt = f"""You are a chess commentator analyzing a game. Provide natural, engaging commentary.

Position Details:
- Move Number: {position.get('moveNumber')}
- Turn: {"White" if position.get('isWhiteMove') else "Black"}
- Move Played: {position.get('playedMove', 'N/A')}
- Engine Best Move: {position.get('engineBestMove', 'N/A')}
- Evaluation: {position.get('evaluationText', 'N/A')}

Write 2-3 sentences of natural chess commentary explaining this position and move quality."""

                    # Generate commentary
                    response = client.chat(
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.7,
                        max_tokens=150
                    )
                    
                    commentaries.append({
                        'plyNumber': position.get('plyNumber'),
                        'moveNumber': position.get('moveNumber'),
                        'commentary': response.content.strip(),
                        'provider': response.provider
                    })
                    
                    print(f"  ✓ Position {i+1}/{len(analysis_array)} - {response.provider}")
                    
                except Exception as e:
                    print(f"  ✗ Error on position {i+1}: {str(e)}")
                    commentaries.append({
                        'plyNumber': position.get('plyNumber'),
                        'moveNumber': position.get('moveNumber'),
                        'commentary': 'Commentary generation failed for this position.',
                        'error': str(e)
                    })
        
        print(f"✅ Successfully generated {len(commentaries)} commentaries\n")
        
        return jsonify({
            'success': True,
            'commentaries': commentaries,
            'total': len(commentaries)
        })
        
    except NoProvidersAvailableError as e:
        print(f"❌ All providers exhausted: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'All LLM providers are rate-limited. Try again later.'
        }), 429
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    # Check which API keys are loaded
    groq = os.getenv('GROQ_API_KEY')
    gemini = os.getenv('GEMINI_API_KEY')
    github = os.getenv('GITHUB_TOKEN')
    
    print("=" * 60)
    print("🎮 Chess Commentary Service")
    print("=" * 60)
    print(f"Groq API:   {'✓ Loaded' if groq else '✗ Not found'}")
    print(f"Gemini API: {'✓ Loaded' if gemini else '✗ Not found'}")
    print(f"GitHub API: {'✓ Loaded' if github else '✗ Not found'}")
    print("=" * 60)
    
    if not any([groq, gemini, github]):
        print("⚠️  WARNING: No API keys found!")
        print("   Add at least one key to your .env file")
    
    print("🚀 Starting server on http://localhost:5001")
    print("=" * 60 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)