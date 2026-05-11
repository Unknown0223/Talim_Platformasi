/**
 * Diplom hujjatiga qo‘shimcha metodik matnlar.
 * Oldingi versiyadagi modul×aspekt shablonlari olib tashlangan — har bir paragraf alohida yozilgan.
 */

/** II bobda «Talim platformasi» bo‘yicha yoziladigan bo‘limlar — har biri boshqacha mazmun va topshiriq */
const UNIQUE_GUIDANCE_PARAGRAPHS = [
  `Kurslar va fanlar katalogi bo‘limida nafaqat «nima bor», balki «kurs qanday tuziladi: daraja (Beginner/Intermediate/Advanced), online/offline turi, o‘qituvchi biriktirish» kabi maydonlar izohlanadi. Loyihangizdagi Course/CourseType kabi atamalarni jadval ustunlari bilan birga keltiring; analog LMS lardagi «kurs = modul» farqini bir abzasta aniqlashtiring.`,
  `Yozilish (enrollment) jarayonini foydalanuvchi nuqtai nazaridan tasvirlang: o‘quvchi kursni tanlaydi, status (active/completed/cancelled) o‘zgaradi, tarix saqlanadi. ER bog‘lanishida Enrollment va User, Course o‘rtasidagi munosabatni 1:N yoki boshqa tip bilan asoslang; cheklovlar: bir vaqtning o‘zida ikki marta faol yozilish bo‘lmasligi kabi qoidalar bo‘lsa, matn va jadvalda ko‘rsating.`,
  `To‘lovlar modulida Payment obyekti maydonlari (summa, valyuta, holat) va kassa/resepshn rollarining vazifasi ajratiladi. Nazariy jihatdan to‘lov xavfsizligi PCI DSS darajasida emasligini halol yozing; amalda nimalar qilingan (masalan, ichki balans, statuslar) — haqiqiy sxema yoki skrinshot bilan.`,
  `Xabarlar va fayl almashinuvi: suhbat a’zoligi, xabar turi, fayl saqlash yo‘li (masalan, uploads papkasi) bo‘yicha ketma-ketlik diagrammasi tavsiya etiladi. Real vaqt bilan bog‘liqlikni alohida jumla bilan ajrating: qaysi hodisalar socket orqali, qaysilari oddiy HTTP orqali.`,
  `Davomat: kim yozadi (o‘qituvchi), qaysi sana va guruh, qanday holatlar (keldi/kelmadi/kechikdi) — jadval ko‘rinishida sinov senariylari bilan birga keltiring. Bu bo‘limda «innovatsiya» emas, balki jarayonning aniqligi muhim.`,
  `Testlar va quizlar: savollar tuzilishi, urinishlar (attempt), natija saqlanishi bo‘yicha qisqa dasturchi tavsifi so‘zda emas, balki ma’lumotlar modeli bilan bog‘langan holda beriladi. Agar loyihada alohida «battle» yoki reyting bo‘lsa, test modulidan farqini bitta paragraf bilan ajrating.`,
  `O‘qituvchi profili (TeacherDetails): mutaxassislik, tajriba, bio maydonlari qanday UI da ochilishini 1–2 skrinshot bilan izohlashingiz mumkin. Reyting (XP, coins, badges) pedagogik jihatdan nima berishini ehtiyotkorlik bilan yozing — o‘yinlashtirish va motivatsiya adabiyotlari bilan bog‘lang.`,
  `Admin panel va monitoring: qaysi statistikalar yoki jadval ko‘rinishlari mavjud, kim ko‘radi — rollar bo‘yicha. Bu yerda «kengaytirilgan metodika» emas, balki konkret ekranlar ro‘yxati va ularning maqsadi yoziladi.`,
  `Chegirmalar (discount) kampaniyalari: kim yaratadi, kimga tegishli, muddati — biznes-qoidalar va MB maydonlari mosligi. Agar hali to‘liq ishlamasa, cheklovni halol yozib, keyingi ish sifatida rejalashtiring.`,
  `Yangiliklar va ishtirokchilik moduli bo‘lsa, kontent moderatsiyasi va foydalanuvchi ishtiroki (masalan, ro‘yxatdan o‘tish) bo‘yicha qisqa tavsif. Bu bo‘lim I bobdagi «ommaviy axborot» nazariyasi bilan bog‘lanishi mumkin — lekin takroriy iqtibos o‘rniga o‘z so‘zingiz bilan bog‘lang.`,
  `Socket.io qayerda ishlatilishini aniq sanab o‘ting: bildirishnoma, chat, monitoring — loyiha kodidagi haqiqiy hodisalar nomlari bilan. WebSocket va HTTP long-polling farqini bir abzasta, keyin o‘z tanlovingiz sababini yozing.`,
  `JWT va autentifikatsiya: token qayerda saqlanadi (localStorage/sessionStorage — xavfsizlik nuqtai nazaridan qisqa baho), qaysi marshrutlar himoyalangan, middleware qanday ishlaydi — sxema bilan. Parol xeshlash algoritmi nomini keltirish mumkin (masalan, bcrypt), lekin maxfiy kalitlarni matnga yozmang.`,
  `Fayl yuklash (multer): ruxsat etilgan formatlar, hajm cheklovi, fayl nomini unikallashtirish — amaliy qoidalar ro‘yxati. Xavfsizlik: fayl turi tekshiruvi haqida alohida gap.`,
  `Ota-ona kabineti: bola bilan bog‘lanish (ParentChild) modeli va ota-onaga ko‘rinadigan ma’lumotlar doirasi. Maxfiylik: qaysi ma’lumotlar yashirilishi kerakligi institut axloqi va qonunchilikka bog‘langan holda qisqa yoziladi.`,
  `Kassa va qabul rollari uchun vazifalar matritsasi (kim nima qila oladi) jadval ko‘rinishida berilsa, takrorlanmasdan aniq bo‘ladi. Bu jadval keyingi paragraflarda qayta takrorlanmasin.`,
  `Arxitektura bo‘yicha umumiy qoida: har bir yangi paragraf yangi «burchak» ochsin — masalan, ketma-ketlik diagrammasidan keyin joylashuv diagrammasi (deployment), so‘ng xatoliklarni qayd etish (logging) bo‘yicha qisqa band.`,
  `Ma’lumotlar migratsiyasi (Prisma migrate): rivojlanish muhitida qanday boshqariladi, ishlab chiqarishda nima rejalashtirilgan — halol yozing. Migratsiya fayllarining nomlanishi va tarixchini himoya materiallariga kiritish mumkin.`,
  `Frontend marshrutlari: asosiy sahifalar ro‘yxati (masalan, kurslar, o‘qituvchilar, admin) va foydalanuvchi roliga qarab cheklanish. Bu ro‘yxatni mundarija bilan bir xil qilib qayta yozmaslik uchun faqat texnik nomlar va URL path bilan cheklaning.`,
  `Xatoliklar va HTTP statuslar: API javoblarining qisqa tasnifi (400/401/403/404/500) va foydalanuvchiga chiqadigan xabarlar — sinov jadvalida «kutilgan xato» ustuni bilan bog‘lang.`,
  `Integratsiyalar (masalan, Telegram-bot): nima uchun kerak, qanday ma’lumot almashinuvi, maxfiy tokenlarni qayerda saqlash — xavfsizlik ro‘yxati. Agar integratsiya bo‘lmasa, bo‘limni olib tashlash o‘rniga «kelajakda» deb yozish yoki butunlay chetlab o‘tish institutga bog‘liq.`,
  `Loyiha tuzilmasi (papka tuzilishi) va asosiy paketlar (Express, Prisma, React) versiyalari jadvalda bir marta keltiriladi; keyingi paragraflarda shu jadvalni takrorlamang, balki bitta modulni chuqurlashtiring.`,
  `Sinovlar: smoke, regressiya, asosiy foydalanuvchi ssenariylari — har biri uchun alohida mini-jadval (4–6 qator yetarli). Bir xil «muvaffaqiyatli» so‘zi o‘rniga har safar boshqa formulirovka ishlating.`,
  `Xulosa qismi uchun: I bobda qaysi nazariy xulosalar, II bobda qaysi amaliy natijalar — ikkita ro‘yxat, bir-birini takrorlamasdan.`,
];

