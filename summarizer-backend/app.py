import os
import io
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from PyPDF2 import PdfReader
from docx import Document
from dotenv import load_dotenv


load_dotenv()  

CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_MODEL = os.getenv("CLOUDFLARE_MODEL", "@cf/meta/llama-3.1-8b-instruct")

if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
    raise RuntimeError("Missing Cloudflare environment variables. Check your .env file.")


app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def call_cloudflare_ai(prompt: str) -> str:
    """Send a prompt to Cloudflare AI and return the model's response."""
    url = f"https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{CLOUDFLARE_MODEL}"

    headers = {
        "Authorization": f"Bearer {CLOUDFLARE_API_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "messages": [
            {
                "role": "system",
                "content": "You summarize academic/scientific PDFs clearly and concisely.",
            },
            {"role": "user", "content": prompt},
        ]
    }

    response = requests.post(url, json=payload, headers=headers, timeout=120)

    if not response.ok:
        raise RuntimeError(f"Cloudflare API Error {response.status_code}: {response.text}")

    data = response.json()

    result = data.get("result", {})
    return result.get("response") or result.get("message") or str(result)

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file):
    reader = PdfReader(file)
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t + "\n"

    return text.strip(), {"filetype": "pdf", "pages": len(reader.pages)}

def extract_text_from_docx(file):
    data = file.read()
    file.seek(0)
    doc = Document(io.BytesIO(data))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs), {"filetype": "docx", "paragraphs": len(paragraphs)}

def extract_text_from_txt(file):
    raw = file.read()
    file.seek(0)
    try:
        text = raw.decode("utf-8")
    except:
        text = raw.decode("latin-1", errors="ignore")
    return text.strip(), {"filetype": "txt"}


def build_summary_prompt(text, length, extra=""):
    if len(text) > 12000:
        text = text[:12000] + "\n\n[Text truncated for processing.]"

    if length == "short":
        length_part = "Write a very short summary (3–4 bullet points)."
    elif length == "long":
        length_part = "Write a long detailed summary."
    else:
        length_part = "Write a concise summary."

    return f"{length_part} {extra}\n\nDocument:\n{text}"

# =========================
# API ROUTE (used by React frontend)
# =========================
@app.route("/api/summarize", methods=["POST"])
def api_summarize():
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    length = request.form.get("length", "medium")
    extra = request.form.get("instructions", "")

    results = []
    combined_parts = []  

    for f in files:
        if not f or f.filename == "":
            results.append({"filename": "", "error": "Empty file"})
            continue

        if not allowed_file(f.filename):
            results.append(
                {
                    "filename": f.filename,
                    "error": "File type not allowed. Please upload PDF, DOCX, or TXT.",
                }
            )
            continue

        ext = f.filename.rsplit(".", 1)[1].lower()
        try:
            if ext == "pdf":
                text, meta = extract_text_from_pdf(f)
            elif ext == "docx":
                text, meta = extract_text_from_docx(f)
            else:
                text, meta = extract_text_from_txt(f)

            
            if text.strip():
                combined_parts.append(f"Paper: {f.filename}\n{text}\n")

            # build per-file prompt and call Cloudflare AI
            prompt = build_summary_prompt(text, length, extra)
            summary_text = call_cloudflare_ai(prompt)

            results.append(
                {
                    "filename": f.filename,
                    "summary": summary_text,
                    "metadata": meta,
                }
            )
        except Exception as e:
            results.append(
                {
                    "filename": f.filename,
                    "error": f"Failed to summarize using Cloudflare AI: {e}",
                }
            )

   
    combined_summary = None
    if combined_parts:
        combined_text = "\n\n".join(combined_parts)
        combined_prompt_extra = (
            extra
            + " Additionally, write a single integrated summary that highlights the overall themes, "
              "similarities, differences, and key contributions across all of these papers."
        )
        combined_prompt = build_summary_prompt(combined_text, length, combined_prompt_extra)

        try:
            combined_summary = call_cloudflare_ai(combined_prompt)
        except Exception as e:
            combined_summary = f"Error while generating combined summary: {e}"

    return jsonify(
        {
            "summaries": results,
            "combined_summary": combined_summary,
        }
    )


@app.route("/")
def index():
    return render_template("upload.html")

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
