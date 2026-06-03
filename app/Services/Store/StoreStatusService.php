<?php

namespace Pterodactyl\Services\Store;

use Illuminate\Contracts\Config\Repository as ConfigRepository;

class StoreStatusService
{
    public function __construct(private ConfigRepository $config)
    {
    }

    /**
     * @return array{stripe_secret: bool, webhook_secret: bool, price_ids: bool, egg: bool, ready: bool}
     */
    public function getStatus(): array
    {
        $plans = $this->config->get('store.plans', []);
        $priceIds = collect($plans)->pluck('price_id')->filter()->count();

        $status = [
            'stripe_secret' => !empty($this->config->get('store.stripe.secret')),
            'webhook_secret' => !empty($this->config->get('store.stripe.webhook_secret')),
            'price_ids' => $priceIds >= count($plans) && count($plans) > 0,
            'egg' => !empty($this->config->get('store.egg_id')),
        ];

        $status['ready'] = $status['stripe_secret']
            && $status['webhook_secret']
            && $status['price_ids']
            && $status['egg'];

        return $status;
    }
}
