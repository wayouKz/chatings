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
            // Pastikan user sudah ada sebelum lanjut
            if (!user?.id) return;

            const registration =
                await navigator.serviceWorker.register("/service-worker.js");
            console.log("SW registered");

            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                console.log("Permission denied");
                return;
            }

            // 2. Gunakan fungsi helper untuk mengkonversi VAPID KEY
            const convertedVapidKey = urlB64ToUint8Array(
                BN2RZ1wyMnjqqFWVeuOUzLVo_cK0BGh3jeCEpcISf0U3QUMDr68gK3RhvGwEkrQZ8P_nr_XJrBF6 -
                    oubWUB7PE8,
            ); // Sesuaikan dengan nama env kamu

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey,
            });

            console.log("Subscription berhasil dibuat:", subscription);

            // 3. Gunakan UPSERT agar tidak terjadi duplikasi data di database
            // (Pastikan di Supabase, kolom user_id dijadikan Primary Key atau Unique)
            const { error } = await supabase.from("push_subscriptions").upsert(
                {
                    user_id: user.id,
                    subscription: subscription,
                },
                {
                    onConflict: "user_id", // Timpa data lama jika user_id sudah ada
                },
            );

            if (error) {
                console.error("Gagal simpan subscription ke Supabase:", error);
            }
        } catch (err) {
            console.log("SW error", err);
        }
    });
}
