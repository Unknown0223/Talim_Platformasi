/**
 * Diplom ishi: texnik talablar, mundarija, paragraf bo'yicha ko'rsatmalar,
 * GOST formatidagi adabiyotlar (takrorlanmas [1]–[27]).
 * Chiqish: Talim_platformasi_diplom_talablari_va_adabiyotlar.docx
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
import {
  buildVolumeGuidanceParagraphs,
  buildIntroParagraphs,
  buildQAParagraphs,
  buildGostFieldParagraphs,
  buildFormattingParagraphs,
} from "./volume-guidance.mjs";
import { BIBLIOGRAPHY_GOST } from "./bibliography-gost.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FONT = "Times New Roman";
const SIZE_14 = 28; // half-points
const SIZE_16 = 32;
const LINE_15 = 360; // ~1.5 line spacing (12 pt base)
const FIRST_LINE = convertMillimetersToTwip(12.5); // 1.25 cm

function body(text, bold = false) {
  return new Paragraph({
    spacing: { line: LINE_15, lineRule: LineRuleType.AUTO, after: 160 },
    indent: { firstLine: FIRST_LINE },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SIZE_14,
        bold,
      }),
    ],
  });
}

function bodyNoIndent(text, bold = false) {
  return new Paragraph({
    spacing: { line: LINE_15, lineRule: LineRuleType.AUTO, after: 160 },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SIZE_14,
        bold,
      }),
    ],
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120, line: LINE_15, lineRule: LineRuleType.AUTO },
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({
        text,
        font: FONT,
        size: SIZE_14,
        bold: true,
      }),
    ],
  });
}

/** Har bir kichik paragraf: ko'rsatma + iqtibos indekslari */
const paragraphPlans = [
  {
    id: "1.1",
    title:
      "1.1. Ta’lim jarayonini qo‘llab-quvvatlovchi raqamli ta’lim platformalari va ularning turlari",
    refs: [1, 2, 3],
    instruction: `Bu bo‘limda LMS, LXP, o‘quv markazi boshqaruvi (CRM bilan integratsiya), sinxron/asinxron o‘qitish modellarini farqlang. Real ma’lumot sifatida: O‘zbekiston yoki tanlangan mamlakatda onlayn ta’lim bo‘yicha rasmiy statistikalar (Milliy statistika qo‘mitasi, Vazirlik saytlari, UNESCO/OECD hisobotlari), 2–3 konkret platforma nomi va ularning asosiy funksiyalari jadvali keltirilsin. Manbalar matnda faqat [1], [2], [3] ko‘rinishida iqtibos qilinsin; boshqa bo‘limlarda bu raqamlar takrorlanmasin.`,
  },
  {
    id: "1.2",
    title:
      "1.2. O‘quv markazlari faoliyatida zamonaviy veb-platformalarning o‘rni va ahamiyati",
    refs: [4, 5, 6],
    instruction: `Real ma’lumot: o‘quv markazlari soni, guruh/yozilish dinamikasi, to‘lov va davomatni qog‘ozda yuritish xarajati va xatoliklar haqida ma’lumot (mumkin bo‘lsa, so‘rovnoma yoki ochiq ma’lumot). «Talim platformasi» loyihasidagi rollar (o‘quvchi, o‘qituvchi, admin va hokazo) bilan nazariy ahamiyatni bog‘lang. Iqtiboslar: [4], [5], [6].`,
  },
  {
    id: "1.3",
    title:
      "1.3. Raqamli ta’lim platformalarida qo‘llaniladigan dasturiy texnologiyalar (veb, ma’lumotlar bazasi, real vaqt aloqa)",
    refs: [7, 8, 9],
    instruction: `Loyiha bilan moslashtiring: veb-klientserver arxitekturasi, REST API, PostgreSQL, ORM (Prisma), Node.js (Express), React + TypeScript + Vite, Tailwind CSS, Socket.io, JWT, fayl yuklash (multer) — qisqa texnik tavsif va tanlangan texnologiyaning afzalliklari. Real manba sifatida rasmiy hujjatlar (React, PostgreSQL, Socket.io dokumentatsiyasi) va 1 ta ilmiy/uchebnik manba ishlatilsin. Iqtiboslar: [7], [8], [9].`,
  },
  {
    id: "1.4",
    title:
      "1.4. O‘quv markazlari uchun raqamli platformalarga qo‘yiladigan asosiy funksional va texnik talablar",
    refs: [10, 11, 12],
    instruction: `Funksional talablar: kurslar, yozilish, to‘lov, xabarlar, davomat, testlar — loyiha sxemasi bo‘yicha. Texnik talablar: xavfsizlik (parol xeshlash, JWT), masshtablash, zaxira nusxa. Real ma’lumot: OWASP TOP 10 dan 1–2 band, yoki milliy standartlar (mavjud bo‘lsa) iqtibos bilan. Iqtiboslar: [10], [11], [12].`,
  },
  {
    id: "1.5",
    title:
      "1.5. Mavjud yechimlar va analog tizimlarning qisqa tahlili hamda ularning cheklovlari",
    refs: [13, 14, 15],
    instruction: `Kamida uchta analog (masalan, Moodle, Google Classroom, boshqa tijoriy LMS) — qisqa taqqoslash jadvali (modullar, narx, integratsiya). Cheklovlar va tanlangan yo‘nalish asoslari. Real URL va kirish sanasi elektron manbalar uchun majburiy. Iqtiboslar: [13], [14], [15].`,
  },
  {
    id: "2.1",
    title:
      "2.1. O‘quv markazlari uchun raqamli ta’lim platformasining umumiy arxitekturasi (klient–server, API, xavfsizlik va rollar tuzilmasi)",
    refs: [16, 17, 18],
    instruction: `Loyiha arxitekturasining blok-sxemasi (Miro/Draw.io eksporti yoki Word ichida rasm). Klient, API, MB, real vaqt xizmati, tashqi integratsiya (masalan, Telegram-bot) oqimi. Real ma’lumot: o‘z loyihangizdagi endpointlar ro‘yxati yoki modullar nomi (kod iqtibosi emas, tuzilma). Iqtiboslar: [16], [17], [18].`,
  },
  {
    id: "2.2",
    title:
      "2.2. O‘quv markazlari uchun raqamli ta’lim platformasining ma’lumotlar bazasini loyihalash",
    refs: [19, 20, 21],
    instruction: `Prisma sxemasidan asosiy modellar (User, Course, Enrollment va hokazo) — ER yoki konseptual diagramma, asosiy bog‘lanishlar (1:N, M:N). Normalizatsiya darajasi va tanlov asoslari. Real manba: PostgreSQL hujjatlari, Коннолли Т., Бегг К. darsligi [19] va SQL nazariyasi bo‘yicha adabiyot [20]. Iqtiboslar: [19], [20], [21].`,
  },
  {
    id: "2.3",
    title:
      "2.3. O‘quv markazlari uchun raqamli ta’lim platformasini ishlab chiqish (frontend va backend dasturiy modullari)",
    refs: [22, 23, 24],
    instruction: `Frontend marshrutlari va asosiy sahifalar (React Router), backend modullar (controller/route), autentifikatsiya oqimi. Real ma’lumot: 1–2 ekran tasviri (skrinshot) yoki komponentlar ierarxiyasi. Kod parchasi iqtibos sifatida ixtiyoriy, lekin manba ko‘rsatilishi shart emas — ilmiy/adabiyot manbalari [22]–[24] asosida tahlil yozilsin.`,
  },
  {
    id: "2.4",
    title:
      "2.4. Tizimni sinovdan o‘tkazish va olingan natijalarni tahlil qilish",
    refs: [25, 26, 27],
    instruction: `Sinov rejalari: funksional, yuk (ixtiyoriy), xavfsilik tekshiruvi. Real natija: test senariylari jadvali, muvaffaqiyatli/muvaffaqiyatsiz holatlar soni. Iqtiboslar: [25], [26], [27].`,
  },
];

