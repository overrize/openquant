@echo off
rem 优先使用 JDK 17/21 运行 Gradle，避免本机默认 JDK 25 导致 "Unsupported class file major version 69"
set "USE_JAVA="
if defined JAVA_HOME (
  for /f "tokens=*" %%v in ('"%JAVA_HOME%\bin\java.exe" -version 2^>^&1 ^| findstr /i "version"') do set "USE_JAVA=1"
)
if not defined USE_JAVA (
  if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
  if exist "C:\Program Files\Java\jdk-17\bin\java.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-17"
  if exist "C:\Program Files\Java\jdk-21\bin\java.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-21"
  if exist "C:\Program Files\Eclipse Adoptium\jdk-17*\bin\java.exe" (
    for /d %%d in ("C:\Program Files\Eclipse Adoptium\jdk-17*") do set "JAVA_HOME=%%d"
  )
)
call "%~dp0gradlew.bat" %*