export function buildVolumeGuidanceParagraphs() {
  return UNIQUE_GUIDANCE_PARAGRAPHS;
}

const INTRO_BLOCKS = [
  `Ushbu bo‘lim diplom ishi hajmini institut talabiga (I bob taxminan 35–40 sahifa, II bob 35–40 sahifa, jami 70–80 sahifa atrofida) yaqinlashtirish uchun metodik qo‘llanma hisoblanadi. U asosiy diplom matnining o‘rnini bosmaydi; jadvallar, raqamlar va skrinshotlarni o‘z loyihangizdagi haqiqiy materiallar bilan almashtirishingiz kerak.`,
  `Hajmni mazmun bilan to‘ldirish: taqqoslash jadvallari, ER-diagramma, ketma-ketlik sxemasi, sinov natijalari, xulosalar. Shrift yoki intervalni «cho‘zish» orqali hajmni oshirish qabul qilinmaydi.`,
  `Har bir bobning ichki tuzilmasi uchun tavsiya: terminlar va qisqacha sharh; adabiyot bo‘yicha umumiy yo‘nalish; o‘z obyektingizga tatbiq; jadval yoki rasm; muhokama va xulosa. Elementlar soni va tartibi institut namunasiga moslashishi mumkin.`,
  `I bobda nazariyani kengaytirish: xalqaro tashkilot hisobotlari, analog platformalar matritsasi, raqamli ta’lim modellari, xavfsizlik va maxfiylik umumiy talablari — har biri alohida kichik bo‘lim sifatida, bir xil jumlani takrorlamasdan.`,
  `II bobda amaliyotni kengaytirish: arxitektura (komponent va ketma-ketlik), ma’lumotlar bazasi, API, frontend navigatsiya, sinovlar. Har bir rasm matnda izohlangan bo‘lishi kerak.`,
  `Rasm va jadval sarlavhalari: «Rasm 2.1 – …», «Jadval 1.3 – …» va matnda aniq murojaat. Ilovalarda katta kodlar bo‘lsa, asosiy qismga qisqa parcha, to‘liqi ilovaga.`,
  `Plagiatdan qochish: statistikani manba bilan ko‘rsatish; boshqa ishlardan ko‘chirmaslik; o‘z kodingiz uchun mualliflik qoidalariga rioya qilish.`,
];

