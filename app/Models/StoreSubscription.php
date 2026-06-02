<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * \Pterodactyl\Models\StoreSubscription.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $server_id
 * @property string $plan_slug
 * @property string|null $stripe_customer_id
 * @property string|null $stripe_subscription_id
 * @property string|null $stripe_checkout_session_id
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property User $user
 * @property Server|null $server
 */
class StoreSubscription extends Model
{
    public const RESOURCE_NAME = 'store_subscription';

    public const STATUS_PENDING = 'pending';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_PAST_DUE = 'past_due';
    public const STATUS_CANCELLED = 'cancelled';

    protected $table = 'store_subscriptions';

    protected $fillable = [
        'user_id',
        'server_id',
        'plan_slug',
        'stripe_customer_id',
        'stripe_subscription_id',
        'stripe_checkout_session_id',
        'status',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'server_id' => 'integer',
    ];

    public static array $validationRules = [
        'user_id' => ['required', 'integer', 'exists:users,id'],
        'plan_slug' => ['required', 'string', 'max:191'],
        'status' => ['required', 'string', 'max:191'],
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\Pterodactyl\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\Pterodactyl\Models\Server, $this>
     */
    public function server(): BelongsTo
    {
        return $this->belongsTo(Server::class);
    }
}
