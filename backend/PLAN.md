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

- `content_vocab_items` — từ vựng: `{ term, reading, meaningVi[], level, imageUrl, type, examples[{sentence, reading, meaning}], synonyms[], antonyms[], version, updatedAt }`
- `content_kanji_items` — kanji: `{ kanji, hanmean[], onyomi[], kunyomi[], meaningVi[], compDetail[{h, w}], tips[], strokes, level, example_kun{}, example_on{}, version, updatedAt }`
- `content_grammar_points` — ngữ pháp: `{ title, pattern, explainVi, level, type?, examples[{content, transcription, mean}], version, updatedAt }`
- `content_vocab_tests` — đề test từ vựng (catalog): `{ title, level, version, mode, items[], published, updatedAt }`
- `content_kanji_tests` — đề test kanji (catalog)
- `content_grammar_tests` — đề test ngữ pháp (catalog)
- `achievements` — catalog thành tựu: `{ _id: code, title, desc, icon, rules? }`

### 1.2. Người dùng — `user_*`

- `users` — tài khoản: `{ email (unique), hash, displayName, createdAt, status, courseStartDate? }`
  - `courseStartDate`: Ngày bắt đầu khóa học (do admin quản lý), dùng để tính toán ngày học và phân phối nội dung không trùng lặp
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
  - **Kiểm tra `courseStartDate`**: User phải có `courseStartDate` được admin đặt trước khi có thể điểm danh
  - **Tính toán ngày học**: Dựa trên `courseStartDate` và ngày hiện tại, tính số ngày đã trôi qua
  - **Phân phối nội dung không trùng lặp**:
    - Lấy tất cả `user_daily_state` trước đó để thu thập các ID đã được gán
    - Lọc ra các vocab/kanji/grammar chưa được gán
    - Gán 10 vocab, 5 kanji, 1 grammar mới (không trùng với các ngày trước)
  - **Xử lý ngày bỏ lỡ**: Nếu user bỏ lỡ ngày điểm danh, nội dung của ngày đó sẽ bị bỏ qua vĩnh viễn. Ngày tiếp theo sẽ nhận nội dung mới tiếp theo
    - Ví dụ: Ngày 1 điểm danh → vocab 1-10, Ngày 2 bỏ lỡ → vocab 11-20 bị bỏ qua, Ngày 3 điểm danh → vocab 21-30
  - `$setOnInsert`: `{ limits: {vocab:10,kanji:5,grammar:1}, used: {0,0,0}, assigned: {vocabIds[],kanjiIds[],grammarIds[]}, checkedInAt: nowJST }`
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

- `POST /attendance/check-in` → upsert `user_daily_state` hôm nay với nội dung không trùng lặp.
- `GET /attendance/status?dateKey=YYYY-MM-DD` → trả `{ limits, used, assigned, checkedInAt }` cho ngày cụ thể (mặc định hôm nay).
- `GET /attendance/history?month=YYYY-MM` → trả danh sách các ngày đã điểm danh trong tháng `[{ dateKey, checkedAt }, ...]`.

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

- `GET /users` (Admin) → danh sách tất cả users (bao gồm `courseStartDate`)
- `PATCH /users/:id` (Admin) → cập nhật user (body: `{ displayName?, courseStartDate? }`)
  - `courseStartDate`: Ngày bắt đầu khóa học, định dạng ISO string (YYYY-MM-DD)
  - User cần có `courseStartDate` trước khi có thể điểm danh
- `GET /users/me` → thông tin user hiện tại (bao gồm `courseStartDate`)

---

## 11) Frontend Features (Japanese Classroom)

### 11.1. Lesson Progress & Unlock Logic

**Unlock Requirements:**

- **Kanji unlock**: Yêu cầu hoàn thành Vocabulary 100% (đọc hết tất cả từ) VÀ đạt 100% trong bài test từ vựng
- **Grammar unlock**: Yêu cầu hoàn thành Kanji 100% (đọc hết tất cả kanji) VÀ đạt 100% trong bài test kanji
- Logic unlock được quản lý trong `LessonModal` component với state `vocabTestPassed`, `kanjiTestPassed`
- Unlock button không tự động chuyển tab, chỉ unlock lesson tiếp theo (user tự chuyển tab nếu muốn)

