from flask import Flask, request, render_template
import PyPDF2
import docx
import ollama

app = Flask(__name__)

def extract_text_from_pdf(file_stream):
    """Extract text from a PDF file stream."""
    reader = PyPDF2.PdfReader(file_stream)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    return text.strip()

def extract_text_from_docx(file_stream):
    """Extract text from a DOCX file stream."""
    doc = docx.Document(file_stream)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text.strip()

def extract_text_from_txt(file_stream):
    """Extract text from a TXT file stream."""
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
    if "file" not in request.files:
        return "No file uploaded", 400

    uploaded_file = request.files["file"]

    if uploaded_file.filename == "":
        return "Empty file", 400

    filename = uploaded_file.filename.lower()

    # Determine file type
    if filename.endswith(".pdf"):
        text = extract_text_from_pdf(uploaded_file)
    elif filename.endswith(".docx"):
        text = extract_text_from_docx(uploaded_file)
    elif filename.endswith(".txt"):
        text = extract_text_from_txt(uploaded_file)
    else:
        return "Unsupported file type. Please upload PDF, DOCX, or TXT.", 400

    if not text:
        return "No text found in the document.", 400

    # Truncate if necessary
    max_chars = 8000
    text = text[:max_chars]

    prompt = f"Summarize this academic paper clearly and concisely:\n\n{text}"

    response = ollama.chat(
        model="llama3.1:8b",
        messages=[{"role": "user", "content": prompt}]
    )

    summary = response["message"]["content"]
    return render_template("upload.html", summary=summary)

if __name__ == "__main__":
    app.run(debug=True)
