import os
import io
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from PyPDF2 import PdfReader
from docx import Document
from dotenv import load_dotenv

# =========================
# Load environment variables
# =========================
load_dotenv()  # Loads .env in this directory

CLOUDFLARE_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID")
CLOUDFLARE_API_TOKEN = os.getenv("CLOUDFLARE_API_TOKEN")
CLOUDFLARE_MODEL = os.getenv("CLOUDFLARE_MODEL", "@cf/meta/llama-3.1-8b-instruct")

if not CLOUDFLARE_ACCOUNT_ID or not CLOUDFLARE_API_TOKEN:
    raise RuntimeError("Missing Cloudflare environment variables. Check your .env file.")

# =========================
# File size limit (10 MB)
# =========================
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# =========================
# Flask Setup
# =========================
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# =========================
# Cloudflare AI request
# =========================
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

    # Models return response inside "result"
    result = data.get("result", {})
    return result.get("response") or result.get("message") or str(result)


ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}

def allowed_file(filename: str) -> bool:
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
    except Exception:
        text = raw.decode("latin-1", errors="ignore")
    return text.strip(), {"filetype": "txt"}


def build_summary_prompt(text: str, length: str, extra: str = "") -> str:
    # Truncate extremely long text for safety
    if len(text) > 12000:
        text = text[:12000] + "\n\n[Text truncated for processing.]"

    if length == "short":
        length_instruction = "Write a very short summary (3–4 bullet points)."
    elif length == "long":
        length_instruction = "Write a detailed summary (8–12 bullet points or 5–8 sentences)."
    else:
        length_instruction = "Write a concise summary (5–7 bullet points or 3–5 sentences)."

    extra_instruction = f" {extra}" if extra else ""

    prompt = (
        f"{length_instruction}{extra_instruction}\n\n"
        "Summarize the following academic document. Focus on key ideas, methods, and conclusions:\n\n"
        f"{text}"
    )
    return prompt


@app.route("/")
def index():
    # In case you still use the old upload.html flow
    return render_template("upload.html")


@app.route("/api/summarize", methods=["POST"])
def api_summarize():
    files = request.files.getlist("files")
    if not files:
        return jsonify({"error": "No files uploaded"}), 400

    length = request.form.get("length", "medium")
    extra = request.form.get("instructions", "")

    results = []
    combined_parts = []  # collect all text for global summary

    for f in files:
        if not f or f.filename == "":
            results.append({"filename": "", "error": "Empty file"})
            continue

        # ===== File size check (10MB limit) =====
        f.seek(0, 2)   # move to end of file
        file_size = f.tell()
        f.seek(0)      # reset to beginning

        if file_size > MAX_FILE_SIZE_BYTES:
            results.append({
                "filename": f.filename,
                "error": f"File size exceeds {MAX_FILE_SIZE_MB}MB limit."
            })
            continue

        if not allowed_file(f.filename):
            results.append({
                "filename": f.filename,
                "error": "File type not allowed. Upload PDF, DOCX, or TXT."
            })
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
        combined_extra = (
            extra
            + " Additionally, write a single integrated summary that highlights overall themes, "
              "similarities, differences, and key contributions across all of these papers."
        )
        combined_prompt = build_summary_prompt(combined_text, length, combined_extra)

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

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