**Progress Persistence:**

- Progress được lưu vào `localStorage` với key format: `lesson_progress_{type}_{dateKey}`
- Mỗi lesson type (vocab/kanji/grammar) lưu:
  - `completedIndices`: Mảng các index đã học
  - `testPassed`: Boolean - đã pass test 100% chưa
  - `testScore`: Điểm test
  - `testTotal`: Tổng số câu
  - `lastUpdated`: Timestamp
- Progress tự động reset khi điểm danh ngày mới (dựa trên `checkedInAt` dateKey)
- **Auto-restore progress**: Khi mở lại test đã đạt 100%, tự động load và mark tất cả câu hỏi là completed, không cần làm lại
- Utility functions trong `@/utils/lesson-progress.ts`:
  - `loadProgress()`: Load progress từ localStorage
  - `saveProgress()`: Lưu progress vào localStorage
  - `clearProgress()`: Xóa progress cho một ngày cụ thể

### 11.2. Test Results & Unlock Button

**Test Completion Flow:**

- Khi hoàn thành test và đạt 100% chính xác:
  - Hiển thị nút "Mở khóa {NextLesson}" (màu xanh lá, có icon check) và nút "Đóng"
  - Click nút unlock sẽ unlock lesson tiếp theo nhưng không tự động chuyển tab
- Test results được lưu vào localStorage và load lại khi mở modal
- Callback `onTestComplete(score, total)` được truyền từ test component → lesson component → modal
- **Skip completed questions**: Khi quay lại test đã hoàn thành, các câu hỏi đã completed sẽ tự động bỏ qua

### 11.3. Vocabulary Matching Test

**Features:**

- Matching game: Ghép nghĩa tiếng Việt với từ tiếng Nhật
- Cả 2 cột (Vietnamese và Japanese) đều được random
- Vietnamese cards có thể flip (click để mở/đóng)
- SVG lines kết nối các card đã match (tính toán vị trí chính xác với scroll)
- Progress bar hiển thị số lượng đã ghép
- Kết quả test hiển thị chi tiết từng câu đúng/sai

### 11.4. Kanji Test Features

**Interactive Stroke Order Test:**

- **Stroke Order Memory Test**: Thay vì multiple choice, câu hỏi đầu tiên là interactive test nhớ nét vẽ
  - Hiển thị tất cả nét vẽ dưới dạng background (màu xám)
  - User click vào các nét vẽ theo thứ tự đúng
  - Nếu click đúng → nét vẽ hiển thị với màu sắc
  - Nếu click sai → hiển thị dấu X màu đỏ tại vị trí click (tự động ẩn sau 1 giây)
  - Tự động chuyển câu tiếp theo khi hoàn thành tất cả nét vẽ
- **Hearts System**:
  - Hiển thị 3 trái tim ở góc phải trên cùng của khung test
  - Mỗi lần click sai nét vẽ → mất 1 trái tim từ trái sang phải với hiệu ứng fade out và scale
  - Khi mất hết 3 trái tim → hiển thị modal gợi ý với `KanjiStrokeOrder` component
  - Modal có nút "Thử lại" để reset và cho phép thử lại từ đầu
- **Skip Completed Questions**:
  - Sau khi hoàn thành stroke order test, không cần làm lại khi quay lại
  - Nút "Trước" tự động bỏ qua các câu stroke order đã hoàn thành
  - Hiển thị thông báo "Đã hoàn thành nét vẽ" và tự động chuyển câu tiếp theo
- **Retry Mode**:
  - Khi làm lại test, có nút "Bỏ qua (tự tính đúng)" cho stroke order questions
  - Các câu đã hoàn thành trước đó được giữ lại, không reset

**Reading Questions:**

