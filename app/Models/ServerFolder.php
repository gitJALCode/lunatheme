<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * \Pterodactyl\Models\ServerFolder.
 *
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $color
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property User $user
 * @property \Illuminate\Database\Eloquent\Collection|\Pterodactyl\Models\Server[] $servers
 */
class ServerFolder extends Model
{
    public const RESOURCE_NAME = 'server_folder';

    protected $table = 'server_folders';

    protected $fillable = [
        'name',
        'color',
    ];

    public static array $validationRules = [
        'user_id' => ['required', 'integer', 'exists:users,id'],
        'name' => ['required', 'string', 'max:191'],
        'color' => ['required', 'string', 'max:16'],
    ];

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\Pterodactyl\Models\User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany<\Pterodactyl\Models\Server, $this>
     */
    public function servers(): BelongsToMany
    {
        return $this->belongsToMany(Server::class, 'server_folder_server', 'server_folder_id', 'server_id');
    }
}
