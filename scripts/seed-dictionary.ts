/**
 * Seed script to extract Mien Dictionary entries from the PDF
 * and populate the dictionary_entries table in PostgreSQL.
 *
 * Usage: npx tsx scripts/seed-dictionary.ts
 */

import { PDFParse } from "pdf-parse";
import fs from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;

// ── Configuration ──────────────────────────────────────────────
const PDF_PATH = path.resolve(__dirname, "../assets/mien_dictionary.pdf");
const ENGLISH_PAGE_START = 11; // First page with dictionary entries
const ENGLISH_PAGE_END = 247; // Last page with English definitions (some overflow onto page 247)
const BATCH_SIZE = 200;

// ── Part of speech abbreviations used in the dictionary ─────────
const POS_ABBREVS: Record<string, string> = {
  "v.": "verb",
  "n.": "noun",
  "a.": "adjective",
  "adv.": "adverb",
  "pn.": "proper noun",
  "clf.": "classifier",
  "con.": "contraction",
  "sl.": "slang",
  "chl.": "child language",
  "pro.": "pronoun",
};

// Tokens that indicate the start of a definition (part of speech / other markers)
const POS_TOKENS = new Set([
  "v.",
  "n.",
  "a.",
  "adv.",
  "pn.",
  "clf.",
  "con.",
  "sl.",
  "chl.",
  "pro.",
]);

// Common English verbs that follow "to" in definitions
const COMMON_VERBS = new Set([
  "be",
  "have",
  "make",
  "put",
  "take",
  "get",
  "give",
  "do",
  "go",
  "come",
  "let",
  "keep",
  "set",
  "try",
  "sit",
  "cut",
  "run",
  "turn",
  "hold",
  "pull",
  "push",
  "carry",
  "throw",
  "break",
  "bring",
  "burn",
  "buy",
  "call",
  "catch",
  "change",
  "clean",
  "close",
  "cook",
  "copy",
  "die",
  "drag",
  "draw",
  "drive",
  "drop",
  "eat",
  "feel",
  "find",
  "fix",
  "fold",
  "follow",
  "force",
  "grab",
  "guard",
  "hang",
  "hatch",
  "hear",
  "help",
  "herd",
  "hide",
  "hunt",
  "join",
  "kill",
  "know",
  "lay",
  "lead",
  "learn",
  "leave",
  "lend",
  "lift",
  "like",
  "live",
  "look",
  "lose",
  "love",
  "mark",
  "meet",
  "mimic",
  "mind",
  "miss",
  "move",
  "name",
  "need",
  "offend",
  "open",
  "order",
  "pack",
  "pass",
  "pat",
  "patrol",
  "pay",
  "pick",
  "plan",
  "plant",
  "play",
  "point",
  "pour",
  "pray",
  "prick",
  "prove",
  "prune",
  "pucker",
  "punish",
  "pursue",
  "raise",
  "read",
  "reclaim",
  "reflect",
  "rent",
  "repeat",
  "reprimand",
  "ride",
  "ring",
  "rise",
  "roll",
  "rout",
  "rule",
  "rush",
  "save",
  "scrape",
  "seal",
  "search",
  "sell",
  "send",
  "serve",
  "shape",
  "share",
  "shave",
  "shoot",
  "show",
  "shut",
  "sing",
  "skip",
  "slip",
  "smooth",
  "speak",
  "spread",
  "stand",
  "start",
  "stay",
  "stop",
  "stir",
  "swing",
  "talk",
  "teach",
  "tell",
  "tend",
  "test",
  "tie",
  "touch",
  "toss",
  "track",
  "trim",
  "urge",
  "use",
  "violate",
  "wait",
  "walk",
  "want",
  "warn",
  "wash",
  "watch",
  "wear",
  "weed",
  "wipe",
  "wish",
  "work",
  "worship",
  "wrap",
  "write",
  "yell",
  "chisel",
  "compress",
  "conclude",
  "convince",
  "defeat",
  "display",
  "exert",
  "fine",
  "hatch",
  "mimic",
  "reclaim",
  "scold",
  "scrape",
  "shoot",
  "smooth",
  "sprout",
]);

