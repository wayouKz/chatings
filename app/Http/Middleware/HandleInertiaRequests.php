<?php

namespace App\Http\Middleware;

use App\Services\SupabaseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';
 protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }
    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
public function share(Request $request): array
{
    if ($request->user()) {
        $request->user()->update(['last_seen' => now()]);
    }
return [
    ...parent::share($request),
    'auth' => [
        'user' => $request->user(),

    ],
    'allUsers' => $request->user()
            ? \App\Models\User::where('id', '!=', $request->user()->id)->get()
            : [],

            'friends' => $this->supabase->getByFriendId('friendships', Auth::user()->id),
];
}
}