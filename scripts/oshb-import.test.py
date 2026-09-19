import importlib.util
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location("oshb_import", Path(__file__).with_name("import-oshb.py"))
oshb = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oshb)


class ImportTests(unittest.TestCase):
    def test_augmented_identifiers(self):
        self.assertEqual(oshb.strong_codes("c/157"), ["H157"])
        self.assertEqual(oshb.strong_codes("c/b/01254 a+"), ["H1254"])
        self.assertEqual(oshb.strong_codes("b"), [])
        with self.assertRaises(ValueError):
            oshb.strong_codes("unrecognized")

    def test_nested_letters_and_variants(self):
        verse = ET.fromstring('''<verse xmlns="http://www.bibletechnologies.net/2003/OSIS/namespace">
          <w lemma="8085" morph="HVqv2ms" id="a">שְׁמַ֖<seg type="x-large">ע</seg></w>
          <w lemma="3318" morph="HVhv2ms" id="b" type="x-ketiv">הוצא</w>
          <note type="variant"><catchWord>הוצא</catchWord><rdg type="x-qere">
            <w lemma="3318" morph="HVhv2ms" id="c">הַיְצֵ֣א</w>
          </rdg></note>
          <w lemma="1" morph="ANcmsa" id="d">Aramaic</w>
          <w lemma="b" morph="HR" id="e">ב</w>
        </verse>''')
        words, variant = oshb.verse_words(verse)
        self.assertTrue(variant)
        self.assertEqual(len(words), 3)
        self.assertEqual(words[0][1], "שְׁמַ֖ע")
        self.assertEqual(words[1][5], "ketiv")
        self.assertEqual(words[2][5], "qere")

    def test_versification_does_not_guess_partial_or_many_to_one(self):
        full, blocked = oshb.verse_mapping('''<verseMap>
          <verse wlc="Gen.32.1" kjv="Gen.31.55" type="full"/>
          <verse wlc="Isa.63.19!b" kjv="Isa.64.1" type="partial"/>
          <verse wlc="Ps.51.2" kjv="Ps.51.1" type="full"/>
          <verse wlc="Ps.51.3" kjv="Ps.51.1" type="full"/>
        </verseMap>''')
        self.assertEqual(full["Gen.32.1"], "Gen.31.55")
        self.assertEqual(blocked, {"Isa.63.19", "Isa.64.1", "Ps.51.1"})

    def test_unpinned_input_rejected(self):
        with self.assertRaisesRegex(ValueError, "hash"):
            oshb.build_assets(b"not the pinned archive")


if __name__ == "__main__":
    unittest.main()
