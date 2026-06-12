<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => false,
            'status' => session('status'),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
 $response = Http::withHeaders([
    'apikey' => env('SUPABASE_ANON_KEY'),
    'Content-Type' => 'application/json',
])->post(
    env('SUPABASE_URL') . '/auth/v1/token?grant_type=password',
    [
        'email' => $request->email,
        'password' => $request->password,
    ]
);

        if (!$response->successful()) {
            return back()->withErrors([
                'email' => 'Email atau password salah.',
            ]);
        }

        $data = $response->json();
session([
    'supabase_access_token' => $data['access_token'],
    'supabase_refresh_token' => $data['refresh_token'],
    'supabase_user' => $data['user'],
]);
$request->session()->regenerate();

return redirect()->intended(route('home'));

    }

public function destroy(Request $request): RedirectResponse
{
    // logout dari Supabase (optional tapi bagus)
    if (session()->has('supabase_access_token')) {
        Http::withHeaders([
            'apikey' => env('SUPABASE_ANON_KEY'),
            'Authorization' => 'Bearer ' . session('supabase_access_token'),
        ])->post(env('SUPABASE_URL') . '/auth/v1/logout');
    }

    $request->session()->forget([
        'supabase_access_token',
        'supabase_refresh_token',
        'supabase_user',
    ]);
    $request->session()->invalidate();
    $request->session()->regenerateToken();

}
}