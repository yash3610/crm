# BillPro CRM Backend

Simple Express + MongoDB backend using an MVC-style structure.

## Local setup

1. Start MongoDB on `mongodb://127.0.0.1:27017`.
2. Copy `.env.example` to `.env`.
3. Install and seed:

```bash
npm install
npm run seed
npm run dev
```

API base URL: `http://localhost:5000/api`

Demo login:

```text
admin@billpro.io
demo1234
```

## Structure

- `src/models`: Mongoose schemas
- `src/controllers`: business logic
- `src/routes`: Express routes
- `src/middleware`: auth and error handling
- `src/config`: database connection
- `src/seed`: local development seed data
