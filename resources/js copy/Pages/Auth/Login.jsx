import Checkbox from "@/Components/Checkbox";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            {/* ── Header Section ── */}
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Welcome back
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Please enter your details to sign in.
                </p>
            </div>

            {/* ── Status Message ── */}
            {status && (
                <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm font-medium text-green-600 border border-green-100">
                    {status}
                </div>
            )}

            {/* ── Login Form ── */}
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <InputLabel htmlFor="email" value="Email Address" />
                    <TextInput
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1.5 block w-full rounded-lg border-slate-300 px-4 py-2.5 shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500"
                        autoComplete="username"
                        isFocused={true}
                        onChange={(e) => setData("email", e.target.value)}
                        placeholder="name@example.com"
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" />
                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1.5 block w-full rounded-lg border-slate-300 px-4 py-2.5 shadow-sm transition-colors focus:border-indigo-500 focus:ring-indigo-500"
                        autoComplete="current-password"
                        onChange={(e) => setData("password", e.target.value)}
                        placeholder="••••••••"
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                {/* ── Remember Me & Forgot Password ── */}
                <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center cursor-pointer">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData("remember", e.target.checked)
                            }
                            className="rounded border-slate-300 text-indigo-600 shadow-sm focus:ring-indigo-500"
                        />
                        <span className="ms-2 text-sm font-medium text-slate-600 select-none">
                            Remember me
                        </span>
                    </label>

                    {canResetPassword && (
                        <Link
                            href={route("password.request")}
                            className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-500 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                {/* ── Submit Button ── */}
                <div className="pt-2">
                    <PrimaryButton
                        className="w-full justify-center rounded-lg py-3 text-sm font-semibold tracking-wide transition-all hover:bg-indigo-700 focus:ring-offset-1"
                        disabled={processing}
                    >
                        {processing ? "Signing in..." : "Sign in"}
                    </PrimaryButton>
                </div>

                {/* ── Register Link ── */}
                <p className="mt-6 text-center text-sm text-slate-500">
                    Don't have an account?{" "}
                    <Link
                        href={route("register")}
                        className="font-semibold text-indigo-600 transition-colors hover:text-indigo-500 hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Sign up for free
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
