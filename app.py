from flask import Flask, request, render_template
import PyPDF2
import ollama

app = Flask(__name__)

def extract_text_from_pdf(file_stream):
    """Extracts all text from a PDF file stream."""
    reader = PyPDF2.PdfReader(file_stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text.strip()

@app.route("/", methods=["GET"])
def index():
    return render_template("upload.html")

@app.route("/summarize", methods=["POST"])
def summarize():
    if "file" not in request.files:
        return "No file uploaded", 400

    pdf_file = request.files["file"]
    if pdf_file.filename == "":
        return "Empty file", 400

    text = extract_text_from_pdf(pdf_file)
    if not text:
        return "No text found in PDF.", 400

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