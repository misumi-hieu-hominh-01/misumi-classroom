# Xây dựng backend web học tiếng Nhật (MongoDB, daily/weekly assignments, exams)

> **Mục tiêu**: Xây dựng backend với nội dung học (vocab/kanji/grammar, đề test), dữ liệu người dùng (điểm danh, tiến trình, kết quả), cơ chế **unlock theo ngày** (quota), **bài tập tuần**, **ôn tập hôm qua**, **bài tập custom** có lời giải. Dùng **MongoDB Atlas**, NestJS/TypeScript.

---

## 0) Phạm vi & Nguyên tắc

- **1 database** duy nhất trên Atlas; tách bằng tiền tố collection: `content_*`, `user_*`, `admin_*`.
- Timezone chuẩn: **Asia/Tokyo**; mọi logic theo ngày/tuần dựa trên giờ server JST.
- Backend: NestJS + TypeScript
- Auth: JWT (access + refresh), role-based (user, admin).
- Triết lý dữ liệu:
  - Nội dung học ít thay đổi → version hoá (`version`), có thể embed các field tĩnh.
  - Dòng sự kiện người dùng (attempts/logs) tách riêng để không phình document.
  - Tiêu hao quota bằng thao tác **atomic** (`findOneAndUpdate` + `$expr` + `$inc`).

---

## 1) Danh sách collection (tối thiểu cần có)

### 1.1. Nội dung học — `content_*`

- `content_vocab_items` — từ vựng: `{ term, reading, meaningVi[], level, imageUrl, type, examples[], version, updatedAt }`
- `content_kanji_items` — kanji: `{ kanji, hanmean[], onyomi[], kunyomi[], meaningVi[], compDetail[], tips[], strokes, imageUrl, level, examples[], version, updatedAt }`
- `content_grammar_points` — ngữ pháp: `{ title, pattern, explainVi, level, examples[], version, updatedAt }`
- `content_vocab_tests` — đề test từ vựng (catalog): `{ title, level, version, mode, items[], published, updatedAt }`
- `content_kanji_tests` — đề test kanji (catalog)
- `content_grammar_tests` — đề test ngữ pháp (catalog)
- `achievements` — catalog thành tựu: `{ _id: code, title, desc, icon, rules? }`

### 1.2. Người dùng — `user_*`

- `users` — tài khoản: `{ email (unique), hash, displayName, createdAt, status }`
- `user_profiles` — hồ sơ/cài đặt (tùy): `{ userId, settings{ uiMode }, avatarUrl }`
- `user_progress` — tiến trình & SRS: `{ userId, moduleKey, xp, streakDays, totalScore, lastStudiedAt, srs{ ease, nextReviewAt } }`
- `user_attendance` — điểm danh: `{ userId, dateKey, checkedAt }`
- `user_daily_state` — trạng thái ngày & quota unlock: `{ userId, dateKey, checkedInAt, limits{vocab,kanji,grammar}, used{...}, assigned{vocabIds[],kanjiIds[],grammarIds[]}, updatedAt }`
- `user_attempts_vocab` — kết quả test vocab: `{ userId, testId, testVersion, score, total, answers[], startedAt, finishedAt }`
- `user_attempts_kanji` — kết quả test kanji
- `user_attempts_grammar` — kết quả test ngữ pháp
- `user_achievements` — thành tựu đã đạt: `{ userId, code, earnedAt }`
- `leaderboard_rollups` — bảng xếp hạng: `{ period (daily|weekly|monthly key), userId, score, rankedAt }`

### 1.3. Bài giao tuần/ôn tập — `user_assignments_*`

- `user_assignments_weekly` — gói bài tuần (đóng gói từ nội dung đã học tuần): `{ userId, period(YYYY-W##), generatedAt, pools{...}, limits{...}, used{...}, status }`
- `user_assignments_daily_review` — gói ôn hôm qua: `{ userId, dateKey(today), sourceDateKey(yesterday), generatedAt, pools{...}, limits{...}, used{...}, status }`
- `user_custom_tests` — gói ôn custom: `{ userId, title, sources[{type, assignmenId, module},{...}], settings{totalQuestions, perModule, createdAt, lastUsedAt}}`

