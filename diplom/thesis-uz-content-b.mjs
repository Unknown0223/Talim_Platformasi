/**
 * Diplom matni — qism B: II bob va xulosa.
 * 2.1 → [16][17][18], 2.2 → [19][20][21], 2.3 → [22][23][24], 2.4 → [25][26][27].
 */
export const thesisBlocksB = [
  { t: "h1", x: "II BOB. O‘QUV MARKAZLARI UCHUN RAQAMLI TA’LIM PLATFORMASINI ISHLAB CHIQISH" },

  {
    t: "h2",
    x: "2.1. O‘quv markazlari uchun raqamli ta’lim platformasining umumiy arxitekturasi (klient–server, API, xavfsizlik va rollar tuzilmasi)",
  },
  {
    t: "p",
    x: "«Talim platformasi» klient–server arxitekturasida qurilgan. Klient qismi brauzerda ishlaydigan SPA bo‘lib, foydalanuvchi interfeysi React kutubxonasi yordamida komponentlashgan; marshrutlash React Router orqali amalga oshiriladi. Server qismi Node.js muhitida Express asosida REST API ni ta’minlaydi; ma’lumotlar PostgreSQL da saqlanadi; real vaqt hodisalari uchun Socket.io serveri ishga tushiriladi [18].",
  },
  {
    t: "p",
    x: "Mikroservislar yondashuvi katta tizimlarda modullarni mustaqil joylashtirish imkonini beradi, biroq kichik jamoa uchun monolit server va aniq chegaralangan modullar (controller/route bo‘linmalari) boshqaruvni soddalashtiradi [16]. Loyihada asosiy modullar mavzuga oid controller va route fayllariga bo‘lingan.",
  },
  {
    t: "p",
    x: "Autentifikatsiya JWT asosida: foydalanuvchi login qilgach server JWT beradi, keyingi so‘rovlarda token tekshiriladi. Parollar xeshlangan holda saqlanadi. Qisman maxsus ruxsatlar massivi (permissions) va override bayrog‘i foydalanuvchi darajasida admin boshqaruvini chuqurlashtirish imkonini beradi [17].",
  },
  {
    t: "p",
    x: "Rollar enumi sifatida belgilangan: student, teacher, admin, cashier, receptionist, parent. Har bir rol uchun UI va API cheklovlari boshqacha: masalan, davomatni odatda o‘qituvchi yuritadi, to‘lovni kassa, monitoringni admin. Bu yondashuv tizimning xavfsizlik perimetrini soddalashtiradi [16][17][18].",
  },
  {
    t: "p",
    x: "Tashqi integratsiya sifatida Telegram-bot va fayl yuklash (multer) kabi komponentlar mavjud bo‘lishi mumkin; ularning xavfsizligi tokenlarni muhit o‘zgaruvchilarda saqlash va tarmoq cheklovlarini qo‘llash bilan bog‘liq.",
  },

  {
    t: "h2",
    x: "2.2. O‘quv markazlari uchun raqamli ta’lim platformasining ma’lumotlar bazasini loyihalash",
  },
  {
    t: "p",
    x: "Ma’lumotlar bazasi relatsion model asosida loyihalangan. User jadvali foydalanuvchi shaxsini, rolini, profil maydonlarini, o‘yinlashtirish (xp, coins, badges) va tavsiya kodlarini saqlaydi. TeacherDetails alohida jadvalda o‘qituvchining mutaxassisligi va tajribasi kabi maydonlarni User bilan 1:1 bog‘laydi.",
  },
  {
    t: "p",
    x: "Subject va Course obyektlari fan va kurs tuzilmasini ifodalaydi: Course maydonlarida daraja (Beginner/Intermediate/Advanced), turi (online/offline), narx va o‘qituvchi bog‘lanishi mavjud. Enrollment yozilishni userId va courseId bo‘yicha noyob qilib, status (active/completed/cancelled) bilan kuzatadi [19].",
  },
  {
    t: "p",
    x: "To‘lovlar Payment orqali, xabarlar Message va suhbat obyektlari orqali, davomat Attendance yozuvlari orqali ifodalanadi. Location, Room va Schedule oflayn darslar uchun joy va vaqt resurslarini bog‘lash imkonini beradi. SQL va relatsion nazariyasiga asoslangan holda, butunlik cheklovlari va indekslar orqali so‘rovlar samaradorligi ta’minlanadi [20].",
  },
  {
    t: "p",
    x: "Prisma sxemasi migratsiyalar orqali versiyalanadi; bu esa ishlab chiqish jamoasi uchun sxema o‘zgarishlarini nazorat qilish imkonini beradi [17]. Ma’lumotlar bazasi loyihalashining amaliy tomoni — ER-diagramma va har bir jadval uchun qisqa izoh diplom ilovasida skrinshot va jadval ko‘rinishida kengaytirilishi mumkin [19][20][21].",
  },
  {
    t: "p",
    x: "Lesson modeli har bir kurs bo‘yicha darslar ro‘yxatini saqlaydi: sarlavha, video havolasi yoki jonli dars havolasi, «video» yoki «live» turi. Schedule jadvali o‘qituvchi, kurs, xona va vaqt oralig‘ini bog‘laydi; Location va Room obyektlari oflayn o‘qitish infratuzilmasini ifodalaydi.",
  },
  {
    t: "p",
    x: "Test, TestResult, QuizAttempt va Battle kabi obyektlar baholash va o‘yinlashtirishni qo‘llab-quvvatlaydi: testlar fan yoki kurs bilan bog‘lanishi, urinishlar tarixini saqlash imkoniyati pedagogik hisobot uchun muhim. Certificate yozuvlari kursni tugatganlikni rasmiylashtirish uchun ishlatiladi.",
  },
  {
    t: "p",
    x: "Moliya va marketing jihatidan DiscountCampaign va DiscountAward yozuvlari aksiya shartlari va foydalanuvchiga tegishli mukofotlarni saqlash imkonini beradi. News va NewsParticipant yangiliklar oqimi va ishtirokchilarni kuzatish uchun mo‘ljallangan.",
  },
  {
    t: "p",
    x: "Feedback moduli fikr-mulohaza va javob zanjirini saqlashi mumkin; Message, Conversation va ConversationMember suhbat tuzilmasini ifodalaydi. Notification yozuvlari foydalanuvchiga yo‘naltirilgan bildirishnomalar tarixini saqlash uchun ishlatiladi. Barcha bu bog‘lanishlar relatsion butunlik va indekslar bilan qo‘llab-quvvatlanishi kerak [19][20][21].",
  },

  {
    t: "h2",
    x: "2.3. O‘quv markazlari uchun raqamli ta’lim platformasini ishlab chiqish (frontend va backend dasturiy modullari)",
  },
  {
    t: "p",
    x: "Backend modullari REST marshrutlari orqali ifodalanadi: autentifikatsiya, kurslar, yozilish, to‘lovlar, xabarlar, davomat, testlar, reyting, admin va boshqa kontrollerlar. Har bir modul o‘z validation va xato javoblariga ega bo‘lishi lozim. Dasturiy dizayn tamoyillari (ajratish, qayta ishlatish) kodi o‘qilishini yaxshilaydi [22].",
  },
  {
    t: "p",
    x: "Frontend TypeScript bilan yozilgani statik tekshruv orqali xatolarni erta bosqichda aniqlash imkonini beradi [23]. Vite yig‘ish tezligi va zamonaviy ESM muhitini ta’minlaydi [24]. Foydalanuvchi uchun sahifalar: autentifikatsiya, bosh sahifa, kurslar, o‘qituvchilar, kutubxona, xabarlar, admin va boshqa rollarga xos panellar.",
  },
  {
    t: "p",
    x: "UI komponentlari qayta ishlatiladigan tugmalar, kartalar va shakllar bilan birlashtirilgan; bu esa interfeysning vizual uyg‘unligini saqlashga yordam beradi. Real vaqt hodisalari uchun klient tomonda socket.io-client kutubxonasidan foydalaniladi.",
  },
  {
    t: "p",
    x: "Dasturiy modullarning integratsiyasi: frontend API bazaviy URL orqali serverga murojaat qiladi; fayl yuklash multipart/form-data formatida qayta ishlanadi. Xatoliklar foydalanuvchiga tushunarli xabar bilan qaytarilishi tavsiya etiladi [22][23][24].",
  },
  {
    t: "p",
    x: "Real vaqt xizmati (Socket.io) hodisalarni serverdan klientlarga uzatishda ishlatiladi: masalan, yangi xabar, yangilanish yoki monitoring ko‘rsatkichlari. Bu HTTP ning so‘rov-javob sikliga qaraganda kechikishni kamaytirishga yordam beradi, biroq autentifikatsiya va xona (room) bo‘yicha cheklovlar qo‘yilishi shart.",
  },
  {
    t: "p",
    x: "Telegram-bot integratsiyasi (agar loyihada mavjud bo‘lsa) xabarnomalarni tashqi kanal orqali yetkazish imkonini beradi; bunda bot tokenlari muhit o‘zgaruvchilarida saqlanishi va loglarda ochiq chiqarilmasligi talab etiladi.",
  },

  {
    t: "h2",
    x: "2.4. Tizimni sinovdan o‘tkazish va olingan natijalarni tahlil qilish",
  },
  {
    t: "p",
    x: "Sinov strategiyasi funksional sinovlardan iborat: autentifikatsiya, kursga yozilish, to‘lov yaratish, xabar yuborish, davomat belgilash kabi asosiy ssenariylar ketma-ket bajarilib, kutilgan holatlar bilan solishtiriladi. Sinov sanalari va muhit (development/production) hujjatlashtirilishi kerak [25].",
  },
  {
    t: "p",
    x: "ISO/IEC/IEEE 29119 standarti sinov jarayonining umumiy tushunchalarini belgilaydi; diplom ishi doirasida sinov hujjatlari (test-kese, kutilgan natija) shu tamoyillarga yaqin tartibda tuzilishi mumkin [26]. ISTQB Foundation darajasidagi tasniflar sinov turini tanlashda (smoke, regressiya) yo‘riqchi bo‘lib xizmat qiladi [27].",
  },
  {
    t: "p",
    x: "Yuk sinovi (stress) ixtiyoriy bo‘lib, server resurslari va asosiy API lar uchun so‘rov intensivligini o‘lchaydi. Agar amalga oshirilmagan bo‘lsa, cheklov sifatida halol ko‘rsatiladi va keyingi ish sifatida rejalashtiriladi.",
  },
  {
    t: "p",
    x: "Sinov natijalari jadval ko‘rinishida: ssenariy, muvaffaqiyat/yo‘q, izoh — shaklda berilishi tavsiya etiladi. Muvaffaqiyatsiz holatlar sababi (masalan, validatsiya, ruxsat) tahlil qilinadi va tuzatish choralari ko‘rsatiladi [25][26][27].",
  },
  {
    t: "h2",
    x: "2.4.1. Ishlab chiqish muhiti va boshqaruv",
  },
  {
    t: "p",
    x: "Ishlab chiqish muhiti sifatida zamonaviy brauzerlar, Node.js va mahalliy yoki konteynerdagi PostgreSQL ishlatiladi. Muhit o‘zgaruvchilari (.env) orqali ma’lumotlar bazasi ulanishi, JWT maxfiy kaliti va tashqi xizmat tokenlari saqlanadi; maxfiy qiymatlarni repozitoriyga commit qilmaslik talab etiladi.",
  },
  {
    t: "p",
    x: "Git orqali o‘zgarishlar tarixini yuritish va kod ko‘rish jarayoni sifatni oshiradi. Docker Compose muhitini bir xillashtirish uchun qo‘llanilishi mumkin — diplomda aniq xizmat nomlari va portlar keltirilishi tavsiya etiladi.",
  },
  {
    t: "p",
    x: "Marshrutlar va kontrollerlarning mantiqiy tuzilishi keyingi kengaytirish uchun muhim. API ni hujjatlashtirish (oddiy jadval yoki OpenAPI) frontend bilan integratsiyani tezlashtiradi.",
  },
  {
    t: "h2",
    x: "2.4.2. Loyihaning cheklovlari",
  },
  {
    t: "p",
    x: "To‘liq bank integratsiyasi, mobil ilova yoki yuqori yuk sinovi hozircha cheklangan bo‘lishi mumkin; bunday holatlar halol yoziladi va keyingi rivojlanish sifatida rejalashtiriladi.",
  },

  { t: "h1", x: "XULOSA" },
  {
    t: "p",
    x: "Ilmiy ishda raqamli ta’lim platformalarining nazariy asoslari, ularning o‘quv markazi faoliyatidagi o‘rni, zamonaviy veb va ma’lumotlar bazasi texnologiyalari, xavfsizlik va talablar tahlil qilindi. Analog yechimlar bilan taqqoslash maxsus platforma ishlab chiqish zaruratini asosladi.",
  },
  {
    t: "p",
    x: "Amaliy qismda «Talim platformasi» arxitekturasi, PostgreSQL va Prisma yordamidagi ma’lumotlar modeli, Express REST API va React SPA ning birgalikdagi ishlashi, rollar va ruxsatlar mexanizmi, real vaqt funksiyalari hamda sinov yondashuvi yoritildi.",
  },
  {
    t: "p",
    x: "Kelajakda mobil ilova, chuqur analitika, hisobotlar eksporti va yuk sinovlarini kengaytirish orqali tizim salohiyatini oshirish mumkin. Loyihaning barqarorligi va xavfsizligi doimiy kuzatuv va yangilanishlarni talab qiladi.",
  },
];