const QA_BLOCKS = [
  `1) Savol: Platforma qaysi arxitekturada? Javab: brauzerdagi SPA (React) va serverdagi REST API (Express) ajralishi, ma’lumotlar PostgreSQL da — sxema bilan tushuntiring.`,
  `2) Savol: Rollar qanday farqlanadi? Javab: har bir rolda «nima ko‘radi / nima o‘zgartiradi» juftliklari bilan 4–6 qator yetarli; bitta umumiy gap yetarli emas.`,
  `3) Savol: Asosiy MB ob’ektlari qaysilar? Javab: User, Course, Enrollment kabi yadrolar va ulararo bog‘lanish — diagrammada chizilgan holda.`,
  `4) Savol: Autentifikatsiya qanday? Javab: parol xeshlash, JWT, himoyalangan marshrutlar — ketma-ketlik diagrammasi bilan.`,
  `5) Savol: Real vaqt qayerda ishlatiladi? Javab: aniq hodisalar (bildirishnoma, chat va hokazo) va HTTP dan farqi.`,
  `6) Savol: Sinovlar qanday tuzilgan? Javab: kirish sharti, qadamlar, kutilgan natija ustunli jadval; muvaffaqiyatsiz holatlar bo‘lsa, sababini yozing.`,
  `7) Savol: Analoglardan farqi? Javab: o‘quv markazi ssenariylari, modullar to‘plami, integratsiyalar — aniq 3 ta nuqta.`,
  `8) Savol: Xavfsizlik bo‘yicha nima qilingan? Javab: OWASP bo‘yicha 2–3 bandni loyiha bilan bog‘lab, qisqa tahlil.`,
  `9) Savol: Prisma nima beradi? Javab: sxema, migratsiya, tip bilan ishlash — bir misol bilan.`,
  `10) Savol: Frontend texnologiyalari? Javab: React, TypeScript, Vite, Tailwind — har biri uchun bitta qisqa vazifa.`,
  `11) Savol: To‘lov moduli? Javab: qaysi maydonlar, qaysi rollar kiritadi, qanday holatlar.`,
  `12) Savol: Davomat? Javab: kim belgilaydi, qanday yozuv yaratiladi, qanday hisobot.`,
  `13) Savol: Test/quiz farqi loyihada? Javab: foydalanuvchi oqimi va MB jihatdan ajratish.`,
  `14) Savol: Admin monitoring? Javab: qaysi ko‘rsatkichlar va ularning ma’nosi.`,
  `15) Savol: Yuk sinovi bo‘ldimi? Javab: halol — bo‘lsa vosita va natija, bo‘lmasa cheklov.`,
  `16) Savol: Tashqi xizmat (Telegram va hokazo)? Javab: maqsad, xavf, tokenlarni qanday himoya qilish.`,
  `17) Savol: Keyingi ishlar? Javab: 3–5 bandli qisqa roadmap, har biri bitta gap.`,
  `18) Savol: Ilmiy yangilik yoki amaliy ahamiyat? Javab: o‘zingizning loyiha chegarangizda aniqlang, boshqa ishdan gapirmang.`,
];

