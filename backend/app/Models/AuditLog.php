<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'boutique_id', 'user_id', 'user_pseudo', 'user_nom',
        'action', 'module', 'details', 'ip_address', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'details'    => 'array',
            'created_at' => 'datetime',
        ];
    }
}