<?php

namespace Pterodactyl\Http\Controllers\Store;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Services\Store\PlanAvailabilityService;

class PlanController extends Controller
{
    public function __construct(private PlanAvailabilityService $availabilityService)
    {
    }

    /**
     * Return the public plan catalogue together with a live stock flag for each
     * plan. This endpoint is intentionally unauthenticated so the order page can
     * be browsed by anyone.
     */
    public function index(Request $request): JsonResponse
    {
        $plans = collect(config('store.plans'))->map(function (array $plan) {
            return [
                'slug' => $plan['slug'],
                'name' => $plan['name'],
                'price' => $plan['price'],
                'memory' => (int) $plan['memory'],
                'disk' => (int) $plan['disk'],
                'cpu' => (int) $plan['cpu'],
                'databases' => (int) $plan['databases'],
                'backups' => (int) $plan['backups'],
                'in_stock' => !empty($plan['price_id']) && $this->availabilityService->isAvailable($plan),
            ];
        })->values();

        return new JsonResponse([
            'currency' => config('store.currency'),
            'authenticated' => $request->user() !== null,
            'plans' => $plans,
        ]);
    }
}
