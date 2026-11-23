// Generated from the website reader by npm run bundle:scripture.
const bookDefinitions = [
  ["Genesis", 50], ["Exodus", 40], ["Leviticus", 27], ["Numbers", 36], ["Deuteronomy", 34],
  ["Joshua", 24], ["Judges", 21], ["Ruth", 4], ["1 Samuel", 31], ["2 Samuel", 24],
  ["1 Kings", 22], ["2 Kings", 25], ["1 Chronicles", 29], ["2 Chronicles", 36], ["Ezra", 10],
  ["Nehemiah", 13], ["Esther", 10], ["Job", 42], ["Psalm", 150], ["Proverbs", 31],
  ["Ecclesiastes", 12], ["Song of Songs", 8], ["Isaiah", 66], ["Jeremiah", 52], ["Lamentations", 5],
  ["Ezekiel", 48], ["Daniel", 12], ["Hosea", 14], ["Joel", 3], ["Amos", 9],
  ["Obadiah", 1], ["Jonah", 4], ["Micah", 7], ["Nahum", 3], ["Habakkuk", 3],
  ["Zephaniah", 3], ["Haggai", 2], ["Zechariah", 14], ["Malachi", 4], ["Matthew", 28],
  ["Mark", 16], ["Luke", 24], ["John", 21], ["Acts", 28], ["Romans", 16],
  ["1 Corinthians", 16], ["2 Corinthians", 13], ["Galatians", 6], ["Ephesians", 6], ["Philippians", 4],
  ["Colossians", 4], ["1 Thessalonians", 5], ["2 Thessalonians", 3], ["1 Timothy", 6], ["2 Timothy", 4],
  ["Titus", 3], ["Philemon", 1], ["Hebrews", 13], ["James", 5], ["1 Peter", 5],
  ["2 Peter", 3], ["1 John", 5], ["2 John", 1], ["3 John", 1], ["Jude", 1], ["Revelation", 22],
];

const books = bookDefinitions.map(([book]) => book);
const bookAliases = buildBookAliases();

function buildBookAliases() {
  const aliases = {};
  const add = (book, ...values) => values.forEach((value) => {
    aliases[normalizeAliasKey(value)] = book;
  });

  books.forEach((book) => add(book, book, book.replace(/^\d\s+/, "$&"), book.replace(/\s+/g, "")));
  add("Genesis", "gen", "ge", "gn");
  add("Exodus", "ex", "exo", "exod");
  add("Leviticus", "lev", "le");
  add("Numbers", "num", "numb", "nu", "nm");
  add("Deuteronomy", "deut", "dt", "deu");
  add("Joshua", "jos", "josh");
  add("Judges", "jdg", "judg");
  add("Ruth", "ru");
  add("1 Samuel", "1sam", "1sa", "1 sam", "1 sa");
  add("2 Samuel", "2sam", "2sa", "2 sam", "2 sa");
  add("1 Kings", "1ki", "1kgs", "1 kin", "1kin", "1 kgs", "1 king", "1 kings");
  add("2 Kings", "2ki", "2kgs", "2 kin", "2kin", "2 kgs", "2 king", "2 kings");
  add("1 Chronicles", "1chr", "1ch", "1 chron", "1 chronicles");
  add("2 Chronicles", "2chr", "2ch", "2 chron", "2 chronicles");
  add("Ezra", "ezr");
  add("Nehemiah", "neh", "ne");
  add("Esther", "est", "esth");
  add("Psalm", "ps", "psa", "psm", "psalm", "psalms");
  add("Proverbs", "pro", "prov", "proverb");
  add("Ecclesiastes", "ecc", "eccl", "eccles");
  add("Song of Songs", "song", "song of solomon", "sos", "songofsongs", "songofsolomon");
  add("Isaiah", "isa", "is");
  add("Jeremiah", "jer");
  add("Lamentations", "lam");
  add("Ezekiel", "ezek", "ezk");
  add("Daniel", "dan", "dn");
  add("Hosea", "hos");
  add("Joel", "jol");
  add("Amos", "amo");
  add("Obadiah", "oba", "obad");
  add("Jonah", "jon");
  add("Micah", "mic");
  add("Nahum", "nah", "nam");
  add("Habakkuk", "hab");
  add("Zephaniah", "zep", "zeph");
  add("Haggai", "hag");
  add("Zechariah", "zec", "zech");
  add("Malachi", "mal");
  add("Matthew", "matt", "mt", "mat");
  add("Mark", "mrk", "mk", "mar");
  add("Luke", "luk", "lk");
  add("John", "jhn", "jn");
  add("Acts", "act", "ac");
  add("Romans", "rom", "ro", "rm");
  add("1 Corinthians", "1cor", "1co", "1 cor", "1 corinthians");
  add("2 Corinthians", "2cor", "2co", "2 cor", "2 corinthians");
  add("Galatians", "gal");
  add("Ephesians", "eph");
  add("Philippians", "phi", "phil", "php");
  add("Colossians", "col");
  add("1 Thessalonians", "1th", "1thess", "1 thess", "1 thessalonians");
  add("2 Thessalonians", "2th", "2thess", "2 thess", "2 thessalonians");
  add("1 Timothy", "1tim", "1ti", "1 tim", "1 timothy");
  add("2 Timothy", "2tim", "2ti", "2 tim", "2 timothy");
  add("Titus", "tit");
  add("Philemon", "phm", "phile", "philem");
  add("Hebrews", "heb");
  add("James", "jas", "jam", "jm");
  add("1 Peter", "1pet", "1pe", "1 peter");
  add("2 Peter", "2pet", "2pe", "2 peter");
  add("1 John", "1jn", "1 jn", "1john", "1 john");
  add("2 John", "2jn", "2 jn", "2john", "2 john");
  add("3 John", "3jn", "3 jn", "3john", "3 john");
  add("Jude", "jud");
  add("Revelation", "rev", "re", "rv");
  return aliases;
}

function normalizeAliasKey(value) {
  return value.trim().toLowerCase().replace(/\./g, "").replace(/\s+/g, " ");
}

export function normalizeBookName(value) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");
  const compact = cleaned.replace(/\s+/g, "");
  const exactMatch = bookAliases[cleaned] || bookAliases[compact];
  if (exactMatch) return exactMatch;

  // Keep very short or ambiguous prefixes from silently opening the wrong book.
  if (cleaned.replace(/[^a-z]/g, "").length < 3) return null;
  const prefixMatches = books.filter((book) => {
    const normalizedBook = book.toLowerCase();
    return normalizedBook.startsWith(cleaned) || normalizedBook.replace(/\s+/g, "").startsWith(compact);
  });
  return prefixMatches.length === 1 ? prefixMatches[0] : null;
}
