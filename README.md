# 🎓 Edu Test — Backend

Test yechish platformasining backend qismi. NestJS, PostgreSQL va Prisma ORM asosida qurilgan.

---

## 🛠 Texnologiyalar

| Texnologiya                      | Maqsad                          |
| -------------------------------- | ------------------------------- |
| NestJS                           | Backend framework               |
| PostgreSQL                       | Ma'lumotlar bazasi              |
| Prisma v6                        | ORM                             |
| JWT                              | Autentifikatsiya                |
| Nodemailer                       | Email yuborish                  |
| Swagger                          | API dokumentatsiya              |
| bcrypt                           | Parol shifrlash                 |
| pdf-parse                        | PDF dan matn + rasmlar ajratish |
| mammoth                          | DOCX dan matn + rasmlar         |
| adm-zip                          | DOCX XML dan formulalar (LaTeX) |
| Gemini / Groq / OpenRouter       | AI fallback zanjiri             |
| Supabase / ImageKit / Uploadcare | Storage fallback zanjiri        |

---

## 📁 Loyiha strukturasi

```
src/
├── auth/                  # Autentifikatsiya
│   ├── dto/
│   ├── strategies/        # JWT strategiyalari
│   └── auth.service.ts
├── users/                 # Admin va Teacher CRUD
├── subjects/              # Fanlar / Kategoriyalar
├── questions/             # Savollar CRUD + fayl import
│   └── prompts/           # AI promptlari
├── students/              # O'quvchilar
├── sessions/              # Test sessiyalari
├── ai/                    # AI fallback (Gemini → Groq → OpenRouter)
├── storage/               # Storage fallback (Supabase → ImageKit → Uploadcare)
├── file-parser/           # Fayl o'qish (PDF, DOCX, TXT)
├── mail/                  # Email yuborish
├── prisma/                # Prisma service va seed
└── common/
    ├── decorators/        # CurrentUser, Roles
    ├── enums/             # UserRole
    └── guards/            # AccessToken, RefreshToken, Roles, ResetPassword
prisma/
└── schema.prisma          # DB sxemasi
```

---

## 👥 Rollar va huquqlar

| Amal                       | super_admin | admin | teacher |
| -------------------------- | ----------- | ----- | ------- |
| Admin yaratish             | ✅          | ❌    | ❌      |
| Teacher ro'yxatdan o'tish  | —           | —     | O'zi    |
| Foydalanuvchilar ro'yxati  | ✅          | ✅    | ❌      |
| Fan yaratish / yangilash   | ✅          | ✅    | ✅      |
| Fanni inactive qilish      | ✅          | ✅    | ❌      |
| Savol yaratish / yangilash | ✅          | ✅    | ✅      |
| Fayldan savollar import    | ✅          | ✅    | ✅      |
| Savolni inactive qilish    | ✅          | ✅    | ✅      |
| Savolni butunlay o'chirish | ✅          | ❌    | ❌      |
| Studentlar ro'yxati        | ✅          | ✅    | ❌      |
| Studentni bloklash         | ✅          | ✅    | ❌      |
| Sessiyalar statistikasi    | ✅          | ✅    | ❌      |

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
- `questions` — Savollar
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

# PostgreSQL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/edu-test?schema=public"

# JWT
ACCESS_TOKEN_KEY=your_access_token_secret
REFRESH_TOKEN_KEY=your_refresh_token_secret
REFRESH_COOKIE_TIME=86400000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_smtp_password
DOMEN=http://localhost:5432

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

# Working environment
NODE_ENV='development'
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

