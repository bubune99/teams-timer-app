# Create a temporary directory for packaging
$tempDir = ".\teams-package"
New-Item -ItemType Directory -Force -Path $tempDir

# Copy the manifest and icons
Copy-Item ".\manifest.json" -Destination $tempDir
Copy-Item ".\public\color.svg" -Destination $tempDir
Copy-Item ".\public\outline.svg" -Destination $tempDir

# Create the ZIP file
Compress-Archive -Path "$tempDir\*" -DestinationPath ".\teams-timer-app.zip" -Force

# Clean up
Remove-Item -Recurse -Force $tempDir

Write-Host "Package created: teams-timer-app.zip"
Write-Host "Before uploading to Teams:"
Write-Host "1. Replace {{DOMAIN}} in manifest.json with your hosting domain"
Write-Host "2. Replace the app ID with the one from Teams Admin Center"
Write-Host "3. Update the ZIP package with the modified manifest.json"
