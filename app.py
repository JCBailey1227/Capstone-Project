from flask import Flask, request, render_template, send_file
import os
import time
from werkzeug.utils import secure_filename
import PyPDF2
import docx
import ollama
import uuid

# Configuration
UPLOAD_FOLDER = "uploads"
SUMMARY_FOLDER = "summaries"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SUMMARY_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max upload
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SUMMARY_FOLDER'] = SUMMARY_FOLDER

# ---------------------------
# Text Extractor Helpers
# ---------------------------
def extract_text_from_pdf(path):
    reader = PyPDF2.PdfReader(path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    return text.strip()

def extract_text_from_docx(path):
    doc = docx.Document(path)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text.strip()

def extract_text_from_txt(path):
    with open(path, "rb") as f:
        raw = f.read()
    try:
        return raw.decode("utf-8", errors="ignore").strip()
    except:
        return raw.decode("latin-1", errors="ignore").strip()

# ---------------------------
# Routes
# ---------------------------
@app.route("/", methods=["GET"])
def index():
    return render_template("upload.html")

@app.route("/summarize", methods=["POST"])
def summarize():
    if "files" not in request.files:
        return "No files uploaded", 400

    uploaded_files = request.files.getlist("files")
    if len(uploaded_files) == 0:
        return "No files selected", 400
    if len(uploaded_files) > 2:
        return "Please upload a maximum of 2 files.", 400

    summaries = []

    for uploaded_file in uploaded_files:
        original_filename = uploaded_file.filename
        if original_filename == "":
            summaries.append({
                "filename": "(empty filename)",
                "summary": "Filename was empty.",
                "download_file": None
            })
            continue

        # Secure + unique filename
        filename = secure_filename(original_filename)
        timestamp = int(time.time() * 1000)
        filename_on_disk = f"{timestamp}_{filename}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename_on_disk)

        try:
            uploaded_file.save(save_path)
        except Exception as e:
            summaries.append({
                "filename": original_filename,
                "summary": f"Failed to save file: {e}",
                "download_file": None
            })
            continue

        # Determine type
        lower = original_filename.lower()
        try:
            if lower.endswith(".pdf"):
                text = extract_text_from_pdf(save_path)
            elif lower.endswith(".docx"):
                text = extract_text_from_docx(save_path)
            elif lower.endswith(".txt"):
                text = extract_text_from_txt(save_path)
            else:
                summaries.append({
                    "filename": original_filename,
                    "summary": "Unsupported file type",
                    "download_file": None
                })
                continue
        except Exception as e:
            summaries.append({
                "filename": original_filename,
                "summary": f"Error extracting text: {e}",
                "download_file": None
            })
            continue

        if not text:
            summaries.append({
                "filename": original_filename,
                "summary": "No text found.",
                "download_file": None
            })
            continue

        truncated = text[:8000]

        prompt = f"""
Summarize this paper clearly and concisely.
Additionally, extract metadata (if available) such as Title, Author(s), and Publication Date.

Paper text:
{truncated}
"""

        try:
            response = ollama.chat(
                model="llama3.1:8b",
                messages=[{"role": "user", "content": prompt}]
            )
            ai_summary = response["message"]["content"]
        except Exception as e:
            summaries.append({
                "filename": original_filename,
                "summary": f"Ollama error: {e}",
                "download_file": None
            })
            continue

            # Save summary as TXT with clean name
    safe_original = secure_filename(original_filename)  # removes unsafe chars
    summary_filename = f"summary_{safe_original}.txt"
    summary_path = os.path.join(app.config['SUMMARY_FOLDER'], summary_filename)
    with open(summary_path, "w", encoding="utf-8") as f:
        f.write(ai_summary)

    summaries.append({
        "filename": original_filename,
        "summary": ai_summary,
        "download_file": summary_filename
    })


    return render_template("upload.html", summaries=summaries)

# ---------------------------
# Download route
@app.route("/download/<filename>")
def download(filename):
    file_path = os.path.join(app.config['SUMMARY_FOLDER'], filename)
    return send_file(file_path, as_attachment=True)

# ---------------------------
if __name__ == "__main__":
    app.run(debug=True)
