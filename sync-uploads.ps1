# Script para sincronizar uploads al servidor
$localPath = "C:\Users\edgar\OneDrive\Escritorio\Sistema cherry\uploads\images\"
$serverUser = "root"
$serverHost = "185.144.156.209"
$serverPath = "/var/www/sistema-cherry/uploads/images/"  # AJUSTAR ESTA RUTA

Write-Host "🔄 Sincronizando imágenes al servidor..." -ForegroundColor Cyan

# Usar SCP para copiar archivos
scp -r "$localPath*" "${serverUser}@${serverHost}:${serverPath}"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Imágenes sincronizadas correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al sincronizar imágenes" -ForegroundColor Red
}