### 1.4. Tính năng hỗ trợ Admin — `admin_*`

- `notifications` — thông báo: `{ userId, type, payload, readAt, createdAt }`
- `rank_setting` - cài đặt rank (bao nhiêu điểm xp là bậc 1, 2,...)
- `limit_learning` - cài đặt giới hạn học trong ngày của kanji, ngữ pháp, từ vựng
- `testtime_setting` - cài đặt giới hạn thời gian làm test

---

## 2) Index khuyến nghị (ít nhưng đủ)

- `users.email` unique
- `user_attempts_*`: `{ userId:1, finishedAt:-1 }`, `{ testId:1 }`
- `user_progress`: unique `{ userId:1, moduleKey:1 }`
- `user_attendance`: unique `{ userId:1, dateKey:1 }`
- `user_daily_state`: unique `{ userId:1, dateKey:1 }`
- `leaderboard_rollups`: `{ period:1, score:-1 }`
- `user_assignments_weekly`: unique `{ userId:1, period:1 }`
- `user_assignments_daily_review`: unique `{ userId:1, dateKey:1 }`

> Lưu ý: Index tính vào quota 500MB. Chỉ tạo khi có truy vấn thực.

---

## 3) Thuật toán & luồng nghiệp vụ chính

### 3.1. Điểm danh & unlock quota ngày

- API `POST /attendance/check-in` → upsert `user_daily_state` hôm nay:
  - `$setOnInsert`: `{ limits: {vocab,kanji,grammar}, used: {0,0,0}, assigned: {[]}, checkedInAt: nowJST }`
  - `$set`: `{ updatedAt: now }`

- Tất cả cấp bài trong ngày yêu cầu: `checkedInAt != null`.

### 3.2. Cấp 1 mục học (hoặc bắt đầu câu hỏi)

- `findOneAndUpdate` trên `user_daily_state` với điều kiện atomic:
  - Filter: `{ userId, dateKey, checkedInAt: { $ne: null }, $expr: { $lt: ["$used.vocab", "$limits.vocab"] } }`
  - Update: `$inc: { "used.vocab": 1 }, $set: { updatedAt: now }`

- Nếu trả về `null` → hết quota hoặc chưa check-in.

### 3.3. Bài ôn tập hôm qua

- Khi `check-in` hôm nay:
  - Lấy items đã học **hôm qua** (từ `user_attempts_*` hoặc `user_study_log`).
  - Upsert `user_assignments_daily_review` `{ userId, dateKey }` với `sets` cố định trong ngày.

### 3.4. Bài tuần

- Đầu tuần (JST) hoặc khi user mở module tuần lần đầu:
  - Tập hợp items đã học trong tuần (Mon–Sun) → chọn theo quota.
  - Upsert `user_assignments_weekly` `{ userId, period }` + `sets` + `used`.
  - Tiêu hao tương tự mục 3.2 (theo module tuần).

### 3.5. Streak & leaderboard

- Khi check-in, cập nhật `user_progress.streakDays` (so sánh `dateKey` với hôm trước).
- Mỗi khi hoàn thành bài/đạt mốc → cộng XP, roll-up `leaderboard_rollups` theo `period` (daily/weekly/monthly key).

---

## 4) API thiết kế (REST, mô tả tóm tắt)

### Auth

- `POST /auth/register` → tạo `users`.
- `POST /auth/login` → trả JWT.
- `POST /auth/refresh` → cấp lại access token.

### Attendance & Daily State

- `POST /attendance/check-in` → upsert `user_daily_state` hôm nay.
- `GET /daily/state` → trả `{ limits, used, assigned }` hôm nay.

### Content

