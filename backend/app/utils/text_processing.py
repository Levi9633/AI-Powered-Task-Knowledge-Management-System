"""
Text Processing Utilities
Follows: RAG Architecture Analysis

  PDF/DOCX/TXT → Read Text (with page numbers) → Clean Text → Split into Chunks (with LangChain) → Return
"""
import re
from typing import List, Dict, Any
import pdfplumber
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Initialize once to avoid overhead on every document chunking
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ". ", " ", ""]
)


def clean_text(text: str) -> str:
    """Clean text by removing tabs, excess spaces, and consecutive newlines."""
    text = text.replace('\t', ' ')
    text = re.sub(r' {2,}', ' ', text)  # Collapse multiple spaces
    text = re.sub(r'\n{3,}', '\n\n', text)  # Reduce 3+ newlines to max 2
    return text.strip()


def extract_text_from_pdf(file_path: str) -> List[Dict[str, Any]]:
    """Extract text from a PDF file using pdfplumber, page by page."""
    pages_data = []
    with pdfplumber.open(file_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                cleaned = clean_text(text)
                if cleaned:
                    pages_data.append({"page_number": i + 1, "text": cleaned})
    return pages_data


def extract_text_from_docx(file_path: str) -> List[Dict[str, Any]]:
    """Extract text from a DOCX file using python-docx."""
    doc = docx.Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    text = "\n\n".join(paragraphs)
    cleaned = clean_text(text)
    return [{"page_number": 1, "text": cleaned}] if cleaned else []


def extract_text_from_txt(file_path: str) -> List[Dict[str, Any]]:
    """Read plain text from a .txt file."""
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    cleaned = clean_text(text)
    return [{"page_number": 1, "text": cleaned}] if cleaned else []


def extract_text(file_path: str, file_type: str) -> List[Dict[str, Any]]:
    """Dispatch to correct extractor based on file type. Returns list of page-mapped text."""
    if file_type.lower() == "pdf":
        return extract_text_from_pdf(file_path)
    elif file_type.lower() == "docx":
        return extract_text_from_docx(file_path)
    elif file_type.lower() == "txt":
        return extract_text_from_txt(file_path)
    raise ValueError(f"Unsupported file type: {file_type}")


def chunk_text(pages_data: List[Dict[str, Any]], chunk_size: int = 1000, overlap: int = 200) -> List[Dict[str, Any]]:
    """
    Split text into overlapping chunks using LangChain's RecursiveCharacterTextSplitter.
    Preserves page_number metadata.
    """
    chunks = []
    for page in pages_data:
        text = page["text"]
        page_num = page["page_number"]
        
        split_texts = _splitter.split_text(text)
        for chunk in split_texts:
            if chunk.strip():
                chunks.append({
                    "chunk_text": chunk.strip(),
                    "page_number": page_num
                })
                
    return chunks

