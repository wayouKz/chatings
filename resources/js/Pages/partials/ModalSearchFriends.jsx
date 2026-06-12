import { router, usePage } from "@inertiajs/react";
import { useState } from "react";

export default function ModalSearchFriends({ onClose }) {
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [addedIds, setAddedIds] = useState([]);

    // Ambil daftar semua user dari props (pastikan di-share dari backend)
    const allUsers = usePage().props.allUsers || [];
    const currentUser = usePage().props.auth.user;
    const friends = usePage().props.friends || [];
    const friendIds = new Set(friends.map((f) => f.id));

    const filtered = allUsers.filter(
        (u) =>
            u.id !== currentUser.id &&
            (u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())),
    );

    const handleAdd = (userId) => {
        setLoading(true);
        router.post(
            route("friends.add", { friend_id: userId }),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAddedIds((prev) => [...prev, userId]);
                    setLoading(false);
                },
                onError: () => setLoading(false),
            },
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/60">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                        <h2 className="text-[15px] font-semibold text-slate-800">
                            Add Friend
                        </h2>
                        <p className="text-[11px] text-slate-400">
                            Find and add people to chat with
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pt-4 pb-2">
                    <div className="relative">
                        <svg
                            className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or email…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition"
                            autoFocus
                        />
                    </div>
                </div>

                {/* User list */}
                <ul className="max-h-72 overflow-y-auto px-3 pb-3">
                    {filtered.length === 0 ? (
                        <li className="py-8 text-center text-sm text-slate-400">
                            No users found
                        </li>
                    ) : (
                        filtered.map((user) => {
                            const isFriend = friendIds.has(user.id);
                            const isAdded = addedIds.includes(user.id);
                            const initials = user.name
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();

                            return (
                                <li
                                    key={user.id}
                                    className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition hover:bg-slate-50"
                                >
                                    {/* Avatar */}
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-sm">
                                        {initials}
                                    </div>

                                    {/* Info */}
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-[13px] font-medium text-slate-700">
                                            {user.name}
                                        </div>
                                        <div className="truncate text-[11px] text-slate-400">
                                            {user.email}
                                        </div>
                                    </div>

                                    {/* Action */}
                                    {isFriend || isAdded ? (
                                        <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-medium text-green-600">
                                            <svg
                                                className="h-3 w-3"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            {isFriend ? "Friends" : "Added"}
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleAdd(user.id)}
                                            disabled={loading}
                                            className="flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                                        >
                                            <svg
                                                className="h-3 w-3"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <line
                                                    x1="12"
                                                    y1="5"
                                                    x2="12"
                                                    y2="19"
                                                />
                                                <line
                                                    x1="5"
                                                    y1="12"
                                                    x2="19"
                                                    y2="12"
                                                />
                                            </svg>
                                            Add
                                        </button>
                                    )}
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
        </>
    );
}