- `GET /content/vocab` → danh sách từ vựng (filter: level, search term, pagination)
- `GET /content/vocab/:id` → chi tiết 1 từ vựng
- `POST /content/vocab` (Admin) → tạo mới
- `PUT /content/vocab/:id` (Admin) → cập nhật
- `DELETE /content/vocab/:id` (Admin) → xóa
- Tương tự cho `kanji`, `grammar` (CRUD)

- `GET /content/vocab-tests` → danh sách đề test từ vựng (filter: level, published)
- `GET /content/vocab-tests/:id` → chi tiết đề test (bao gồm items)
- `POST /content/vocab-tests` (Admin) → tạo đề test
- `PUT /content/vocab-tests/:id` (Admin) → cập nhật
- `DELETE /content/vocab-tests/:id` (Admin) → xóa
- Tương tự cho `kanji-tests`, `grammar-tests`

### Study & Quota

- `POST /study/consume` → tiêu hao quota (body: `{ module: "vocab"|"kanji"|"grammar" }`) → `200 { used }` | `409 QUOTA_EXCEEDED`
- `GET /study/items` → lấy items học hôm nay (query: `module`, `limit`) → trả items từ `assigned` hoặc random theo level
- `GET /study/item/:id` → chi tiết 1 item (vocab/kanji/grammar) theo ID

### Attempts & Test Results

- `POST /attempts/vocab` → submit kết quả test vocab (body: `{ testId, answers[], startedAt, finishedAt }`) → `200 { attemptId, score, total }`
- `POST /attempts/kanji` → submit kết quả test kanji
- `POST /attempts/grammar` → submit kết quả test ngữ pháp
- `GET /attempts/history` → lịch sử attempts (query: `module?`, `page`, `limit`) → phân trang theo `finishedAt`
- `GET /attempts/:id` → chi tiết 1 attempt (bao gồm answers)

### Assignments

- `GET /assignments/daily-review/today` → gói ôn hôm qua hôm nay (từ `user_assignments_daily_review`)
- `GET /assignments/daily-review/status` → trạng thái ôn hôm nay `{ pools, used, limits, status }`
- `POST /assignments/daily-review/consume` → tiêu hao quota ôn hôm nay (body: `{ module }`)

- `GET /assignments/weekly/current` → gói bài tuần hiện tại (từ `user_assignments_weekly`)
- `GET /assignments/weekly/:period` → gói bài tuần theo period `YYYY-W##`
- `GET /assignments/weekly/status` → trạng thái bài tuần `{ pools, used, limits, status }`
- `POST /assignments/weekly/consume` → tiêu hao quota bài tuần

- `POST /assignments/custom` → tạo bài ôn custom (body: `{ title, sources[], settings{} }`)
- `GET /assignments/custom` → danh sách bài custom của user
- `GET /assignments/custom/:id` → chi tiết bài custom
- `PUT /assignments/custom/:id` → cập nhật bài custom
- `DELETE /assignments/custom/:id` → xóa bài custom
- `POST /assignments/custom/:id/start` → bắt đầu làm bài custom → trả items

### Progress & Stats

- `GET /progress` → tiến trình tổng quan `{ xp, streakDays, totalScore, modules[] }`
- `GET /progress/:moduleKey` → tiến trình theo module (vocab/kanji/grammar) `{ xp, srs, lastStudiedAt }`
- `GET /stats/overview` → thống kê tổng quan `{ totalDays, totalAttempts, avgScore, achievements[] }`

### Leaderboard

- `GET /leaderboard` → bảng xếp hạng (query: `period=daily|weekly|monthly`, `limit=10`) → top N theo `period`
- `GET /leaderboard/me` → vị trí của user hiện tại trong leaderboard

### Achievements

- `GET /achievements` → danh sách tất cả achievements (catalog)
- `GET /achievements/earned` → thành tựu đã đạt của user (từ `user_achievements`)
- `GET /achievements/:code` → chi tiết 1 achievement

