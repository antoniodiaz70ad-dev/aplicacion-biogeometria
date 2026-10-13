"""Index supplied PDFs privately; never place raw books in src/ or public/.

Usage: python3 scripts/index_source_documents.py SOURCES.json PRIVATE_OUTPUT_DIR
Requires PyMuPDF. The config is an array with id, title, path and coverage.
PDF page ordinals are authoritative; printed page labels are never inferred.
Extraction is not editorial review or validation of an author's claims.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

import fitz


def normalize(text):
    return re.sub(r"\s+", " ", text).strip()


def index(config, output):
    repo = Path(__file__).resolve().parents[1]
    output = output.resolve()
    if output == repo or repo in output.parents:
        raise ValueError("Private corpus must be outside the repository")
    output.mkdir(parents=True, exist_ok=True)
    if len({source["id"] for source in config}) != len(config):
        raise ValueError("Duplicate source identifiers")
    sources, chunks, pages = [], [], []
    for source in config:
        path = Path(source["path"]).resolve()
        sha = hashlib.sha256(path.read_bytes()).hexdigest()
        with fitz.open(path) as document:
            source_pages = []
            for number, page in enumerate(document, 1):
                raw = page.get_text()
                text = normalize(raw)
                page_id = f"{source['id']}:pdf:{number}"
                source_pages.append({"id": page_id, "source_id": source["id"],
                                     "pdf_page": number, "printed_page": None,
                                     "raw_text": raw, "text": text,
                                     "image_count": len(page.get_images()),
                                     "review_status": "extracted_not_reviewed",
                                     "needs_visual_review": not text or source.get("ocr_quality") == "low"})
                # Overlap is bounded within the page; chunks never cross sources or pages.
                start, part = 0, 0
                while start < len(text):
                    end = min(start + 1700, len(text))
                    chunks.append({"id": f"{page_id}:chunk:{part}", "page_id": page_id,
                                   "source_id": source["id"], "pdf_page": number,
                                   "start": start, "end": end, "text": text[start:end],
                                   "review_status": "extracted_not_reviewed"})
                    if end == len(text):
                        break
                    start, part = end - 180, part + 1
            pages.extend(source_pages)
            sources.append({key: value for key, value in source.items() if key != "path"} |
                           {"sha256": sha, "pdf_pages": len(document),
                            "pages_with_text": sum(bool(page["text"]) for page in source_pages),
                            "extraction_status": "completed", "editorial_review": "partial"})
    assert len({page["id"] for page in pages}) == len(pages)
    assert len({chunk["id"] for chunk in chunks}) == len(chunks)
    page_map = {page["id"]: page for page in pages}
    assert all(chunk["text"] == page_map[chunk["page_id"]]["text"][chunk["start"]:chunk["end"]]
               for chunk in chunks)
    result = {"version": 1, "page_numbering": "one_based_pdf_ordinal",
              "publication": "private", "sources": sources, "pages": pages, "chunks": chunks}
    target = output / "corpus.json"
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"sources": len(sources), "pdf_pages": len(pages), "chunks": len(chunks),
            "empty_text_pages": sum(not page["text"] for page in pages), "output": str(target)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("config", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    print(json.dumps(index(json.loads(args.config.read_text()), args.output), ensure_ascii=False))
