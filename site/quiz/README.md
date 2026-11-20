# Анкета ViMotion: новый дизайн

Изменён только внешний вид. Логика анкеты не тронута.

## Что поменялось
- `quiz/index.html`: в `<head>` убраны подключение шрифтов Fontshare и Google Fonts и встроенный `<style>`,
  вместо них подключён `quiz.css` и предзагрузка двух шрифтов. Всё от `<body>` до конца файла
  (разметка, вопросы, проверка полей, отправка в `../api/send-quiz.php`, `../assets/js/utm.js`,
  `../assets/js/track.js`, `vmTrack("quiz_open")`, Meta Pixel, vm-analytics) совпадает с прежней версией символ в символ.
- `quiz/quiz.css`: новые стили.
- `quiz/assets/fonts/*.woff2`: шрифты для стилей.

## Как выложить
1. Заменить на сервере `quiz/index.html` новой версией.
2. Положить рядом `quiz/quiz.css` и папку `quiz/assets/`.
3. `api/`, `assets/js/`, `.env` и остальное не трогать.

## Проверка после выкладки
Открыть `https://vi-motion.pro/quiz/?utm_source=test`, пройти анкету, отправить.
Заявка должна прийти в Telegram и Google Sheets с источником `test`.
