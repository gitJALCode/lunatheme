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
        Schema::create('server_folders', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('user_id');
            $table->string('name');
            $table->string('color', 16)->default('#4f46e5');
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::create('server_folder_server', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('server_folder_id');
            $table->unsignedInteger('server_id');

            $table->unique(['server_folder_id', 'server_id']);

            $table->foreign('server_folder_id')->references('id')->on('server_folders')->cascadeOnDelete();
            $table->foreign('server_id')->references('id')->on('servers')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('server_folder_server');
        Schema::dropIfExists('server_folders');
    }
};
