@extends('layouts.admin')
@include('partials/admin.settings.nav', ['activeTab' => 'store'])

@section('title')
    Store Settings
@endsection

@section('content-header')
    <h1>Store Settings<small>Configure Stripe billing and automatic server provisioning for the public order page.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Settings</li>
    </ol>
@endsection

@section('content')
    @yield('settings::nav')
    <div class="row">
        <div class="col-xs-12">
            <div class="box">
                <div class="box-header with-border">
                    <h3 class="box-title">Setup Status</h3>
                </div>
                <div class="box-body">
                    @include('partials.admin.store.status', ['status' => $status])
                    <p class="text-muted small" style="margin-top: 12px; margin-bottom: 0;">
                        Public order page: <a href="{{ $orderUrl }}" target="_blank" rel="noopener noreferrer">{{ $orderUrl }}</a>
                    </p>
                </div>
            </div>

            @if($disabled)
                <div class="box">
                    <div class="box-body">
                        <div class="alert alert-info no-margin-bottom">
                            Store settings cannot be edited while <code>APP_ENVIRONMENT_ONLY=true</code>. Set <code>APP_ENVIRONMENT_ONLY=false</code> in your environment file to manage Stripe configuration from this page, or configure the <code>STRIPE_*</code> and <code>STORE_*</code> variables in <code>.env</code> directly.
                        </div>
                    </div>
                </div>
            @else
                <form action="{{ route('admin.settings.store') }}" method="POST">
                    <div class="box">
                        <div class="box-header with-border">
                            <h3 class="box-title">Stripe API Keys</h3>
                        </div>
                        <div class="box-body">
                            <div class="row">
                                <div class="form-group col-md-12">
                                    <label class="control-label">Publishable Key</label>
                                    <input type="text" class="form-control" name="store:stripe:key" value="{{ old('store:stripe:key', config('store.stripe.key')) }}" placeholder="pk_test_..." />
                                    <p class="text-muted small">Your Stripe publishable key. Optional for Checkout redirect flows but useful for future client-side features.</p>
                                </div>
                                <div class="form-group col-md-6">
                                    <label class="control-label">Secret Key</label>
                                    <input type="password" class="form-control" name="store:stripe:secret" placeholder="sk_test_... or rk_..." />
                                    <p class="text-muted small">Leave blank to keep the existing secret. Starts with <code>sk_</code> or <code>rk_</code>.</p>
                                </div>
                                <div class="form-group col-md-6">
                                    <label class="control-label">Webhook Signing Secret</label>
                                    <input type="password" class="form-control" name="store:stripe:webhook_secret" placeholder="whsec_..." />
                                    <p class="text-muted small">Leave blank to keep the existing secret. Found in the Stripe Dashboard under your webhook endpoint.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="box">
                        <div class="box-header with-border">
                            <h3 class="box-title">Stripe Webhook</h3>
                        </div>
                        <div class="box-body">
                            <div class="form-group">
                                <label class="control-label">Webhook URL</label>
                                <div class="input-group">
                                    <input type="text" class="form-control" id="webhookUrl" readonly value="{{ $webhookUrl }}" />
                                    <span class="input-group-btn">
                                        <button type="button" class="btn btn-default" id="copyWebhookUrl">Copy</button>
                                    </span>
                                </div>
                                <p class="text-muted small">
                                    Create a webhook endpoint in the <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer">Stripe Dashboard</a>
                                    and enable these events: <code>checkout.session.completed</code>, <code>invoice.payment_failed</code>, and <code>customer.subscription.deleted</code>.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="box">
                        <div class="box-header with-border">
                            <h3 class="box-title">Plan Price IDs</h3>
                        </div>
                        <div class="box-body">
                            <p class="text-muted small">
                                Create three recurring monthly EUR prices in the <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer">Stripe Dashboard</a>
                                and paste each Price ID below.
                            </p>
                            <div class="row">
                                <div class="form-group col-md-4">
                                    <label class="control-label">Explorer (€8.49/mo)</label>
                                    <input type="text" class="form-control" name="store:plans:explorer:price_id" value="{{ old('store:plans:explorer:price_id', config('store.plans.explorer.price_id')) }}" placeholder="price_..." />
                                </div>
                                <div class="form-group col-md-4">
                                    <label class="control-label">Builder (€11.99/mo)</label>
                                    <input type="text" class="form-control" name="store:plans:builder:price_id" value="{{ old('store:plans:builder:price_id', config('store.plans.builder.price_id')) }}" placeholder="price_..." />
                                </div>
                                <div class="form-group col-md-4">
                                    <label class="control-label">Community (€15.49/mo)</label>
                                    <input type="text" class="form-control" name="store:plans:community:price_id" value="{{ old('store:plans:community:price_id', config('store.plans.community.price_id')) }}" placeholder="price_..." />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="box">
                        <div class="box-header with-border">
                            <h3 class="box-title">Provisioning</h3>
                        </div>
                        <div class="box-body">
                            <div class="row">
                                <div class="form-group col-md-6">
                                    <label class="control-label">Default Egg</label>
                                    <select name="store:egg_id" class="form-control">
                                        <option value="">— Select an egg —</option>
                                        @foreach($nests as $nest)
                                            <optgroup label="{{ $nest->name }}">
                                                @foreach($nest->eggs as $egg)
                                                    <option value="{{ $egg->id }}" @if((int) old('store:egg_id', config('store.egg_id')) === $egg->id) selected @endif>
                                                        {{ $egg->name }}
                                                    </option>
                                                @endforeach
                                            </optgroup>
                                        @endforeach
                                    </select>
                                    <p class="text-muted small">Every purchased server is created using this egg.</p>
                                </div>
                                <div class="form-group col-md-6">
                                    <label class="control-label">Deploy Locations <span class="field-optional"></span></label>
                                    <select name="store:location_ids[]" class="form-control" multiple size="6">
                                        @foreach($locations as $location)
                                            <option value="{{ $location->id }}" @if(in_array($location->id, old('store:location_ids', $selectedLocationIds), true)) selected @endif>
                                                {{ $location->short }} — {{ $location->long }}
                                            </option>
                                        @endforeach
                                    </select>
                                    <p class="text-muted small">Hold Ctrl (Cmd on Mac) to select multiple. Leave empty to use every public node for stock checks and deployment.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="box box-primary">
                        <div class="box-footer">
                            {{ csrf_field() }}
                            <div class="pull-right">
                                <button type="button" id="testStripeButton" class="btn btn-sm btn-success">Test Connection</button>
                                <button type="submit" name="_method" value="PATCH" class="btn btn-sm btn-primary">Save</button>
                            </div>
                        </div>
                    </div>
                </form>
            @endif
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent

    @if(!$disabled)
    <script>
        function showStripeError(jqXHR, verb) {
            var errorText = '';
            if (!jqXHR.responseJSON) {
                errorText = jqXHR.responseText;
            } else if (jqXHR.responseJSON.error) {
                errorText = jqXHR.responseJSON.error;
            } else if (jqXHR.responseJSON.errors) {
                $.each(jqXHR.responseJSON.errors, function (i, v) {
                    if (v.detail) {
                        errorText += v.detail + ' ';
                    }
                });
            }

            swal({
                title: 'Whoops!',
                text: 'An error occurred while attempting to ' + verb + ' Stripe: ' + errorText,
                type: 'error'
            });
        }

        $(document).ready(function () {
            $('#copyWebhookUrl').on('click', function () {
                var input = document.getElementById('webhookUrl');
                input.select();
                input.setSelectionRange(0, 99999);
                document.execCommand('copy');
                swal({
                    title: 'Copied',
                    text: 'Webhook URL copied to clipboard.',
                    type: 'success',
                    timer: 2000
                });
            });

            $('#testStripeButton').on('click', function () {
                swal({
                    type: 'info',
                    title: 'Test Stripe Connection',
                    text: 'Save your settings first if you changed the secret key. Click Test to verify the configured key.',
                    showCancelButton: true,
                    confirmButtonText: 'Test',
                    closeOnConfirm: false,
                    showLoaderOnConfirm: true
                }, function () {
                    $.ajax({
                        method: 'POST',
                        url: '{{ route('admin.settings.store.test') }}',
                        headers: { 'X-CSRF-TOKEN': $('input[name="_token"]').val() }
                    }).fail(function (jqXHR) {
                        showStripeError(jqXHR, 'test');
                    }).done(function () {
                        swal({
                            title: 'Success',
                            text: 'Successfully connected to Stripe with the configured secret key.',
                            type: 'success'
                        });
                    });
                });
            });
        });
    </script>
    @endif
@endsection
