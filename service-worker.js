const CACHE_NAME = 'kotelek-varit-v1';
const urlsToCache = [
  '/kotelek-varit/',
  '/kotelek-varit/index.html',
  '/kotelek-varit/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/lucide@latest'
];

// Установка Service Worker и кэширование файлов
self.addEventListener('install', event => {
  console.log('Service Worker: Установка...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log('Ошибка кэширования:', err))
  );
  self.skipWaiting();
});

// Активация Service Worker и удаление старого кэша
self.addEventListener('activate', event => {
  console.log('Service Worker: Активация');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Удаление старого кэша', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Перехват запросов и возврат из кэша
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем из кэша, если есть
        if (response) {
          console.log('Service Worker: Загрузка из кэша', event.request.url);
          return response;
        }
        
        // Иначе загружаем из сети
        console.log('Service Worker: Загрузка из сети', event.request.url);
        return fetch(event.request)
          .then(response => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ
            const responseToCache = response.clone();

            // Добавляем в кэш
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Если офлайн и нет в кэше, показываем базовую страницу
            return caches.match('/kotelek-varit/index.html');
          });
      })
  );
});
