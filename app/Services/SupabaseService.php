<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class SupabaseService
{
    protected $url;
    protected $key;

    public function __construct()
    {
        $this->url = env('SUPABASE_URL');
        $this->key = env('SUPABASE_ANON_KEY');
    }

    private function headers()
    {
        return [
            'apikey' => $this->key,
            'Authorization' => 'Bearer ' . $this->key,
            'Content-Type' => 'application/json',
        ];
    }

    // READ (all)
    public function getAll($table)
    {
        return Http::withHeaders($this->headers())
            ->get("$this->url/rest/v1/$table")
            ->json();
    }

    // READ (by id)
public function getByFriendId($table, $id)
{    $data = Http::withHeaders($this->headers())
        ->get("$this->url/rest/v1/$table?select=user_id,friend_id,user:users!user_id(*),friend:users!friend_id(*)&or=(user_id.eq.$id,friend_id.eq.$id)")
        ->json();

    return collect($data)->map(function ($item) use ($id) {

        // kalau saya sebagai user_id → ambil friend
        if ($item['user_id'] == $id) {
            return $item['friend'];
        }

        // kalau saya sebagai friend_id → ambil user
        return $item['user'];
    })->values()->all();
    return response()->json($data);
}

    // CREATE
    public function create($table, $data)
    {
        return Http::withHeaders($this->headers())
            ->post("$this->url/rest/v1/$table", $data)
            ->json();
    }

    // UPDATE
    public function update($table, $id, $data)
    {
        return Http::withHeaders($this->headers())
            ->patch("$this->url/rest/v1/$table?id=eq.$id", $data)
            ->json();
    }

    // DELETE
    public function delete($table, $id)
    {
        return Http::withHeaders($this->headers())
            ->delete("$this->url/rest/v1/$table?id=eq.$id")
            ->json();
    }

    public function createConversation($userId, $friendId)
{
    // Buat conversation

    $conversationId = rand(1000, 9999);

    // Tambahkan participant
    Http::withHeaders($this->headers())
        ->post("{$this->url}/rest/v1/conversations", [
            [
                'id' => $conversationId,
            ],
        ])
        ->throw();

    return $conversationId;
}
public function addParticipant($conversationId, $userId)
{
        return Http::withHeaders([
            ...$this->headers(),
            'Prefer' => 'return=representation',
        ])
        ->post("{$this->url}/rest/v1/conversation_participants", [
            'conversation_id' => (int) $conversationId,
            'user_id' => $userId,
        ])
        ->throw()
        ->json();
}
public function findConversation($userId, $friendId)
{
    $response = Http::withHeaders($this->headers())
        ->get($this->url . "/rest/v1/conversation_participants", [
            'select' => '*',
            'or' => "(and(user_id.eq.$userId),and(user_id.eq.$friendId))"
        ]);

    return $response->json();
}
}
