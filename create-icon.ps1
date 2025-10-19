Add-Type -AssemblyName System.Drawing

$width = 128
$height = 128
$bmp = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)

# Fill with blue background
$blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 116, 228))
$graphics.FillRectangle($blueBrush, 0, 0, $width, $height)

# Add white "Z" for Zillow
$font = New-Object System.Drawing.Font("Arial", 80, [System.Drawing.FontStyle]::Bold)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.DrawString("Z", $font, $whiteBrush, 20, 10)

# Save
$bmp.Save("$PSScriptRoot\icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Cleanup
$graphics.Dispose()
$font.Dispose()
$whiteBrush.Dispose()
$blueBrush.Dispose()
$bmp.Dispose()

Write-Host "Icon created successfully!"