- Câu hỏi thứ 2: Chọn âm đọc (onyomi/kunyomi) của kanji
- 4 đáp án được tạo từ: đáp án đúng + 3 đáp án sai (từ kanji khác + sample data)
- Đảm bảo không có đáp án trùng lặp

**Component Architecture:**

- `KanjiStrokeOrderTest`: Component chính cho interactive stroke order test
- `HeartsDisplay`: Component hiển thị trái tim (tái sử dụng)
- `KanjiHintModal`: Modal gợi ý nét vẽ khi hết trái tim (tái sử dụng)
- `KanjiStrokeOrder`: Component hiển thị animation nét vẽ (dùng trong modal hint)
- Tất cả components được export từ `@/components/ui/kanji/index.ts`

### 11.5. Internationalization

- Tất cả UI text đã được chuyển sang tiếng Việt:
  - Vocabulary Lesson: "Danh sách từ", "Tiến độ", "Bắt đầu kiểm tra", "Trước", "Tiếp theo"
  - Kanji Lesson: "Danh sách kanji", "Tiến độ: X/Y kanji đã học", "Hoàn thành tất cả để mở khóa bài kiểm tra"
  - Grammar Lesson: "Danh sách ngữ pháp", "Tiến độ: X/Y điểm ngữ pháp đã học"
  - Test Results: "Kết quả kiểm tra", "Chi tiết đáp án", "Đạt yêu cầu", "Chưa đạt yêu cầu"
  - Kanji Test: "Click vào các nét vẽ theo thứ tự đúng", "Nét X/Y", "Bỏ qua (tự tính đúng)", "Gợi ý nét vẽ", "Thử lại"

### 11.6. UI/UX Improvements

- Modal test results có scroll cho phần body, header và footer cố định
- Progress được hiển thị real-time trong lesson components
- Tooltip trên tab buttons khi chưa unlock: "Hoàn thành từ vựng và bài test để mở khóa"
- Check icon hiển thị trên tab khi đã hoàn thành 100%
- **Kanji stroke order display**:
  - Ẩn số label ngay từ đầu để tránh flash khi load
  - SVG tự động scale để fit container (95% kích thước)
  - Error markers hiển thị đúng vị trí click
- **Hearts display**:
  - Hiển thị ở góc phải trên cùng, cùng hàng với text hướng dẫn
  - Text hướng dẫn được căn giữa
  - Hiệu ứng mất từ trái sang phải (cả animation và màu sắc)

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

### Backend

- [x] Đăng ký/đăng nhập hoạt động, JWT trả về hợp lệ
- [x] Check-in tạo/khởi tạo `user_daily_state` hôm nay với nội dung không trùng lặp
- [x] Validation `courseStartDate`: User không có `courseStartDate` không thể điểm danh
- [x] Phân phối nội dung: Mỗi ngày nhận nội dung mới, không trùng với các ngày trước
- [x] Xử lý ngày bỏ lỡ: Nếu bỏ lỡ ngày, nội dung ngày đó bị bỏ qua, ngày sau nhận nội dung tiếp theo
- [x] API `GET /attendance/history` trả về danh sách ngày đã điểm danh
- [x] Admin có thể xem và cập nhật `courseStartDate` cho users
- [ ] Consume quota atomic: khi hết quota trả `409`
- [ ] Sinh `user_assignments_daily_review` từ dữ liệu hôm qua
- [ ] Sinh `user_assignments_weekly` đầu tuần (JST)
- [ ] Ghi `user_attempts_*` khi nộp bài; lịch sử phân trang
- [ ] Custom tests: tạo, bắt đầu, submit → xem kết quả
- [ ] Leaderboard: lấy top N theo `period`
- [ ] Streak tăng/giữ/đứt đúng khi check-in liên tiếp

### Frontend