// Common English words that follow articles in definitions
const COMMON_ENGLISH_WORDS = new Set([
  "abandoned",
  "attentive",
  "baby",
  "barren",
  "basic",
  "beloved",
  "big",
  "bitter",
  "black",
  "blessing",
  "bright",
  "broken",
  "bundle",
  "busy",
  "callus",
  "ceremony",
  "chubby",
  "chronic",
  "compelling",
  "completive",
  "corner",
  "crime",
  "dead",
  "den",
  "disease",
  "divorcee",
  "door",
  "duck",
  "empty",
  "exclamation",
  "exclamatory",
  "family",
  "father",
  "few",
  "film",
  "first",
  "generation",
  "giant",
  "given",
  "good",
  "great",
  "gully",
  "hard",
  "heater",
  "heavy",
  "human",
  "kind",
  "last",
  "lazy",
  "leader",
  "leaflet",
  "leading",
  "light",
  "local",
  "low",
  "male",
  "man",
  "messenger",
  "military",
  "minor",
  "moment",
  "mother",
  "naughty",
  "negative",
  "nest",
  "new",
  "old",
  "particle",
  "peace",
  "person",
  "photographer",
  "preacher",
  "prisoner",
  "profuse",
  "public",
  "reflection",
  "response",
  "rice",
  "rich",
  "rotten",
  "run",
  "runaway",
  "saddle",
  "second",
  "serious",
  "shelf",
  "shift",
  "short",
  "singer",
  "skinny",
  "small",
  "soldier",
  "spouse",
  "straight",
  "street",
  "striped",
  "stutter",
  "tall",
  "thigh",
  "torch",
  "transgressor",
  "very",
  "village",
  "wall",
  "watchdog",
  "wedding",
  "white",
  "whole",
  "whorl",
  "widow",
  "wife",
  "woman",
  "woven",
  "young",
]);

// Words that definitely start English definitions
const DEFINITION_STARTERS = new Set([
  "one's",
  "used",
  "sound",
  "please",
  "yes",
  "okay",
  "alright",
  "right",
  "again",
  "also",
  "another",
  "being",
  "father",
  "mother",
  "daddy",
  "mommy",
  "grandfather",
  "grandmother",
  "grandpa",
  "grandma",
  "brother",
  "sister",
  "uncle",
  "son",
  "daughter",
  "husband",
  "wife",
  "just",
  "almost",
  "nearly",
  "later",
  "usually",
  "generally",
  "normally",
  "hopefully",
  "intentionally",
  "together",
  "collectively",
  "certainly",
  "absolutely",
  "definitely",
  "undoubtedly",
  "even",
  "still",
  "air-conditioner",
  "duckling",
  "cement",
  "congee",
  "rice",
  "militia",
  "chorus",
  "dropsy",
  "edema",
  "epilepsy",
  "seizure",
  "bacteria",
  "germ",
  "virus",
  "furry",
  "hairy",
  "black",
  "comparable",
  "full",
  "eight",
  "what",
]);

interface DictionaryEntry {
  mienWord: string;
  englishDefinition: string;
  partOfSpeech: string | null;
}

// ── Parsing Logic ──────────────────────────────────────────────

/**
 * Determine if a token marks the start of an English definition.
 * Checks the current token and the next token for context.
 */
function isDefinitionStart(
  token: string,
  nextToken: string | undefined,
): boolean {
  // Part of speech markers
  if (POS_TOKENS.has(token)) return true;

  // Foreign language markers
  if (["Chn.", "Eng.", "Th.", "La."].includes(token)) return true;

  // Different form marker
  if (token === "dfd.") return true;

  // Numbered definition
  if (token === "1." || token === "2.") return true;

  // "to" followed by an English verb
  if (token === "to" && nextToken && COMMON_VERBS.has(nextToken)) return true;

  // Articles followed by common English words
  if (
    (token === "a" || token === "an" || token === "the") &&
    nextToken &&
    COMMON_ENGLISH_WORDS.has(nextToken)
  )
    return true;

  // Known definition starters
  if (DEFINITION_STARTERS.has(token)) return true;

  return false;
}

/**
 * Extract the part of speech from a definition string.
 */
