@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21.0.10"
set "ANDROID_HOME=C:\Users\hudin\AppData\Local\Android\Sdk"
set "NODE_ENV=production"
set "PATH=%JAVA_HOME%\bin;%PATH%"
echo Starting Build in C:\brq\billing-app\android...
cd /d C:\brq\billing-app\android
call gradlew.bat assembleRelease --stacktrace
if %ERRORLEVEL% NEQ 0 (
    echo Build Failed with Error Level %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
echo Build Successful!