Dastur ishga tushganda **super admin avtomatik yaratiladi** (agar mavjud bo'lmasa):

- Email: `superadmin@gmail.com`
- Parol: `superadmin123`

> ⚠️ Production da super admin parolini darhol o'zgartiring!

---

## 📖 API Dokumentatsiya

Swagger UI: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

### Asosiy endpointlar

#### 🔐 Auth

| Method | URL                          | Himoya | Tavsif                     |
| ------ | ---------------------------- | ------ | -------------------------- |
| POST   | `/auth/login`                | Ochiq  | Tizimga kirish             |
| POST   | `/auth/register`             | Ochiq  | Teacher ro'yxatdan o'tish  |
| GET    | `/auth/refresh`              | Cookie | Access tokenni yangilash   |
| POST   | `/auth/logout`               | Bearer | Tizimdan chiqish           |
| POST   | `/auth/forgot-password`      | Ochiq  | Parolni tiklash (email)    |
| POST   | `/auth/reset-password/token` | Ochiq  | Token orqali parol tiklash |
| POST   | `/auth/reset-password`       | Bearer | Parolni o'zgartirish       |

#### 👤 Users

| Method | URL          | Himoya             | Tavsif              |
| ------ | ------------ | ------------------ | ------------------- |
| POST   | `/users`     | super_admin        | Yangi user yaratish |
| GET    | `/users`     | admin, super_admin | Barchasini olish    |
| GET    | `/users/:id` | admin, super_admin | Bittasini olish     |
| PATCH  | `/users/:id` | super_admin        | Yangilash           |
| DELETE | `/users/:id` | super_admin        | O'chirish           |

#### 📚 Subjects

| Method | URL             | Himoya             | Tavsif           |
| ------ | --------------- | ------------------ | ---------------- |
| POST   | `/subjects`     | Barcha rollar      | Fan yaratish     |
| GET    | `/subjects`     | Ochiq              | Barchasini olish |
| GET    | `/subjects/:id` | Ochiq              | Bittasini olish  |
| PATCH  | `/subjects/:id` | Barcha rollar      | Yangilash        |
| DELETE | `/subjects/:id` | admin, super_admin | Inactive qilish  |

#### ❓ Questions

| Method | URL                                | Himoya        | Tavsif                             |
| ------ | ---------------------------------- | ------------- | ---------------------------------- |
| POST   | `/questions`                       | Barcha rollar | Savol yaratish                     |
| POST   | `/questions/import`                | Barcha rollar | Fayldan import (.pdf, .docx, .txt) |
| GET    | `/questions`                       | Ochiq         | Barchasini olish                   |
| GET    | `/questions?subjectId=uuid`        | Ochiq         | Fan bo'yicha filter                |
| GET    | `/questions/by-subject/:subjectId` | Ochiq         | Fan bo'yicha savollar              |
| GET    | `/questions/:id`                   | Ochiq         | Bittasini olish                    |
| PATCH  | `/questions/:id`                   | Barcha rollar | Yangilash                          |
| DELETE | `/questions/:id`                   | Barcha rollar | Inactive qilish                    |
| DELETE | `/questions/:id/permanent`         | super_admin   | Butunlay o'chirish                 |

#### 🎓 Students

| Method | URL                     | Himoya             | Tavsif                   |
| ------ | ----------------------- | ------------------ | ------------------------ |
| POST   | `/students/check-phone` | Ochiq              | Telefon tekshirish       |
| POST   | `/students`             | Ochiq              | Student yaratish         |
| POST   | `/students/my-results`  | Ochiq              | O'z natijalarini ko'rish |
| GET    | `/students`             | admin, super_admin | Barchasini olish         |
| GET    | `/students/:id`         | admin, super_admin | Bittasini olish          |
| DELETE | `/students/:id`         | admin, super_admin | Bloklash                 |

#### 📝 Sessions

| Method | URL                    | Himoya             | Tavsif              |
| ------ | ---------------------- | ------------------ | ------------------- |
| POST   | `/sessions/start`      | Ochiq              | Testni boshlash     |
| POST   | `/sessions/:id/submit` | Ochiq              | Javoblarni yuborish |
| GET    | `/sessions`            | admin, super_admin | Barcha sessiyalar   |
| GET    | `/sessions/:id`        | admin, super_admin | Bitta sessiya       |

---

## 📂 Fayl import jarayoni

```
Fayl yuklandi (.pdf / .docx / .txt)
        ↓
DOCX → mammoth (matn + rasmlar) + AdmZip XML (formulalar → LaTeX)
PDF  → pdf-parse (matn + rasmlar)
TXT  → oddiy matn
        ↓
Rasmlar → Storage fallback (Supabase → ImageKit → Uploadcare)
        ↓
Matn + Formulalar + Rasm URLlar → AI fallback
(Gemini → Groq → OpenRouter)
        ↓
AI → JSON (savollar, variantlar, to'g'ri javoblar)
        ↓
Duplicate tekshiruv (normalize qilib taqqoslash)
        ↓
Batch transaction → DB ga saqlash
```

---

## 🔄 Test yechish jarayoni

```
1. POST /students/check-phone  →  telefon mavjudmi?
          ↓
2. POST /students              →  student yaratish
          ↓
3. POST /sessions/start        →  sessiya ochish, random savollar
          ↓
4. Student savollarni yechadi  (frontend)
          ↓
5. POST /sessions/:id/submit   →  javoblar yuboriladi, natija qaytariladi
          ↓
6. POST /students/my-results   →  barcha natijalar (ixtiyoriy)
```

---

## ➕ Formulalar

Matematik formulalar **LaTeX** formatida saqlanadi (`$\frac{3}{4}$`).
Frontend da **KaTeX** kutibxonasi yordamida render qilinadi:

```bash
npm install react-katex katex
```

```tsx
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// $ ... $ formulalarni avtomatik render qiladi
<MathText text="$\frac{3}{4}$ kg un kerak" />;
```

---

## 🔒 Xavfsizlik

- Parollar **bcrypt** bilan shifrlangan
- **Access token** — 1 soat, Authorization headerda
- **Refresh token** — 1 kun, HttpOnly cookie da
- Parolni tiklash tokeni **30 daqiqa** amal qiladi
- Test savollari **to'g'ri javobsiz** yuboriladi
- Bloklangan studentlar tizimdan foydalana olmaydi
- Duplicate savollar normalize qilib aniqlanadi

---

## 📝 Litsenziya

MIT
