# 🎓 Edu Test — Backend

Test yechish platformasining backend qismi. NestJS, PostgreSQL va Prisma ORM asosida qurilgan RESTful API.

---

## 🛠 Texnologiyalar

| Texnologiya | Versiya | Maqsad |
|---|---|---|
| **NestJS** | v10+ | Backend framework |
| **PostgreSQL** | v15+ | Ma'lumotlar bazasi |
| **Prisma** | v6 | ORM |
| **JWT** | — | Autentifikatsiya (Cookie based) |
| **bcrypt** | — | Parol shifrlash |
| **Nodemailer** | — | Email yuborish |
| **Swagger** | — | API dokumentatsiya |
| **Helmet** | — | HTTP header himoyasi |
| **Throttler** | — | Rate limiting |
| **pdf-parse** | — | PDF dan matn + rasmlar |
| **mammoth** | — | DOCX dan matn + rasmlar |
| **adm-zip** | — | DOCX XML dan formulalar (LaTeX) |
| **Gemini / Groq / OpenRouter** | — | AI fallback zanjiri |
| **Supabase / ImageKit / Uploadcare** | — | Storage fallback zanjiri |

---

## 📁 Loyiha strukturasi

```
src/
├── auth/                   # Autentifikatsiya
│   ├── dto/                # Login, Register, ResetPassword DTOlar
│   ├── strategies/         # JWT Access + Refresh strategiyalari
│   └── auth.service.ts
├── users/                  # Admin va Teacher CRUD
│   ├── dto/
│   ├── entities/
│   └── users.service.ts
├── subjects/               # Fanlar / Kategoriyalar CRUD
├── questions/              # Savollar CRUD + fayl import + paginatsiya
│   └── prompts/            # AI promptlari
├── students/               # O'quvchilar
├── sessions/               # Test sessiyalari
├── ai/                     # AI fallback (Gemini → Groq → OpenRouter)
├── storage/                # Storage fallback (Supabase → ImageKit → Uploadcare)
├── file-parser/            # Fayl o'qish (PDF, DOCX, TXT) + OMML → LaTeX
├── mail/                   # Email yuborish servisi
├── prisma/                 # Prisma service + seed (super admin)
└── common/
    ├── decorators/         # @CurrentUser, @Roles
    ├── enums/              # UserRole
    └── guards/             # AccessToken, RefreshToken, Roles, ResetPassword, OptionalAuth
prisma/
└── schema.prisma           # DB sxemasi
```

---

## 👥 Rollar va huquqlar

| Amal | super_admin | admin | teacher | Ochiq |
|---|---|---|---|---|
| Admin yaratish | ✅ | ❌ | ❌ | ❌ |
| Teacher ro'yxatdan o'tish | — | — | O'zi | ✅ |
| Foydalanuvchilar ro'yxati | ✅ | ✅ | ❌ | ❌ |
| Fan yaratish | ✅ | ✅ | ✅ | ❌ |
| Fan yangilash | ✅ | ✅ | Faqat o'ziniki | ❌ |
| Fanni inactive qilish | ✅ | ✅ | Faqat o'ziniki | ❌ |
| Savol yaratish | ✅ | ✅ | ✅ | ❌ |
| Savollarni ko'rish | ✅ | ✅ | Faqat o'ziniki | ✅ (barchasi) |
| Savol yangilash | ✅ | ✅ | Faqat o'ziniki | ❌ |
| Fayldan import | ✅ | ✅ | ✅ | ❌ |
| Savolni inactive qilish | ✅ | ✅ | Faqat o'ziniki | ❌ |
| Savolni o'chirish | ✅ | ❌ | ❌ | ❌ |
| Studentlar ro'yxati | ✅ | ✅ | ❌ | ❌ |
| Studentni bloklash | ✅ | ✅ | ❌ | ❌ |
| Sessiyalar statistikasi | ✅ | ✅ | ❌ | ❌ |

---

## 🗄 Database sxemasi

```
users ──────────────────────────── subjects
  │                                    │
  └── questions ◄──────────────────────┘
          │
          └── answer_options

students
  └── test_sessions
          └── session_questions
                ├── question_id
                └── selected_option_id
```

**Jadvallar:**
- `users` — Super admin, Admin, Teacher
- `subjects` — Fanlar / Kategoriyalar
- `questions` — Savollar (LaTeX formulalar, rasm URL)
- `answer_options` — Javob variantlari (A, B, C, D)
- `students` — O'quvchilar (tizimga ro'yxatdan o'tmaydi)
- `test_sessions` — Test urinishlari
- `session_questions` — Sessiya savollari va javoblar

---

## 🚀 O'rnatish

### 1. Repozitoriyani clone qilish

```bash
git clone https://github.com/username/edu-test-backend.git
cd edu-test-backend
```

### 2. Paketlarni o'rnatish

```bash
npm install
```

### 3. `.env` fayl yaratish

