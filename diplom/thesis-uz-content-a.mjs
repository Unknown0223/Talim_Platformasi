/**
 * Diplom matni — qism A: kirish va I bob (o‘zbek lotin alifbosi).
 * Iqtiboslar: 1.1 → [1][2][3], 1.2 → [4][5][6], 1.3 → [7][8][9], 1.4 → [10][11][12], 1.5 → [13][14][15].
 */
export const thesisBlocksA = [
  { t: "title", x: "O‘QUV MARKAZLARI UCHUN RAQAMLI TA’LIM PLATFORMASINI ISHLAB CHIQISH («TALIM PLATFORMASI»)" },
  { t: "p", x: "Diplom ishi (yoki bitiruv malakaviy ishi) _______________________ yo‘nalishi bo‘yicha bajarildi. Ilmiy rahbar: _______________________. Muallif: _______________________. Shahar, 2026 yil." },
  { t: "h2", x: "ANNOTATSIYA" },
  {
    t: "p",
    x: "Annotatsiya hajmi: __ sah. Ilmiy ishning predmeti — «Talim platformasi» veb-tizimi. Maqsad — o‘quv markazlari uchun raqamli ta’lim platformasini ishlab chiqish va sinovdan o‘tkazish jarayonini asoslash. Natija — klient–server arxitekturasi, PostgreSQL ma’lumotlar bazasi, React/TypeScript frontend va Express backend asosidagi yechim tavsiflangan.",
  },
  {
    t: "p",
    x: "Kalit so‘zlar: raqamli ta’lim, veb-platforma, o‘quv markazi, PostgreSQL, React, Node.js, REST API, real vaqt, sinov.",
  },
  { t: "h1", x: "KIRISH" },
  {
    t: "p",
    x: "Zamonaviy ta’lim jarayoni texnologik vositalarsiz to‘liq qiymatga ega bo‘lmasligi, ayniqsa o‘quv markazlari kabi tijoriy ta’lim tashkilotlarida o‘quvchilarni hisobga olish, guruhlarni boshqarish, to‘lovlar, xabarlar va monitoringni birlashtiruvchi yagona platforma ehtiyoji dolzarb masalaga aylandi. Qog‘ozda yuritiladigan yoki bir-biridan ajralgan jadval va messenjerlar orqali boshqaruv xatolikka moyil, shaffoflikni pasaytiradi va xodimlar vaqtini ortiqcha sarflashga olib keladi.",
  },
  {
    t: "p",
    x: "O‘zbekiston Respublikasida raqamli ta’lim va axborot-kommunikatsiya texnologiyalarini joriy etish bo‘yicha qabul qilingan normativ-huquqiy va tavsiya xarakteridagi hujjatlar ta’lim tashkilotlarining raqamli muhitga o‘tishini tezlatmoqda. Xalqaro miqyosda UNESCO va OECD hisobotlari raqamli ta’lim ekotizimining shakllanishi, o‘qituvchi malakasi va infratuzilma talablarini tizimli qilib beradi [2][3].",
  },
  {
    t: "p",
    x: "Ilmiy ishning muammosi shundaki, kichik va o‘rta o‘quv markazlari uchun tayyor «ofis paketlari» va umumiy CRM yechimlari o‘quv-tarbiya jarayonining o‘ziga xos ssenariylarini (kurs darajalari, onlayn va oflayn aralash format, davomat, testlar, ota-ona bilan aloqa) to‘liq qamrab olmaydi. Shuning uchun maxsus veb-platforma ishlab chiqish va uni amaliyotda qo‘llash dolzarbdir.",
  },
  {
    t: "p",
    x: "Ilmiy ishning ob’ekti — o‘quv markazlarida raqamli ta’lim platformalaridan foydalanish jarayoni; predmeti — «Talim platformasi» veb-tizimining arxitekturasi, ma’lumotlar bazasi tuzilishi, dasturiy modullari va sinov natijalari.",
  },
  {
    t: "p",
    x: "Ilmiy ishning maqsadi — raqamli ta’lim platformalarining nazariy asoslarini umumlashtirish hamda o‘quv markazlari uchun mo‘ljallangan «Talim platformasi» yechimining loyihalanishi va ishlab chiqilishi jarayonini ilmiy va texnik jihatdan asoslash.",
  },
  {
    t: "p",
    x: "Vazifalar: (1) raqamli ta’lim platformalarining turlari va ularning o‘quv markazi faoliyatidagi o‘rini bo‘yicha adabiyotlar va rasmiy manbalar asosida tahlil olib borish; (2) zamonaviy veb, ma’lumotlar bazasi va real vaqt texnologiyalarini tanlash va ularning tanlangan loyihaga mosligini asoslash; (3) analog yechimlarni taqqoslash orqali o‘z yechimining afzalliklari va cheklovlarini aniqlash; (4) tizim arxitekturasi va ma’lumotlar modelini loyihalash; (5) frontend va backend dasturiy qismlarini yaratish; (6) funksional sinovlar o‘tkazish va natijalarni tahlil qilish.",
  },
  {
    t: "p",
    x: "Ilmiy ishning yangiliqi — nazariy qismda xalqaro tashkilotlar hisobotlari bilan milliy statistik ma’lumotlarni uyg‘unlashtirish, amaliy qismda esa o‘quv markazi uchun rollar (student, teacher, admin, cashier, receptionist, parent) va modullar (kurs, yozilish, to‘lov, xabar, davomat, test, chegirma, yangilik va boshqalar) yig‘indisini yagona veb-tizimda birlashtirish bo‘yicha yondashuvdir.",
  },
  {
    t: "p",
    x: "Ilmiy ahamiyati — ishlab chiqilgan yondashuv va dasturiy yechim boshqa o‘quv markazlari yoki ta’lim startaplari tomonidan moslashtirib qo‘llanishi mumkin bo‘lgan modul tuzilmasini namoyish etadi. Amaliyot ahamiyati — markaz xodimlari va o‘quvchilar uchun jarayonlarni soddalashtirish va ma’lumotlarni markazlashtirishdir.",
  },
  {
    t: "p",
    x: "Ish tuzilmasi: birinchi bobda nazariy asoslar; ikkinchi bobda loyihalash va ishlab chiqish; yakunda xulosa va «Foydalanilgan adabiyotlar» keltiriladi. Matnda adabiyotlarga iqtiboslar raqamli ko‘rinishda berilgan.",
  },

  { t: "h1", x: "I BOB. RAQAMLI TA’LIM PLATFORMLARINING NAZARIY ASOSLARI" },

  { t: "h2", x: "1.1. Ta’lim jarayonini qo‘llab-quvvatlovchi raqamli ta’lim platformalari va ularning turlari" },
  {
    t: "p",
    x: "Raqamli ta’lim platformasi deb, o‘quv kontentini yetkazish, o‘quvchilarni boshqarish, baholash va o‘zaro aloqani axborot tizimlari orqali ta’minlovchi dasturiy- apparat kompleksiga aytiladi. Zamonaviy ta’limda eng keng tarqalgan sinf — Learning Management System (LMS), ya’ni o‘quv jarayonini rejalashtirish, topshiriqlarni berish va qaytarib olish, baholash jurnallarini yuritish imkoniyatlarini birlashtiruvchi tizimlar. Bundan tashqari, o‘qituvchi malakasini rivojlantirish (LXP), korporativ o‘qitish platformalari va o‘quv markazlari uchun maxsus boshqaruv paneli bilan birlashtirilgan yechimlar mavjud [1].",
  },
  {
    t: "p",
    x: "Raqamli platformalar sinxron (jonli dars, vebinar) va asinxron (video darslar, forum, chat) o‘qitish modellarini qo‘llab-quvvatlashi mumkin. Xalqaro hisobotlarda ta’limning sifatini oshirishda raqamli vositalarning o‘rni alohida ta'kidlanadi: texnologiya o‘zi o‘rnini bosmaydi, balki pedagogik dizayn va boshqaruv siyosati bilan birgalikda samara beradi [2]. OECD ko‘rsatmalariga ko‘ra, raqamli ekotizimda platforma, kontent, malaka va infratuzilma o‘rtasida muvozanatni saqlash muhim [3].",
  },
  {
    t: "p",
    x: "O‘quv markazlari uchun LMS dan tashqari, to‘lov va yozilish (CRM elementlari), xabar almashinuvi, ota-onaga hisobot kabi funksiyalar muhim. Shuning uchun «universitet LMS» dan farqli ravishda tijoriy markaz ssenariysiga yaqin modullar to‘plami talab etiladi. Mazkur diplom ishida shu bo‘shliqni to‘ldirish maqsadida maxsus platforma ishlab chiqilgan.",
  },
  {
    t: "p",
    x: "Xulosa qilib aytganda, raqamli ta’lim platformalari turli bo‘linadi: ochiq manbali va tijoriy; kengaytiriladigan plaginlar asosidagi va monolit yechimlar; mobil- birinchi (mobile-first) va klassik veb-interfeysdagi. Tanlov pedagogik maqsad, byudjet va texnik jamoaning kvalifikatsiyasiga bog‘liq [1][2][3].",
  },

  { t: "h2", x: "1.2. O‘quv markazlari faoliyatida zamonaviy veb-platformalarning o‘rni va ahamiyati" },
  {
    t: "p",
    x: "O‘quv markazi faoliyatining mohiyati — o‘quvchilar oqimini boshqarish, guruhlarni shakllantirish, o‘qituvchilarni yuklamasi bilan bog‘lash va moliyaviy natijadorlikni nazorat qilishdir. Veb-platforma bu jarayonlarni yagona interfeys orqali birlashtiradi: administrator yoki kassa xodimi to‘lovni qayd etadi, o‘qituvchi davomat va baholarni kiritadi, o‘quvchi kontent va topshiriqlarga kiradi, ota-ona farzandi faolligi haqida cheklangan, lekin kerakli ma’lumotlarni oladi.",
  },
  {
    t: "p",
    x: "Respublika miqyosida ta’lim va fan sohasidagi statistik ma’lumotlar o‘quvchilar soni, ta’lim muassasalari tarmog‘i va boshqa ko‘rsatkichlarni tahlil qilish uchun asos bo‘lib xizmat qiladi [6]. Raqamli boshqaruv modellari esa ta’lim tashkilotining ichki jarayonlarini shaffoflashtirish va qaror qabul qilishni tezlashtirishga qaratilgan [5].",
  },
  {
    t: "p",
    x: "Normativ jihatdan axborot texnologiyalarini ta’lim jarayoniga joriy etish bo‘yicha vazirlik hujjatlari o‘qituvchi va talabalarning raqamli muhit bilan ishlashini rag‘batlantiradi; bu esa o‘quv markazlari uchun ham veb-xizmatlarni rivojlantirish bo‘yicha strategik yo‘nalish sifatida talqin qilinishi mumkin [4].",
  },
  {
    t: "p",
    x: "Shunday qilib, veb-platforma o‘quv markaziga nafaqat «sayt», balki ichki boshqaruv tizimining yadrosi sifatida qaraladi. Bu esa xatoliklarni kamaytirish, xizmat ko‘rsatish sifatini oshirish va mijozlar sodiqligini mustahkamlash imkonini beradi [4][5][6].",
  },

  { t: "h2", x: "1.3. Raqamli ta’lim platformalarida qo‘llaniladigan dasturiy texnologiyalar (veb, ma’lumotlar bazasi, real vaqt aloqa)" },
  {
    t: "p",
    x: "Zamonaviy veb-ilovalar odatda klient–server arxitekturasida quriladi: brauzerda ishlaydigan yagona sahifali ilova (SPA) foydalanuvchi interfeysini ta’minlaydi, server esa biznes-qoidalarni va ma’lumotlarni boshqaradi. React kutubxonasi komponentlar asosidagi UI yaratish, virtual DOM va keng jamoat ekotizimini ta’minlash jihatidan kuchli tanlov hisoblanadi [7].",
  },
  {
    t: "p",
    x: "Ma’lumotlar qatlami uchun PostgreSQL relatsion ma’lumotlar bazasi murakkab so‘rovlar, butunlik cheklovlari (integrity) va kengaytiriladigan indekslash imkoniyatlari bilan tanilgan [8]. ORM (masalan, Prisma) sxemani kod bilan boshqarish, migratsiyalar va tip xavfsizligini yaxshilashda yordam beradi [17].",
  },
  {
    t: "p",
    x: "Real vaqt rejimida hodisalarni yetkazish uchun WebSocket asosidagi Socket.io texnologiyasi qo‘llaniladi: u brauzer va server o‘rtasida uzluksiz aloqa kanalini ochadi va bildirishnomalar, chat yoki jonli monitoring kabi ssenariylarni soddalashtiradi [9].",
  },
  {
    t: "p",
    x: "«Talim platformasi» loyihasida frontend qismi React 19, TypeScript, Vite va Tailwind CSS yig‘indisida; backend — Node.js muhitida Express freymvorki orqali REST API sifatida; ma’lumotlar saqlanishi PostgreSQL da; sxema va migratsiyalar Prisma orqali boshqariladi; real vaqt funksiyalari Socket.io bilan uyg‘unlashtirilgan. Bu tanlov ochiq manbali vositalar va rasmiy hujjatlar bilan qo‘llab-quvvatlanadi [7][8][9].",
  },

  { t: "h2", x: "1.4. O‘quv markazlari uchun raqamli platformalarga qo‘yiladigan asosiy funksional va texnik talablar" },
  {
    t: "p",
    x: "Funksional talablar o‘quv markazi ssenariysiga bog‘liq bo‘lsa-da, quyidagi to‘plam asosiy hisoblanadi: foydalanuvchi autentifikatsiyasi va rollar bo‘yicha kirish cheklovi; kurslar va fanlar katalogi; yozilish va holatlar; dars jadvali va xonalar; to‘lovlar; xabarlar va fayllar; davomat; testlar va natijalar; sertifikatlar; chegirma va aksiyalar; yangiliklar; ota-ona bilan bog‘lanish.",
  },
  {
    t: "p",
    x: "Texnik talablardan xavfsizlik alohida o‘rin tutadi: parollarni ochiq saqlamaslik, transport darajasida HTTPS, keng tarqalgan veb-zaifliklardan xabardor bo‘lish va ularni oldini olish (OWASP TOP 10) tavsiya etiladi [10]. REST uslubidagi API larni loyihalashda resurslarga yo‘naltirilgan marshrutlar va to‘g‘ri HTTP metodlaridan foydalanish tizimning barqarorligini oshiradi [11].",
  },
  {
    t: "p",
    x: "Avtomatlashtirilgan tizimlarni yaratish bosqichlari (texnik topshiriqdan tortib foydalanishgacha) milliy standartlar bilan tartibga solinishi mumkin; bu diplom ishi doirasida loyiha hayot sikli va hujjatlashtirishni tuzishda yo‘riqchi sifatida qo‘llaniladi [12].",
  },
  {
    t: "p",
    x: "Shu bo‘limda bayon etilgan talablar keyingi bobda «Talim platformasi» modullari va texnik qarorlar bilan aniq modellarda ifodalanadi [10][11][12].",
  },

  { t: "h2", x: "1.5. Mavjud yechimlar va analog tizimlarning qisqa tahlili hamda ularning cheklovlari" },
  {
    t: "p",
    x: "Moodle ochiq manbali LMS bo‘lib, kurs tuzilmalari, modullar va keng jamoat plaginlari bilan ajralib turadi; ammo tijoriy o‘quv markazi uchun to‘g‘ridan-to‘g‘ri to‘lov, kassa va maxsus rollar ssenariylarini «out of the box» qamrab olish har doim ham qulay emas [13].",
  },
  {
    t: "p",
    x: "Google Classroom o‘qituvchi va o‘quvchi o‘rtasidagi topshiriq almashinuvini soddalashtiradi, lekin markazning ichki moliya va murakkab guruh boshqaruvi uchun yetarli emas [14]. Canvas LMS kuchli pedagogik vositalarga ega bo‘lsa-da, litsenziyalash va sozlash xarajati kichik markazlar uchun cheklov bo‘lishi mumkin [15].",
  },
  {
    t: "p",
    x: "Shuning uchun maxsus veb-platforma ishlab chiqish orqali: (a) o‘quv markazi jarayonlariga yaqin modullarni birlashtirish; (b) ma’lumotlarni o‘z serverida saqlash va siyosatni mustaqil boshqarish; (v) keyinchalik integratsiyalar (masalan, messenjer-botlar) qo‘shish imkoniyati — afzallik sifatida ko‘rsatiladi.",
  },
  {
    t: "p",
    x: "Analoglarning umumiy cheklovi — standart ssenariy va qo‘shimcha funksiyalar uchun qo‘shimcha modullar yoki tashqi xizmatlarga bog‘liqlikdir. «Talim platformasi» esa lokal ehtiyojlarga moslashuvchan modul yondashuvi bilan farqlanadi [13][14][15].",
  },
];
