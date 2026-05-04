@echo off
chcp 65001 >nul
title OrtoManager - Avvia sul Telefono

echo.
echo  ============================================
echo    ORTOMANAGER - Installazione sul Telefono
echo  ============================================
echo.

cd /d "%~dp0"

:: Build
echo  [1/3] Build dell'app in corso...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo  ERRORE durante la build.
    pause
    exit /b 1
)
echo.

:: Installa serve se mancante
where serve >nul 2>&1
if %errorlevel% neq 0 (
    echo  [2/3] Installazione server locale...
    call npm install -g serve
    echo.
)

:: Trova IP tramite Node.js
echo  [2/3] Ricerca IP di rete...
for /f %%i in ('node find-ip.cjs') do set IP=%%i

echo.
echo  ============================================
echo.
echo   [3/3] Server avviato!
echo.
if "%IP%"=="NON_TROVATO" (
    echo   IP non trovato automaticamente.
    echo   Apri cmd e digita: ipconfig
    echo   Cerca "Indirizzo IPv4" della WiFi, poi apri:
    echo   http://[quell-ip]:3000
) else (
    echo   Apri questo indirizzo nel browser del telefono:
    echo.
    echo     ===^>  http://%IP%:3000  ^<===
    echo.
)
echo.
echo   IMPORTANTE: PC e telefono sulla stessa WiFi!
echo.
echo   Come installare l'app:
echo    Android: menu 3 puntini del browser -^> "Installa app"
echo             oppure "Aggiungi a schermata Home"
echo    iPhone:  icona Condividi -^> "Aggiungi a schermata Home"
echo.
echo   Premi CTRL+C per fermare il server quando hai finito.
echo  ============================================
echo.

serve dist -p 3000 -s

pause
