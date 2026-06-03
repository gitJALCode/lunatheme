<?php

namespace Pterodactyl\Http\Requests\Auth;

use Pterodactyl\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => User::getRules()['email'],
            'username' => User::getRules()['username'],
            'name_first' => User::getRules()['name_first'],
            'name_last' => User::getRules()['name_last'],
            'password' => 'required|string|confirmed|min:8',
        ];
    }

    public function attributes(): array
    {
        return [
            'name_first' => 'first name',
            'name_last' => 'last name',
        ];
    }
}