const children = [];

children.push(
  new Paragraph({
    spacing: { before: 240, after: 120, line: LINE_15, lineRule: LineRuleType.AUTO },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "«TALIM PLATFORMASI» LOYIHASI",
        font: FONT,
        size: SIZE_16,
        bold: true,
      }),
    ],
  })
);
children.push(
  new Paragraph({
    spacing: { after: 200, line: LINE_15, lineRule: LineRuleType.AUTO },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "DIPLOM ISHI: TEXNIK TALABLAR, MUNDARIJA VA ADABIYOTLAR",
        font: FONT,
        size: SIZE_16,
        bold: true,
      }),
    ],
  })
);

children.push(
  bodyNoIndent(
    "Ushbu hujjat institut talablariga moslashtirilgan shablon va metodik ko‘rsatmalar to‘plamidir. Asosiy matnni o‘zingiz yozasiz; iqtibos indekslari va adabiyotlar ro‘yxati quyida berilgan tartibda saqlanishi kerak.",
    true
  )
);

children.push(h2("1. Asosiy shartlar va qo‘shimchalar"));
children.push(
  body(
    "Hajm: I bob — 35–40 sahifa, II bob — 35–40 sahifa; jami taxminan 70–80 sahifa oralig‘ida (jadvallar, rasmlar va ilovalar kiritilganda sahifa soni oshishi mumkin, lekin asosiy matn hajmi shu diapazonda ushlanishi tavsiya etiladi)."
  )
);
children.push(
  body(
    "Matn uslubi: shrift Times New Roman, o‘lcham 14 pt; qatorlar orasidagi interval 1,5; abzasning birinchi qatori 1,25 sm chekinma; sahifa maydonlari institut namunasiga mos."
  )
);
children.push(
  body(
    "Iqtiboslar va adabiyotlar: matnda [n] ko‘rinishi; GOST bo‘yicha maydonlar — 4.2-bo‘limda; namunaviy adabiyotlar ro‘yxati — hujjat oxirida. 3-bobdagi har bir kichik paragraf uchun ajratilgan uchta manba indeksi boshqa paragraflarda takrorlanmasin."
  )
);
children.push(
  body(
    "Real ma’lumotlar: har bir bo‘limda statistika, rasmiy hujjatlar, loyiha artefaktlari (diagramma, jadval, skrinshot) va tekshirilgan URL manbalardan foydalanish majburiy hisoblanadi; uydan uydan ixtiro qilinmagan raqamlarni keltirish akademik halollik talabidir."
  )
);

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(h2("2. Mundarija"));
children.push(
  bodyNoIndent("I BOB. RAQAMLI TA’LIM PLATFORMLARINING NAZARIY ASOSLARI", true)
);
children.push(
  bodyNoIndent(
    "1.1. Ta’lim jarayonini qo‘llab-quvvatlovchi raqamli ta’lim platformalari va ularning turlari"
  )
);
children.push(
  bodyNoIndent(
    "1.2. O‘quv markazlari faoliyatida zamonaviy veb-platformalarning o‘rni va ahamiyati"
  )
);
children.push(
  bodyNoIndent(
    "1.3. Raqamli ta’lim platformalarida qo‘llaniladigan dasturiy texnologiyalar (veb, ma’lumotlar bazasi, real vaqt aloqa)"
  )
);
children.push(
  bodyNoIndent(
    "1.4. O‘quv markazlari uchun raqamli platformalarga qo‘yiladigan asosiy funksional va texnik talablar"
  )
);
children.push(
  bodyNoIndent(
    "1.5. Mavjud yechimlar va analog tizimlarning qisqa tahlili hamda ularning cheklovlari"
  )
);
children.push(
  bodyNoIndent(
    "II BOB. O‘QUV MARKAZLARI UCHUN RAQAMLI TA’LIM PLATFORMASINI ISHLAB CHIQISH",
    true
  )
);
children.push(
  bodyNoIndent(
    "2.1. O‘quv markazlari uchun raqamli ta’lim platformasining umumiy arxitekturasi (klient–server, API, xavfsizlik va rollar tuzilmasi)"
  )
);
children.push(
  bodyNoIndent(
    "2.2. O‘quv markazlari uchun raqamli ta’lim platformasining ma’lumotlar bazasini loyihalash"
  )
);
children.push(
  bodyNoIndent(
    "2.3. O‘quv markazlari uchun raqamli ta’lim platformasini ishlab chiqish (frontend va backend dasturiy modullari)"
  )
);
children.push(
  bodyNoIndent(
    "2.4. Tizimni sinovdan o‘tkazish va olingan natijalarni tahlil qilish"
  )
);

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(
  h2(
    "3. Har bir kichik paragraf bo‘yicha alohida ko‘rsatmalar (real ma’lumot va manbalar)"
  )
);

