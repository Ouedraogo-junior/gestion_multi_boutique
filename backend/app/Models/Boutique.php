<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Boutique extends Model
{
    protected $fillable = [
        'nom', 'adresse', 'telephone', 'logo', 'slogan', 'ncc', 'mention_legale', 'actif',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    protected $appends = ['logo_url', 'logo_base64'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo
            ? config('app.url') . '/storage/' . $this->logo
            : null;
    }

    public function getLogoBase64Attribute(): ?string
    {
        if (!$this->logo) return null;
        $path = storage_path('app/public/' . $this->logo);
        if (!file_exists($path)) return null;
        $mime = mime_content_type($path);
        $data = base64_encode(file_get_contents($path));
        return "data:{$mime};base64,{$data}";
    }
}