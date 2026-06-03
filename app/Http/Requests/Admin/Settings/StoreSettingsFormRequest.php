<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Illuminate\Validation\Rule;
use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class StoreSettingsFormRequest extends AdminFormRequest
{
    /**
     * Return rules to validate store settings POST data against.
     */
    public function rules(): array
    {
        return [
            'store:stripe:key' => ['nullable', 'string', 'max:191', 'regex:/^pk_/'],
            'store:stripe:secret' => ['nullable', 'string', 'max:191', 'regex:/^(sk_|rk_)/'],
            'store:stripe:webhook_secret' => ['nullable', 'string', 'max:191', 'regex:/^whsec_/'],
            'store:plans:explorer:price_id' => ['nullable', 'string', 'max:191', 'regex:/^price_/'],
            'store:plans:builder:price_id' => ['nullable', 'string', 'max:191', 'regex:/^price_/'],
            'store:plans:community:price_id' => ['nullable', 'string', 'max:191', 'regex:/^price_/'],
            'store:egg_id' => ['nullable', 'integer', Rule::exists('eggs', 'id')],
            'store:location_ids' => ['nullable', 'array'],
            'store:location_ids.*' => ['integer', Rule::exists('locations', 'id')],
        ];
    }

    /**
     * Override the default normalization function for this type of request
     * as we need to accept empty values on the keys and omit blank secrets.
     */
    public function normalize(?array $only = null): array
    {
        $keys = array_flip(array_keys($this->rules()));

        if (empty($this->input('store:stripe:secret'))) {
            unset($keys['store:stripe:secret']);
        }

        if (empty($this->input('store:stripe:webhook_secret'))) {
            unset($keys['store:stripe:webhook_secret']);
        }

        return $this->only(array_flip($keys));
    }
}
