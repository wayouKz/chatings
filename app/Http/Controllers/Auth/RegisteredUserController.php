<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
            'password' => [
                'required',
                'confirmed',
                Rules\Password::defaults(),
            ],
        ]);
$authResponse = Http::withHeaders([
    'apikey' => env('SUPABASE_ANON_KEY'),
    'Content-Type' => 'application/json',
])->post(
    env('SUPABASE_URL') . '/auth/v1/signup',
    [
        'email' => $request->email,
        'password' => $request->password,
    ]
);

$authData = $authResponse->json();

if (!$authResponse->successful()) {
    throw ValidationException::withMessages([
        'email' => [
            $authData['msg']
                ?? 'Registrasi gagal.'
        ],
    ]);
}

$userId = $authData['user']['id'];
    $response = Http::withHeaders([
    'apikey' => env('SUPABASE_ANON_KEY'),
    'Authorization' => 'Bearer ' . env('SUPABASE_ANON_KEY'),
    'Content-Type' => 'application/json',
    'Prefer' => 'return=representation',
])->post(
    env('SUPABASE_URL') . '/rest/v1/users',
    [
        'id' => $userId,
        'name' => $request->name,
        'email' => $request->email,
        'password' => bcrypt($request->password),
    ]
);

        if (!$response->successful()) {
            throw ValidationException::withMessages([
                'email' => [
                    $response->json()['msg']
                        ?? 'Registrasi gagal.'
                ],
            ]);
        }

        $data = $response->json();
        if (isset($data['access_token'])) {
            session([
                'supabase_access_token' => $data['access_token'],
                'supabase_refresh_token' => $data['refresh_token'],
                'supabase_user' => $data['user'],
            ]);

            return redirect()->route('dashboard');
        }

        return redirect()
            ->route('login')
            ->with(
                'status',
                'Registrasi berhasil. Silakan cek email untuk verifikasi akun.'
            );
    }
}
