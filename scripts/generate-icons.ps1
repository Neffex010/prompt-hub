# Genera los iconos PNG de la PWA con System.Drawing (Windows).
# Uso: powershell -ExecutionPolicy Bypass -File scripts/generate-icons.ps1
# Los PNG resultantes se versionan en el repositorio; este script solo
# documenta cómo se obtuvieron.

param(
    [string]$OutDir = (Join-Path $PSScriptRoot '..\icons')
)

Add-Type -AssemblyName System.Drawing

$yellow = [System.Drawing.ColorTranslator]::FromHtml('#FFE600')
$black = [System.Drawing.Color]::Black
$fontName = 'Arial Black'

if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir | Out-Null
}

function New-Graphics([int]$size) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Draw-Text($graphics, [string]$text, [single]$fontSize, [System.Drawing.Color]$color, [System.Drawing.RectangleF]$rect) {
    $font = New-Object System.Drawing.Font($fontName, $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $brush = New-Object System.Drawing.SolidBrush($color)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $graphics.DrawString($text, $font, $brush, $rect, $format)

    $format.Dispose()
    $brush.Dispose()
    $font.Dispose()
}

function New-StandardIcon([int]$size, [string]$path) {
    $canvas = New-Graphics $size
    $graphics = $canvas.Graphics

    $graphics.Clear($yellow)

    $border = [single]($size * 0.055)
    $pen = New-Object System.Drawing.Pen($black, $border)
    $offset = [single]($border / 2)
    $graphics.DrawRectangle($pen, $offset, $offset, [single]($size - $border), [single]($size - $border))

    $rect = New-Object System.Drawing.RectangleF(0, 0, [single]$size, [single]$size)
    Draw-Text $graphics 'PH' ([single]($size * 0.36)) $black $rect

    $pen.Dispose()
    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $canvas.Bitmap.Dispose()
}

function New-MaskableIcon([int]$size, [string]$path) {
    $canvas = New-Graphics $size
    $graphics = $canvas.Graphics

    $graphics.Clear($yellow)

    # Contenido dentro del 80% central: sobrevive a máscaras circulares.
    $inset = [single]($size * 0.20)
    $side = [single]($size - $inset * 2)
    $graphics.FillRectangle((New-Object System.Drawing.SolidBrush($black)), $inset, $inset, $side, $side)

    $rect = New-Object System.Drawing.RectangleF(0, 0, [single]$size, [single]$size)
    Draw-Text $graphics 'PH' ([single]($size * 0.28)) $yellow $rect

    $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $canvas.Bitmap.Dispose()
}

New-StandardIcon 192 (Join-Path $OutDir 'icon-192.png')
New-StandardIcon 512 (Join-Path $OutDir 'icon-512.png')
New-StandardIcon 180 (Join-Path $OutDir 'apple-touch-icon.png')
New-MaskableIcon 512 (Join-Path $OutDir 'icon-maskable-512.png')

Get-ChildItem $OutDir -Filter *.png | ForEach-Object {
    $image = [System.Drawing.Image]::FromFile($_.FullName)
    "$($_.Name): $($image.Width)x$($image.Height) ($([math]::Round($_.Length / 1KB)) KB)"
    $image.Dispose()
}
