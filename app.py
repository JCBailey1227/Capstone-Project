from flask import Flask, request, render_template
import PyPDF2
import docx
import ollama

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB max upload

def extract_text_from_pdf(file_stream):
    reader = PyPDF2.PdfReader(file_stream)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    return text.strip()

def extract_text_from_docx(file_stream):
    doc = docx.Document(file_stream)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text.strip()

def extract_text_from_txt(file_stream):
    raw = file_stream.read()
    try:
        return raw.decode("utf-8", errors="ignore").strip()
    except:
        return raw.decode("latin-1", errors="ignore").strip()

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
        filename = uploaded_file.filename.lower()
        if filename.endswith(".pdf"):
            text = extract_text_from_pdf(uploaded_file)
        elif filename.endswith(".docx"):
            text = extract_text_from_docx(uploaded_file)
        elif filename.endswith(".txt"):
            text = extract_text_from_txt(uploaded_file)
        else:
            summaries.append(f"{uploaded_file.filename}: Unsupported file type")
            continue

        if not text:
            summaries.append(f"{uploaded_file.filename}: No text found")
            continue

        # Truncate to 8000 characters
        text = text[:8000]
        prompt = f"Summarize this academic paper clearly and concisely:\n\n{text}"

        response = ollama.chat(
            model="llama3.1:8b",
            messages=[{"role": "user", "content": prompt}]
        )

        summary = response["message"]["content"]
        summaries.append(f"{uploaded_file.filename}:\n{summary}")

    return render_template("upload.html", summaries=summaries)

if __name__ == "__main__":
    app.run(debug=True)
