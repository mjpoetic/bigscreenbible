#!/usr/bin/env python3
"""Import eBible.org's engylt_usfx.xml into the local Bible bundle.

Download https://ebible.org/Scriptures/engylt_usfx.zip and extract it first.
Usage: python3 scripts/import-ylt.py /path/to/engylt_usfx.xml
"""

import hashlib
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1])
index_path = root / "assets/bibles/index.js"
index = json.loads(index_path.read_text().split("=", 1)[1].strip().removesuffix(";"))
books = {book["code"]: book for book in index["books"]}
xml = ET.fromstring(source.read_bytes())
# Fail on new markup rather than accidentally including notes or omitting text.
allowed = {"usfx", "languageCode", "book", "id", "h", "toc", "p", "c", "v", "ve"}
assert {element.tag for element in xml.iter()} <= allowed, "Review new source markup"
assert [book.attrib["id"] for book in xml.findall("book")] == list(books)
chapters = {}
for book in xml.findall("book"):
    definition = books[book.attrib["id"]]
    chapter = None
    verse = None
    paragraph_start = False
    for element in book.iter():
        if element.tag == "c":
            key = f'{definition["name"]} {int(element.attrib["id"])}'
            assert key not in chapters, f"Duplicate chapter: {key}"
            chapter = {"title": key, "verses": []}
            chapters[key] = chapter
        elif element.tag == "p" and chapter is not None:
            assert element.attrib.get("style") == "p", "Review new paragraph style"
            paragraph_start = True
        elif element.tag == "v":
            assert chapter is not None and verse is None
            verse = {"n": int(element.attrib["id"]), "text": " ".join((element.tail or "").split())}
            assert verse["text"], f"Empty verse in {chapter['title']}"
            assert verse["n"] == len(chapter["verses"]) + 1, "Non-contiguous verse numbers"
            if paragraph_start:
                verse["paragraphStart"] = True
                paragraph_start = False
            chapter["verses"].append(verse)
        elif element.tag == "ve":
            assert verse is not None
            verse = None
    assert verse is None
    assert sum(key.startswith(definition["name"] + " ") for key in chapters) == definition["chapters"]

assert len(chapters) == 1189
assert sum(len(chapter["verses"]) for chapter in chapters.values()) == 31102
payload = {
    "code": "YLT",
    "name": "Young's Literal Translation",
    "source": "https://ebible.org/engylt/",
    "sourceFormat": "USFX from eBible.org",
    "sourceDownload": "https://ebible.org/Scriptures/engylt_usfx.zip",
    "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
    "license": "Public Domain",
    "licenseUrl": "https://ebible.org/engylt/copyright.htm",
    "chapters": chapters,
}
(root / "assets/bibles/YLT.js").write_text(
    "window.BIGSCREEN_BIBLE_YLT=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n"
)
index["versions"]["YLT"] = {
    "name": payload["name"], "source": payload["source"], "chapters": 1189, "verses": 31102,
}
index_path.write_text("window.BIGSCREEN_BIBLE_INDEX=" + json.dumps(index, ensure_ascii=False, indent=2) + ";\n")
print("Imported YLT: 66 books, 1,189 chapters, 31,102 verses")
