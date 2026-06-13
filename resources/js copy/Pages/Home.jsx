import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, Link, usePage } from "@inertiajs/react";

export default function Dashboard() {
    const { friends } = usePage().props;
    console.log(friends);
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Chatings Personal
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12 px-4 lg:hidden">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* FRIEND LIST */}
                    <h3 className="text-lg font-bold mb-3">Friend List</h3>

                    <div className="space-y-3">
                        {friends?.map((friend) => (
                            <Link
                                key={friend.id}
                                href={route("chat.show", friend.id)}
                                className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-slate-50 transition"
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
                    </div>
                </div>

                {/* CONTENT */}
            </div>
        </AuthenticatedLayout>
    );
}
