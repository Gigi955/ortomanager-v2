$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.10.7-hotspot"
$env:PATH = $env:JAVA_HOME + "\bin;" + $env:PATH
Set-Location "C:\APPLICAZIONI CLAUDE\ortomanager-v2\android"
.\gradlew.bat assembleDebug