for (const p of paragraphPlans) {
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 120, line: LINE_15, lineRule: LineRuleType.AUTO },
      children: [
        new TextRun({
          text: `${p.id}. `,
          font: FONT,
          size: SIZE_14,
          bold: true,
        }),
        new TextRun({
          text: p.title,
          font: FONT,
          size: SIZE_14,
          bold: true,
        }),
      ],
    })
  );
  children.push(
    body(
      `Matnda faqat quyidagi indekslardan foydalaning: ${p.refs.map((r) => `[${r}]`).join(", ")}.`
    )
  );
  children.push(body(p.instruction));
}

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(
  h2(
    "4. Hajm va tuzilma bo‘yicha metodik ilova (takrorlanmas paragraflar, I bob 35–40 sah., II bob 35–40 sah., jami 70–80 sah.)"
  )
);
for (const t of buildIntroParagraphs()) {
  children.push(body(t));
}

children.push(
  bodyNoIndent(
    "4.0. Word muhitida formatlash va hujjat tuzilishi bo‘yicha qisqa eslatmalar",
    true
  )
);
for (const t of buildFormattingParagraphs()) {
  children.push(body(t));
}

children.push(
  h2(
    "4.1. II bob uchun «Talim platformasi» bo‘yicha noyob yozish yo‘riqnomalari (har paragraf boshqacha mazmun)"
  )
);
for (const t of buildVolumeGuidanceParagraphs()) {
  children.push(body(t));
}

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(h2("4.2. GOST bo‘yicha adabiyot yozuvi maydonlari (qisqa o‘quv qo‘llanma)"));
for (const t of buildGostFieldParagraphs()) {
  children.push(body(t));
}

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(
  h2("5. Himoya uchun namunaviy savollar va qisqa javab rejasi")
);
for (const t of buildQAParagraphs()) {
  children.push(body(t));
}

