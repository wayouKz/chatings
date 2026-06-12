// 1. Tambahkan fungsi helper ini di atas atau di luar useEffect/komponen
const urlB64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// ... di dalam komponen / script utama kamu
if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            // Pengecekan user.id dihapus agar service worker tetap jalan
            // untuk user yang belum login sekalipun.

            const registration =
                await navigator.serviceWorker.register("/service-worker.js");
            console.log("SW registered");

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.log("Permission denied");
                return;
            }

            // Pastikan VAPID KEY dibungkus tanda kutip karena ini adalah string
            const vapidKey =
                "BN2RZ1wyMnjqqFWVeuOUzLVo_cK0BGh3jeCEpcISf0U3QUMDr68gK3RhvGwEkrQZ8P_nr_XJrBF6-oubWUB7PE8";
            const convertedVapidKey = urlB64ToUint8Array(vapidKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });

            console.log("Subscription berhasil dibuat:", subscription);

            // Opsional: Jika user tidak login, Anda bisa simpan sebagai null
            // atau tambahkan pengecekan agar hanya simpan jika ada user.id
            const subscriptionData = {
                subscription: subscription,
                user_id: user?.id || null, // Akan bernilai null jika user belum login
            };

            const { error } = await supabase
                .from("push_subscriptions")
                .upsert(subscriptionData, {
                    // Hati-hati: Jika user_id null, onConflict 'user_id'
                    // mungkin akan bermasalah jika ada lebih dari satu user guest.
                    // Pertimbangkan menggunakan subscription endpoint sebagai identifier.
                    onConflict: "user_id",
                });

            if (error) {
                console.error("Gagal simpan subscription ke Supabase:", error);
            }
        } catch (err) {
            console.log("SW error", err);
        }
    });
}
