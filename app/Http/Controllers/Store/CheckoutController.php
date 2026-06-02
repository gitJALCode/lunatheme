<?php

namespace Pterodactyl\Http\Controllers\Store;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Store\PlanAvailabilityService;
use Pterodactyl\Services\Store\CreateCheckoutSessionService;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CheckoutController extends Controller
{
    public function __construct(
        private PlanAvailabilityService $availabilityService,
        private CreateCheckoutSessionService $checkoutSessionService,
    ) {
    }

    /**
     * Create a Stripe Checkout session for the requested plan and return the URL
     * the client should be redirected to. Stock is re-validated here to guard
     * against capacity changing between page load and purchase.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'plan' => 'required|string',
        ]);

        $plan = config("store.plans.{$data['plan']}");
        if (!$plan || empty($plan['price_id'])) {
            throw new NotFoundHttpException('The requested plan does not exist.');
        }

        if (!$this->availabilityService->isAvailable($plan)) {
            throw new ConflictHttpException('This plan is currently out of stock.');
        }

        $url = $this->checkoutSessionService->handle($request->user(), $plan);

        return new JsonResponse(['url' => $url]);
    }
}
