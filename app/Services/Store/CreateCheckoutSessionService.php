<?php

namespace Pterodactyl\Services\Store;

use Stripe\StripeClient;
use Pterodactyl\Models\User;

class CreateCheckoutSessionService
{
    /**
     * Create a Stripe Checkout session for a monthly subscription to the given
     * plan and return the hosted checkout URL the customer should be sent to.
     */
    public function handle(User $user, array $plan): string
    {
        $stripe = new StripeClient(config('store.stripe.secret'));

        $session = $stripe->checkout->sessions->create([
            'mode' => 'subscription',
            'line_items' => [
                [
                    'price' => $plan['price_id'],
                    'quantity' => 1,
                ],
            ],
            'customer_email' => $user->email,
            'client_reference_id' => (string) $user->id,
            'success_url' => url('/order/success') . '?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => url('/order/cancel'),
            'metadata' => [
                'plan_slug' => $plan['slug'],
                'user_id' => (string) $user->id,
                'user_uuid' => $user->uuid,
            ],
            'subscription_data' => [
                'metadata' => [
                    'plan_slug' => $plan['slug'],
                    'user_id' => (string) $user->id,
                ],
            ],
        ]);

        return $session->url;
    }
}
