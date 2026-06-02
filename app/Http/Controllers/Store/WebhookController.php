<?php

namespace Pterodactyl\Http\Controllers\Store;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Store\StripeWebhookService;

class WebhookController extends Controller
{
    public function __construct(private StripeWebhookService $webhookService)
    {
    }

    /**
     * Receive and process a Stripe webhook event. The payload signature is
     * verified inside the service using the configured webhook secret.
     */
    public function handle(Request $request): Response
    {
        try {
            $this->webhookService->handle(
                $request->getContent(),
                $request->header('Stripe-Signature', '')
            );
        } catch (\UnexpectedValueException|\Stripe\Exception\SignatureVerificationException $exception) {
            return new Response('Invalid payload.', Response::HTTP_BAD_REQUEST);
        } catch (\Throwable $exception) {
            Log::error('Failed to process Stripe webhook.', ['exception' => $exception]);

            return new Response('Webhook handler failed.', Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return new Response('Webhook handled.', Response::HTTP_OK);
    }
}
