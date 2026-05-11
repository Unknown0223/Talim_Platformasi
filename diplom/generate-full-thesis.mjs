/**
 * To‘liq diplom matni (o‘zbekcha) — Word .docx generatsiyasi.
 * Chiqish: Talim_platformasi_DIPLOM_TOLOQ_MATN.docx
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  LineRuleType,
  convertMillimetersToTwip,
  PageBreak,
} from "docx";
import { thesisBlocksA } from "./thesis-uz-content-a.mjs";
import { thesisBlocksB } from "./thesis-uz-content-b.mjs";
import { BIBLIOGRAPHY_GOST } from "./bibliography-gost.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FONT = "Times New Roman";
const SIZE_14 = 28;
const SIZE_16 = 32;
const LINE_15 = 360;
const FIRST_LINE = convertMillimetersToTwip(12.5);

function paraBody(text) {
  return new Paragraph({
    spacing: { line: LINE_15, lineRule: LineRuleType.AUTO, after: 160 },
    indent: { firstLine: FIRST_LINE },
    children: [new TextRun({ text, font: FONT, size: SIZE_14 })],
  });
}

function paraBodyNoIndent(text, bold = false) {
  return new Paragraph({
    spacing: { line: LINE_15, lineRule: LineRuleType.AUTO, after: 160 },
    children: [new TextRun({ text, font: FONT, size: SIZE_14, bold })],
  });
}

function paraTitle(text) {
  return new Paragraph({
    spacing: { before: 400, after: 300, line: LINE_15, lineRule: LineRuleType.AUTO },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: FONT, size: SIZE_16, bold: true })],
  });
}

function paraH1(text) {
  return new Paragraph({
    spacing: { before: 360, after: 200, line: LINE_15, lineRule: LineRuleType.AUTO },
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: FONT, size: SIZE_16, bold: true })],
  });
}

function paraH2(text) {
  return new Paragraph({
    spacing: { before: 240, after: 140, line: LINE_15, lineRule: LineRuleType.AUTO },
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: FONT, size: SIZE_14, bold: true })],
  });
}

function needsPageBeforeH1(text) {
  if (text === "KIRISH") return false;
  if (text.startsWith("I BOB.")) return true;
  if (text.startsWith("II BOB.")) return true;
  if (text === "XULOSA") return true;
  return false;
}

const allBlocks = [...thesisBlocksA, ...thesisBlocksB];

const children = [];

for (const b of allBlocks) {
  if (b.t === "h1" && needsPageBeforeH1(b.x)) {
    children.push(new Paragraph({ children: [new PageBreak()] }));
  }
  if (b.t === "title") children.push(paraTitle(b.x));
  else if (b.t === "h1") children.push(paraH1(b.x));
  else if (b.t === "h2") children.push(paraH2(b.x));
  else children.push(paraBody(b.x));
}

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(paraH1("FOYDALANILGAN ADABIYOTLAR"));
children.push(
  paraBodyNoIndent(
    "Quyidagi manbalar matnda raqamli iqtibos [n] ko‘rinishida ishlatilgan. Institut talabiga qarab shrift va intervalni tekshiring.",
    true
  )
);

for (const line of BIBLIOGRAPHY_GOST) {
  children.push(
    new Paragraph({
      spacing: { line: LINE_15, lineRule: LineRuleType.AUTO, after: 120 },
      children: [new TextRun({ text: line, font: FONT, size: SIZE_14 })],
    })
  );
}

const doc = new Document({
  sections: [{ properties: {}, children }],
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SIZE_14 },
      },
    },
  },
});

const buf = await Packer.toBuffer(doc);
const outPath = path.join(__dirname, "Talim_platformasi_DIPLOM_TOLOQ_MATN.docx");
try {
  fs.writeFileSync(outPath, buf);
  console.log("Yozildi:", outPath);
} catch (err) {
  if (err && (err.code === "EBUSY" || err.code === "EPERM")) {
    const alt = path.join(__dirname, "Talim_platformasi_DIPLOM_TOLOQ_MATN_YANGI.docx");
    fs.writeFileSync(alt, buf);
    console.warn("Asosiy fayl bloklangan. Yozildi:", alt);
  } else throw err;
}
