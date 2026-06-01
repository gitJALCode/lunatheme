<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class AvatarController extends ClientApiController
{
    /**
     * Uploads and stores a custom avatar for the authenticated user.
     */
    public function store(ClientApiRequest $request): JsonResponse
    {
        $this->validate($request, [
            'avatar' => ['required', 'image', 'mimes:png,jpg,jpeg,webp,gif', 'max:4096'],
        ]);

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');

        $user->forceFill(['avatar' => $path])->saveOrFail();

        return new JsonResponse([
            'object' => 'avatar',
            'attributes' => [
                'avatar' => Storage::disk('public')->url($path),
            ],
        ]);
    }

    /**
     * Removes the custom avatar for the authenticated user.
     */
    public function delete(ClientApiRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->forceFill(['avatar' => null])->saveOrFail();
        }

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }
}
