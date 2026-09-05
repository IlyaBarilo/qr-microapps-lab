# Сторонние компоненты

Собственный код QR Microapps Lab распространяется по [лицензии MIT](LICENSE). Исключение составляют перечисленные ниже сторонние компоненты: для них действуют лицензии соответствующих правообладателей.

Редактор поставляет QR-библиотеки и синтаксические анализаторы локально и не обращается к CDN. Полные тексты их лицензий находятся рядом с исходниками и встроены в `qr-microapps-lab.html`, поэтому автономный файл можно распространять отдельно от репозитория при сохранении встроенных уведомлений.

## QRCode.js 1.0.0

- Назначение: генерация QR-матрицы.
- Исходный проект: [davidshimjs/qrcodejs](https://github.com/davidshimjs/qrcodejs).
- Дистрибутив: QRCode.js 1.0.0; локальный файл совпадает с опубликованным `qrcode.min.js`.
- Лицензия: [MIT](editor/vendor/qrcodejs.LICENSE), copyright © 2012 davidshimjs.
- Встроенный файл: `editor/vendor/qrcode.min.js`.
- SHA-256: `c541ef06327885a8415bca8df6071e14189b4855336def4f36db54bde8484f36`.

## jsQR 1.4.0

- Назначение: декодирование пикселей сформированного QR-кода.
- Исходный проект: [cozmo/jsQR](https://github.com/cozmo/jsQR).
- Основа дистрибутива: jsQR 1.4.0 из npm-пакета `jsqr@1.4.0` (`dist/jsQR.js`). Локальная копия изменена только для передачи уже прочитанных декодером уровня коррекции и номера маски в результат анализа.
- Лицензия: [Apache-2.0](editor/vendor/jsQR.LICENSE).
- Встроенный файл: `editor/vendor/jsQR.js`.
- SHA-256 локальной копии: `451450af8c0b9948010a8a928ddf2f2999a35f78595a98a2f6f51fd98d2a3e46`.

## Acorn 8.18.0

- Назначение и происхождение: Разбор JavaScript перед сокращением межтокенных пробелов; npm-дистрибутив dist/acorn.js.
- Исходный проект: [Acorn](https://github.com/acornjs/acorn).
- Лицензия: [MIT](editor/vendor/acorn.LICENSE).
- Встроенный файл: `editor/vendor/acorn.js`. Окончания строк приведены к CRLF.
- SHA-256 локальной копии: `8d2da0e1fe4258b4b990ef3f4691c2ab67fc19a92c37f933e1600e97d8ec20e1`.

## CSS Tree 3.2.1

- Назначение и происхождение: Разбор и сериализация CSS; npm-дистрибутив dist/csstree.js с добавленным CommonJS-экспортом для тестов.
- Исходный проект: [CSS Tree](https://github.com/csstree/csstree).
- Лицензия: [MIT](editor/vendor/csstree.LICENSE).
- Встроенный файл: `editor/vendor/csstree.js`. Окончания строк приведены к CRLF.
- SHA-256 локальной копии: `4a460529d33f2ef7748b1a21272fa95344bdea534ff92a5e85af8b6fa397cfce`.

CSS Tree включает справочные данные проекта [mdn-data](https://github.com/mdn/data); их [лицензия MIT](editor/vendor/mdn-data.LICENSE) также встроена в автономный HTML.

## parse5 8.0.1 и entities 8.0.0

- Назначение: разбор HTML без выполнения скриптов и сетевых запросов; декодирование HTML-сущностей.
- Исходные проекты: [parse5](https://github.com/inikulin/parse5) и [entities](https://github.com/fb55/entities).
- Лицензии: [parse5 — MIT](editor/vendor/parse5.LICENSE), [entities — BSD-2-Clause](editor/vendor/entities.LICENSE).
- Встроенный файл: `editor/vendor/parse5.js`. Браузерная IIFE-сборка экспортов parse/Parser содержит необходимый код entities; добавлен CommonJS-экспорт для тестов.
- Воспроизведение: после `npm --prefix tests ci` выполнить `npm --prefix tests run build:html-parser`. Используется зафиксированный esbuild 0.28.2; он нужен только для подготовки vendor-файла.
- SHA-256 локальной сборки: `de201e337d10e68a773248a8be1e3ff4016aa013f564d3c4fc54b802715e7f77`.

Полные тексты обеих лицензий встроены в автономный HTML.
