<?php

namespace Pterodactyl\Services\Store;

use Stripe\Webhook;
use Pterodactyl\Models\User;
use Pterodactyl\Models\StoreSubscription;
use Pterodactyl\Services\Servers\SuspensionService;

class StripeWebhookService
{
    public function __construct(
        private ProvisionServerService $provisionServerService,
        private SuspensionService $suspensionService,
    ) {
    }

    /**
     * Verify the Stripe signature and dispatch the relevant event handler.
     *
     * @throws \Stripe\Exception\SignatureVerificationException
     * @throws \UnexpectedValueException
     */
    public function handle(string $payload, string $signature): void
    {
        $event = Webhook::constructEvent($payload, $signature, config('store.stripe.webhook_secret'));
        $object = $event->data->object;

        match ($event->type) {
            'checkout.session.completed' => $this->handleCheckoutCompleted($object),
            'invoice.payment_failed' => $this->suspendForSubscription($object->subscription ?? null),
            'customer.subscription.deleted' => $this->cancelSubscription($object->id ?? null),
            default => null,
        };
    }

    /**
     * Provision a server for a completed checkout. This is idempotent: replaying
     * the same checkout session will never create a second server.
     *
     * @throws \Throwable
     */
    private function handleCheckoutCompleted(object $session): void
    {
        $slug = $session->metadata->plan_slug ?? null;
        $userId = $session->metadata->user_id ?? null;
        $plan = $slug ? config("store.plans.$slug") : null;

        if (!$plan || !$userId) {
            return;
        }

        $user = User::query()->find((int) $userId);
        if (!$user) {
            return;
        }

        $subscription = StoreSubscription::query()->firstOrCreate(
            ['stripe_checkout_session_id' => $session->id],
            [
                'user_id' => $user->id,
                'plan_slug' => $slug,
                'status' => StoreSubscription::STATUS_PENDING,
            ]
        );

        // A server has already been provisioned for this session, nothing to do.
        if ($subscription->server_id) {
            return;
        }

        $subscriptionId = $session->subscription ?? null;
        $server = $this->provisionServerService->handle($user, $plan, $subscriptionId);

        $subscription->update([
            'server_id' => $server->id,
            'stripe_customer_id' => $session->customer ?? null,
            'stripe_subscription_id' => $subscriptionId,
            'status' => StoreSubscription::STATUS_ACTIVE,
        ]);
    }

    /**
     * Suspend the server tied to a subscription whose payment failed.
     *
     * @throws \Throwable
     */
    private function suspendForSubscription(?string $subscriptionId): void
    {
        if (!$subscriptionId) {
            return;
        }

        $record = StoreSubscription::query()->where('stripe_subscription_id', $subscriptionId)->first();
        if (!$record) {
            return;
        }

        $record->update(['status' => StoreSubscription::STATUS_PAST_DUE]);

        if ($record->server) {
            $this->suspensionService->toggle($record->server, SuspensionService::ACTION_SUSPEND);
        }
    }

    /**
     * Mark a subscription as cancelled and suspend its server.
     *
     * @throws \Throwable
     */
    private function cancelSubscription(?string $subscriptionId): void
    {
        if (!$subscriptionId) {
            return;
        }

        $record = StoreSubscription::query()->where('stripe_subscription_id', $subscriptionId)->first();
        if (!$record) {
            return;
        }

        $record->update(['status' => StoreSubscription::STATUS_CANCELLED]);

        if ($record->server) {
            $this->suspensionService->toggle($record->server, SuspensionService::ACTION_SUSPEND);
        }
    }
}
