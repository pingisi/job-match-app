import io


def extract_text(file_bytes: bytes, content_type: str) -> str:
    if content_type == "application/pdf":
        return _extract_from_pdf(file_bytes)
    if content_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return _extract_from_docx(file_bytes)
    raise ValueError(f"Unsupported content type: {content_type}")


def _extract_from_pdf(file_bytes: bytes) -> str:
    import fitz  # PyMuPDF

    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        pages = [page.get_text() for page in doc]
    return "\n".join(pages)


def _extract_from_docx(file_bytes: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
    return "\n".join(paragraphs)
