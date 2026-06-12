<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/home', [App\Http\Controllers\Home::class, 'index'])->middleware(['supabase.auth'])->name('home');
Route::post('/add-friend', [App\Http\Controllers\Home::class, 'add_friends'])->middleware(['supabase.auth'])->name('friends.add');
Route::get('/chat-show/{id}', [App\Http\Controllers\Home::class, 'chat_show'])->middleware(['supabase.auth'])->name('chat.show');
Route::middleware('supabase.auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
