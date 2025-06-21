// service-worker.js
// Nombre de la caché para tu aplicación. Incrementa la versión si realizas cambios importantes
// en los recursos precargados para forzar al navegador a descargar la nueva versión.
const CACHE_NAME = 'alesfun-crm-cache-v3'; // <--- VERSIÓN INCREMENTADA
// La URL de la página offline. Asegúrate de que este archivo exista en la raíz de tu proyecto.
const OFFLINE_URL = '/offline.html';

// Lista de recursos que se precargarán y almacenarán en caché durante la instalación
// del Service Worker. Es CRÍTICO que todas estas rutas sean correctas y los archivos existan.
const urlsToCache = [
    '/', // La página principal (la raíz de tu aplicación)
    '/index.html', // Tu archivo HTML principal
    OFFLINE_URL, // La página HTML a mostrar cuando no hay conexión
    '/manifest.json', // El manifiesto de tu PWA
    '/images/icon-192x192.png', // Un icono para tu PWA (asegúrate de que la ruta 'images/' exista y el archivo esté ahí)
    // Agrega aquí cualquier otro recurso crítico de tu aplicación que desees precargar.
    // Por ejemplo, si tienes un archivo CSS o JS principal separado:
    // '/css/main.css',
    // '/js/app.js',
    // O si usas librerías JS locales (no CDN):
    // '/lib/some-library.js',
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando y precargando recursos...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caché abierto.');
                // Intenta agregar todos los URLs a la caché. Si *cualquier* recurso falla,
                // toda la instalación del Service Worker fallará. Esto es bueno para la depuración.
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('Service Worker: Todos los recursos precargados exitosamente.');
                        // Forzar la activación del nuevo Service Worker inmediatamente para que tome el control.
                        self.skipWaiting();
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fallo al precargar recursos. Verifica las URLs y la existencia de los archivos:', error);
                        // Lanza el error para que la instalación falle y puedas depurar.
                        throw error;
                    });
            })
            .catch((error) => {
                console.error('Service Worker: Fallo al abrir la caché durante la instalación:', error);
                throw error;
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activando y limpiando cachés antiguas...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Elimina cualquier caché que no sea la versión actual
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Eliminando caché antigua:', cacheName);
                        return caches.delete(cacheName);
                    }
                    return Promise.resolve();
                })
            );
        })
        .then(() => {
            console.log('Service Worker: Cachés antiguas limpiadas. Activación completa.');
            // Asegura que las páginas actualmente abiertas sean controladas por este Service Worker.
            return clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Ignorar solicitudes que no sean GET o que no sean HTTP/HTTPS (por ejemplo, extensiones de navegador).
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si el recurso está en caché, lo devolvemos inmediatamente.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si no está en caché, intentamos obtenerlo de la red.
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Si la respuesta de la red es válida (estado 200, tipo 'basic' para evitar errores CORS),
                        // la clonamos y la guardamos en caché para futuras solicitudes.
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Si la red falla (es decir, estamos offline) y el recurso no estaba en caché,
                        // intentamos devolver la página offline.html.
                        console.log('Service Worker: Fallo de red para:', event.request.url, '. Sirviendo página offline.');
                        return caches.match(OFFLINE_URL);
                    });
            })
    );
});
