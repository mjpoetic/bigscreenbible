#!/usr/bin/env python3
"""Build local Hebrew occurrence assets from a verified, pinned OSHB archive.

Usage: python3 scripts/import-oshb.py [/path/to/morphhb.tar.gz]
No third-party Python dependencies; XML is never shipped to the browser.
"""
import argparse
from collections import Counter
import hashlib
import io
import json
from pathlib import Path
import re
import tarfile
import urllib.request
import xml.etree.ElementTree as ET

REVISION = "3d15126fb1ef74867fc1434be1942e837932691f"
ARCHIVE_SHA256 = "f979b5357fb18391928cd42ee1b95594db6e4f71d8da4e893c6c18f2688093a6"
SOURCE = "https://github.com/openscriptures/morphhb"
ARCHIVE_URL = f"https://codeload.github.com/openscriptures/morphhb/tar.gz/{REVISION}"
ATTRIBUTION = f"Original work of the Open Scriptures Hebrew Bible available at {SOURCE}"
BOOKS = dict(zip(
    "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal".split(),
    ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalm", "Proverbs", "Ecclesiastes", "Song of Songs", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi"],
))
NS = "{http://www.bibletechnologies.net/2003/OSIS/namespace}"


def strong_codes(lemma):
    # Preserve the augmented lemma separately. Prefix letters are not Strong's
    # numbers, and homonym letters / '+' must not be concatenated into a code.
    codes = []
    for part in lemma.split("/"):
        match = re.fullmatch(r"(\d+)(?: [a-z])?\+?", part)
        if match:
            code = f"H{int(match[1])}"
            if code not in codes:
                codes.append(code)
        elif not re.fullmatch(r"[a-z]", part):
            raise ValueError(f"Unknown OSHB lemma syntax: {lemma}")
    return codes


def verse_mapping(xml):
    full, blocked = {}, set()
    for node in ET.fromstring(xml).iter():
        if node.tag.rsplit("}", 1)[-1] != "verse":
            continue
        source, target = node.get("wlc"), node.get("kjv")
        if node.get("type") == "full":
            if source in full:
                raise ValueError(f"Duplicate verse mapping: {source}")
            full[source] = target
        else:
            # Partial boundaries require word-level evidence the map lacks.
            # Block both sides, including related full mappings, rather than
            # silently using the same-numbered Hebrew verse.
            blocked.update([source.split("!")[0], target.split("!")[0]])
    # The upstream map includes a few many-to-one Psalm title/body mappings.
    # These also need finer boundaries; keep dictionary-only behavior for now.
    blocked.update(target for target, count in Counter(full.values()).items() if count > 1)
    return full, blocked


def verse_words(verse):
    words, has_variant = [], False

    def visit(node, reading=""):
        nonlocal has_variant
        tag = node.tag.removeprefix(NS)
        if tag == "note" and node.get("type") != "variant":
            return
        if tag == "rdg":
            reading = node.get("type", "variant").removeprefix("x-")
        if tag == "w":
            variant = node.get("type", "").removeprefix("x-") or reading
            has_variant = has_variant or bool(variant)
            morph, lemma = node.get("morph", ""), node.get("lemma", "")
            if not morph.startswith("H"):
                return  # Phase 1: Hebrew, not Aramaic or Greek.
            codes = strong_codes(lemma)
            if not codes:
                return  # Standalone prefix/particle without a dictionary key.
            # itertext preserves letters nested in seg (e.g. enlarged letters).
            surface = "".join(node.itertext()).strip()
            word_id = node.get("id")
            if not word_id or not surface:
                raise ValueError("OSHB word lacks its ID or text")
            row = [word_id, surface, codes, lemma, morph]
            if variant:
                row.append(variant)
            words.append(row)
            return
        for child in node:
            visit(child, reading)

    visit(verse)
    return words, has_variant


def build_assets(archive_bytes):
    if hashlib.sha256(archive_bytes).hexdigest() != ARCHIVE_SHA256:
        raise ValueError("Archive hash does not match the pinned OSHB source")
    with tarfile.open(fileobj=io.BytesIO(archive_bytes), mode="r:gz") as archive:
        def read(name):
            return archive.extractfile(f"morphhb-{REVISION}/{name}").read()

        full, blocked = verse_mapping(read("wlc/VerseMap.xml"))
        targets = set(full.values())
        results, ids = {}, set()
        for osis, name in BOOKS.items():
            verses, omitted = {}, []
            for verse in ET.fromstring(read(f"wlc/{osis}.xml")).iter(NS + "verse"):
                source = verse.get("osisID")
                target = full.get(source, source)
                if source in blocked or target in blocked:
                    omitted.append(source)
                    continue
                if source not in full and target in targets:
                    # E.g. a Psalm superscription: the mapped body of the Psalm
                    # owns English verse 1. Do not attach its title to that verse.
                    omitted.append(source)
                    continue
                target_book, chapter, number = target.split(".")
                if target_book != osis:
                    raise ValueError(f"Unexpected cross-book map: {source} -> {target}")
                key = f"{int(chapter)}:{int(number)}"
                if key in verses:
                    raise ValueError(f"Ambiguous verse target: {target}")
                words, variant = verse_words(verse)
                for word in words:
                    if word[0] in ids:
                        raise ValueError(f"Duplicate word ID: {word[0]}")
                    ids.add(word[0])
                if words:
                    record = {"ref": source, "words": words}
                    if variant:
                        record["variant"] = True
                    verses[key] = record
            results[f"{osis}.json"] = {"schema": 1, "revision": REVISION, "book": name, "verses": verses}
            results.setdefault("manifest.json", {"schema": 1, "revision": REVISION,
                "source": SOURCE, "archive": ARCHIVE_URL, "archiveSha256": ARCHIVE_SHA256,
                "attribution": ATTRIBUTION, "license": "CC BY 4.0 (lemma and morphology); WLC text public domain",
                "licenseUrl": "https://creativecommons.org/licenses/by/4.0/",
                "versification": "OSHB VerseMap.xml whole-verse mappings to KJV numbering; partial mappings and superscription collisions omitted",
                "wordFields": ["id", "surface", "strongCodes", "rawLemma", "morph", "optionalVariant"],
                "books": {}})["books"][name] = {"file": f"{osis}.json", "verses": len(verses),
                    "words": sum(len(v["words"]) for v in verses.values()), "omittedSourceVerses": omitted}
        results["LICENSE.md"] = read("LICENSE.md").decode()
        return results


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", nargs="?", type=Path)
    parser.add_argument("--output", type=Path, default=Path(__file__).resolve().parents[1] / "assets/oshb")
    args = parser.parse_args()
    raw = args.archive.read_bytes() if args.archive else urllib.request.urlopen(ARCHIVE_URL).read()
    results = build_assets(raw)  # Validate everything before writing any asset.
    args.output.mkdir(parents=True, exist_ok=True)
    for name, data in results.items():
        content = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"
        (args.output / name).write_text(content, encoding="utf-8")
    print(f"Imported {len(BOOKS)} books / {sum(b['words'] for b in results['manifest.json']['books'].values())} Hebrew occurrences at {REVISION}")


if __name__ == "__main__":
    main()
