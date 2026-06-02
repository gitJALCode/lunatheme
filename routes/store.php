<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Controllers\Store;

/*
|--------------------------------------------------------------------------
| Store Routes
|--------------------------------------------------------------------------
|
| These routes power the public server store. The "/order" pages are served
| by the React SPA and are reachable without authentication so plans can be
| browsed by anyone.
|
*/

// Public SPA shell for the order pages. The React app handles the actual views.
Route::get('/order', [Base\IndexController::class, 'index'])->name('store.index');
Route::get('/order/success', [Base\IndexController::class, 'index'])->name('store.success');
Route::get('/order/cancel', [Base\IndexController::class, 'index'])->name('store.cancel');

Route::prefix('/api/store')->group(function () {
    Route::get('/plans', [Store\PlanController::class, 'index'])->name('store.plans');
    Route::post('/checkout', [Store\CheckoutController::class, 'store'])
        ->middleware('auth')
        ->name('store.checkout');

    // Stripe webhook. This is excluded from CSRF verification (see VerifyCsrfToken).
    Route::post('/webhook', [Store\WebhookController::class, 'handle'])->name('store.webhook');
});
