<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\View\View;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Services\Helpers\SoftwareVersionService;
use Pterodactyl\Services\Store\StoreStatusService;

class BaseController extends Controller
{
    /**
     * BaseController constructor.
     */
    public function __construct(
        private SoftwareVersionService $version,
        private ConfigRepository $config,
        private StoreStatusService $storeStatus,
    ) {
    }

    /**
     * Return the admin index view.
     */
    public function index(): View
    {
        return view('admin.index', [
            'version' => $this->version,
            'storeStatus' => $this->storeStatus->getStatus(),
            'storeOrderUrl' => url('/order'),
            'storeSettingsUrl' => route('admin.settings.store'),
            'storeDisabled' => $this->config->get('pterodactyl.load_environment_only', false),
        ]);
    }
}
