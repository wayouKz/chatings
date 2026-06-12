self.addEventListener("install", (event) => {
    console.log("SW installed");
    self.skipWaiting(); // Memaksa update SW langsung aktif
});

self.addEventListener("activate", (event) => {
    console.log("SW activated");
    event.waitUntil(self.clients.claim());
});

// Wajib ada agar browser menganggap ini PWA yang valid
self.addEventListener("fetch", (event) => {
    // Biarkan minimalis dulu (Network Only) atau gunakan strategi caching
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request)),
    );
});

// ── 1. MENANGKAP PESAN DARI SUPABASE DAN MENAMPILKANNYA ──
self.addEventListener("push", (event) => {
    console.log("Sinyal Push diterima oleh Service Worker!");

    if (event.data) {
        try {
            // Mengambil payload JSON dari Edge Function
            const data = event.data.json();

            const options = {
                body: data.body,
                icon: data.icon || "/icon-192.png",
                badge: "/icon-192.png", // Icon kecil untuk status bar Android
                data: data.data, // Berisi URL tujuan ("/chat")
            };

            // Memunculkan pop-up notifikasi di layar
            event.waitUntil(
                self.registration.showNotification(data.title, options),
            );
        } catch (e) {
            console.error("Gagal parsing JSON Push:", e);
            // Fallback darurat jika format data salah
            event.waitUntil(
                self.registration.showNotification("Notifikasi Baru", {
                    body: event.data.text(),
                    icon: "/icon-192.png",
                }),
            );
        }
    }
});

// ── 2. AKSI SAAT USER MENGKLIK NOTIFIKASI ──
self.addEventListener("notificationclick", (event) => {
    console.log("Notifikasi diklik oleh user!");

    event.notification.close(); // Hilangkan pop-up notifikasi

    // Ambil URL dari payload, kalau tidak ada arahkan ke Home '/'
    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((windowClients) => {
                // Jika tab aplikasi sudah terbuka, langsung arahkan (fokus) ke tab itu
                for (let i = 0; i < windowClients.length; i++) {
                    const client = windowClients[i];
                    if (client.url.includes(urlToOpen) && "focus" in client) {
                        return client.focus();
                    }
                }
                // Jika belum terbuka sama sekali, buka tab/window baru
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            }),
    );
});