- [x] Lesson progress được lưu vào localStorage và persist qua refresh
- [x] Progress tự động reset khi điểm danh ngày mới
- [x] Auto-restore progress khi mở lại test đã đạt 100%
- [x] Unlock logic: Kanji chỉ unlock khi vocab 100% + test 100%
- [x] Unlock logic: Grammar chỉ unlock khi kanji 100% + test 100%
- [x] Nút "Mở khóa Kanji/Grammar" hiển thị khi test đạt 100% (không tự động chuyển tab)
- [x] Vocabulary matching test với random cả 2 cột
- [x] Kanji interactive stroke order test với click detection và error feedback
- [x] Hearts system (3 trái tim) với hint modal khi hết trái tim
- [x] Skip completed stroke order questions khi quay lại test
- [x] Retry mode với nút "Bỏ qua (tự tính đúng)" cho stroke order
- [x] Test results modal có scroll đúng cách
- [x] Tất cả UI text đã chuyển sang tiếng Việt
- [x] Progress bar hiển thị real-time trong lessons
- [x] Component architecture: Tách reusable components (HeartsDisplay, KanjiHintModal)

---

## 8) Lộ trình thực thi (cho AI agent)

### Milestone 1: Khởi tạo dự án

- [x] Init repo (NestJS + TypeScript) + ESLint/Prettier
- [x] Kết nối MongoDB Atlas; tạo `.env.example`
- [x] Module `auth`, `users` (register/login, JWT)

### Milestone 2: Content & Attempts

- [x] Model + CRUD tối thiểu cho `content_*_items` và `*_tests` (Admin)
- [x] Endpoint submit attempt `user_attempts_*`

### Milestone 3: Daily state & attendance

- [x] Endpoint `POST /attendance/check-in` với logic phân phối nội dung không trùng lặp
- [x] `GET /attendance/status?dateKey=...` (thay cho `/daily/state`)
- [x] `GET /attendance/history?month=...` để lấy lịch sử điểm danh
- [x] Validation `courseStartDate` trước khi cho phép điểm danh
- [x] Logic xử lý ngày bỏ lỡ (missed days) - nội dung bị bỏ qua vĩnh viễn
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

- [x] Trang quản trị content (CRUD vocab/kanji/grammar/tests)
- [x] Trang quản lý users (xem danh sách, cập nhật `courseStartDate`)
  - Hiển thị danh sách users với thông tin `courseStartDate`
  - Cho phép admin đặt/cập nhật `courseStartDate` cho từng user
  - Giao diện date picker để chọn ngày bắt đầu khóa học
- [ ] Trang cài đặt admin (rank, limit-learning, test-time)
- [x] Import CSV nhỏ cho content (vocab/kanji/grammar)

### Milestone 9: Frontend Lesson Features

- [x] Vocabulary matching test với random và flip cards
- [x] Progress persistence với localStorage (vocab/kanji/grammar)
- [x] Auto-reset progress khi điểm danh ngày mới
- [x] Unlock logic: Yêu cầu 100% progress + 100% test score
- [x] Unlock button hiển thị khi test đạt 100%
- [x] Internationalization: Tất cả UI text tiếng Việt
- [x] Test results modal với scroll và chi tiết đáp án
- [x] Real-time progress tracking trong lesson components

### Milestone 8: Hardening

- [ ] Logging, rate limit, guards
- [ ] E2E tests cho các flow chính

---

## 9) Ví dụ payload (tóm tắt)

**Check-in**

```http
POST /api/attendance/check-in
→ 200 { dateKey, limits: {vocab:10,kanji:5,grammar:1}, used: {vocab:0,kanji:0,grammar:0}, assigned: {vocabIds:[...],kanjiIds:[...],grammarIds:[...]}, checkedInAt }
→ 400 { message: "Course start date not set. Please contact admin." } (nếu chưa có courseStartDate)
```

**Get attendance history**

```http
GET /api/attendance/history?month=2024-01
→ 200 [{ dateKey: "2024-01-15", checkedAt: "2024-01-15T10:30:00Z" }, ...]
```

**Update user course start date (Admin)**

```http
PATCH /api/users/:id
Body: { courseStartDate: "2024-01-01" }
→ 200 { id, email, displayName, role, status, courseStartDate: "2024-01-01T00:00:00Z" }
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
