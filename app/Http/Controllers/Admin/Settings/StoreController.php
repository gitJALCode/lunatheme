<?php

namespace Pterodactyl\Http\Controllers\Admin\Settings;

use Stripe\StripeClient;
use Illuminate\View\View;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Pterodactyl\Models\Location;
use Illuminate\Http\RedirectResponse;
use Prologue\Alerts\AlertsMessageBag;
use Illuminate\Contracts\Console\Kernel;
use Pterodactyl\Http\Controllers\Controller;
use Illuminate\Contracts\Encryption\Encrypter;
use Pterodactyl\Providers\SettingsServiceProvider;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Pterodactyl\Contracts\Repository\NestRepositoryInterface;
use Pterodactyl\Contracts\Repository\SettingsRepositoryInterface;
use Pterodactyl\Http\Requests\Admin\Settings\StoreSettingsFormRequest;
use Pterodactyl\Services\Store\StoreStatusService;

class StoreController extends Controller
{
    public function __construct(
        private AlertsMessageBag $alert,
        private ConfigRepository $config,
        private Encrypter $encrypter,
        private Kernel $kernel,
        private NestRepositoryInterface $nestRepository,
        private SettingsRepositoryInterface $settings,
        private StoreStatusService $storeStatus,
    ) {
    }

    /**
     * Render the store / Stripe setup page.
     */
    public function index(): View
    {
        return view('admin.settings.store', [
            'disabled' => $this->config->get('pterodactyl.load_environment_only', false),
            'webhookUrl' => url('/api/store/webhook'),
            'orderUrl' => url('/order'),
            'nests' => $this->nestRepository->getWithEggs(),
            'locations' => Location::query()->orderBy('short')->get(),
            'selectedLocationIds' => $this->config->get('store.location_ids', []),
            'status' => $this->storeStatus->getStatus(),
        ]);
    }

    /**
     * Handle request to update store settings.
     *
     * @throws \Pterodactyl\Exceptions\Model\DataValidationException
     * @throws \Pterodactyl\Exceptions\Repository\RecordNotFoundException
     */
    public function update(StoreSettingsFormRequest $request): RedirectResponse
    {
        if ($this->config->get('pterodactyl.load_environment_only', false)) {
            $this->alert->warning('Store settings cannot be saved while APP_ENVIRONMENT_ONLY is enabled.')->flash();

            return redirect()->route('admin.settings.store');
        }

        $values = $request->normalize();
        $values['store:location_ids'] = $request->input('store:location_ids', []);

        foreach ($values as $key => $value) {
            if ($key === 'store:location_ids') {
                $value = is_array($value) ? implode(',', array_filter($value)) : '';
            } elseif ($key === 'store:egg_id') {
                $value = $value !== null && $value !== '' ? (string) $value : '';
            } elseif (in_array($key, SettingsServiceProvider::getEncryptedKeys(), true) && !empty($value)) {
                $value = $this->encrypter->encrypt($value);
            }

            $this->settings->set('settings::' . $key, $value);
        }

        $this->kernel->call('queue:restart');
        $this->alert->success('Store settings have been updated successfully and the queue worker was restarted to apply these changes.')->flash();

        return redirect()->route('admin.settings.store');
    }

    /**
     * Verify the configured Stripe secret key by calling the Stripe API.
     */
    public function test(Request $request): Response
    {
        $secret = $this->config->get('store.stripe.secret');
        if (empty($secret)) {
            return response('No Stripe secret key is configured.', 400);
        }

        try {
            $stripe = new StripeClient($secret);
            $stripe->accounts->retrieve();
        } catch (\Exception $exception) {
            return response($exception->getMessage(), 500);
        }

        return response('', 204);
    }
}
