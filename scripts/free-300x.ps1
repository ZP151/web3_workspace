Write-Host "🔍 检查并释放端口 3000-3009..."

for ($port = 3000; $port -le 3009; $port++) {
    $connections = netstat -ano | Select-String ":$port\s"
    if ($connections) {
        $processIds = $connections -replace '.*\s+(\d+)$', '$1' | Sort-Object -Unique
        foreach ($processId in $processIds) {
            try {
                Stop-Process -Id $processId -Force -ErrorAction Stop
                Write-Host "✅ 已终止 PID $processId (端口 $port)"
            } catch {
                Write-Host "⚠ 无法终止 PID ${processId}: $_"
            }
        }
    } else {
        Write-Host "✔ 端口 $port 未被占用"
    }
}

