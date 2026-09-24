# RatingRise — лендинг, личный кабинет клиента и админка

Next.js 16, локальная база SQLite (встроенный `node:sqlite`).

## Запуск на новом компьютере

Нужен **Node.js 24 или новее** (`node -v`).

```bash
git clone https://github.com/applianceua-bot/reviewhub.git   # если проект уже есть: git pull
cd reviewhub
git checkout feature/client-cabinet
npm install
npm run db:seed                                             # вымышленные демо-данные
npm run user:create -- admin <пароль> admin "Администратор"  # пароль не короче 8 символов
npm run dev
```

Открыть http://localhost:3000:

- `/` — лендинг
- `/login` — вход в кабинет
- `/admin` — админка (логин `admin`)
- `/cabinet` — кабинет клиента (демо: логин `demo`, пароль `demo-cabinet`)

База лежит в `data/reviewhub.db` и в git не попадает: на каждом компьютере она своя.
Перенести реальные данные можно, скопировав этот файл вручную.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | запуск для разработки |
| `npm run build` | production-сборка |
| `npm run db:seed` | пересоздать демо-бренды Nordvik Pay и Lumo Travel (реальные данные не трогает) |
| `npm run user:create -- <логин> <пароль> [admin\|client] [Имя]` | создать пользователя или сменить ему пароль |