function extractPartOfSpeech(definition: string): string | null {
  for (const [abbrev, full] of Object.entries(POS_ABBREVS)) {
    // Check if the definition starts with the abbreviation
    if (definition.startsWith(abbrev + " ") || definition.startsWith(abbrev)) {
      return full;
    }
    // Check inside numbered definitions like "1. v. to do"
    const numberedPattern = new RegExp(`^\\d+\\.\\s*${abbrev.replace(".", "\\.")}\\s`);
    if (numberedPattern.test(definition)) {
      return full;
    }
  }
  // Infer from definition content
  if (definition.match(/^(?:1\.\s+)?to\s/)) return "verb";
  return null;
}

/**
 * Parse a single dictionary line into a Mien word and English definition.
 * Returns null if the line cannot be parsed as an entry.
 */
function parseEntry(line: string): { word: string; def: string } | null {
  const trimmed = line.trim();

  // Lines starting with parentheses, numbers (2., 3.), or S./A. are continuations
  if (trimmed.startsWith("(")) return null;
  if (/^\d+\.\s/.test(trimmed) && !trimmed.startsWith("1.")) return null;
  if (trimmed.startsWith("S. ") || trimmed.startsWith("A. ")) return null;

  const tokens = trimmed.split(/\s+/);
  if (tokens.length < 2) return null;

  // The first token must look like a Mien word (starts with lowercase letter)
  if (!/^[a-z]/.test(tokens[0])) return null;

  for (let i = 1; i < tokens.length; i++) {
    if (isDefinitionStart(tokens[i], tokens[i + 1])) {
      const word = tokens.slice(0, i).join(" ");
      const def = tokens.slice(i).join(" ");
      if (word.length > 0 && def.length > 0) {
        // Reject if the "Mien word" is just an English article or preposition
        const wordLower = word.toLowerCase();
        if (["a", "an", "the", "to", "of", "for", "in", "on", "at", "by"].includes(wordLower)) {
          return null;
        }
        return { word, def };
      }
    }
  }

  // Fallback: try to find the first clearly English word
  // by checking for words that don't follow Mien phonological patterns
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i].toLowerCase().replace(/[,.:;!?]/g, "");
    // Check if this looks like an English word (common suffixes)
    if (
      tok.length >= 4 &&
      (tok.endsWith("ing") ||
        tok.endsWith("tion") ||
        tok.endsWith("ness") ||
        tok.endsWith("ful") ||
        tok.endsWith("ment") ||
        tok.endsWith("able") ||
        tok.endsWith("ible") ||
        tok.endsWith("ous") ||
        tok.endsWith("ive") ||
        tok.endsWith("ally") ||
        tok.endsWith("ary") ||
        tok.endsWith("ory"))
    ) {
      const word = tokens.slice(0, i).join(" ");
      const def = tokens.slice(i).join(" ");
      if (word.length > 0) {
        // Reject if the "Mien word" is just an English article or preposition
        const wordLower = word.toLowerCase();
        if (["a", "an", "the", "to", "of", "for", "in", "on", "at", "by"].includes(wordLower)) {
          return null;
        }
        return { word, def };
      }
    }
  }

  return null;
}

/**
 * Check if a line is a page header (first/last entry + page number).
 * Page headers look like: "word1 \t word2" at the top of pages.
 */
function isPageHeader(line: string, nextLine: string | undefined): boolean {
  // Page numbers are standalone numbers
  if (/^\d+$/.test(line.trim())) return true;

  // Headers with tab separation (first/last words on page)
  if (line.includes("\t") && line.split(/\s+/).length <= 6) return true;

  return false;
}

/**
 * Check if a line is a section header (single letter like "B", "C", etc.)
 */
function isSectionHeader(line: string): boolean {
  return /^[A-Z]$/.test(line.trim());
}

/**
 * Check if a line is a continuation of the previous entry's definition.
 */
