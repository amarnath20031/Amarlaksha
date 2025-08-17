// Service Worker for Laksha Coach PWA
const CACHE_NAME = 'laksha-coach-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/laksha-icon.svg',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Opened cache');
        return cache.addAll(urlsToCache).catch((error) => {
          console.log('SW: Cache add failed for some resources', error);
        });
      })
  );
  self.skipWaiting();
});

// Fetch events
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('SW: Push received', event);
  
  if (!event.data) {
    console.log('SW: Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('SW: Push data', data);

    const options = {
      body: data.body,
      icon: data.icon || '/laksha-icon.svg',
      badge: data.badge || '/laksha-icon.svg',
      tag: data.tag || 'laksha-notification',
      data: data.data || {},
      requireInteraction: true,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Laksha', options)
    );
  } catch (error) {
    console.error('SW: Error processing push notification', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window/tab
        if (self.clients.openWindow) {
          const urlToOpen = event.notification.data?.url || '/';
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenses());
  }
});

async function syncExpenses() {
  // Handle offline expense sync when connection is restored
  console.log('SW: Syncing offline expenses');
}