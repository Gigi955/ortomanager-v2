$f = "C:\APPLICAZIONI CLAUDE\ortomanager-v2\src\components\BottomNav.tsx"
$c = Get-Content $f -Raw
$c = $c -replace 'bg-white border-t border-gray-200 safe-area-bottom', 'bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom'
$c = $c -replace '"text-gray-500 hover:text-gray-700 active:bg-gray-100"', '"text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800"'
$c = $c -replace '"bg-garden-leaf/10"', '"bg-garden-leaf/10 dark:bg-garden-leaf/20"'
Set-Content $f $c
Write-Host "BottomNav patched OK"
