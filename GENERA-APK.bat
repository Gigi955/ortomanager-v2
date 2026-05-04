@echo off
chcp 65001 >nul
title OrtoManager - Generazione APK

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  Fai clic destro su GENERA-APK.bat
    echo  e scegli "Esegui come amministratore"
    echo.
    pause
    exit /b 1
)

echo.
echo  ============================================================
echo    ORTOMANAGER - Generazione APK per Android
echo  ============================================================
echo.

set SRC=C:\APPLICAZIONI CLAUDE\ortomanager-v2
set WORK=C:\ortomanager-build
set APK_DEST=C:\APPLICAZIONI CLAUDE\ortomanager-v2\OrtoManager.apk
set ANDROID_HOME=C:\Users\giuse\AppData\Local\Android\Sdk
set JAVA_HOME=C:\Users\giuse\.jdks\jdk-21.0.6+7
set PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%PATH%

echo  Java:        %JAVA_HOME%
echo  Android SDK: %ANDROID_HOME%
echo.

:: ---- PREP: Copia progetto in cartella di lavoro ----
echo  [Prep] Copia progetto in C:\ortomanager-build...
if exist "%WORK%" rmdir /s /q "%WORK%"
mkdir "%WORK%"

xcopy "%SRC%\src"                   "%WORK%\src\"               /E /I /Q /Y >nul
xcopy "%SRC%\public"                "%WORK%\public\"            /E /I /Q /Y >nul
copy  "%SRC%\package.json"          "%WORK%\package.json"       >nul
copy  "%SRC%\package-lock.json"     "%WORK%\package-lock.json"  >nul 2>&1
copy  "%SRC%\vite.config.ts"        "%WORK%\vite.config.ts"     >nul
copy  "%SRC%\tsconfig.json"         "%WORK%\tsconfig.json"      >nul
copy  "%SRC%\tsconfig.app.json"     "%WORK%\tsconfig.app.json"  >nul 2>&1
copy  "%SRC%\tsconfig.node.json"    "%WORK%\tsconfig.node.json" >nul 2>&1
copy  "%SRC%\tailwind.config.ts"    "%WORK%\tailwind.config.ts" >nul
copy  "%SRC%\postcss.config.js"     "%WORK%\postcss.config.js"  >nul
copy  "%SRC%\index.html"            "%WORK%\index.html"         >nul
copy  "%SRC%\eslint.config.js"      "%WORK%\eslint.config.js"   >nul
copy  "%SRC%\capacitor.config.json" "%WORK%\capacitor.config.json" >nul
copy  "%SRC%\components.json"       "%WORK%\components.json"    >nul 2>&1

echo  Copia OK.
echo.

cd /d "%WORK%"

:: ---- STEP 1: npm install ----
echo  [1/6] Installazione dipendenze (npm install)...
call npm install --no-fund --no-audit
if %errorlevel% neq 0 (
    echo  ERRORE npm install.
    pause & exit /b 1
)
echo  Dipendenze OK.
echo.

:: ---- STEP 2: Build web ----
echo  [2/6] Build web dell'app...
call npm run build
if %errorlevel% neq 0 (
    echo  ERRORE nella build web.
    pause & exit /b 1
)
echo  Build web OK.
echo.

:: ---- STEP 3: Installa Capacitor ----
echo  [3/6] Installazione Capacitor...
call npm install --save --no-fund --no-audit @capacitor/core @capacitor/android
if %errorlevel% neq 0 (
    echo  ERRORE @capacitor/core @capacitor/android.
    pause & exit /b 1
)
call npm install --save-dev --no-fund --no-audit @capacitor/cli
if %errorlevel% neq 0 (
    echo  ERRORE @capacitor/cli.
    pause & exit /b 1
)
echo  Capacitor OK.
echo.

:: ---- STEP 4: Aggiungi piattaforma Android ----
echo  [4/6] Aggiunta piattaforma Android...
call npx cap add android
if %errorlevel% neq 0 (
    echo  ERRORE aggiunta piattaforma Android.
    pause & exit /b 1
)

