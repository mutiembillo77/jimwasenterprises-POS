const CACHE_VERSION = 'v1';
const STATIC_CACHE = `jimwas-pos-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `jimwas-pos-dynamic-${CACHE_VERSION}`;
const API_CACHE = `jimwas-pos-api-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, fallback to network
  cacheFirst: async (request) => {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await fetch(request);
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Network request failed' }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'application/json' }),
        }
      );
    }
  },

  // Network first, fallback to cache
  networkFirst: async (request) => {
    try {
      const response = await fetch(request);
      
      if (response && response.status === 200) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
      
      return response;
    } catch (error) {
      const cache = await caches.open(DYNAMIC_CACHE);
      const cached = await cache.match(request);
      
      if (cached) {
        return cached;
      }
      
      // Return offline page if not cached
      return caches.match('/offline.html') || 
        new Response('Service unavailable - offline', {
          status: 503,
          statusText: 'Service Unavailable',
        });
    }
  },

  // Stale while revalidate
  staleWhileRevalidate: async (request) => {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request).then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    });

    return cached || fetchPromise;
  },
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE &&
            cacheName !== DYNAMIC_CACHE &&
            cacheName !== API_CACHE
          ) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests (network-first)
  if (url.pathname.startsWith('/api/') || url.origin !== location.origin) {
    event.respondWith(CACHE_STRATEGIES.networkFirst(request));
    return;
  }

  // Handle image requests (cache-first)
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url.pathname)) {
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request));
    return;
  }

  // Handle CSS/JS assets (stale-while-revalidate)
  if (/\.(css|js)$/i.test(url.pathname)) {
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request));
    return;
  }

  // Default: network-first for HTML and other assets
  event.respondWith(CACHE_STRATEGIES.networkFirst(request));
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(DYNAMIC_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    caches.open(DYNAMIC_CACHE).then((cache) => {
      cache.keys().then((requests) => {
        event.ports[0].postMessage({ count: requests.length });
      });
    });
  }
});
