# 🎓 Edu Test — Backend

Test yechish platformasining backend qismi. NestJS, PostgreSQL va Prisma ORM asosida qurilgan.

---

## 🛠 Texnologiyalar

| Texnologiya | Versiya | Maqsad             |
| ----------- | ------- | ------------------ |
| NestJS      | v10+    | Backend framework  |
| PostgreSQL  | v15+    | Ma'lumotlar bazasi |
| Prisma      | v6      | ORM                |
| JWT         | —       | Autentifikatsiya   |
| Nodemailer  | —       | Email yuborish     |
| Swagger     | —       | API dokumentatsiya |
| bcrypt      | —       | Parol shifrlash    |

---

## 📁 Loyiha strukturasi

```
src/
├── auth/                  # Autentifikatsiya (login, register, token)
│   ├── dto/
│   ├── strategies/        # JWT strategiyalari
│   └── auth.service.ts
├── users/                 # Admin va Teacher CRUD
│   ├── dto/
│   ├── entities/
│   └── users.service.ts
├── subjects/              # Fanlar / Kategoriyalar CRUD
├── questions/             # Savollar va javob variantlari CRUD
├── students/              # O'quvchilar
├── sessions/              # Test sessiyalari
├── mail/                  # Email yuborish servisi
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

| Amal                        | super_admin | admin | teacher |
| --------------------------- | ----------- | ----- | ------- |
| Admin yaratish              | ✅          | ❌    | ❌      |
| Teacher yaratish (register) | —           | —     | O'zi    |
| Foydalanuvchilar ro'yxati   | ✅          | ✅    | ❌      |
| Fan yaratish / yangilash    | ✅          | ✅    | ✅      |
| Fanni inactive qilish       | ✅          | ✅    | ❌      |
| Savol yaratish / yangilash  | ✅          | ✅    | ✅      |
| Savolni inactive qilish     | ✅          | ✅    | ✅      |
| Studentlar ro'yxati         | ✅          | ✅    | ❌      |
| Studentni bloklash          | ✅          | ✅    | ❌      |
| Sessiyalar statistikasi     | ✅          | ✅    | ❌      |

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

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=edu-test

DATABASE_URL="postgresql://postgres:your_password@localhost:5432/edu-test?schema=public"

ACCESS_TOKEN_KEY=your_access_token_secret
ACCESS_TOKEN_TIME=1h

REFRESH_TOKEN_KEY=your_refresh_token_secret
REFRESH_TOKEN_TIME=1d
REFRESH_COOKIE_TIME=86400000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_smtp_password

DOMEN=http://localhost:3000
```

### 4. Migratsiya

```bash
npx prisma migrate dev --name init
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

| Method | URL                         | Himoya        | Tavsif              |
| ------ | --------------------------- | ------------- | ------------------- |
| POST   | `/questions`                | Barcha rollar | Savol yaratish      |
| GET    | `/questions`                | Ochiq         | Barchasini olish    |
| GET    | `/questions?subjectId=uuid` | Ochiq         | Fan bo'yicha filter |
| GET    | `/questions/:id`            | Ochiq         | Bittasini olish     |
| PATCH  | `/questions/:id`            | Barcha rollar | Yangilash           |
| DELETE | `/questions/:id`            | Barcha rollar | Inactive qilish     |

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

## 🔄 Test yechish jarayoni

```
1. POST /students/check-phone  →  telefon mavjudmi?
          ↓
2. POST /students              →  student yaratish (yoki mavjudini qaytarish)
          ↓
3. POST /sessions/start        →  sessiya ochish, random savollar olish
          ↓
4. Student savollarni yechadi  (frontend tomonida)
          ↓
5. POST /sessions/:id/submit   →  javoblarni yuborish, natija olish
          ↓
6. POST /students/my-results   →  barcha natijalarni ko'rish (ixtiyoriy)
```

---

## 🔒 Xavfsizlik

- Parollar **bcrypt** bilan shifrlangan
- **Access token** — 1 soat, Authorization headerda
- **Refresh token** — 1 kun, HttpOnly cookie da
- Parolni tiklash tokeni **30 daqiqa** amal qiladi
- Test savollari **to'g'ri javobsiz** yuboriladi
- Bloklangan studentlar tizimdan foydalana olmaydi

---

## 📝 Litsenziya

MIT
