$ErrorActionPreference = "Stop"

Write-Host "1. Generando fecha para la carpeta de copia..."
$dateString = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$localBackupDir = "C:\Users\jaill\Documents\VERDANTIA COPIAS SEGURIDAD\$dateString"
$cloudBackupDir = "C:\Users\Public\OneDrive\PROYECTOS\VERDANTIA\$dateString"

New-Item -ItemType Directory -Force -Path $localBackupDir | Out-Null
New-Item -ItemType Directory -Force -Path $cloudBackupDir | Out-Null

Write-Host "2. Realizando volcado de la base de datos SQL..."
$dumpPath = "$localBackupDir\verdantia_dump.sql"
& "C:\xampp\mysql\bin\mysqldump.exe" -u root verdantia > $dumpPath
Copy-Item -Path $dumpPath -Destination $cloudBackupDir

Write-Host "3. Comprimiendo el código del proyecto (excluyendo node_modules usando git archive)..."
$zipPath = "$localBackupDir\verdantia_codigo.zip"
git archive --format=zip HEAD -o $zipPath
Copy-Item -Path $zipPath -Destination $cloudBackupDir

Write-Host "4. Ejecutando npm run build..."
# We use cmd /c to ensure npm runs correctly in powershell and exits with correct code
cmd.exe /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Error "El build ha fallado. Abortando el despliegue."
    exit 1
}

Write-Host "5. Subiendo a GitHub..."
git add .
git commit -m "Deploy v0.1.24 - Asistente de Semillas y Diff Modal"
git push

Write-Host "6. Desplegando en Firebase..."
cmd.exe /c "npx firebase-tools deploy --only hosting"
if ($LASTEXITCODE -ne 0) {
    Write-Error "El despliegue en Firebase ha fallado."
    exit 1
}

Write-Host "--- DESPLIEGUE COMPLETADO CON EXITO ---"
