<?php

namespace App\Http\Controllers;

use App\Services\SupabaseService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class Home extends Controller
{

    protected $supabase;

    public function __construct(SupabaseService $supabase)
    {
        $this->supabase = $supabase;
    }
    public function index()
    {
       $user = session('supabase_user');

    if (!$user || !isset($user['id'])) {
        $friends = [];
    } else {
        $friends = $this->supabase->getByFriendId('friendships', $user['id']);
    }

        $allUsers = $this->supabase->getAll('users');
        return Inertia::render('Home', [
            'friends' => $friends,
            'allUsers' => $allUsers,
        ]);
    }

    public function add_friends()
    {
        $friendId = request('friend_id');
       $post = $this->supabase->create('friendships', [
            'user_id' => Auth::user()->id,
            'friend_id' => $friendId,
        ]);
        return redirect()->route('home');
    }

public function chat_show($friendId)
{
   $conversation = $this->supabase->findConversation(
    Auth::user()->id,
    $friendId
    );

    $friendsData = $this->supabase->getByFriendId('friendships', Auth::user()->id);
if (empty($conversation)) {

    $conversation = $this->supabase->createConversation(Auth::user()->id, $friendId);
    $this->supabase->addParticipant(
        $conversation,
        Auth::user()->id
    );

    $this->supabase->addParticipant(
        $conversation,
        $friendId
    );
}
return Inertia::render('ChatShow', [
    'conversationId' => $conversation[0]['conversation_id'] ?? null,
    'friendId' => $friendId,
    'friendData' => $friendsData[0]
]);
}
}