```dotenv
PORT=3000
NODE_ENV=development

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=edu-test
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/edu-test?schema=public"

# JWT (Cookie based)
ACCESS_TOKEN_KEY=your_access_token_secret
ACCESS_TOKEN_TIME=1h
ACCESS_COOKIE_TIME=3600000

REFRESH_TOKEN_KEY=your_refresh_token_secret
REFRESH_TOKEN_TIME=1d
REFRESH_COOKIE_TIME=86400000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_smtp_app_password
DOMEN=http://localhost:3000

# Super Admin (avtomatik yaratiladi)
SUPER_ADMIN_FULL_NAME=Super Admin
SUPER_ADMIN_EMAIL=superadmin@gmail.com
SUPER_ADMIN_PASSWORD=your_strong_password

# Frontend URL (CORS uchun)
FRONTEND_URL=http://localhost:5173

# AI Providers (fallback zanjiri)
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# Storage Providers (fallback zanjiri)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_BUCKET=images

IMAGEKIT_PUBLIC_KEY=public_xxxx
IMAGEKIT_PRIVATE_KEY=private_xxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

UPLOADCARE_PUBLIC_KEY=your_public_key
UPLOADCARE_SECRET_KEY=your_secret_key
```

### 4. Migratsiya

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Dasturni ishga tushirish

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

> Dastur ishga tushganda `.env` dagi ma'lumotlar asosida **super admin avtomatik yaratiladi**.

---

## 📖 API Dokumentatsiya

Swagger UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### 🔐 Auth
| Method | URL | Himoya | Tavsif |
|---|---|---|---|
| POST | `/auth/register` | Ochiq | Teacher ro'yxatdan o'tish |
| POST | `/auth/login` | Ochiq | Tizimga kirish |
| GET | `/auth/refresh` | Cookie | Access tokenni yangilash |
| POST | `/auth/logout` | Cookie | Tizimdan chiqish |
| POST | `/auth/forgot-password` | Ochiq | Parolni tiklash (email) |
| POST | `/auth/reset-password/token` | Ochiq | Token orqali parol tiklash |
| POST | `/auth/reset-password` | Cookie | Parolni o'zgartirish |

### 👤 Users
| Method | URL | Himoya | Tavsif |
|---|---|---|---|
| POST | `/users` | super_admin | Yangi user yaratish |
| GET | `/users` | admin, super_admin | Barchasini olish |
| GET | `/users/:id` | admin, super_admin | Bittasini olish |
| PATCH | `/users/:id` | super_admin | Yangilash |
| DELETE | `/users/:id` | super_admin | O'chirish |

