// Lightweight service worker used for future-proofing (MV3). Currently not required for the toggle flow
// but present so the extension can be expanded. No expensive listeners here.


self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());


// Optional: respond to commands or alarm events here in future versions.