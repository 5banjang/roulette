// Service Worker for 결정장애 돌림판 PWA
const CACHE_NAME = 'decision-roulette-cache-v1';
const urlsToCache = [
  '/',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icon-48x48.png',
  './icon-72x72.png',
  './icon-96x96.png',
  './icon-144x144.png',
  './icon-192x192.png',
  './icon-512x512.png'
];

// install 이벤트: 파일들을 캐시에 저장
self.addEventListener('install', (event) => {
  console.log('Service Worker: 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 필요한 파일들을 캐시에 저장 중...');
        console.log('캐시할 파일 목록:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: 모든 파일이 성공적으로 캐시되었습니다.');
        return self.skipWaiting(); // 즉시 활성화
      })
      .catch((error) => {
        console.error('Service Worker: 캐시 저장 실패', error);
      })
  );
});

// activate 이벤트: 이전 버전 캐시 정리
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 활성화됨');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 현재 캐시가 아닌 이전 버전 캐시들을 삭제
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: 이전 캐시 삭제 -', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: 캐시 정리 완료');
        return self.clients.claim(); // 모든 탭에서 즉시 제어권 가져오기
      })
  );
});

// fetch 이벤트: 캐시된 파일을 우선적으로 보여주기
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // 캐시된 파일이 있으면 그것을 먼저 보여주기
        if (cachedResponse) {
          console.log('Service Worker: 캐시에서 파일 제공 -', event.request.url);
          return cachedResponse;
        }

        // 캐시에 없으면 네트워크에서 가져오기
        console.log('Service Worker: 네트워크에서 파일 가져오기 -', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // 유효한 응답인지 확인
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // 새로 가져온 파일을 캐시에 저장 (동적 캐싱)
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('Service Worker: 새 파일 캐시에 저장 -', event.request.url);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('Service Worker: 네트워크 요청 실패 -', event.request.url, error);
            
            // 네트워크 실패 시 기본 페이지 제공
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// 메시지 이벤트 (앱에서 Service Worker로 메시지 전송 시)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: 즉시 활성화 요청 받음');
    self.skipWaiting();
  }
});

// Service Worker 정보 출력
console.log('Service Worker: decision-roulette-cache-v1 로드됨');
console.log('캐시 대상 파일들:', urlsToCache); 