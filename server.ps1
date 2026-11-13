# Gram Panchayat Nangwada - Local HTTP Server on Port 1234
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$port = 1234
$baseDir = $PSScriptRoot
if (-not $baseDir) { $baseDir = Get-Location }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "  Gram Panchayat Nangwada Website Server" -ForegroundColor Green
    Write-Host "  Candidate: Chainaram Loth (चैनाराम लोठ)" -ForegroundColor Yellow
    Write-Host "  Running Live at: http://localhost:$port" -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Cyan
} catch {
    Write-Error "Failed to start listener: $_"
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
}

$complaintsFile = Join-Path $baseDir "data\complaints.json"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
        
        # API: GET Complaints
        if ($rawUrl -eq "/api/complaints" -and $request.HttpMethod -eq "GET") {
            if (Test-Path $complaintsFile) {
                $content = [System.IO.File]::ReadAllText($complaintsFile, [System.Text.Encoding]::UTF8)
            } else {
                $content = "[]"
            }
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # API: POST Complaints
        if ($rawUrl -eq "/api/complaints" -and $request.HttpMethod -eq "POST") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $body = $reader.ReadToEnd()
            $reader.Close()

            $newComplaint = $null
            try {
                $newComplaint = ConvertFrom-Json $body
            } catch {
                # Handle form URL encoded if sent as form
                $newComplaint = @{}
                $pairs = $body.Split('&')
                foreach ($p in $pairs) {
                    $parts = $p.Split('=')
                    if ($parts.Count -eq 2) {
                        $key = [System.Uri]::UnescapeDataString($parts[0])
                        $val = [System.Uri]::UnescapeDataString($parts[1].Replace("+", " "))
                        $newComplaint[$key] = $val
                    }
                }
            }

            # Generate Unique ID
            $randomNum = Get-Random -Minimum 1000 -Maximum 9999
            $id = "NGW-2026-$randomNum"
            $currentDate = (Get-Date).ToString("yyyy-MM-dd hh:mm tt")

            $entry = [PSCustomObject]@{
                id = $id
                name = if ($newComplaint.name) { $newComplaint.name } else { "नागरिक" }
                mobile = if ($newComplaint.mobile) { $newComplaint.mobile } else { "-" }
                ward = if ($newComplaint.ward) { $newComplaint.ward } else { "सामान्य" }
                category = if ($newComplaint.category) { $newComplaint.category } else { "अन्य" }
                description = if ($newComplaint.description) { $newComplaint.description } else { "" }
                photo = if ($newComplaint.photo) { $newComplaint.photo } else { "" }
                date = $currentDate
                status = "दर्ज की गई (समीक्षाधीन)"
                statusColor = "blue"
            }

            $list = @()
            if (Test-Path $complaintsFile) {
                try {
                    $existingJson = [System.IO.File]::ReadAllText($complaintsFile, [System.Text.Encoding]::UTF8)
                    $list = ConvertFrom-Json $existingJson
                    if (-not ($list -is [System.Collections.IEnumerable])) {
                        $list = @($list)
                    }
                } catch {
                    $list = @()
                }
            }

            # Prepend new entry
            $updatedList = @($entry) + $list
            $updatedJson = ConvertTo-Json -InputObject $updatedList -Depth 5
            [System.IO.File]::WriteAllText($complaintsFile, $updatedJson, [System.Text.Encoding]::UTF8)

            $resObj = @{
                success = $true
                message = "आपकी जनसमस्या सफलतापूर्वक दर्ज कर ली गई है।"
                trackingId = $id
                date = $currentDate
                complaint = $entry
            }
            $resJson = ConvertTo-Json $resObj
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($resJson)
            $response.ContentType = "application/json; charset=utf-8"
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # Static File Serving
        $relativePath = $rawUrl.TrimStart('/')
        if ($relativePath -eq "" -or $relativePath -eq "index.html") {
            $filePath = Join-Path $baseDir "index.html"
        } else {
            $filePath = Join-Path $baseDir ($relativePath.Replace('/', '\'))
        }

        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $mime
            $response.StatusCode = 200
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawUrl")
            $response.StatusCode = 404
            $response.ContentType = "text/plain; charset=utf-8"
            $response.ContentLength64 = $notFound.Length
            $response.OutputStream.Write($notFound, 0, $notFound.Length)
        }
        $response.Close()
    } catch {
        # ignore or log
    }
}
