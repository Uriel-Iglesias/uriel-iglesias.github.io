# 💰 Finanzas

PWA minimalista (estilo iOS / DAAK) para llevar **ingresos y gastos** desde el iPhone con el mínimo número de toques. Pensada para alguien que vende puerta a puerta y necesita apuntar cobros y gastos rápido.

- **React + Vite + TypeScript + Tailwind**
- **Local-first**: funciona 100% offline con `localStorage`.
- **Supabase opcional**: si configuras credenciales, sincroniza en la nube con auth email/contraseña.
- **PWA instalable** en iPhone (modo standalone, safe-area, service worker offline).

---

## 🚀 Puesta en marcha

```bash
npm install
npm run dev          # http://localhost:5173
```

Para verlo en el iPhone en la misma red Wi-Fi, abre la URL `Network:` que imprime Vite.

### Compilar para producción

```bash
npm run build        # genera dist/
npm run preview      # sirve dist/ en local para probar la PWA real
```

> El service worker **solo se activa en `build`/`preview`**, no en `dev` (para evitar caché pegajosa mientras desarrollas).

---

## 🗄️ Modos de datos

### Modo local (por defecto, sin configurar nada)

Sin variables de entorno, la app guarda todo en `localStorage` del iPhone. **No hay login real**: entras directo. Ideal para un único dispositivo personal. Los datos viven en el navegador/PWA de ese teléfono.

### Modo Supabase (nube + login)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta:

   ```sql
   create table transactions (
     id          uuid default gen_random_uuid() primary key,
     user_id     uuid references auth.users not null,
     type        text check (type in ('income','expense')) not null,
     amount      numeric(10,2) not null check (amount > 0),
     category    text not null,
     description text not null default '',
     date        date not null default current_date,
     created_at  timestamptz default now()
   );

   alter table transactions enable row level security;

   create policy "own data" on transactions
     using (auth.uid() = user_id)
     with check (auth.uid() = user_id);
   ```

3. Crea tu usuario en **Authentication → Users → Add user** (no hay registro público en la app).
4. Copia las credenciales en un `.env` (ver `.env.example`):

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

5. `npm run dev`. Ahora la app pide login y sincroniza con Supabase.

**Offline con Supabase:** las escrituras se guardan en una *outbox* local y se sincronizan solas al recuperar conexión (al volver online, al abrir la app, o tras cada operación). La UI siempre es instantánea porque lee de la caché local.

---

## ☁️ Deploy en Vercel

1. Sube el repo a GitHub.
2. En Vercel: **New Project → Import**. Framework detectado: *Vite*. Build `npm run build`, output `dist`.
3. Si usas Supabase, añade `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en **Settings → Environment Variables**.
4. Deploy. `vercel.json` ya incluye el *rewrite* SPA para que rutas como `/stats` funcionen al recargar.

---

## 📲 Instalar en iPhone

1. Abre la URL en **Safari**.
2. Botón compartir → **Añadir a pantalla de inicio**.
3. Se abre a pantalla completa (standalone), con su icono y respetando notch / Dynamic Island.

---

## 🎨 Iconos

Los iconos PWA (`public/icon-{180,192,512}.png` + `favicon.svg`) se generan sin dependencias:

```bash
npm run icons
```

Edita `scripts/generate-icons.mjs` si quieres otro diseño, o sustituye los PNG por los tuyos.

---

## 🧩 Estructura

```
src/
├── components/   BalanceCard, MonthStats, TransactionList/Item, AddSheet, DetailSheet,
│                 CategoryGrid, FilterChips, Sheet (bottom sheet reutilizable), BarChart, DonutChart
├── pages/        Dashboard, Stats, Login, Export
├── lib/          supabase, categories (presets), utils (fechas/dinero), db (capa local-first)
├── hooks/        useAuth, useTransactions, useStats
├── context.ts    auth + movimientos compartidos
└── types/        modelos
```

Atajos de categoría con precio: **Stand Google ×1 → €30**, **×2 → €50**, **×3 → €60**, **Bus → €2**. Tocar la categoría rellena el importe y la nota automáticamente.
