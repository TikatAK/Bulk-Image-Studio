$ErrorActionPreference = 'Stop'

# Ensure .ssh directory exists
$sshDir = "$env:USERPROFILE/.ssh"
New-Item -ItemType Directory -Path $sshDir -Force | Out-Null

# Target key path
$keyPath = "$sshDir/id_ed25519"

# Generate key if missing
if (-not (Test-Path $keyPath)) {
    ssh-keygen -t ed25519 -C "Tikat.fun@gmail.com" -N "" -f $keyPath | Out-Null
}
else {
    Write-Host "Existing SSH key found at $keyPath, reusing it."
}

# Output public key
Write-Host "--- PUBLIC KEY ---"
Get-Content "$keyPath.pub"
Write-Host "------------------"

