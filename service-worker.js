const CACHE_NAME = 'alesfun-crm-cache-v2'; // Cambiado a v2 para forzar la actualización
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/service-worker.js',
    '/images/icon-192x192.png', // Asegúrate de que estos iconos existan en la carpeta /images
    '/images/icon-512x512.png', // Asegúrate de que estos iconos existan en la carpeta /images
    'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
    'https://fonts.googleapis.com/css2?family=Major+Mono+Display&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache abierta');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting()) // Forzamos la activación inmediata del nuevo SW
            .catch(error => {
                console.error('Service Worker: Fallo al cachear:', error);
                // Si falla, es probable que un recurso no se encuentre (ej. icono 404).
                // Continúa la instalación, pero el caché será parcial.
                // Es crucial que los recursos en urlsToCache existan.
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando cache antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Permite que el SW tome control de las pestañas abiertas
    );
});

self.addEventListener('fetch', (event) => {
    // Si la solicitud es para la API de Google Apps Script, intentar siempre la red
    if (event.request.url.startsWith('https://script.google.com/macros/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Si la red falla, no tenemos una copia en caché de la API,
                // así que solo fallamos o mostramos un mensaje de offline.
                console.log('Service Worker: Fallo de red para la API, no se puede servir desde caché.');
                // No respondemos con un error HTTP si estamos offline para que el frontend maneje la excepción
                return new Response(null, { status: 503, statusText: 'Service Unavailable - Offline' });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Devolver recurso desde caché si está disponible
                if (response) {
                    return response;
                }
                // Si no está en caché, intentar obtener de la red
                return fetch(event.request).then((networkResponse) => {
                    // Si es una respuesta válida, cachearla
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        // Solo cachear si la URL no es la API
                        if (!event.request.url.startsWith('https://script.google.com/macros/')) {
                             caches.open(CACHE_NAME).then((cache) => {
                                 cache.put(event.request, responseToCache);
                             });
                        }
                    }
                    return networkResponse;
                }).catch(() => {
                    // Si falla la red (offline), intentar servir una página offline si es una navegación
                    if (event.request.mode === 'navigate') {
                        // Podrías servir una página offline específica si tuvieras una
                        // return caches.match('/offline.html');
                        console.log('Service Worker: Modo offline para navegación, no hay página offline específica.');
                    }
                    // Si no, simplemente fallar la solicitud (el frontend lo manejará)
                    console.log('Service Worker: Fallo de red para recurso cacheable:', event.request.url);
                    // Retornar un Response nulo o un error para que la aplicación maneje la caída de red
                    return new Response(null, { status: 503, statusText: 'Service Unavailable - Offline' });
                });
            })
    );
});
