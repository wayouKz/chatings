import ModalSearchFriends from "@/Pages/partials/ModalSearchFriends";
import { Link, usePage, router } from "@inertiajs/react";
import { useState, useRef } from "react";

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function AuthenticatedLayout({
    header,
    children,
    onSendMessage,
}) {
    const user = usePage().props?.auth?.user;
    console.log(user);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [addFriendOpen, setAddFriendOpen] = useState(false);
    const [messageText, setMessageText] = useState("");
    const friends = usePage().props.friends || [];

    const chatUser = usePage().props.chatUser || null;
    const isChatPage = route().current("chat.show");

    const initials = user.name
        ? user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : user.email.slice(0, 2).toUpperCase();

    const chatUserInitials = chatUser?.name
        ? chatUser.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()
        : "?";

    const handleSend = () => {
        const text = messageText.trim();
        if (!text) return;
        if (onSendMessage) onSendMessage(text);
        setMessageText("");
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {addFriendOpen && (
                <ModalSearchFriends onClose={() => setAddFriendOpen(false)} />
            )}

            {/* ── Sidebar (desktop only) ── */}
            <aside
                className={[
                    "hidden md:flex flex-col bg-white border-r border-slate-200 z-40 transition-all duration-200 overflow-hidden shrink-0",
                    sidebarOpen ? "w-64" : "w-0",
                ].join(" ")}
            >
                <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-slate-100 px-4">
                    <Link href="/" className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
                            <svg
                                className="h-4 w-4 fill-white"
                                viewBox="0 0 24 24"
                            >
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                            </svg>
                        </div>
                        <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-slate-800">
                            ChatApp
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 overflow-y-auto px-2 py-3">
                    <div className="mb-2 flex items-center justify-between px-2 pt-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Friends
                        </p>
                        <button
                            onClick={() => setAddFriendOpen(true)}
                            title="Add friend"
                            className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                        </button>
                    </div>

                    {friends.length === 0 && (
                        <div className="px-2 py-4 text-xs text-slate-400">
                            No friends yet.{" "}
                            <button
                                onClick={() => setAddFriendOpen(true)}
                                className="text-indigo-500 hover:underline"
                            >
                                Add one!
                            </button>
                        </div>
                    )}

                    {friends?.map((friend) => (
                        <Link
                            key={friend.id}
                            href={route("chat.show", friend.id)}
                            className={[
                                "flex items-center gap-3 rounded-lg px-2.5 py-2 transition",
                                isChatPage && chatUser?.id === friend.id
                                    ? "bg-indigo-50"
                                    : "hover:bg-slate-50",
                            ].join(" ")}
                        >
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-semibold">
                                {friend.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("")
                                    .toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-slate-700">
                                    {friend.name}
                                </div>
                                <div className="text-[11px] text-slate-400 truncate">
                                    {friend.last_message ??
                                        "Start conversation"}
                                </div>
                            </div>
                            <span
                                className={[
                                    "h-2 w-2 rounded-full",
                                    friend.is_online
                                        ? "bg-green-500"
                                        : "bg-slate-300",
                                ].join(" ")}
                            />
                        </Link>
                    ))}
                </nav>

                <div className="shrink-0 border-t border-slate-100 p-2">
                    <UserDropdown user={user} initials={initials} />
                </div>
            </aside>

            {/* ── Main ── */}
            {/* ── Main ── */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* Header hanya akan dirender jika BUKAN di halaman chat */}
                {!isChatPage && (
                    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4">
                        {/* Sidebar toggle */}
                        <button
                            onClick={() => setSidebarOpen((p) => !p)}
                            className="hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Toggle sidebar"
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
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>

                        {/* ── DEFAULT NAVBAR ── */}
                        <Link
                            href="/"
                            className="flex md:hidden items-center gap-2"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
                                <svg
                                    className="h-4 w-4 fill-white"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                                </svg>
                            </div>
                            <span className="text-[15px] font-semibold tracking-tight text-slate-800">
                                ChatApp
                            </span>
                        </Link>

                        <div className="flex-1 overflow-hidden">
                            {header && (
                                <div className="truncate text-sm font-medium text-slate-700">
                                    {header}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setAddFriendOpen(true)}
                            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-100 hover:border-indigo-300"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            <span className="hidden sm:inline">Add Friend</span>
                        </button>

                        <Link
                            href={route("profile.edit")}
                            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
                        >
                            <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span className="hidden sm:inline">Profile</span>
                        </Link>
                    </header>
                )}

                {/* Content — chat page punya padding bawah lebih besar untuk input bar */}
                <main
                    className={[
                        "flex-1 overflow-auto bg-slate-50",
                        isChatPage ? "pb-20 md:pb-0" : "pb-16 md:pb-0",
                    ].join(" ")}
                >
                    {children}
                </main>
            </div>
            {/* ── Bottom: Chat input (mobile, chat page) / Bottom Nav (mobile, lainnya) ── */}
            {isChatPage ? (
                /* ── CHAT INPUT BAR (mobile only) ── */
                <></>
            ) : (
                /* ── BOTTOM NAV (mobile, non-chat pages) ── */
                <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white border-t border-slate-200 flex items-stretch h-16 safe-area-pb">
                    <Link
                        href={route("home")}
                        className={[
                            "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                            route().current("home")
                                ? "text-indigo-600"
                                : "text-slate-400 hover:text-slate-600",
                        ].join(" ")}
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Home
                    </Link>

                    <button
                        onClick={() => setAddFriendOpen(true)}
                        className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                        Add Friend
                    </button>

                    <Link
                        href={route("profile.edit")}
                        className={[
                            "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                            route().current("profile.edit")
                                ? "text-indigo-600"
                                : "text-slate-400 hover:text-slate-600",
                        ].join(" ")}
                    >
                        <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Profile
                    </Link>

                    <button
                        onClick={() => setUserMenuOpen((p) => !p)}
                        className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-600 transition-colors relative"
                    >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white">
                            {initials}
                        </div>
                        Account
                    </button>

                    {userMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setUserMenuOpen(false)}
                            />
                            <div className="fixed bottom-16 right-2 z-50 w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/80">
                                <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="truncate text-[13px] font-medium text-slate-700">
                                            {user.name}
                                        </div>
                                        <div className="truncate text-[11px] text-slate-400">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href={route("profile.edit")}
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Profile
                                </Link>
                                <div className="h-px bg-slate-100" />
                                <Link
                                    href={route("logout")}
                                    method="post"
                                    as="button"
                                    className="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                    onClick={() => setUserMenuOpen(false)}
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Log Out
                                </Link>
                            </div>
                        </>
                    )}
                </nav>
            )}
        </div>
    );
}

// ── UserDropdown ──────────────────────────────────────────────────────────────
function UserDropdown({ user, initials }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
                    <Link
                        href={route("profile.edit")}
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
                        onClick={() => setOpen(false)}
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        Profile
                    </Link>
                    <div className="h-px bg-slate-100" />
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-[13px] text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => setOpen(false)}
                    >
                        <svg
                            className="h-3.5 w-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Log Out
                    </Link>
                </div>
            )}
            <button
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition-colors hover:bg-slate-50"
            >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                    {initials}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-slate-700">
                        {user.name}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">
                        {user.email}
                    </div>
                </div>
                <svg
                    className="h-3.5 w-3.5 shrink-0 text-slate-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="19" r="1" />
                </svg>
            </button>
        </div>
    );
}
