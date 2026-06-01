<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Models\ServerFolder;
use Pterodactyl\Http\Requests\Api\Client\ClientApiRequest;

class FolderController extends ClientApiController
{
    /**
     * Returns all of the folders configured by the authenticated user.
     */
    public function index(ClientApiRequest $request): JsonResponse
    {
        $folders = $request->user()->serverFolders()->with('servers:id,uuid')->get();

        return new JsonResponse([
            'object' => 'list',
            'data' => $folders->map(fn (ServerFolder $folder) => $this->toResource($folder))->all(),
        ]);
    }

    /**
     * Creates a new folder for the authenticated user.
     */
    public function store(ClientApiRequest $request): JsonResponse
    {
        $data = $this->validate($request, [
            'name' => ['required', 'string', 'max:191'],
            'color' => ['nullable', 'string', 'max:16'],
        ]);

        /** @var ServerFolder $folder */
        $folder = $request->user()->serverFolders()->create([
            'name' => $data['name'],
            'color' => $data['color'] ?? '#4f46e5',
        ]);

        return new JsonResponse($this->toResource($folder->load('servers:id,uuid')), JsonResponse::HTTP_CREATED);
    }

    /**
     * Updates an existing folder owned by the authenticated user.
     */
    public function update(ClientApiRequest $request, int $folder): JsonResponse
    {
        $model = $this->findFolder($request, $folder);

        $data = $this->validate($request, [
            'name' => ['sometimes', 'required', 'string', 'max:191'],
            'color' => ['sometimes', 'required', 'string', 'max:16'],
        ]);

        $model->update($data);

        return new JsonResponse($this->toResource($model->load('servers:id,uuid')));
    }

    /**
     * Deletes a folder. Servers assigned to the folder are not deleted.
     */
    public function delete(ClientApiRequest $request, int $folder): JsonResponse
    {
        $model = $this->findFolder($request, $folder);
        $model->delete();

        return new JsonResponse([], JsonResponse::HTTP_NO_CONTENT);
    }

    /**
     * Replaces the set of servers assigned to a folder. Only servers the user
     * can access may be assigned, and a server may only live in one folder.
     */
    public function setServers(ClientApiRequest $request, int $folder): JsonResponse
    {
        $model = $this->findFolder($request, $folder);

        $this->validate($request, [
            'servers' => ['present', 'array'],
            'servers.*' => ['string'],
        ]);

        $uuids = $request->input('servers', []);

        $serverIds = $request->user()->accessibleServers()
            ->whereIn('uuid', $uuids)
            ->pluck('id')
            ->all();

        // Ensure a server only ever belongs to one of this user's folders.
        $otherFolderIds = $request->user()->serverFolders()->where('id', '!=', $model->id)->pluck('id');
        if ($otherFolderIds->isNotEmpty() && count($serverIds) > 0) {
            \DB::table('server_folder_server')
                ->whereIn('server_folder_id', $otherFolderIds)
                ->whereIn('server_id', $serverIds)
                ->delete();
        }

        $model->servers()->sync($serverIds);

        return new JsonResponse($this->toResource($model->load('servers:id,uuid')));
    }

    /**
     * Locate a folder owned by the authenticated user or throw a 404.
     */
    protected function findFolder(ClientApiRequest $request, int $folder): ServerFolder
    {
        return $request->user()->serverFolders()->findOrFail($folder);
    }

    /**
     * Formats a folder into the response structure consumed by the frontend.
     */
    protected function toResource(ServerFolder $folder): array
    {
        return [
            'object' => 'server_folder',
            'attributes' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'color' => $folder->color,
                'servers' => $folder->servers->pluck('uuid')->all(),
            ],
        ];
    }
}
