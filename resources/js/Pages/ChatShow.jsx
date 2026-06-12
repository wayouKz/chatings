import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../libs/supabase";

const VAPID_PUBLIC_KEY =
    "BN2RZ1wyMnjqqFWVeuOUzLVo_cK0BGh3jeCEpcISf0U3QUMDr68gK3RhvGwEkrQZ8P_nr_XJrBF6-oubWUB7PE8";

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function ChatShow({ conversationId, friendId, friendData }) {
    const user = usePage().props.auth.user;

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // 🔥 State baru untuk upload foto
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);

    // 🔥 Dua ref terpisah untuk Galeri dan Kamera
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);

    useEffect(() => {
        if (!user?.id) return;
        const timer = setTimeout(() => {
            registerPush();
        }, 1000);
        return () => clearTimeout(timer);
    }, [user?.id]);

    useEffect(() => {
        if (!conversationId) return;

        loadMessages();

        const channel = supabase
            .channel(`chat-${conversationId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new]);
                },
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    useEffect(() => {
        scrollBottom();
    }, [messages]);

    const scrollBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    };

    const loadMessages = async () => {
        if (!conversationId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const { data, error } = await supabase
            .from("messages")
            .select(
                `id, conversation_id, message, type, created_at, sender_id, users:users(id, name)`,
            )
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        setMessages(data || []);
        setLoading(false);
    };

    // 🔥 Handler saat foto dipilih dari galeri/kamera
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            textareaRef.current?.focus();
        }
    };

    // 🔥 Handler menghapus foto yang batal dikirim
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (cameraInputRef.current) cameraInputRef.current.value = ""; // Bersihkan ref kamera juga
    };

    const sendMessage = async (e) => {
        e?.preventDefault();

        // Cegah kirim jika input kosong dan tidak ada gambar
        if (!message.trim() && !imageFile) return;
        if (!conversationId || isUploading) return;

        setIsUploading(true);
        let imageUrl = null;
        let notifyText = message.trim();

        // 🔥 1. Upload Gambar ke Supabase Storage (Jika ada)
        if (imageFile) {
            const fileExt = imageFile.name.split(".").pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `chat-images/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("chat-media") // Pastikan bucket ini sudah dibuat di Supabase
                .upload(filePath, imageFile);

            if (uploadError) {
                console.error("Gagal upload gambar:", uploadError);
                setIsUploading(false);
                return;
            }

            const { data } = supabase.storage
                .from("chat-media")
                .getPublicUrl(filePath);
            imageUrl = data.publicUrl;
            notifyText = notifyText
                ? `📷 Foto: ${notifyText}`
                : "📷 Mengirim foto";
        }

        const textToSend = message.trim();
        setMessage("");
        removeImage();

        if (textareaRef.current) {
            textareaRef.current.style.height = "38px";
        }

        // 🔥 2. Simpan Gambar ke tabel messages (sebagai tipe 'image')
        if (imageUrl) {
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                message: imageUrl,
                type: "image",
            });
        }

        // 🔥 3. Simpan Teks ke tabel messages (sebagai tipe 'text')
        if (textToSend) {
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                message: textToSend,
                type: "text",
            });
        }

        setIsUploading(false);

        // 🔥 4. PUSH NOTIF TRIGGER
        const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("*")
            .eq("user_id", friendId);

        if (subs?.length) {
            await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-push`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    },
                    body: JSON.stringify({
                        subscription: subs[0].subscription,
                        title: friendData.name,
                        message: notifyText,
                    }),
                },
            );
        }
    };

    const handleInput = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 96) + "px";
        setMessage(el.value);
    };

    const handleKeyDown = async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    };

    const registerPush = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") return;

            const registration =
                await navigator.serviceWorker.register("/service-worker.js");
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            const sub = subscription.toJSON();
            if (!sub?.endpoint || !sub?.keys) return;

            // 🔥 1. Cek dulu apakah device (endpoint) ini sudah ada di database
            const { data: existingSub, error: fetchError } = await supabase
                .from("push_subscriptions")
                .select("id")
                .eq("user_id", user.id)
                .eq("endpoint", sub.endpoint)
                .maybeSingle();

            if (fetchError) {
                console.error("Gagal mengecek data:", fetchError);
                return;
            }

            // 🔥 2. Jika sudah ada, hentikan proses (jangan insert lagi)
            if (existingSub) {
                console.log("Device sudah terdaftar.");
                return;
            }

            // 🔥 3. Jika belum ada, lakukan INSERT
            const { error: insertError } = await supabase
                .from("push_subscriptions")
                .insert({
                    user_id: user.id,
                    endpoint: sub.endpoint,
                    auth: sub.keys.auth,
                    p256dh: sub.keys.p256dh,
                    subscription: sub,
                });

            if (insertError) {
                console.error("Gagal menyimpan subscription:", insertError);
            } else {
                console.log("Device baru berhasil didaftarkan!");
            }
        } catch (err) {
            console.log("Push error:", err);
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="h-[calc(100vh-80px)] p-4">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 shrink-0">
                    <div>
                        <h2 className="font-semibold text-slate-800">
                            {friendData.name}
                        </h2>
                        <p className="text-sm text-green-500">Online</p>
                    </div>

                    <div className="flex gap-2">
                        <button className="rounded-lg border border-green-500 px-3 py-2 text-green-500 hover:bg-green-500 hover:text-white transition">
                            <i className="fa fa-phone"></i>
                        </button>
                        <button className="rounded-lg border border-blue-500 px-3 py-2 text-blue-500 hover:bg-blue-500 hover:text-white transition">
                            <i className="fa fa-video"></i>
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
                    {messages.map((msg) => {
                        const isMine = msg.sender_id === user.id;

                        return (
                            <div
                                key={msg.id}
                                className={`mb-4 flex ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div className="max-w-[75%]">
                                    {!isMine && (
                                        <div className="mb-1 text-xs text-slate-500">
                                            {friendData.name}
                                        </div>
                                    )}

                                    <div
                                        className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                            isMine
                                                ? "bg-indigo-600 text-white"
                                                : "bg-white border border-slate-100 text-slate-800"
                                        }`}
                                    >
                                        {/* 🔥 Render Image jika type adalah 'image' */}
                                        {msg.type === "image" ? (
                                            <img
                                                src={msg.message}
                                                alt="Photo"
                                                className="rounded-lg max-w-full object-cover max-h-64 cursor-pointer"
                                            />
                                        ) : (
                                            <p className="whitespace-pre-wrap word-break">
                                                {msg.message}
                                            </p>
                                        )}
                                    </div>

                                    <div
                                        className={`mt-1 text-[10px] text-slate-400 ${
                                            isMine ? "text-right" : ""
                                        }`}
                                    >
                                        {new Date(
                                            msg.created_at,
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef}></div>
                </div>

                {/* Footer / Input Area */}
                <div className="border-t border-slate-200 bg-white p-3 shrink-0">
                    {/* 🔥 Preview Gambar Sebelum Dikirim */}
                    {imagePreview && (
                        <div className="relative mb-3 inline-block">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-24 w-24 rounded-xl object-cover shadow-sm border border-slate-200"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
                            >
                                <i className="fa fa-times text-xs"></i>
                            </button>
                        </div>
                    )}

                    <form
                        onSubmit={sendMessage}
                        className="flex items-end gap-2"
                    >
                        {/* 🔥 Tombol Galeri */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                            title="Pilih dari Galeri"
                        >
                            <i className="fa fa-image text-lg"></i>
                        </button>

                        {/* 🔥 Tombol Kamera Langsung */}
                        <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-indigo-600 transition"
                            title="Buka Kamera"
                        >
                            <i className="fa fa-camera text-lg"></i>
                        </button>

                        {/* Input Tersembunyi untuk Galeri */}
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />

                        {/* Input Tersembunyi untuk Kamera */}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            ref={cameraInputRef}
                            onChange={handleImageSelect}
                        />

                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={message}
                            onInput={handleInput}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tulis pesan..."
                            className="max-h-24 flex-1 resize-none rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-shadow"
                            style={{ height: "40px" }}
                        />

                        <button
                            type="submit"
                            disabled={
                                (!message.trim() && !imageFile) || isUploading
                            }
                            className={`flex shrink-0 items-center justify-center rounded-xl px-5 py-2 font-medium text-white transition-all ${
                                (!message.trim() && !imageFile) || isUploading
                                    ? "cursor-not-allowed bg-slate-300"
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                            }`}
                            style={{ height: "40px" }}
                        >
                            {isUploading ? (
                                <i className="fa fa-spinner fa-spin"></i>
                            ) : (
                                <i className="fa fa-paper-plane"></i>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
