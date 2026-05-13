# 🛒 ShopVN

## Cấu trúc dự án
```
ecommerce/
├── backend/     → Spring Boot (port 8080)
└── frontend/    → React + Vite (port 5173)
```

---

## ⚙️ BACKEND — Hướng dẫn setup

### 1. Chuẩn bị MySQL
```sql
-- Chạy file schema gốc (ecommerce_db)


### 2. Cấu hình `application.yml`
Mở file `backend/src/main/resources/application.yml` và sửa:
```yaml
spring.datasource.password: <MySQL password của bạn>
app.jwt.secret: <chuỗi bất kỳ dài > 32 ký tự>
```

### 3. Mở trong IntelliJ
- File → Open → chọn thư mục `backend/`
- IntelliJ tự nhận Maven project
- Đợi download dependencies (lần đầu ~2-3 phút)
- Run `EcommerceApplication.java`

## ⚛️ FRONTEND — Hướng dẫn setup

### 1. Cài dependencies
```bash
cd frontend
npm install
```

### 2. Chạy dev server
```bash
npm run dev
```
→ Mở http://localhost:5173
