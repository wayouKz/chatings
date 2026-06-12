import { Head, Link } from "@inertiajs/react";
import { useState, useEffect } from "react";

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIosPrompt, setIsIosPrompt] = useState(false); // State baru untuk iOS

    useEffect(() => {
        // Cek apakah aplikasi sudah diinstall (dukungan untuk Chrome/Edge & iOS Safari)
        if (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone
        ) {
            setIsInstalled(true);
        }

        // Deteksi apakah perangkat adalah iOS
        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        // Jika ini iOS dan belum diinstal, tampilkan prompt manual iOS
        if (isIos() && !window.navigator.standalone) {
            setIsIosPrompt(true);
        }

        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstallable(false);
            setIsInstalled(true);
            setDeferredPrompt(null);
            setIsIosPrompt(false);
        };

        window.addEventListener(
            "beforeinstallprompt",
            handleBeforeInstallPrompt,
        );
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt,
            );
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();

        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
            console.log("User accepted the install prompt");
        } else {
            console.log("User dismissed the install prompt");
        }

        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return (
        <>
            <Head title="Welcome" />
            <div className="bg-gray-50 text-black/50 dark:bg-black dark:text-white/50">
                <img
                    id="background"
                    className="absolute -left-20 top-0 max-w-[877px] opacity-20"
                    src="https://laravel.com/assets/img/welcome/background.svg"
                    alt="background"
                />
                <div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-indigo-500 selection:text-white">
                    <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                        <header className="flex justify-end py-10">
                            <nav className="-mx-3 flex flex-1 justify-end">
                                <>
                                    <Link
                                        href={route("login")}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-indigo-500 dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white font-medium"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route("register")}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-indigo-500 dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white font-medium"
                                    >
                                        Register
                                    </Link>
                                </>
                            </nav>
                        </header>

                        <main className="mt-10 flex flex-col items-center text-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 mb-8">
                                <svg
                                    className="h-12 w-12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>

                            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl mb-4">
                                ChatApp
                            </h1>

                            <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                                Connect with your friends instantly. Install our
                                app to your home screen for a faster,
                                native-like experience.
                            </p>

                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                {isInstalled ? (
                                    <div className="rounded-full bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-600 ring-1 ring-inset ring-green-500/20 flex items-center gap-2">
                                        <svg
                                            className="h-5 w-5"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        App is Installed
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInstallClick}
                                        disabled={!isInstallable}
                                        className={`rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-all ${
                                            isInstallable
                                                ? "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600 hover:scale-105 cursor-pointer"
                                                : "bg-slate-400 cursor-not-allowed opacity-70"
                                        }`}
                                    >
                                        {isInstallable
                                            ? "Install App"
                                            : "Install Not Available"}
                                    </button>
                                )}

                                {auth.user ? (
                                    <Link
                                        href={route("home")}
                                        className="text-sm font-semibold leading-6 text-slate-900 dark:text-white hover:underline"
                                    >
                                        Open Web App{" "}
                                        <span aria-hidden="true">→</span>
                                    </Link>
                                ) : (
                                    <Link
                                        href={route("login")}
                                        className="text-sm font-semibold leading-6 text-slate-900 dark:text-white hover:underline"
                                    >
                                        Login to continue{" "}
                                        <span aria-hidden="true">→</span>
                                    </Link>
                                )}
                            </div>

                            {!isInstallable && !isInstalled && (
                                <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    PWA installation might not be supported in
                                    your current browser, or the app
                                    requirements haven't been met yet (requires
                                    HTTPS and valid manifest).
                                </p>
                            )}
                        </main>

                        <footer className="absolute bottom-10 left-0 right-0 text-center text-sm text-slate-500 dark:text-slate-400">
                            ChatApp &copy; {new Date().getFullYear()}
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}
