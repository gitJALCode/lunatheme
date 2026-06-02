<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Store / Billing Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the public server store (the "/order" page). Plans are
    | sold as monthly Stripe subscriptions and a server is provisioned
    | automatically once payment succeeds.
    |
    */

    // Three-letter ISO currency code used for display purposes.
    'currency' => env('STORE_CURRENCY', 'eur'),

    'stripe' => [
        'key' => env('STRIPE_KEY'),
        'secret' => env('STRIPE_SECRET'),
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],

    // The egg every provisioned server is created from. Set this to the ID of
    // the egg you want customers to receive (configured in the admin area).
    'egg_id' => env('STORE_DEFAULT_EGG_ID') ? (int) env('STORE_DEFAULT_EGG_ID') : null,

    // Optional comma-separated list of location IDs to deploy into. Leave empty
    // to consider every public node when checking stock and deploying.
    'location_ids' => array_values(array_filter(array_map(
        'intval',
        array_filter(array_map('trim', explode(',', (string) env('STORE_DEPLOY_LOCATION_IDS', ''))), 'strlen')
    ))),

    // Resource values shared by every plan. Only memory, disk and cpu differ
    // between the individual plans below.
    'defaults' => [
        'swap' => 0,
        'io' => 500,
        'oom_disabled' => true,
        'allocation_limit' => 0,
    ],

    /*
    | Plan catalogue. The "memory" and "disk" values are in MiB and are used
    | both for provisioning and for the live stock check against node capacity.
    | "price" is a display string; the real charge comes from the Stripe Price.
    */
    'plans' => [
        'explorer' => [
            'slug' => 'explorer',
            'name' => 'Explorer',
            'price' => '8.49',
            'price_id' => env('STRIPE_PRICE_EXPLORER'),
            'memory' => 4096,
            'disk' => 20480,
            'cpu' => 200,
            'databases' => 1,
            'backups' => 2,
        ],
        'builder' => [
            'slug' => 'builder',
            'name' => 'Builder',
            'price' => '11.99',
            'price_id' => env('STRIPE_PRICE_BUILDER'),
            'memory' => 6144,
            'disk' => 30720,
            'cpu' => 300,
            'databases' => 2,
            'backups' => 3,
        ],
        'community' => [
            'slug' => 'community',
            'name' => 'Community',
            'price' => '15.49',
            'price_id' => env('STRIPE_PRICE_COMMUNITY'),
            'memory' => 8192,
            'disk' => 51200,
            'cpu' => 400,
            'databases' => 3,
            'backups' => 5,
        ],
    ],
];
