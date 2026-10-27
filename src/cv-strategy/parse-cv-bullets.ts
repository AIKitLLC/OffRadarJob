import { Err, Ok, Result } from "../types/domain.js";
import { BulletMarker, CV_TEXT_MAX_CHARS, CvBullet, CvSection, ParsedCv } from "./types.js";
import { shortHash } from "./short-hash.js";

// Splits CV text into sections and bullets (#16). Pure and deterministic.
//
// Ids hash the section title and the bullet's own text, plus an occurrence
// counter for exact repeats. Editing, adding or removing one bullet does not
// change any other bullet's id.
//
// Lines that are neither headings nor bullets (role lines, summary prose) are
// not bullets. A line continues the previous bullet only when it looks like a
// wrapped line: it starts lowercase, or the bullet so far ends with a
// connector. CVs without bullet markers yield sections and no bullets.

const MARKDOWN_HEADING_RE = /^#{1,6}\s+(.+)$/;
const SYMBOL_BULLET_RE = /^([-*•·▪◦‣–])\s+(.*)$/;
const NUMBER_BULLET_RE = /^\d{1,2}[.)]\s+(.*)$/;
const CONNECTOR_END_RE = /(?:[,;:(\-–]|\b(?:and|or|of|to|for|with|in|on|by|the|a|an))$/i;

const KNOWN_HEADINGS = new Set([
  "summary",
  "profile",
  "about",
  "about me",
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "employment history",
  "projects",
  "selected projects",
  "education",
  "skills",
  "technical skills",
  "certifications",
  "awards",
  "publications",
  "open source",
  "volunteering",
  "languages",
]);

const SYMBOL_MARKERS: Record<string, BulletMarker> = {
  "-": "dash",
  "–": "dash",
  "*": "star",
  "•": "dot",
  "·": "dot",
  "▪": "dot",
  "◦": "dot",
  "‣": "dot",
};

function normalizeLine(line: string): string {
  return line.replace(/[\t ]/g, " ").replace(/\s+/g, " ").trim();
}

function idKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isHeading(line: string): string | null {
  const markdown = MARKDOWN_HEADING_RE.exec(line);
  if (markdown && markdown[1]) return markdown[1].replace(/:$/, "").trim();
  if (line.length > 60 || /[.;,!?]$/.test(line)) return null;
  const bare = line.replace(/:$/, "").trim();
  if (bare.length === 0) return null;
  if (KNOWN_HEADINGS.has(bare.toLowerCase())) return bare;
  const letters = bare.replace(/[^A-Za-z]/g, "");
  if (letters.length >= 3 && letters.replace(/[^A-Z]/g, "").length / letters.length >= 0.8) return bare;
  if (line.endsWith(":") && bare.split(" ").length <= 5) return bare;
  return null;
}

function bulletStart(line: string): { marker: BulletMarker; text: string } | null {
  const symbol = SYMBOL_BULLET_RE.exec(line);
  if (symbol && symbol[1] && symbol[2] !== undefined) {
    return { marker: SYMBOL_MARKERS[symbol[1]] ?? "dash", text: symbol[2].trim() };
  }
  const numbered = NUMBER_BULLET_RE.exec(line);
  if (numbered && numbered[1] !== undefined) return { marker: "number", text: numbered[1].trim() };
  return null;
}

function continuesBullet(previous: string, line: string): boolean {
  return /^[a-z]/.test(line) || CONNECTOR_END_RE.test(previous);
}

interface Draft {
  sectionIndex: number;
  marker: BulletMarker;
  text: string;
}

export function parseCvBullets(input: string): Result<ParsedCv, Error> {
  if (input.length > CV_TEXT_MAX_CHARS) {
    return Err(new Error(`cv_text_too_long: ${input.length} > ${CV_TEXT_MAX_CHARS} characters`));
  }

  const titles: string[] = [""];
  const drafts: Draft[] = [];
  let open: Draft | null = null;

  for (const rawLine of input.replace(/\r\n?/g, "\n").split("\n")) {
    const line = normalizeLine(rawLine);
    if (line.length === 0) {
      open = null;
      continue;
    }
    const start = bulletStart(line);
    if (start) {
      open = start.text.length > 0 ? { sectionIndex: titles.length - 1, marker: start.marker, text: start.text } : null;
      if (open) drafts.push(open);
      continue;
    }
    const heading = isHeading(line);
    if (heading !== null) {
      titles.push(heading);
      open = null;
      continue;
    }
    if (open && continuesBullet(open.text, line)) {
      open.text = `${open.text} ${line}`;
      continue;
    }
    open = null;
  }

  const sectionIds: string[] = [];
  const sectionSeen = new Map<string, number>();
  for (const title of titles) {
    const key = idKey(title);
    const n = sectionSeen.get(key) ?? 0;
    sectionSeen.set(key, n + 1);
    sectionIds.push(`s_${shortHash(`${key}#${n}`)}`);
  }

  const sections: CvSection[] = titles.map((title, i) => ({ id: sectionIds[i] ?? "", title, bulletIds: [] }));
  const bullets: CvBullet[] = [];
  const bulletSeen = new Map<string, number>();
  for (const draft of drafts) {
    const section = sections[draft.sectionIndex];
    if (!section) continue;
    const key = `${idKey(section.title)}\n${idKey(draft.text)}`;
    const n = bulletSeen.get(key) ?? 0;
    bulletSeen.set(key, n + 1);
    const id = `b_${shortHash(`${key}#${n}`)}`;
    bullets.push({ id, sectionId: section.id, text: draft.text, marker: draft.marker });
    section.bulletIds.push(id);
  }

  return Ok({ sections: sections.filter((s, i) => i > 0 || s.bulletIds.length > 0), bullets });
}
