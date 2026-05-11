# User flow diagram

Foydalanuvchi oqimi – Mijoz (Student), O'qituvchi (Teacher) va Admin uchun.

## Mijoz (O'quvchi) oqimi

```mermaid
flowchart TD
  Start[Kirish] --> Login{Login?}
  Login -->|Yo'q| Register[Ro'yxatdan o'tish]
  Register --> Login
  Login -->|Ha| Home[Home]
  Home --> Subjects[Fan tanlash]
  Subjects --> Test[Test topshirish]
  Test --> Level[Daraja aniqlash]
  Level --> Courses[Kurslar ro'yxati]
  Courses --> Enroll[Kursga yozilish]
  Enroll --> Dashboard[Dashboard]
  Dashboard --> Progress[Progress ko'rish]
  Dashboard --> Online[Online darslar]
  Dashboard --> Offline[Offline darslar]
  Progress --> Cert[Sertifikat]
```

## O'qituvchi oqimi

```mermaid
flowchart TD
  TStart[Kirish] --> TLogin[Login]
  TLogin --> TDash[Teacher Dashboard]
  TDash --> TCreateCourse[Kurs yaratish]
  TDash --> TUploadVideo[Video dars yuklash]
  TDash --> TLive[Jonli darslar]
  TDash --> TOffline[Offline darslar boshqaruvi]
  TDash --> TTests[Test yaratish]
  TCreateCourse --> TDash
  TUploadVideo --> TDash
  TLive --> TDash
  TOffline --> TDash
  TTests --> TDash
```

## Admin oqimi

```mermaid
flowchart TD
  AStart[Kirish] --> ALogin[Login]
  ALogin --> AAdmin[Admin Panel]
  AAdmin --> AUsers[Foydalanuvchilar]
  AAdmin --> ACourses[Kurslar nazorati]
  AAdmin --> AStats[Statistika]
  AAdmin --> ANewCourse[Yangi kurslar qo'shish]
```

## Umumiy sahifa va route xulosasi

| Foydalanuvchi | Asosiy yo‘l |
|---------------|-------------|
| Student | Login → Fan tanlash → Test → Daraja → Kursga yozilish → Dashboard (progress, online/offline darslar) |
| Teacher | Login → Dashboard → Kurs yaratish / Video yuklash / Jonli darslar / Offline boshqarish / Test yaratish |
| Admin | Login → Admin Panel → Foydalanuvchilar / Kurslar / Statistika |
