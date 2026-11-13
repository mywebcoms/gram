@echo off
title Gram Panchayat Nangwada Website Server (Port 1234)
color 0A
echo ========================================================
echo   Gram Panchayat Nangwada - Election & Development Portal
echo   Candidate: Chainaram Loth (चैनाराम लोठ)
echo   Starting Local Server at http://localhost:1234
echo ========================================================
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
