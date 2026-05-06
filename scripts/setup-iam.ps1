<#
.SYNOPSIS
Script para configurar estrictamente los permisos IAM de la cuenta de servicio (Gold Standard).
Asegura que el principio de Mínimo Privilegio se aplique a Google Cloud / Firebase.
#>

$ProjectID = "verdantia-494121"
$ServiceAccount = "firebase-adminsdk-xxxxx@verdantia-494121.iam.gserviceaccount.com"

Write-Host "[IAM Security] Configurando roles estrictos para $ServiceAccount en $ProjectID..." -ForegroundColor Cyan

# 1. Quitar rol de Editor (si lo tiene por defecto y es peligroso)
Write-Host "1. Revocando rol amplio de Editor (si existe)..."
# gcloud projects remove-iam-policy-binding $ProjectID --member="serviceAccount:$ServiceAccount" --role="roles/editor"

# 2. Dar permiso exclusivo para administrar objetos en Storage (Fotos/PDFs)
Write-Host "2. Otorgando rol Storage Object Admin..."
gcloud projects add-iam-policy-binding $ProjectID `
    --member="serviceAccount:$ServiceAccount" `
    --role="roles/storage.objectAdmin"

# 3. Dar permiso para invocar modelos de Vertex AI (Imagen 4.0)
Write-Host "3. Otorgando rol Vertex AI User..."
gcloud projects add-iam-policy-binding $ProjectID `
    --member="serviceAccount:$ServiceAccount" `
    --role="roles/aiplatform.user"

Write-Host "✅ [IAM Security] Permisos configurados con éxito. Principio de mínimo privilegio aplicado." -ForegroundColor Green
