@extends('layouts.admin')

@section('title')
    Administration
@endsection

@section('content-header')
    <h1>Administrative Overview<small>A quick glance at your system.</small></h1>
    <ol class="breadcrumb">
        <li><a href="{{ route('admin.index') }}">Admin</a></li>
        <li class="active">Index</li>
    </ol>
@endsection

@section('content')
<div class="row">
    <div class="col-xs-12">
        <div class="box
            @if($version->isLatestPanel())
                box-success
            @else
                box-danger
            @endif
        ">
            <div class="box-header with-border">
                <h3 class="box-title">System Information</h3>
            </div>
            <div class="box-body">
                @if ($version->isLatestPanel())
                    You are running Pterodactyl Panel version <code>{{ config('app.version') }}</code>. Your panel is up-to-date!
                @else
                    Your panel is <strong>not up-to-date!</strong> The latest version is <a href="https://github.com/Pterodactyl/Panel/releases/v{{ $version->getPanel() }}" target="_blank"><code>{{ $version->getPanel() }}</code></a> and you are currently running version <code>{{ config('app.version') }}</code>.
                @endif
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-12">
        <div class="box {{ $storeStatus['ready'] ? 'box-success' : 'box-warning' }}">
            <div class="box-header with-border">
                <h3 class="box-title">Store &amp; Stripe Billing</h3>
                <div class="box-tools pull-right">
                    <a href="{{ $storeSettingsUrl }}" class="btn btn-sm btn-default">
                        <i class="fa fa-cog"></i> Configure
                    </a>
                </div>
            </div>
            <div class="box-body">
                @if($storeStatus['ready'])
                    <p class="text-muted" style="margin-top: 0;">
                        Your store is configured. Customers can order servers at
                        <a href="{{ $storeOrderUrl }}" target="_blank" rel="noopener noreferrer">{{ $storeOrderUrl }}</a>.
                    </p>
                @else
                    <p class="text-muted" style="margin-top: 0;">
                        Complete the checklist below to enable the public order page and automatic server provisioning after payment.
                    </p>
                @endif
                @include('partials.admin.store.status', ['status' => $storeStatus])
                @if($storeDisabled)
                    <div class="alert alert-warning" style="margin-top: 12px; margin-bottom: 0;">
                        Panel settings are environment-only (<code>APP_ENVIRONMENT_ONLY=true</code>). Configure Stripe via <code>.env</code> or disable that flag to edit from the admin UI.
                    </div>
                @endif
            </div>
            <div class="box-footer">
                <a href="{{ $storeSettingsUrl }}" class="btn btn-primary">
                    <i class="fa fa-credit-card"></i> Open Store Settings
                </a>
                <a href="{{ $storeOrderUrl }}" class="btn btn-default" target="_blank" rel="noopener noreferrer">
                    <i class="fa fa-external-link"></i> View Order Page
                </a>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="{{ $version->getDiscord() }}"><button class="btn btn-warning" style="width:100%;"><i class="fa fa-fw fa-support"></i> Get Help <small>(via Discord)</small></button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="https://pterodactyl.io"><button class="btn btn-primary" style="width:100%;"><i class="fa fa-fw fa-link"></i> Documentation</button></a>
    </div>
    <div class="clearfix visible-xs-block">&nbsp;</div>
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="https://github.com/pterodactyl/panel"><button class="btn btn-primary" style="width:100%;"><i class="fa fa-fw fa-support"></i> GitHub</button></a>
    </div>
    <div class="col-xs-6 col-sm-3 text-center">
        <a href="{{ $version->getDonations() }}"><button class="btn btn-success" style="width:100%;"><i class="fa fa-fw fa-money"></i> Support the Project</button></a>
    </div>
</div>
@endsection
