$content = [System.IO.File]::ReadAllText("c:\Users\jaill\Documents\SEMILLAS_15_04_2026\verdantia-nextjs\src\app\dashboard\bancales\[id]\page.tsx", [System.Text.Encoding]::UTF8)
$lines = $content -split "`n"
for ($i=0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match '_groupedCultivos|filteredActiveCrops|groupBy|allActiveCrops') {
        $trimmed = $lines[$i].Trim()
        if ($trimmed.Length -gt 140) { $trimmed = $trimmed.Substring(0, 140) }
        Write-Output "$($i+1): $trimmed"
    }
}
