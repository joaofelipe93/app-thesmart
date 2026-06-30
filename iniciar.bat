@echo off
title TheSmart - Renovacoes no Trello
cd /d "%~dp0"

echo ============================================
echo   TheSmart - Renovacoes no Trello
echo ============================================
echo.

REM Verifica se o Node.js esta instalado
where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale o Node.js LTS em https://nodejs.org e rode este arquivo de novo.
  echo.
  pause
  exit /b 1
)

REM Verifica se o .env existe
if not exist ".env" (
  echo [ERRO] Arquivo .env nao encontrado nesta pasta.
  echo Crie o .env com as chaves OPENAI_API_KEY, TRELLO_API_KEY e TRELLO_TOKEN.
  echo Use o arquivo .env.example como modelo.
  echo.
  pause
  exit /b 1
)

REM Instala as dependencias na primeira execucao
if not exist "node_modules\" (
  echo Primeira execucao: instalando dependencias. Isso pode levar alguns minutos...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando a aplicacao. O navegador vai abrir sozinho em instantes.
echo Para ENCERRAR, feche esta janela.
echo.

call npm run web

echo.
echo A aplicacao foi encerrada.
pause
