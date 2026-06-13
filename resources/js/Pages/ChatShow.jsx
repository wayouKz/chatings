import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../libs/supabase";

// Konfigurasi Push Notification
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

const encryptMessage = (text) => text;
const decryptMessage = (text) => text;

export default function ChatShow({ conversationId, friendId, friendData }) {
    const user = usePage().props.auth.user;

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);

    // State Media (Gambar & Upload)
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // State Perekam Suara (Voice Note)
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);

    // 🔥 State Perekam Kamera (Live Camera)
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const cameraStreamRef = useRef(null);

    const textareaRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Refs untuk Perekam Suara
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerIntervalRef = useRef(null);

    useEffect(() => {
        if (!user?.id) return;
        const timer = setTimeout(() => registerPush(), 1000);
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
                (payload) => setMessages((prev) => [...prev, payload.new]),
            )
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [conversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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

        if (!error) setMessages(data || []);
        setLoading(false);
    };

    // --- HANDLER GAMBAR (Galeri) ---
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            textareaRef.current?.focus();
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- 🔥 HANDLER KAMERA LANGSUNG (IN-APP) ---
    const openCamera = async () => {
        try {
            // Meminta akses kamera (prioritaskan kamera belakang di HP)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
                audio: false,
            });
            cameraStreamRef.current = stream;
            setIsCameraOpen(true);

            // Pasang stream ke elemen video setelah render
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }, 100);
        } catch (err) {
            console.error("Gagal mengakses kamera:", err);
            alert(
                "Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.",
            );
        }
    };

    const closeCamera = () => {
        if (cameraStreamRef.current) {
            cameraStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());
            cameraStreamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            // Set ukuran canvas sama dengan video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Gambar frame video ke canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Konversi canvas ke file gambar (Blob)
            canvas.toBlob(
                (blob) => {
                    const file = new File([blob], `photo-${Date.now()}.jpg`, {
                        type: "image/jpeg",
                    });
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                    closeCamera(); // Tutup kamera setelah jepret
                },
                "image/jpeg",
                0.8,
            );
        }
    };

    // --- HANDLER PEREKAM SUARA ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, {
                    type: "audio/webm",
                });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerIntervalRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Akses mikrofon ditolak:", err);
            alert("Harap izinkan akses mikrofon di browser Anda.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerIntervalRef.current);
        }
    };

    const cancelAudio = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setIsRecording(false);
        clearInterval(timerIntervalRef.current);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // --- HANDLER KIRIM PESAN ---
    const sendMessage = async (e) => {
        e?.preventDefault();

        if (!message.trim() && !imageFile && !audioBlob) return;
        if (!conversationId || isUploading) return;

        setIsUploading(true);
        let imageUrl = null;
        let audioUrlDb = null;
        let notifyText = message.trim() || "";

        if (imageFile) {
            const fileName = `img-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from("chat-media")
                .upload(`chat-images/${fileName}`, imageFile);
            if (!uploadError) {
                const { data } = supabase.storage
                    .from("chat-media")
                    .getPublicUrl(`chat-images/${fileName}`);
                imageUrl = data.publicUrl;
                notifyText = notifyText
                    ? `📷 Foto: ${notifyText}`
                    : "📷 Mengirim foto";
            }
        }

        if (audioBlob) {
            const fileName = `audio-${Date.now()}-${Math.random().toString(36).substring(2)}.webm`;
            const { error: uploadError } = await supabase.storage
                .from("chat-media")
                .upload(`chat-audio/${fileName}`, audioBlob);
            if (!uploadError) {
                const { data } = supabase.storage
                    .from("chat-media")
                    .getPublicUrl(`chat-audio/${fileName}`);
                audioUrlDb = data.publicUrl;
                notifyText = "🎤 Pesan suara";
            }
        }

        const rawText = message.trim();
        const encryptedText = rawText ? encryptMessage(rawText) : null;

        setMessage("");
        removeImage();
        cancelAudio();
        if (textareaRef.current) textareaRef.current.style.height = "46px";

        if (imageUrl) {
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                message: imageUrl,
                type: "image",
            });
        }
        if (audioUrlDb) {
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                message: audioUrlDb,
                type: "audio",
            });
        }
        if (encryptedText) {
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                message: encryptedText,
                type: "text",
            });
        }

        setIsUploading(false);

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
                        title: user.name,
                        message: notifyText,
                    }),
                },
            );
        }
    };

    const handleInput = (e) => {
        const el = e.target;
        el.style.height = "auto";
        el.style.height = Math.min(el.scrollHeight, 120) + "px";
        setMessage(el.value);
    };

    const handleKeyDown = async (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            await sendMessage();
        }
    };

    const registerPush = async () => {
        /* Push Notif Sama */
    };

    const getStatusText = (lastSeen) => {
        if (!lastSeen) return "Offline";
        const diff = (new Date() - new Date(lastSeen)) / 1000 / 60;
        if (diff < 5) return "Online";
        if (diff < 60) return `Terakhir dilihat ${Math.floor(diff)}m lalu`;
        if (diff < 1440)
            return `Terakhir dilihat ${Math.floor(diff / 60)}h lalu`;
        return "Offline";
    };
    // --- HANDLER KIRIM GETAR (PING) ---
    const sendVibrate = async () => {
        // Getar di HP pengirim (sebagai feedback)
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

        // Kirim pesan khusus ke database
        await supabase.from("messages").insert({
            conversation_id: conversationId,
            sender_id: user.id,
            message: friendData.name + " mengirim getar", // Teks yang akan tampil di chat
            type: "vibrate", // 🔥 Tipe khusus untuk trigger getar
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 relative overflow-hidden">
                {/* 🔥 UI KAMERA OVERLAY (Hanya muncul jika isCameraOpen = true) */}
                {isCameraOpen && (
                    <div className="absolute inset-0 z-50 bg-black flex flex-col">
                        <div className="flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 right-0 z-10">
                            <span className="text-white font-medium">
                                Kamera
                            </span>
                            <button
                                onClick={closeCamera}
                                className="text-white hover:text-slate-300 w-10 h-10 flex items-center justify-center bg-black/40 rounded-full"
                            >
                                <i className="fa fa-times text-xl"></i>
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            {/* Canvas hidden untuk meng-capture gambar */}
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </div>

                        <div className="h-32 bg-black flex items-center justify-center pb-8 pt-4">
                            <button
                                onClick={takePhoto}
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center focus:outline-none hover:bg-white/20 transition-all active:scale-95"
                            >
                                <div className="w-12 h-12 bg-white rounded-full"></div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between bg-white border-b border-slate-200 px-6 py-3 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {friendData.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-800 text-sm">
                                {friendData.name}
                            </h2>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${getStatusText(friendData.last_seen) === "Online" ? "bg-emerald-500" : "bg-slate-400"}`}
                                ></span>
                                <span
                                    className={
                                        getStatusText(friendData.last_seen) ===
                                        "Online"
                                            ? "text-emerald-500"
                                            : ""
                                    }
                                >
                                    {getStatusText(friendData.last_seen)}
                                </span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between  px-6 py-3 shrink-0 ">
                        {/* ... info user ... */}

                        <div className="flex gap-1">
                            {/* 🔥 Tombol Getar (PING) */}
                            <button
                                onClick={sendVibrate}
                                className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition"
                                title="Panggil (Getar)"
                            >
                                <i className="fa fa-bolt"></i>
                            </button>

                            <button
                                hidden
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                            >
                                <i className="fa fa-phone"></i>
                            </button>
                            <button
                                hidden
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
                            >
                                <i className="fa fa-video"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
                    {messages.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <i className="fa fa-comments text-4xl mb-3 text-slate-200"></i>
                            <p className="text-sm">Start your conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.sender_id === user.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] flex flex-col ${isMine ? "items-end" : "items-start"}`}
                                    >
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] ${isMine ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-slate-700 border border-slate-200 rounded-bl-none"}`}
                                        >
                                            {msg.type === "image" ? (
                                                <img
                                                    src={msg.message}
                                                    alt="media"
                                                    className="rounded-lg max-w-[240px] max-h-[300px] object-cover cursor-pointer"
                                                />
                                            ) : msg.type === "audio" ? (
                                                <audio
                                                    src={msg.message}
                                                    controls
                                                    className="h-10 max-w-[220px]"
                                                />
                                            ) : (
                                                <p className="whitespace-pre-wrap break-words">
                                                    {decryptMessage(
                                                        msg.message,
                                                    )}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                                            {new Date(
                                                msg.created_at,
                                            ).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef}></div>
                </div>

                {/* Footer / Input Area */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 shrink-0 z-20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)]">
                    {imagePreview && (
                        <div className="relative mb-3 inline-block">
                            <img
                                src={imagePreview}
                                className="h-20 w-20 rounded-lg object-cover border-2 border-indigo-100 shadow-sm"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full h-5 w-5 flex items-center justify-center hover:bg-slate-700 transition"
                            >
                                <i className="fa fa-times text-[10px]"></i>
                            </button>
                        </div>
                    )}

                    <form
                        onSubmit={sendMessage}
                        className="flex items-end gap-2 m-0"
                    >
                        {/* Tombol Attachment & Kamera */}
                        {!isRecording && !audioUrl && (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    className="text-slate-400 hover:text-indigo-600 text-xl h-11 w-10 flex items-center justify-center shrink-0 transition"
                                >
                                    <i className="fa fa-paperclip"></i>
                                </button>
                                {/* 🔥 Tombol untuk membuka Kamera In-App */}
                                <button
                                    type="button"
                                    onClick={openCamera}
                                    className="text-slate-400 hover:text-indigo-600 text-xl h-11 w-10 flex items-center justify-center shrink-0 transition"
                                >
                                    <i className="fa fa-camera"></i>
                                </button>
                            </>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />

                        {/* Area Input Dinamis */}
                        {isRecording ? (
                            <div className="flex-1 flex items-center justify-between bg-red-50 text-red-500 rounded-2xl px-5 h-[46px]">
                                <div className="flex items-center gap-3 animate-pulse">
                                    <i className="fa fa-microphone"></i>
                                    <span className="font-semibold">
                                        {formatTime(recordingTime)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={stopRecording}
                                    className="text-red-600 font-bold text-sm hover:text-red-800"
                                >
                                    STOP
                                </button>
                            </div>
                        ) : audioUrl ? (
                            <div className="flex-1 flex items-center gap-2 bg-slate-50 rounded-2xl px-2 h-[46px]">
                                <button
                                    type="button"
                                    onClick={cancelAudio}
                                    className="text-slate-400 hover:text-red-500 w-8 h-8 flex items-center justify-center rounded-full transition"
                                >
                                    <i className="fa fa-trash"></i>
                                </button>
                                <audio
                                    src={audioUrl}
                                    controls
                                    className="h-8 flex-1 outline-none"
                                />
                            </div>
                        ) : (
                            <textarea
                                ref={textareaRef}
                                value={message}
                                onInput={handleInput}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-slate-50 border-0 rounded-2xl px-4 py-3 text-[14px] focus:ring-2 focus:ring-indigo-100 resize-none transition-all shadow-inner"
                                style={{ height: "46px" }}
                            />
                        )}

                        {/* Tombol Mic / Kirim */}
                        {!message.trim() && !imageFile && !audioUrl ? (
                            <button
                                type="button"
                                onClick={
                                    isRecording ? stopRecording : startRecording
                                }
                                className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all ${isRecording ? "bg-red-500 text-white animate-bounce" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                            >
                                <i className="fa fa-microphone"></i>
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isUploading}
                                className={`h-11 w-11 shrink-0 rounded-full flex items-center justify-center transition-all ${isUploading ? "bg-slate-100 text-slate-300" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"}`}
                            >
                                {isUploading ? (
                                    <i className="fa fa-spinner fa-spin"></i>
                                ) : (
                                    <i className="fa fa-paper-plane text-sm -ml-1 mt-0.5"></i>
                                )}
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