function isContinuationLine(line: string): boolean {
  if (!line || line.trim().length === 0) return false;

  const trimmed = line.trim();

  // Lines starting with parentheses are always continuations
  if (trimmed.startsWith("(")) return true;

  // Lines starting with numbered sub-definitions (2., 3., 4., etc.)
  if (/^\d+\.\s/.test(trimmed) && !trimmed.startsWith("1.")) return true;

  // Synonym/antonym markers
  if (trimmed.startsWith("S. ") || trimmed.startsWith("A. ")) return true;

  // Part of speech markers at start of line are continuations (from multi-def entries)
  if (/^(?:v\.|n\.|a\.|adv\.|pn\.|clf\.|con\.|sl\.|chl\.|pro\.)\s/.test(trimmed)) return true;

  // Lines starting with common English continuation words
  const continuationStarters = [
    "a ",    // English article (not a Mien word alone)
    "an ",
    "or ",
    "and ",
    "of ",
    "with ",
    "for ",
    "from ",
    "into ",
    "on ",
    "in ",
    "at ",
    "by ",
    "as ",
    "if ",
    "the ",
    "to ",
    "that ",
    "which ",
    "who ",
    "where ",
    "when ",
    "this ",
    "than ",
    "about ",
    "above ",
    "after ",
    "against ",
    "all ",
    "around ",
    "before ",
    "below ",
    "between ",
    "but ",
    "down ",
    "during ",
    "either ",
    "enough ",
    "especially ",
    "even ",
    "every ",
    "everything ",
    "everywhere ",
    "not ",
    "only ",
    "over ",
    "something ",
    "someone ",
    "somewhere ",
    "through ",
    "under ",
    "until ",
    "upon ",
    "very ",
    "without ",
    "neither ",
    "both ",
    "too ",
    "also ",
    "however ",
    "because ",
    "since ",
    "while ",
    "fai ", // Mien conjunction used in definitions
  ];

  for (const starter of continuationStarters) {
    if (trimmed.startsWith(starter)) return true;
  }

  // Lines that start with lowercase and look like mid-sentence English
  // (not starting with a Mien word pattern)
  if (/^[a-z]/.test(trimmed)) {
    const firstWord = trimmed.split(/\s/)[0].replace(/[,.:;!?)]/g, "");

    // Check if it starts with common English words (longer suffixes)
    if (
      firstWord.length >= 3 &&
      (firstWord.endsWith("ing") ||
        firstWord.endsWith("tion") ||
        firstWord.endsWith("ness") ||
        firstWord.endsWith("ful") ||
        firstWord.endsWith("ment") ||
        firstWord.endsWith("able") ||
        firstWord.endsWith("ible") ||
        firstWord.endsWith("ous") ||
        firstWord.endsWith("ive") ||
        firstWord.endsWith("ally") ||
        firstWord.endsWith("ary") ||
        firstWord.endsWith("ory"))
    ) {
      return true;
    }
  }

  return false;
}

// ── PDF Extraction ─────────────────────────────────────────────

async function extractDictionaryEntries(): Promise<DictionaryEntry[]> {
  console.log(`Reading PDF from: ${PDF_PATH}`);
  const buffer = fs.readFileSync(PDF_PATH);
  const uint8 = new Uint8Array(buffer);

  const parser = new PDFParse(uint8);
  await parser.load();

  const result = await parser.getText();
  console.log(`Total PDF pages: ${result.pages.length}`);

  const entries: DictionaryEntry[] = [];
  let currentWord = "";
  let currentDef = "";
  let totalLines = 0;
  let parsedLines = 0;
  let skippedLines = 0;

  // Process pages 11-246 (English dictionary entries)
  for (let pageIdx = ENGLISH_PAGE_START - 1; pageIdx < ENGLISH_PAGE_END; pageIdx++) {
    const page = result.pages[pageIdx];
    if (!page) continue;

    const lines = page.text.split("\n");

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx].trim();
      if (!line) continue;

      totalLines++;

      // Skip page headers and section headers
      if (isPageHeader(line, lines[lineIdx + 1])) {
        skippedLines++;
        continue;
      }
      if (isSectionHeader(line)) {
        skippedLines++;
        continue;
      }

      // Check if this is a continuation of the previous entry
      if (currentWord && isContinuationLine(line)) {
        currentDef += " " + line;
        continue;
      }

      // Try to parse as a new entry
      const parsed = parseEntry(line);
      if (parsed) {
        // Save the previous entry if we have one
        if (currentWord && currentDef) {
          const pos = extractPartOfSpeech(currentDef);
          entries.push({
            mienWord: currentWord,
            englishDefinition: currentDef,
            partOfSpeech: pos,
          });
        }
        currentWord = parsed.word;
        currentDef = parsed.def;
        parsedLines++;
      } else {
        // If we have a current entry, treat as continuation
        if (currentWord) {
          currentDef += " " + line;
        } else {
          skippedLines++;
        }
      }
    }
  }

  // Don't forget the last entry
  if (currentWord && currentDef) {
    const pos = extractPartOfSpeech(currentDef);
    entries.push({
      mienWord: currentWord,
      englishDefinition: currentDef,
      partOfSpeech: pos,
    });
  }

  console.log(`\nParsing summary:`);
  console.log(`  Total lines processed: ${totalLines}`);
  console.log(`  Lines parsed as entries: ${parsedLines}`);
  console.log(`  Lines skipped (headers): ${skippedLines}`);
  console.log(`  Total entries extracted: ${entries.length}`);

  return entries;
}