### 📚 Subjects
| Method | URL | Himoya | Tavsif |
|---|---|---|---|
| POST | `/subjects` | Barcha rollar | Fan yaratish |
| GET | `/subjects` | Ochiq | Barchasini olish |
| GET | `/subjects/:id` | Ochiq | Bittasini olish |
| PATCH | `/subjects/:id` | Barcha rollar | Yangilash (teacher — faqat o'ziniki) |
| DELETE | `/subjects/:id` | admin, super_admin, teacher | Inactive qilish (teacher — faqat o'ziniki) |

### ❓ Questions
| Method | URL | Himoya | Tavsif |
|---|---|---|---|
| POST | `/questions` | Barcha rollar | Savol yaratish |
| POST | `/questions/import` | Barcha rollar | Fayldan import (.pdf, .docx, .txt) |
| GET | `/questions` | Ochiq / Teacher | Savollar (teacher — faqat o'ziniki) |
| GET | `/questions/full` | admin, super_admin | Barcha savollar (inactive ham) |
| GET | `/questions/by-subject/:subjectId` | Ochiq | Fan bo'yicha savollar |
| GET | `/questions/:id` | Ochiq | Bittasini olish |
| PATCH | `/questions/:id` | Barcha rollar | Yangilash (teacher — faqat o'ziniki) |
| DELETE | `/questions/:id` | Barcha rollar | Inactive qilish (teacher — faqat o'ziniki) |
| DELETE | `/questions/:id/permanent` | super_admin | Butunlay o'chirish |

**Paginatsiya va filter:**
```
GET /questions?page=1&limit=10
GET /questions?page=1&limit=10&subjectId=uuid
GET /questions?page=1&limit=10&search=algebra
GET /questions?page=2&limit=20&subjectId=uuid&search=kasr
```

**Response:**
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 🎓 Students
| Method | URL | Himoya | Tavsif |
|---|---|---|---|
| POST | `/students/check-phone` | Ochiq | Telefon tekshirish |
| POST | `/students` | Ochiq | Student yaratish |
| POST | `/students/my-results` | Ochiq | O'z natijalarini ko'rish |
| GET | `/students` | admin, super_admin | Barchasini olish |
| GET | `/students/:id` | admin, super_admin | Bittasini olish |
| DELETE | `/students/:id` | admin, super_admin | Bloklash |

### 📝 Sessions
| Method | URL | Himoya | Tavsif |
|---|---|---|---|
| POST | `/sessions/start` | Ochiq | Testni boshlash |
| POST | `/sessions/:id/submit` | Ochiq | Javoblarni yuborish |
| GET | `/sessions` | admin, super_admin | Barcha sessiyalar |
| GET | `/sessions/:id` | admin, super_admin | Bitta sessiya |

---

## 🔐 Autentifikatsiya

Cookie based JWT ishlatiladi — frontend token bilan ishlamaydi.

```
Login/Register
      ↓
access_token (httpOnly cookie, 1 soat)
refresh_token (httpOnly cookie, 1 kun)
      ↓
401 kelsa → GET /auth/refresh → yangi access_token
      ↓
Logout → cookie tozalanadi + DB dan refreshToken o'chiriladi
```

---

## 📂 Fayl import jarayoni

```
Fayl yuklandi (.pdf / .docx / .txt)
        ↓
DOCX → mammoth (matn + rasmlar) + AdmZip XML (OMML → LaTeX)
PDF  → pdf-parse (matn + rasmlar)
TXT  → oddiy matn
        ↓
Rasmlar → Storage fallback zanjiri
  Supabase → ImageKit → Uploadcare
        ↓
Matn + LaTeX formulalar + Rasm URLlar → AI fallback zanjiri
  Gemini → Groq → OpenRouter (har biri 3x retry)
        ↓
AI → JSON (savollar, variantlar, to'g'ri javoblar)
        ↓
Duplicate tekshiruv (normalize qilib taqqoslash)
        ↓
Batch transaction (100 talik) → DB ga saqlash
```

---

## ➕ Matematik formulalar

Word va PDF fayllaridan formulalar **LaTeX** formatiga o'giriladi:

| Formula turi | LaTeX |
|---|---|
| Kasr | `$\frac{3}{4}$` |
| Daraja | `$x^{2}$` |
| Pastki indeks | `$x_{1}$` |
| Ildiz | `$\sqrt{x}$`, `$\sqrt[3]{x}$` |
| Integral | `$\int_{a}^{b}{f(x)}$` |
| Yig'indi | `$\sum_{i=1}^{n}{x}$` |
| Ko'paytma | `$\prod_{i=1}^{n}{x}$` |
| Limit | `$\lim_{x \to 0}{f(x)}$` |
| Hosila | `$f'(x)$` |
| Mutlaq qiymat | `$\|x\|$` |
| Matritsa | `$\begin{pmatrix}...\end{pmatrix}$` |

Frontend da **KaTeX** bilan render qilinadi:

```bash
npm install react-katex katex
```

---

## 🔄 Test yechish jarayoni

```
1. POST /students/check-phone  →  telefon mavjudmi? (ism avtomatik keladi)
          ↓
2. POST /students              →  student yaratish yoki mavjudini qaytarish
          ↓
3. POST /sessions/start        →  sessiya ochish, random savollar (to'g'ri javovsiz)
          ↓
4. Student savollarni yechadi  (frontend)
          ↓
5. POST /sessions/:id/submit   →  javoblar yuboriladi, natija qaytariladi
          ↓
6. POST /students/my-results   →  barcha natijalar tarixi (ixtiyoriy)
```

---

## 🛡 Xavfsizlik

| Chora | Tavsif |
|---|---|
| **SQL Injection** | Prisma parametrlangan query — avtomatik himoya |
| **Rate Limiting** | Global: 10 req/sek, 100 req/min. Login: 5 req/min |
| **Helmet** | XSS, Clickjacking, MIME sniffing himoyasi |
| **CORS** | Faqat `.env` dagi `FRONTEND_URL` dan so'rovlar |
| **bcrypt** | Parollar hash qilingan (salt: 10) |
| **HttpOnly Cookie** | Token JS orqali o'qib bo'lmaydi |
| **Refresh Token** | DB da hash qilingan holda saqlanadi |
| **Reset Token** | UUID, 30 daqiqa amal qiladi, bir martalik |
| **isActive flag** | Bloklangan user tizimga kira olmaydi |
| **Role Guard** | Har bir endpoint rol tekshiruvi |
| **Owner Check** | Teacher faqat o'z resurslarini o'zgartira oladi |
| **Duplicate Check** | Normalize qilib taqqoslash |
| **Input Validation** | `class-validator` bilan DTO validation |
| **Env Validation** | Joi bilan `.env` tekshiruvi |

---

## 🤖 AI Fallback zanjiri

```
Gemini 2.5 Flash Lite (asosiy)
        ↓ limit/xato
Groq LLaMA 3.3 70B (zaxira 1)
        ↓ limit/xato
OpenRouter Free (zaxira 2)
        ↓ hammasi ishlamasa
503 Service Unavailable
```

Har bir provider **3 marta retry** qiladi (2s, 4s, 6s kutib).

---

## 💾 Storage Fallback zanjiri

```
Supabase Storage (asosiy, 1GB tekin)
        ↓ to'lib qolsa
ImageKit (zaxira 1, 20GB bandwidth)
        ↓ to'lib qolsa
Uploadcare (zaxira 2, 3GB tekin)
```

---

## 📝 Litsenziya

MIT