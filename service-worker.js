// service-worker.js
const CACHE_NAME = 'alesfun-crm-cache-v2'; // Incrementa la versión para forzar la actualización del Service Worker
const OFFLINE_URL = '/offline.html'; // Asegúrate de que este archivo exista en la raíz de tu proyecto

// Lista de recursos a precargar durante la instalación del Service Worker
// Asegúrate de que todas estas rutas son CORRECTAS y los archivos EXISTEN en tu proyecto.
const urlsToCache = [
    '/', // La página principal (la raíz)
    '/index.html',
    OFFLINE_URL, // Tu página offline
    '/manifest.json', // Tu manifiesto de PWA
    '/images/icon-192x192.png', // Tu icono de PWA
    // Si tienes archivos CSS y JS separados (además del JS inline en index.html), inclúyelos aquí:
    // '/styles.css', // Ejemplo si tuvieras un archivo styles.css
    // '/script.js', // Ejemplo si tuvieras un archivo script.js principal
    // Si usas librerías JS locales, también aquí:
    // '/lib/jsPDF/jspdf.umd.min.js', // Si usas jspdf localmente
];

self.addEventListener('install', (event) => {
    console.log('Service Worker: Instalando y precargando recursos...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Cache abierto.');
                return cache.addAll(urlsToCache)
                    .then(() => {
                        console.log('Service Worker: Todos los recursos precargados exitosamente.');
                        // Forzar la activación del nuevo Service Worker inmediatamente
                        self.skipWaiting();
                    })
                    .catch((error) => {
                        console.error('Service Worker: Fallo al precargar recursos. Verificando URL:', error);
                        // Importante: Si cache.addAll falla para *cualquier* recurso, el Service Worker no se instalará.
                        // Esto es bueno para depurar, pero para producción querrías quizás filtrar errores menos críticos.
                        // Por ejemplo, podríamos intentar precargar uno por uno si un recurso no es crítico.
                        // Para este caso, lanzamos el error para que falle la instalación.
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
            // Asegúrate de que las páginas se controlen inmediatamente por el nuevo SW
            return clients.claim();
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Solo manejamos solicitudes GET para URLs http(s)
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Devolver respuesta cacheada si está disponible
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Si no está en caché, intentar obtener de la red
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Si la respuesta de la red es válida (no error, no parcial), la guardamos en caché
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Si la red falla (estamos offline), intentar devolver la página offline
                        console.log('Service Worker: Fallo de red para:', event.request.url, '. Sirviendo página offline.');
                        return caches.match(OFFLINE_URL);
                    });
            })
    );
});
