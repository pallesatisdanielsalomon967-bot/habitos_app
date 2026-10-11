/*
 * sw.js — Service worker: un "ayudante" que el navegador ejecuta en segundo plano.
 * Guarda una copia de los archivos de la app (caché) para que abra sin internet.
 *
 * Estrategia "red primero": si hay internet, descarga la versión más nueva y
 * actualiza la copia; si no hay internet, usa la copia guardada.
 */
const NOMBRE_CACHE = "habitos-v1";

// Rutas relativas a la carpeta donde está este archivo
const ARCHIVOS_APP = [
  "./",
  "index.html",
  "css/estilos.css",
  "js/logica.js",
  "js/app.js",
  "manifest.json",
  "iconos/icono-192.png",
  "iconos/icono-512.png"
];

// 1. Instalación: guarda los archivos básicos
self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(NOMBRE_CACHE).then((cache) => cache.addAll(ARCHIVOS_APP))
  );
  self.skipWaiting(); // activa esta versión sin esperar
});

// 2. Activación: borra cachés de versiones anteriores
self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== NOMBRE_CACHE).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// 3. Cada petición: red primero, caché si no hay internet
self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  // Solo manejamos lecturas (GET) de nuestro propio sitio
  if (peticion.method !== "GET" || new URL(peticion.url).origin !== self.location.origin) return;

  evento.respondWith(
    fetch(peticion)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone(); // una respuesta solo se puede leer una vez
          caches.open(NOMBRE_CACHE).then((cache) => cache.put(peticion, copia));
        }
        return respuesta;
      })
      .catch(async () => {
        const guardada = await caches.match(peticion);
        if (guardada) return guardada;
        // Si se pide la página sin internet y no está exacta, mostramos la principal
        if (peticion.mode === "navigate") return caches.match("index.html");
        return Response.error();
      })
  );
});
