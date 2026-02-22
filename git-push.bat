@echo off
cd /d E:\qunttt
git commit --no-verify -m "feat: K-line multi-interval, realtime/long-term tabs, A-share units, US rate limit, crypto live sync"
if errorlevel 1 exit /b 1
git push
pause