export function buildIntroParagraphs() {
  return INTRO_BLOCKS;
}

export function buildQAParagraphs() {
  return QA_BLOCKS;
}

export function buildFormattingParagraphs() {
  return [
    `Sahifa raqamlari va mundarija: institut shablonidagi maydon va raqamlash qoidalariga qat’iy rioya qiling; Wordda sarlavha uslublaridan foydalanganda mundarijani yangilash unutmang.`,
    `Jadval: keng ustunlar, sarlavha qatorini takrorlash, matnni vertikal markazlash — o‘qilish uchun; juda uzun jadvallarni ilovaga bo‘lish mumkin.`,
    `Rasm: pikselsizlik uchun yetarli aniqlik; sxemalar uchun vektor (Wordga EMF/WMF) qulayroq.`,
    `Kod: asosiy matnda qisqa fragment; uzun listinglar ilovada; har bir fragment oldidan va keyin izoh.`,
    `Atamalar: bir xil terminni butun ish davomida bir xil yozish (transkripsiya va imlo).`,
  ];
}

export function buildGostFieldParagraphs() {
  return [
    `Kitob: muallif(lar); sarlavha; nashr turi; joy; nashriyot; yil; betlar soni.`,
    `Jurnal maqolasi: mualliflar; maqola nomi; jurnal; yil; tom; son; betlar.`,
    `Elektron resurs: muallif yoki tashkilot; sarlavha; [Elektron resurs]; URL; kirish sanasi.`,
    `Dissertatsiya: muallif; mavzu; daraja; maxsuslik; joy, yil; betlar.`,
    `Matndagi [n] va ro‘yxatdagi n-o‘rin mos kelishi; avtomatik raqamlashni yakunda qo‘lda tekshirish.`,
    `Bir xil manba takrorlanmasligi: nusxa adabiyotlar himoyada savol tug‘diradi.`,
  ];
}
