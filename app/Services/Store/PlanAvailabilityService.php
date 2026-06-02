<?php

namespace Pterodactyl\Services\Store;

use Pterodactyl\Services\Deployment\FindViableNodesService;
use Pterodactyl\Services\Deployment\AllocationSelectionService;
use Pterodactyl\Exceptions\Service\Deployment\NoViableNodeException;
use Pterodactyl\Exceptions\Service\Deployment\NoViableAllocationException;

class PlanAvailabilityService
{
    public function __construct(
        private FindViableNodesService $findViableNodesService,
        private AllocationSelectionService $allocationSelectionService,
    ) {
    }

    /**
     * Determine whether a plan can currently be deployed. A plan is in stock
     * only when at least one public node in the configured locations has enough
     * free memory and disk for it, and that node has a free allocation.
     */
    public function isAvailable(array $plan): bool
    {
        $locations = array_map('intval', config('store.location_ids', []));

        try {
            $nodes = $this->findViableNodesService
                ->setLocations($locations)
                ->setMemory((int) $plan['memory'])
                ->setDisk((int) $plan['disk'])
                ->handle();
        } catch (NoViableNodeException) {
            return false;
        }

        try {
            $this->allocationSelectionService
                ->setDedicated(false)
                ->setNodes($nodes->pluck('id')->toArray())
                ->setPorts([])
                ->handle();
        } catch (NoViableAllocationException) {
            return false;
        }

        return true;
    }
}