children.push(new Paragraph({ children: [new PageBreak()] }));

children.push(
  h2("Foydalanilgan adabiyotlar (GOST 7.0.5–2008 ga yaqin format)")
);
children.push(
  bodyNoIndent(
    "Quyidagi ro‘yxat diplom ishi yakuniy qismidagi «Foydalanilgan adabiyotlar» bo‘limiga to‘liq ko‘chiriladi. Tartib raqamlari yuqoridagi paragraflar bilan mos keladi.",
    true
  )
);

for (const line of BIBLIOGRAPHY_GOST) {
  children.push(
    new Paragraph({
      spacing: { line: LINE_15, lineRule: LineRuleType.AUTO, after: 120 },
      children: [
        new TextRun({
          text: line,
          font: FONT,
          size: SIZE_14,
        }),
      ],
    })
  );
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children,
    },
  ],
  styles: {
    default: {
      document: {
        run: {
          font: FONT,
          size: SIZE_14,
        },
      },
    },
  },
});

const buf = await Packer.toBuffer(doc);
const outPath = path.join(
  __dirname,
  "Talim_platformasi_diplom_talablari_va_adabiyotlar.docx"
);
try {
  fs.writeFileSync(outPath, buf);
  console.log("Yozildi:", outPath);
} catch (err) {
  if (err && (err.code === "EBUSY" || err.code === "EPERM")) {
    const alt = path.join(
      __dirname,
      "Talim_platformasi_diplom_talablari_va_adabiyotlar_YANGI.docx"
    );
    fs.writeFileSync(alt, buf);
    console.warn(
      "Asosiy .docx ochiq yoki bloklangan. Yopib qayta urining. Vaqtincha yozildi:",
      alt
    );
  } else {
    throw err;
  }
}
