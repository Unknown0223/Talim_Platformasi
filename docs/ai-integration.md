# AI integratsiya va video segmentlar

## Bosqich 9 – Qo'shimcha AI

### AI Chatbot (Tidio / Landbot)

Saytga embed qilish: Tidio yoki Landbot dan olingan script ni `frontend/index.html` ning `</body>` oldiga qo'shing. O'quvchi savollari va kurs tavsiyalari uchun bot sozlanadi.

### Smart Study Plan

Kelajakda backend da endpoint qo'shish mumkin: foydalanuvchi fanlari va test darajasi (TestResults) asosida haftalik reja generatsiya qilish (masalan OpenAI API). Frontend da "Haftalik reja" sahifasi.

### Quiz Battle

O'quvchilar o'rtasida real-time test poygasi: Socket.io yoki shunga o'xshash. Yangi endpoint va frontend sahifa – "Quiz Battle" tugmasi orqali bir vaqtda 2+ o'quvchi bir xil testni yechadi.

## Bosqich 10 – AI yordamli videolar

Video darslarni tahrirlash (Descript / Pomeroy va boshqalar) – tashqi vosita. Platforma tomondan:

- **Lesson** modelida `subtitleUrl` va `segments` (start, end, title) mavjud.
- Tashqi vosita bilan 10 daqiqalik segmentlar va subtitr yaratib, natijani platformaga yuklash: lesson yangilashda `subtitleUrl` va `segments` ni to'ldirish.
