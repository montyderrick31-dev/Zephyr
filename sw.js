/* Zephyr Trades service worker — caches the app shell, never the market data */
var CACHE = 'zephyr-shell-v1';
var SHELL = [
  './',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/htm/3.1.1/htm.umd.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(SHELL).catch(function(){}); }));
  self.skipWaiting();
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener('fetch', function(e){
  var url = e.request.url;
  // always hit the network for live data — never cache API responses
  if(url.indexOf('twelvedata.com')>=0 || url.indexOf('alphavantage.co')>=0) return;
  if(e.request.method!=='GET') return;
  // cache-first for the shell; fall back to cached start page when offline
  e.respondWith(
    caches.match(e.request).then(function(hit){
      return hit || fetch(e.request).then(function(resp){
        var copy = resp.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(e.request, copy); }catch(_){} });
        return resp;
      }).catch(function(){ return caches.match('./'); });
    })
  );
});
