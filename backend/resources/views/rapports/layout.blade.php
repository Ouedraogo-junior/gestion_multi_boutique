<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 12px; color: #333; padding: 20px; }

        /* .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 16px;
            border-bottom: 2px solid #1A7A4A;
            margin-bottom: 20px;
        }
        .header-logo img {
            width: 80px;
            height: 55px;
            object-fit: cover;
            border-radius: 6px;
        } */
        .header-logo-placeholder {
            width: 80px;
            height: 55px;
            background: #1A7A4A;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            line-height: 55px;
        }
        /* .header-info {
            text-align: right;
        } */
        .header-info h1 { font-size: 16px; color: #1A7A4A; margin-bottom: 4px; }
        .header-info p  { font-size: 10px; color: #666; margin-top: 2px; }

        .rapport-title {
            text-align: center;
            margin-bottom: 20px;
        }
        .rapport-title h2 { font-size: 14px; color: #1C1C1C; }
        .rapport-title p  { font-size: 11px; color: #999; margin-top: 4px; }

        h3 { font-size: 13px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin: 16px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f0f0f0; padding: 6px; text-align: left; font-size: 11px; color: #6B7280; }
        td { padding: 6px; border-bottom: 1px solid #eee; }
        .right  { text-align: right; }
        .total  { font-weight: bold; background: #f9f9f9; }
        .green  { color: #1A7A4A; font-weight: bold; }
        .red    { color: #E8314A; font-weight: bold; }
        .kpis   { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
        .kpi    { background: #F4F6F5; padding: 10px 14px; border-radius: 6px; flex: 1; min-width: 120px; }
        .kpi .label { font-size: 10px; color: #6B7280; }
        .kpi .val   { font-weight: bold; font-size: 13px; }

        .footer {
            text-align: center;
            color: #999;
            font-size: 10px;
            margin-top: 24px;
            padding-top: 12px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>

    {{-- Header boutique --}}
    <table style="width:100%; margin-bottom:16px; border-bottom:2px solid #1A7A4A; padding-bottom:12px;">
        <tr>
            <td style="width:90px; vertical-align:middle;">
                @if(!empty($boutique->logo_base64))
                    <img src="{{ $boutique->logo_base64 }}" style="width:80px; height:55px; object-fit:cover; border-radius:6px;" alt="Logo" />
                @else
                    <div style="width:80px; height:55px; background:#1A7A4A; border-radius:6px; text-align:center; line-height:55px; color:white; font-size:20px; font-weight:bold;">
                        {{ strtoupper(substr($boutique->nom, 0, 2)) }}
                    </div>
                @endif
            </td>
            <td style="text-align:right; vertical-align:middle;">
                <p style="font-size:16px; color:#1A7A4A; font-weight:bold; margin:0;">{{ $boutique->nom }}</p>
                @if($boutique->adresse)
                    <p style="font-size:10px; color:#666; margin:2px 0 0;">{{ $boutique->adresse }}</p>
                @endif
                @if($boutique->telephone)
                    <p style="font-size:10px; color:#666; margin:2px 0 0;">Tél : {{ $boutique->telephone }}</p>
                @endif
                @if($boutique->slogan)
                    <p style="font-size:10px; color:#666; margin:2px 0 0;"><em>{{ $boutique->slogan }}</em></p>
                @endif
            </td>
        </tr>
    </table>

    <div class="rapport-title">
        <h2>@yield('titre')</h2>
        <p>@yield('sous_titre')</p>
    </div>

    @yield('contenu')

    <div class="footer">
        Généré le {{ now()->format('d/m/Y H:i') }}
        @if(!empty($boutique->mention_legale))
            — {{ $boutique->mention_legale }}
        @endif
    </div>

</body>
</html>