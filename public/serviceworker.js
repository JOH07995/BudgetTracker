console.log("This is the serviceworker.js file.");

const FILES_TO_CACHE = [
    "public/db.js",
    "public/index.html",
    "public/index.js",
    "public/index.css",
    "public/manifest.webmanifest",
    "public/icons/icon-192x192.png",
    "public/icons/icon-512x512.png"
];

const STATIC_CACHE = "static-cache";
const RUNTIME_CACHE = "runtime-cache";

self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(STATIC_CACHE).then(cache => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });
  

// activate
self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList => {
        return Promise.all(
          keyList.map(key => {
            if (key !== STATIC_CACHE && key !== RUNTIME_CACHE) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        );
      })
    );
  
    self.clients.claim();
  });
  

// fetch
self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches.open(RUNTIME_CACHE).then(cache => {
          return fetch(evt.request)
            .then(response => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(evt.request.url, response.clone());
              }
  
              return response;
            })
            .catch(err => {
              // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            });
        }).catch(err => console.log(err))
      );
  
      return;
    }
  
    evt.respondWith(
      caches.open(STATIC_CACHE).then(cache => {
        return cache.match(evt.request).then(response => {
          return response || fetch(evt.request);
        });
      })
    );
  });
  