Add-Type -AssemblyName System.Drawing

function New-GrowWellIcon {
  param(
    [int]$Size,
    [string]$OutputPath,
    [bool]$Maskable
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml('#0D5C63'))

  $paddingRatio = if ($Maskable) { 0.24 } else { 0.13 }
  $padding = [int]($Size * $paddingRatio)
  $circleSize = $Size - (2 * $padding)
  $creamBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#F9F9FF'))
  $tealBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#0D5C63'))
  $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#FD9E77'))
  $stemPen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#0D5C63'), [single]($Size * 0.045))
  $stemPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $stemPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $graphics.FillEllipse($creamBrush, $padding, $padding, $circleSize, $circleSize)

  $center = $Size / 2
  $graphics.DrawLine($stemPen, [single]$center, [single]($Size * 0.69), [single]$center, [single]($Size * 0.39))
  $graphics.FillEllipse($tealBrush, [single]($Size * 0.34), [single]($Size * 0.34), [single]($Size * 0.18), [single]($Size * 0.11))
  $graphics.FillEllipse($accentBrush, [single]($Size * 0.49), [single]($Size * 0.27), [single]($Size * 0.18), [single]($Size * 0.12))
  $graphics.FillEllipse($tealBrush, [single]($Size * 0.42), [single]($Size * 0.64), [single]($Size * 0.16), [single]($Size * 0.08))

  $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $stemPen.Dispose()
  $creamBrush.Dispose()
  $tealBrush.Dispose()
  $accentBrush.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

$publicDir = Join-Path $PSScriptRoot '..\public'
New-GrowWellIcon -Size 192 -OutputPath (Join-Path $publicDir 'pwa-192x192.png') -Maskable $false
New-GrowWellIcon -Size 512 -OutputPath (Join-Path $publicDir 'pwa-512x512.png') -Maskable $false
New-GrowWellIcon -Size 512 -OutputPath (Join-Path $publicDir 'pwa-maskable-512x512.png') -Maskable $true