### User Profile

- `GET /users/me` → thông tin user hiện tại
- `PUT /users/me` → cập nhật profile (body: `{ displayName, avatarUrl }`)
- `GET /users/me/profile` → cài đặt profile (từ `user_profiles`)
- `PUT /users/me/profile` → cập nhật cài đặt (body: `{ settings{} }`)

### Notifications

- `GET /notifications` → danh sách thông báo (query: `read?`, `page`, `limit`)
- `PUT /notifications/:id/read` → đánh dấu đã đọc
- `PUT /notifications/read-all` → đánh dấu tất cả đã đọc
- `GET /notifications/unread-count` → số lượng chưa đọc

### Admin Settings

- `GET /admin/settings/rank` → cài đặt rank (từ `rank_setting`)
- `PUT /admin/settings/rank` (Admin) → cập nhật cài đặt rank
- `GET /admin/settings/limit-learning` → cài đặt giới hạn học (từ `limit_learning`)
- `PUT /admin/settings/limit-learning` (Admin) → cập nhật giới hạn học
- `GET /admin/settings/test-time` → cài đặt thời gian test (từ `testtime_setting`)
- `PUT /admin/settings/test-time` (Admin) → cập nhật thời gian test

### Admin Management

- `GET /admin/users` (Admin) → danh sách users (query: `page`, `limit`, `search`)
- `GET /admin/users/:id` (Admin) → chi tiết user (bao gồm progress, attempts)
- `PUT /admin/users/:id/status` (Admin) → cập nhật trạng thái user (body: `{ status }`)

...

**Mã lỗi khuyến nghị**: `401` (auth), `403` (no permission / chưa check-in), `404`, `409` (quota hết / attempt limit), `422` (payload sai), `500`.

---

## 5) Chi tiết triển khai (server)

### Tech stack

- **NestJS** (khuyến nghị) + Mongoose
- Zod/Classtransformer để validate DTO
- JWT + bcrypt
- Winston/Pino logging; Helmet; CORS

### Thư mục (NestJS)

```
src/
  app.module.ts
  common/ (guards, interceptors, filters, dto)
  auth/
  users/
  content/ (vocab, kanji, grammar, tests)
  study/ (daily-state, consume, attempts)
  assignments/ (daily-review, weekly)
  leaderboard/
  progress/
  ...
```

### Environment & cấu hình

