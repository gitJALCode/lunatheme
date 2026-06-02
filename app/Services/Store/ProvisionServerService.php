<?php

namespace Pterodactyl\Services\Store;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\User;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Objects\DeploymentObject;
use Pterodactyl\Services\Servers\ServerCreationService;

class ProvisionServerService
{
    public function __construct(
        private ServerCreationService $creationService,
    ) {
    }

    /**
     * Create a server for the given user based on a store plan, automatically
     * deploying it onto a node with available capacity.
     *
     * @throws \Throwable
     */
    public function handle(User $user, array $plan, ?string $externalId = null): Server
    {
        $egg = Egg::query()->with('variables')->findOrFail((int) config('store.egg_id'));
        $defaults = config('store.defaults');
        $locations = array_map('intval', config('store.location_ids', []));

        // Seed the environment with each variable's default value, mirroring how
        // the admin "new server" form behaves. Without this, eggs that declare
        // required variables would fail validation during creation.
        $environment = $egg->variables
            ->mapWithKeys(fn ($variable) => [$variable->env_variable => $variable->default_value])
            ->toArray();

        $deployment = (new DeploymentObject())
            ->setDedicated(false)
            ->setLocations($locations)
            ->setPorts([]);

        $data = [
            'external_id' => $externalId,
            'name' => $plan['name'] . '-' . $user->username,
            'description' => 'Provisioned via the ' . $plan['name'] . ' plan.',
            'owner_id' => $user->id,
            'egg_id' => $egg->id,
            'nest_id' => $egg->nest_id,
            'image' => collect($egg->docker_images)->first(),
            'startup' => $egg->startup,
            'environment' => $environment,
            'memory' => (int) $plan['memory'],
            'swap' => (int) $defaults['swap'],
            'disk' => (int) $plan['disk'],
            'io' => (int) $defaults['io'],
            'cpu' => (int) $plan['cpu'],
            'threads' => null,
            'oom_disabled' => (bool) $defaults['oom_disabled'],
            'database_limit' => (int) $plan['databases'],
            'allocation_limit' => (int) $defaults['allocation_limit'],
            'backup_limit' => (int) $plan['backups'],
            'start_on_completion' => true,
        ];

        return $this->creationService->handle($data, $deployment);
    }
}
