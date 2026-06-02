<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('store_subscriptions', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->unsignedInteger('server_id')->nullable();
            $table->string('plan_slug');
            $table->string('stripe_customer_id')->nullable();
            $table->string('stripe_subscription_id')->nullable();
            $table->string('stripe_checkout_session_id')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();

            $table->unique('stripe_checkout_session_id');
            $table->index('stripe_subscription_id');

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('server_id')->references('id')->on('servers')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('store_subscriptions');
    }
};