:: --- Patch 1: build.gradle - forza Java 21 (richiesto da capacitor-android) ---
echo  Patch Java 21 in build.gradle...
set BGRADLE=%WORK%\android\app\build.gradle
powershell -NoProfile -Command "$f='%BGRADLE%'; $c=Get-Content $f -Raw; if ($c -notmatch 'compileOptions') { $c=$c -replace '(    buildTypes)', \"    compileOptions {`n        sourceCompatibility JavaVersion.VERSION_21`n        targetCompatibility JavaVersion.VERSION_21`n    }`n`$1\"; Set-Content $f $c -NoNewline }; Write-Host 'Patch Java 21 OK'"

:: --- Patch 1b: build.gradle - inietta versionName/versionCode da package.json ---
echo  Patch versione APK da package.json...
for /f "delims=" %%V in ('powershell -NoProfile -Command "(Get-Content '%WORK%\package.json' -Raw | ConvertFrom-Json).version"') do set APP_VER=%%V
for /f "delims=" %%C in ('powershell -NoProfile -Command "$v='%APP_VER%' -split '\.'; [int]$v[0]*10000 + [int]$v[1]*100 + [int]$v[2]"') do set APP_VER_CODE=%%C
echo  Versione: %APP_VER% (code %APP_VER_CODE%)
powershell -NoProfile -Command "$f='%BGRADLE%'; $c=Get-Content $f -Raw; $c=$c -replace 'versionCode \d+',('versionCode '+'%APP_VER_CODE%'); $c=$c -replace 'versionName \"[^\"]*\"',('versionName \"'+'%APP_VER%'+'\"'); Set-Content $f $c -NoNewline; Write-Host 'Patch versione OK'"

:: --- Patch 2: gradle-wrapper - usa 8.13 (minimo richiesto da AGP, supporta Java 21) ---
echo  Patch Gradle wrapper (8.13)...
set GWPROPS=%WORK%\android\gradle\wrapper\gradle-wrapper.properties
powershell -NoProfile -Command "(Get-Content '%GWPROPS%') -replace 'gradle-\d+\.\d+[\.\d]*-all\.zip','gradle-8.13-all.zip' | Set-Content '%GWPROPS%'; Write-Host 'Patch Gradle OK'"
echo.

:: ---- STEP 5: Sincronizza ----
echo  [5/6] Sincronizzazione assets web in Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo  ERRORE sincronizzazione.
    pause & exit /b 1
)
echo  Sincronizzazione OK.
echo.

:: ---- STEP 6: Build APK ----
echo  [6/6] Build APK con Gradle (prima volta: 5-10 minuti)...
cd android
call gradlew.bat assembleDebug --no-daemon
if %errorlevel% neq 0 (
    echo.
    echo  ERRORE build Gradle.
    cd ..
    pause & exit /b 1
)
cd ..

:: ---- Copia APK sul Desktop ----
set APK_SRC=%WORK%\android\app\build\outputs\apk\debug\app-debug.apk
if exist "%APK_SRC%" (
    copy "%APK_SRC%" "%APK_DEST%" >nul
    echo.
    echo  ============================================================
    echo.
    echo   APK PRONTO NELLA CARTELLA PROGETTO!
    echo.
    echo   File: OrtoManager.apk
    echo.
    echo   Come installarlo:
    echo    1. Manda OrtoManager.apk via WhatsApp / Drive / USB
    echo    2. Sul telefono: Impostazioni > Sicurezza >
    echo       abilita "Installa app da fonti sconosciute"
    echo    3. Apri il file APK e premi Installa
    echo.
    echo  ============================================================
    explorer "C:\APPLICAZIONI CLAUDE\ortomanager-v2"
) else (
    echo  APK non trovato. Controlla gli errori sopra.
)

echo.
pause
