<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Users\UserCreationService;
use Pterodactyl\Http\Requests\Auth\RegisterRequest;

class RegisterController extends AbstractLoginController
{
    public function __construct(private UserCreationService $creationService)
    {
        parent::__construct();
    }

    /**
     * Handle a registration request to the application.
     *
     * @throws \Exception
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->creationService->handle([
            'email' => $request->input('email'),
            'username' => $request->input('username'),
            'name_first' => $request->input('name_first'),
            'name_last' => $request->input('name_last'),
            'password' => $request->input('password'),
            'root_admin' => false,
        ], sendNotification: false);

        Activity::event('auth:register')->withRequestMetadata()->subject($user)->log();

        return $this->sendLoginResponse($user, $request);
    }
}