- `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `REFRESH_SECRET`
- `TZ=Asia/Tokyo` (server), hoặc dùng dayjs/timezone trong code

### Bảo mật

- Rate limit đăng nhập
- Hash mật khẩu với bcrypt
- Phân quyền route theo role (user/admin)
- Không tin giờ client, chỉ dùng server JST

---

## 6) Kịch bản dữ liệu & seed

- Seed `content_*` (một số vocab/kanji/grammar mẫu theo N5)
- Seed `content_*_tests` (một số đề test mẫu cho vocab/kanji/grammar)
- Seed `achievements` (streak 7 ngày, 30 ngày, 100 ngày…)
- Seed `admin_*` settings (rank_setting, limit_learning, testtime_setting) với giá trị mặc định

---

## 7) Kiểm thử (acceptance checklist)

- [ ] Đăng ký/đăng nhập hoạt động, JWT trả về hợp lệ
- [ ] Check-in tạo/khởi tạo `user_daily_state` hôm nay
- [ ] Consume quota atomic: khi hết quota trả `409`
- [ ] Sinh `user_assignments_daily_review` từ dữ liệu hôm qua
- [ ] Sinh `user_assignments_weekly` đầu tuần (JST)
- [ ] Ghi `user_attempts_*` khi nộp bài; lịch sử phân trang
- [ ] Custom tests: tạo, bắt đầu, submit → xem kết quả
- [ ] Leaderboard: lấy top N theo `period`
- [ ] Streak tăng/giữ/đứt đúng khi check-in liên tiếp

---

## 8) Lộ trình thực thi (cho AI agent)

### Milestone 1: Khởi tạo dự án

- [x] Init repo (NestJS + TypeScript) + ESLint/Prettier
- [x] Kết nối MongoDB Atlas; tạo `.env.example`
- [x] Module `auth`, `users` (register/login, JWT)

### Milestone 2: Content & Attempts

- [ ] Model + CRUD tối thiểu cho `content_*_items` và `*_tests` (Admin)
- [ ] Endpoint submit attempt `user_attempts_*`

### Milestone 3: Daily state & attendance

- [ ] Endpoint `POST /attendance/check-in`
- [ ] `GET /daily/state`
- [ ] `POST /study/consume` (atomic $expr/$inc)

### Milestone 4: Assignments ngày/tuần

- [ ] Service sinh `user_assignments_daily_review` (từ hôm qua)
- [ ] Service sinh `user_assignments_weekly` (Mon–Sun JST)
- [ ] Endpoint đọc các assignment tương ứng

### Milestone 5: Custom Tests & Achievements

- [ ] CRUD `user_custom_tests` (tạo, cập nhật, xóa)
- [ ] Service sinh items từ custom test sources
- [ ] Endpoint start/submit custom test
- [ ] Service kiểm tra và cấp achievements tự động

### Milestone 6: Progress & Leaderboard

- [ ] Cập nhật XP/streak khi submit/điểm danh
- [ ] `leaderboard_rollups` + endpoint top N

### Milestone 7: Admin UI (basic)

- [ ] Trang quản trị content (CRUD vocab/kanji/grammar/tests)
- [ ] Trang quản lý users (xem danh sách, chi tiết, cập nhật status)
- [ ] Trang cài đặt admin (rank, limit-learning, test-time)
- [ ] Import CSV nhỏ cho content (vocab/kanji/grammar)

### Milestone 8: Hardening

- [ ] Logging, rate limit, guards
- [ ] E2E tests cho các flow chính

---

## 9) Ví dụ payload (tóm tắt)

**Check-in**

```http
POST /api/attendance/check-in
→ 200 { dateKey, limits, used, checkedInAt }
```

**Consume quota**

```http
POST /api/study/consume { module: "vocab" }
→ 200 { used: { vocab: 4, ... } } | 409 { code: "QUOTA_EXCEEDED" }
```

**Daily review hôm nay**

```http
GET /api/assignments/daily-review/today
→ 200 { pools: { vocabIds: [...], kanjiIds: [...], grammarIds: [...] }, used, limits, status }
```

**Submit test attempt**

```http
POST /api/attempts/vocab
Body: { testId: "...", answers: [{ questionId: "...", answer: "..." }], startedAt: "...", finishedAt: "..." }
→ 200 { attemptId: "...", score: 8, total: 10 }
```

**Get progress**

```http
GET /api/progress
→ 200 { xp: 1250, streakDays: 7, totalScore: 850, modules: [{ moduleKey: "vocab", xp: 500 }, ...] }
```

**Get leaderboard**

```http
GET /api/leaderboard?period=weekly&limit=10
→ 200 { period: "2024-W01", rankings: [{ userId, displayName, score, rank }, ...] }
```

**Create custom test**

```http
POST /api/assignments/custom
Body: { title: "Ôn tập N5", sources: [{ type: "vocab", module: "vocab" }], settings: { totalQuestions: 20, perModule: 10 } }
→ 200 { id: "...", title: "...", ... }
```

---

## 10) Ghi chú tối ưu 500MB

- Hạn chế index dư thừa
- Media (ảnh/audio) ở DB chỉ lưu URL
- Gộp field bằng kiểu số/boolean thay vì chuỗi dài

---

**Kết thúc** — Tài liệu này là blueprint cho AI Agent thực thi theo milestones, đảm bảo các luồng quan trọng (check-in, quota, assignments ngày/tuần) hoạt động đúng trên MongoDB free tier.