// ── Database Seeding ───────────────────────────────────────────

async function seedDatabase(entries: DictionaryEntry[]): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("\nConnected to database.");

    // Ensure table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS dictionary_entries (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        mien_word TEXT NOT NULL,
        english_definition TEXT NOT NULL,
        part_of_speech TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create indexes for search
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_dictionary_entries_mien_word
        ON dictionary_entries (mien_word)
    `);

    // Enable pg_trgm extension for fuzzy search (if available)
    try {
      await client.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_dictionary_entries_mien_word_trgm
          ON dictionary_entries USING gin (mien_word gin_trgm_ops)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_dictionary_entries_english_trgm
          ON dictionary_entries USING gin (english_definition gin_trgm_ops)
      `);
      console.log("Trigram indexes created for fuzzy search.");
    } catch {
      console.log("pg_trgm extension not available, skipping trigram indexes.");
    }

    // Check existing count
    const existing = await client.query(
      "SELECT COUNT(*) as count FROM dictionary_entries",
    );
    const existingCount = parseInt(existing.rows[0].count);

    if (existingCount > 0) {
      console.log(
        `\nFound ${existingCount} existing entries. Clearing table before re-seeding...`,
      );
      await client.query("DELETE FROM dictionary_entries");
    }

    // Insert in batches
    console.log(`\nInserting ${entries.length} dictionary entries...`);
    let inserted = 0;

    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);

      const values: string[] = [];
      const params: (string | null)[] = [];
      let paramIndex = 1;

      for (const entry of batch) {
        values.push(
          `(gen_random_uuid(), $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, NOW())`,
        );
        params.push(entry.mienWord, entry.englishDefinition, entry.partOfSpeech);
        paramIndex += 3;
      }

      await client.query(
        `INSERT INTO dictionary_entries (id, mien_word, english_definition, part_of_speech, created_at)
         VALUES ${values.join(", ")}`,
        params,
      );

      inserted += batch.length;
      if (inserted % 1000 === 0 || inserted === entries.length) {
        console.log(`  Inserted ${inserted}/${entries.length} entries...`);
      }
    }

    // Verify
    const finalCount = await client.query(
      "SELECT COUNT(*) as count FROM dictionary_entries",
    );
    console.log(
      `\nSeeding complete! Total entries in database: ${finalCount.rows[0].count}`,
    );

    // Show sample entries
    const sample = await client.query(
      "SELECT mien_word, english_definition, part_of_speech FROM dictionary_entries ORDER BY mien_word LIMIT 10",
    );
    console.log("\nSample entries:");
    for (const row of sample.rows) {
      console.log(
        `  ${row.mien_word} → ${row.english_definition.substring(0, 60)}${row.english_definition.length > 60 ? "..." : ""} [${row.part_of_speech || "—"}]`,
      );
    }
  } finally {
    client.release();
    await pool.end();
  }
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║   Mien Dictionary PDF → Database Seeder     ║");
  console.log("╚══════════════════════════════════════════════╝\n");

  try {
    const entries = await extractDictionaryEntries();

    if (entries.length === 0) {
      console.error("No entries were extracted from the PDF. Aborting.");
      process.exit(1);
    }

    await seedDatabase(entries);
    console.log("\nDone!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
