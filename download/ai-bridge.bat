@echo off
chcp 65001 >nul
setlocal
title AI 브리지 Claude + Codex (올인원) - 이 창을 닫으면 꺼집니다
set "D=%LOCALAPPDATA%\midong-codex-bridge"
if not exist "%D%\workspace" mkdir "%D%\workspace"

rem ---- 이 파일 안에 든 프로그램을 풀어 놓기 ----
powershell -NoProfile -ExecutionPolicy Bypass -Command "$t=[IO.File]::ReadAllText('%~f0',[Text.Encoding]::UTF8); $u=New-Object Text.UTF8Encoding $false; foreach($p in @(@('server.mjs','server.mjs'),@('config.json','config.json'),@('mixdog-check.mjs','mixdog-check.mjs'),@('AGENTS.md','workspace\AGENTS.md'))){ $m=[regex]::Match($t,'(?s)::BEGIN '+[regex]::Escape($p[0])+'\r?\n(.*?)\r?\n::END '+[regex]::Escape($p[0])); if(-not $m.Success){ exit 1 }; [IO.File]::WriteAllText((Join-Path $env:D $p[1]),$m.Groups[1].Value,$u) }"
if errorlevel 1 ( echo  파일을 풀지 못했습니다. & pause & exit /b 1 )

rem ---- 입장 코드 (처음 한 번 묻고 기억) ----
set "CF=%D%\code.txt"
set "CX_CODE="
if exist "%CF%" set /p CX_CODE=<"%CF%"
set /a TRY=0
:askcode
if defined CX_CODE set "CX_CODE=%CX_CODE: =%"
if defined CX_CODE goto gotcode
set /a TRY+=1
if %TRY% gtr 5 ( echo  입장 코드가 없어 종료합니다. & pause & exit /b 1 )
echo.
set /p "CX_CODE=  입장 코드를 입력하세요 (강사에게 받은 코드): "
goto askcode
:gotcode
>"%CF%" echo %CX_CODE%


rem ---- 1. Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo  [1/8] Node.js 가 없습니다.
  choice /c YN /m "  지금 winget으로 설치할까요"
  if errorlevel 2 ( echo  Node.js 를 설치한 뒤 다시 실행해 주세요. & pause & exit /b 1 )
  winget install --id OpenJS.NodeJS.LTS -e
  echo.
  echo  설치가 끝나면 이 창을 닫고 이 파일을 다시 실행해 주세요.
  pause & exit /b 0
)

rem ---- 모션그래픽(HyperFrames) 준비: Node 22 이상 + FFmpeg ----
node -e "process.exit(+process.versions.node.split('.')[0]>=22?0:1)"
if errorlevel 1 echo  ※ Node.js 가 22보다 낮아 모션그래픽 mp4^(HyperFrames^)는 안 됩니다. 필요하면: winget upgrade OpenJS.NodeJS.LTS
where ffmpeg >nul 2>nul
if not errorlevel 1 goto ffok
echo.
echo  [추가] 영상 자막·모션그래픽 mp4 에 쓰는 FFmpeg 가 없습니다.
choice /c YN /m "  지금 winget으로 설치할까요"
if not errorlevel 2 winget install --id Gyan.FFmpeg.Essentials -e
:ffok

rem ---- 음성 인식(faster-whisper): 영상 대사·노래 가사를 받아 적어 자막으로 ----
call python -c "import sys" >nul 2>nul
if errorlevel 1 goto sttnopy
call python -c "import faster_whisper" >nul 2>nul
if not errorlevel 1 goto sttmodel
echo.
echo  [추가] 영상 대사·노래 가사를 받아 적어 자막을 만드는 음성 인식^(faster-whisper^)이 없습니다.
choice /c YN /m "  지금 설치할까요 (python -m pip install faster-whisper)"
if errorlevel 2 goto sttok
call python -m pip install --disable-pip-version-check faster-whisper
if errorlevel 1 call python -m pip install --disable-pip-version-check --use-feature=truststore faster-whisper
:sttmodel
call python -c "from faster_whisper import WhisperModel as W; W('small', device='cpu', compute_type='int8', local_files_only=True)" >nul 2>nul
if not errorlevel 1 goto sttok
call python -c "import faster_whisper" >nul 2>nul
if errorlevel 1 ( echo  ※ faster-whisper 가 설치되지 않아 가사·대사 자막은 쓸 수 없습니다. & goto sttok )
echo  음성 인식 모델^(small, 약 460MB^)을 미리 받는 중... 처음 한 번만 받습니다.
call python -c "from faster_whisper import WhisperModel as W; W('small', device='cpu', compute_type='int8')"
if errorlevel 1 echo  ※ 모델을 받지 못했습니다. 처음 받아 적을 때 다시 받습니다^(1~2분 더 걸림^).
goto sttok
:sttnopy
echo.
echo  [추가] 영상 대사·노래 가사 자막에 쓰는 음성 인식에는 Python 이 필요합니다.
choice /c YN /m "  지금 winget으로 Python 을 설치할까요"
if errorlevel 2 goto sttok
winget install --id Python.Python.3.12 -e
echo  Python 설치가 끝나면 이 창을 닫고 이 파일을 다시 실행해 주세요. ^(그때 음성 인식을 설치합니다^)
pause & exit /b 0
:sttok

rem ---- 2. mixdog (이 PC에 로그인한 계정 여러 개를 수강생마다 나눠 씀, https://github.com/tribgames/mixdog) ----
call mixdog --help >nul 2>nul
if not errorlevel 1 goto mixlogin
echo.
echo  [2/8] mixdog 가 없습니다. mixdog 에 로그인한 Claude·ChatGPT 계정 여러 개를 수강생마다 하나씩 나눠 씁니다.
echo        ^(Claude Code·Codex CLI 만 쓸 거라면 N^)
choice /c YN /m "  지금 설치할까요 (npm i -g mixdog)"
if errorlevel 2 goto claudecli
call npm i -g mixdog
:mixlogin
rem ---- 3. mixdog 계정 ----
node "%D%\mixdog-check.mjs"
if not errorlevel 1 goto mixready
echo.
echo  [3/8] mixdog 에 Claude·ChatGPT 계정을 로그인해 주세요. 계정이 많을수록 수강생이 나눠 씁니다^(4명이면 4개씩 권장^).
echo        ^(다른 강사 PC와 다른 계정으로 로그인해야 PC끼리 계정이 겹치지 않습니다^)
echo        mixdog 창이 열리면 /providers 에서 Claude·ChatGPT 계정을 추가^(Sign in^)하고, 다 되면 /quit 로 닫으세요.
choice /c YN /m "  지금 mixdog 을 열까요"
if errorlevel 2 goto mixcheck
call mixdog
:mixcheck
node "%D%\mixdog-check.mjs"
if not errorlevel 1 goto mixready
if errorlevel 2 ( echo  ※ 한쪽 계정만 있습니다. 없는 쪽은 Claude Code·Codex CLI 로 씁니다. & goto claudecli )
echo  ※ mixdog 계정이 없어 Claude Code·Codex CLI 를 씁니다.
goto claudecli
:mixready
echo  ✓ mixdog 계정으로 실행합니다. Claude Code·Codex CLI 확인은 건너뜁니다.
goto tunnel

:claudecli
rem ---- 4. Claude Code ----
if exist "%USERPROFILE%\.local\bin\claude.exe" set "PATH=%USERPROFILE%\.local\bin;%PATH%"
where claude >nul 2>nul
if errorlevel 1 goto claudeinstall
rem Claude 5.5 모델(Sonnet·Opus)은 Claude Code 2.1.280 이상이 필요하다 -> 오래된 버전이면 업데이트를 묻는다
set "CCV="
for /f "tokens=1" %%v in ('claude --version 2^>nul') do if not defined CCV set "CCV=%%v"
node -e "const v=(process.argv[1]||'0.0.0').split('.').map(Number);process.exit(v[0]*1e6+(v[1]||0)*1e3+(v[2]||0)>=2001280?0:1)" "%CCV%"
if not errorlevel 1 goto claudelogin
echo.
echo  [4/8] Claude Code 가 오래되었습니다^(%CCV%^). Claude 5.5 모델은 2.1.280 이상이 필요합니다.
choice /c YN /m "  지금 업데이트할까요 (claude update)"
if errorlevel 2 goto claudelogin
call claude update
goto claudelogin
:claudeinstall
echo.
echo  [4/8] Claude Code 가 없습니다. ^(Codex 만 쓸 거라면 N^)
choice /c YN /m "  지금 설치할까요 (npm i -g @anthropic-ai/claude-code)"
if errorlevel 2 goto codex
call npm i -g @anthropic-ai/claude-code

:claudelogin
rem ---- 5. Claude 로그인 ----
echo  Claude 로그인을 확인하는 중...
echo ok| claude -p --model haiku --setting-sources project --strict-mcp-config --disable-slash-commands --tools "" >nul 2>nul
if not errorlevel 1 goto codex
echo.
echo  [5/8] 이 PC의 Claude Code 가 Claude 계정에 로그인되어 있지 않습니다^(또는 로그인이 만료됨^). 브라우저에서 로그인해 주세요.
echo        ^(다른 강사 PC와 다른 계정으로 로그인하면 사용량이 나뉩니다^)
call claude auth login

:codex
rem ---- 6. Codex CLI ----
where codex >nul 2>nul
if not errorlevel 1 goto codexlogin
echo.
echo  [6/8] Codex CLI 가 없습니다. ^(Claude 만 쓸 거라면 N^)
choice /c YN /m "  지금 설치할까요 (npm i -g @openai/codex)"
if errorlevel 2 goto tunnel
call npm i -g @openai/codex

:codexlogin
rem ---- 7. ChatGPT 로그인 ----
call codex login status >nul 2>nul
if not errorlevel 1 goto tunnel
echo.
echo  [7/8] 이 PC의 Codex 가 ChatGPT 계정에 로그인되어 있지 않습니다. 브라우저에서 로그인해 주세요.
echo        ^(다른 강사 PC와 다른 계정으로 로그인하면 사용량이 나뉩니다^)
call codex login

:tunnel
rem ---- 8. Cloudflare 터널 ----
where cloudflared >nul 2>nul
if errorlevel 1 if not exist "%LOCALAPPDATA%\Microsoft\WinGet\Links\cloudflared.exe" if not exist "C:\Program Files (x86)\cloudflared\cloudflared.exe" (
  echo.
  echo  [8/8] 수강생 기기에서 접속하려면 Cloudflare 터널 프로그램^(cloudflared^)이 필요합니다.
  choice /c YN /m "  지금 winget으로 설치할까요"
  if not errorlevel 2 winget install --id Cloudflare.cloudflared -e
)

rem 학교망 보안 프로그램이 HTTPS를 다시 서명해도 Node가 윈도 인증서를 믿도록
set "NODE_USE_SYSTEM_CA=1"
node "%D%\server.mjs"
pause
exit /b 0
::BEGIN server.mjs
// AI 브리지 — 발표 화면(웹)의 13번 미니 앱과 이 PC의 Claude Code CLI · Codex CLI를 이어 주는 작은 서버.
// 설치할 것 없음(Node 내장 모듈만 사용). 실행: start-codex-bridge.bat 또는 `node server.mjs`
// 한 브리지가 두 엔진을 함께 맡는다: 이 PC에 깔린 CLI(claude, codex)를 찾아 쓰고, 요청마다 engine 으로 고른다.
//   Claude 이벤트는 Codex 이벤트 모양으로 바꿔 보내므로 발표 화면은 같은 방식으로 그린다.
//
// 여러 수강생이 함께 쓰는 구조
//  - 수강생(브라우저)마다 세션 키가 있고, 세션마다 workspace/<세션> 폴더를 따로 쓴다.
//  - 동시에 config.maxConcurrent 개까지(두 엔진 합쳐서) 돌린다. 꽉 차면 429로 답해 브라우저가 다른 PC로 보낸다.
//  - 엔진이 사용량 한도에 걸리면 그 엔진만 '사용량 초과'로 표시해 브라우저가 다른 PC(다른 계정)나 다른 엔진으로 옮긴다.
//  - mixdog CLI(https://github.com/tribgames/mixdog)가 깔려 있고 계정이 로그인되어 있으면 Claude·Codex 요청을 mixdog 로 돌린다.
//    이 PC의 mixdog 에 로그인한 계정(Claude 여러 개·ChatGPT 여러 개)을 수강생마다 하나씩, 겹치지 않게 나눠 준다.
//  - config.tunnel 이 true 이고 cloudflared 가 있으면 Cloudflare 임시 터널(https)을 열어 수강생 기기에서 접속하게 한다.
//
//   GET  /health                       상태(용량·실행 수·사용량 초과 여부)
//   GET  /files                        내 작업 폴더 파일 목록          (헤더 X-CX-Session, X-CX-Code)
//   GET  /ws/<세션>/<경로>[?dl=1]      작업 폴더 파일 보기(미리보기 iframe) · dl=1 이면 내려받기
//   GET  /zip/<세션>                   작업 폴더 전체를 zip 으로 내려받기
//   PUT  /upload?name=파일             파일 올리기
//   POST /join                         자리 잡기(PC당 config.seats 명, 기본 maxConcurrent) — 다 찼으면 429 seats-full
//   POST /run   {prompt, engine?, threadId?, images?[]}  → {jobId}
//   GET  /job/<id>?from=n              작업 이벤트 이어 받기 → {events, next, done}
//   POST /stop  {jobId}                작업 중지
//   POST /delete {paths?[], all?}      내 작업 폴더의 파일 지우기(스레드를 지울 때) — all 이면 폴더를 비운다
//   GET  /admin/turns                  모든 참가자의 작업 기록 — 강사 모드 서명(X-CX-Admin)이 있어야 한다
//   GET  /  (그 밖)                    발표 화면(../site) — 인터넷이 안 될 때 이 PC에서 직접 열기용

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import tls from 'node:tls';
import zlib from 'node:zlib';
import { spawn, execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// 학교망 보안 프로그램(예: Plantynet OfficeGuard)이 HTTPS를 자기 인증서로 다시 서명하면 Node가 믿지 않아
// 자동 찾기 알림(ntfy.sh)이 UNABLE_TO_VERIFY_LEAF_SIGNATURE 로 실패한다 → 윈도 인증서 저장소의 인증서도 믿게 한다.
// (Node 22.19+/24.5+. 그보다 낮으면 bat 의 NODE_USE_SYSTEM_CA=1 이 같은 일을 한다)
try {
  if (tls.setDefaultCACertificates && tls.getCACertificates) tls.setDefaultCACertificates([...new Set([...tls.getCACertificates('default'), ...tls.getCACertificates('system')])]);
} catch { /* 지원 안 함 */ }

const HERE = path.dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8'));
const CC = Object.assign({   // Claude 엔진 설정 (config.json 의 "claude")
  model: 'claude-sonnet-5-5', effort: 'high', permissionMode: 'acceptEdits',
  tools: ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'PowerShell', 'TodoWrite', 'WebSearch', 'WebFetch'],
  allowedTools: ['WebSearch', 'WebFetch', 'Bash(ffmpeg:*)', 'Bash(ffprobe:*)', 'Bash(python:*)', 'Bash(py:*)', 'Bash(pip install:*)', 'Bash(node:*)', 'Bash(ls:*)', 'Bash(dir:*)', 'Bash(mkdir:*)', 'PowerShell(ffmpeg:*)', 'PowerShell(python:*)', 'PowerShell(node:*)',
    // 정해진 실습 밖의 요청도 막히지 않게: 파일 보기·복사·옮기기 같은 무해한 명령(지우기·설치는 넣지 않는다)
    'Bash(cat:*)', 'Bash(head:*)', 'Bash(tail:*)', 'Bash(wc:*)', 'Bash(cp:*)', 'Bash(mv:*)', 'Bash(echo:*)',
    'PowerShell(Get-ChildItem:*)', 'PowerShell(Get-Content:*)', 'PowerShell(Copy-Item:*)', 'PowerShell(Move-Item:*)', 'PowerShell(New-Item:*)',
    'Bash(npx -y hyperframes:*)', 'Bash(npx hyperframes:*)', 'PowerShell(npx -y hyperframes:*)', 'PowerShell(npx hyperframes:*)'],
}, cfg.claude || {});
const PORT = Number(process.env.PORT || cfg.port || 8787);
const WORKSPACE = path.resolve(HERE, cfg.workspace || 'workspace');
const ORIGINS = new Set(cfg.origins || []);
const CODE = String(process.env.CX_CODE || cfg.accessCode || '').trim();   // 공개용 bat은 실행할 때 입력받은 코드를 CX_CODE로 넘긴다
const MAX_RUN = Math.max(1, Number(cfg.maxConcurrent) || 4);
const SEATS = Math.max(1, Number(cfg.seats) || MAX_RUN);   // 이 PC에 자리 잡을 수 있는 수강생 수 — PC 2대·8명이면 4명씩
const LABEL = String(process.env.LABEL || cfg.label || os.hostname());
const NAME = { claude: 'Claude', codex: 'Codex' };
const SITE_URL = String(cfg.siteUrl || 'https://midong-edutech.vercel.app').replace(/\/$/, '');
const SITE = path.resolve(HERE, '..', 'site');
const DISCOVERY = String(cfg.discovery || '');   // 연결 주소 자동 알림 채널(ntfy.sh)
if (!CODE) {   // 입장 코드 없이 켜면 누구나 이 PC의 AI를 쓸 수 있으므로 막는다
  console.log('\n  입장 코드가 정해지지 않아 브리지를 켤 수 없습니다. (config.json 의 accessCode 또는 실행할 때 입력)\n');
  process.exit(1);
}
fs.mkdirSync(WORKSPACE, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
  '.srt': 'text/plain; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8', '.pdf': 'application/pdf', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json',
};

// ---- Codex 실행 파일 찾기 -------------------------------------------------
function findCodexJs() {
  if (process.env.CODEX_JS && fs.existsSync(process.env.CODEX_JS)) return process.env.CODEX_JS;
  const appdata = process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
  if (appdata && fs.existsSync(appdata)) return appdata;
  try {
    const root = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const p = path.join(root, '@openai', 'codex', 'bin', 'codex.js');
    if (fs.existsSync(p)) return p;
  } catch { /* npm 없음 */ }
  return null;
}
const CODEX_JS = findCodexJs();
function codexCmd(args) {
  return CODEX_JS ? [process.execPath, [CODEX_JS, ...args], {}] : ['codex', args, { shell: true }];
}
// ---- Claude Code 실행 파일 찾기 (npm 설치: bin/claude.exe, 예전 버전: cli.js, 단독 설치: ~/.local/bin) ----
function findClaude() {
  if (process.env.CLAUDE_EXE && fs.existsSync(process.env.CLAUDE_EXE)) return process.env.CLAUDE_EXE;
  const pkgs = [process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules')];
  try { pkgs.push(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch { /* npm 없음 */ }
  const cands = [];
  for (const r of pkgs.filter(Boolean)) cands.push(path.join(r, '@anthropic-ai', 'claude-code', 'bin', 'claude.exe'), path.join(r, '@anthropic-ai', 'claude-code', 'cli.js'));
  cands.push(path.join(os.homedir(), '.local', 'bin', process.platform === 'win32' ? 'claude.exe' : 'claude'));
  const hit = cands.find(p => fs.existsSync(p));
  if (hit) return hit;
  try { return execSync(process.platform === 'win32' ? 'where claude.exe' : 'which claude', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/)[0].trim() || null; } catch { return null; }
}
const CLAUDE_EXE = findClaude();
function claudeCmd(args) {
  return CLAUDE_EXE && CLAUDE_EXE.endsWith('.js') ? [process.execPath, [CLAUDE_EXE, ...args], {}] : [CLAUDE_EXE || 'claude', args, {}];
}
// 강사 PC의 Claude Code 세션 안에서 브리지를 켜도 그 세션 설정이 섞이지 않게 한다
function claudeEnv() {
  const env = { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1', HYPERFRAMES_SKIP_SKILLS: '1' };   // hyperframes init 이 강사의 ~/.claude/skills 에 스킬을 깔지 않게
  for (const k of Object.keys(env)) if ((/^CLAUDE/i.test(k) && !/^CLAUDE_CODE_(OAUTH_TOKEN|GIT_BASH_PATH|DISABLE_AUTO_MEMORY|USE_POWERSHELL_TOOL)$/i.test(k)) || /^ANTHROPIC_BASE_URL$/i.test(k)) delete env[k];
  return env;
}

// ---- mixdog CLI: 계정 여러 개를 수강생마다 나눠 쓰기 ----------------------------------------------
// config.mixdog 의 claude/codex 에 provider·model·effort 를 적는다(false 면 쓰지 않음). 기본은 Sonnet 5.5 medium · GPT-6.1 Sol high.
// mixdog 가 없거나 그 provider 에 로그인한 계정이 없으면 원래 CLI(claude·codex)를 쓴다.
const MX = cfg.mixdog === false ? null : {
  claude: { provider: 'anthropic-oauth', model: 'claude-sonnet-5-5', effort: 'medium', ...((cfg.mixdog || {}).claude || {}) },
  codex: { provider: 'openai-oauth', model: 'gpt-6.1-sol', effort: 'high', ...((cfg.mixdog || {}).codex || {}) },
};
// provider → [자격 증명 파일을 직접 지정하는 환경 변수, 기본 계정(default)의 파일 이름]
const MX_CRED = { 'anthropic-oauth': ['ANTHROPIC_OAUTH_CREDENTIALS_PATH', 'anthropic-oauth-credentials.json'], 'openai-oauth': ['OPENAI_OAUTH_CREDENTIALS_PATH', 'openai-oauth.json'], 'grok-oauth': ['GROK_OAUTH_CREDENTIALS_PATH', 'grok-oauth.json'] };
function findMixdog() {
  if (process.env.MIXDOG_CLI && fs.existsSync(process.env.MIXDOG_CLI)) return process.env.MIXDOG_CLI;
  const roots = [process.env.APPDATA && path.join(process.env.APPDATA, 'npm', 'node_modules')];
  try { roots.push(execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch { /* npm 없음 */ }
  return roots.filter(Boolean).map(r => path.join(r, 'mixdog', 'src', 'cli.mjs')).find(p => fs.existsSync(p)) || null;
}
const MIX_CLI = MX && findMixdog();
const MIX_DATA = process.env.MIXDOG_DATA_DIR || path.join(process.env.MIXDOG_HOME || path.join(os.homedir(), '.mixdog'), 'data');
let MIX_VER = ''; try { MIX_VER = JSON.parse(fs.readFileSync(path.join(path.dirname(MIX_CLI), '..', 'package.json'), 'utf8')).version; } catch { /* 없음 */ }
// 로그인해 둔 계정 목록(요청마다 다시 읽어, 브리지를 켠 뒤 로그인한 계정도 쓴다) — 이름표(Account 1…)와 자격 증명 파일 위치만 본다
function mixAccounts(provider) {
  const cred = MX_CRED[provider];
  if (!MIX_CLI || !cred) return [];
  let pool = null; try { pool = JSON.parse(fs.readFileSync(path.join(MIX_DATA, 'provider-accounts.json'), 'utf8')).providers[provider]; } catch { /* 계정 목록 없음 */ }
  const rows = pool && Array.isArray(pool.accounts) && pool.accounts.length ? pool.accounts : [{ id: 'default', label: 'Account 1' }];
  return rows.map(a => ({ id: String(a.id), label: String(a.label || a.id), file: a.id === 'default' ? path.join(MIX_DATA, cred[1]) : path.join(MIX_DATA, 'provider-accounts', provider, `${a.id}.json`) }))
    .filter(a => /^(default|[0-9a-f-]{36})$/.test(a.id) && fs.existsSync(a.file));
}
const viaMix = e => !!(MX && MX[e] && mixAccounts(MX[e].provider).length);

// 이 PC에서 쓸 수 있는 엔진 → 버전 (config.engines 로 하나만 쓰게 할 수도 있다)
const VERSION = {}, CODEX_ISOLATE = [];
for (const e of (Array.isArray(cfg.engines) && cfg.engines.length ? cfg.engines : ['claude', 'codex'])) {
  if (viaMix(e)) { VERSION[e] = `mixdog ${MIX_VER} · ${MX[e].model} · 계정 ${mixAccounts(MX[e].provider).length}개`; continue; }
  try {
    if (e === 'claude') { const [cmd, a, o] = claudeCmd(['--version']); VERSION.claude = 'Claude Code ' + execFileSync(cmd, a, { ...o, encoding: 'utf8', env: claudeEnv(), stdio: ['ignore', 'pipe', 'ignore'] }).trim().replace(/\s*\(Claude Code\)\s*/i, ''); }
    if (e === 'codex') {
      const [cmd, a, o] = codexCmd(['--version']); VERSION.codex = execFileSync(cmd, a, { ...o, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      // 강사 PC의 개인 Codex 설정(config.toml 의 MCP·훅·규칙)은 쓰지 않는다 — 이 옵션이 있는 버전에서만
      try { const [c2, a2, o2] = codexCmd(['exec', '--help']); const h = execFileSync(c2, a2, { ...o2, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); CODEX_ISOLATE.push(...['--ignore-user-config', '--ignore-rules'].filter(f => h.includes(f))); } catch { /* 옛 버전 */ }
      // 단, 윈도에서 작업 폴더에 쓰게 해 주는 샌드박스 설정([windows] sandbox = "elevated" 등)은 그대로 가져온다 — 없으면 읽기 전용이 된다
      if (CODEX_ISOLATE.includes('--ignore-user-config')) {
        try {
          const toml = fs.readFileSync(path.join(process.env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'config.toml'), 'utf8');
          const sec = /^\[windows\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/m.exec(toml);
          const m = sec && /^\s*sandbox\s*=\s*"([a-z_-]+)"/m.exec(sec[1]);
          if (m) CODEX_ISOLATE.push('-c', `windows.sandbox="${m[1]}"`);
        } catch { /* 설정 파일 없음 */ }
      }
    }
  } catch { /* 이 엔진은 없음 */ }
}
const ENGINES = Object.keys(VERSION);
const DEFAULT = ENGINES.includes(cfg.engine) ? cfg.engine : ENGINES[0] || 'claude';

// ---- 공통 --------------------------------------------------------------------
function allowedOrigin(origin) {
  if (!origin) return false;
  if (ORIGINS.has(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
function cors(req, res) {
  const o = req.headers.origin;
  if (allowedOrigin(o)) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CX-Session, X-CX-Code, X-CX-Name, X-CX-Admin, X-CX-Overflow');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');
    res.setHeader('Access-Control-Max-Age', '600');
  }
}
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit = 1e6) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}
const SID_RE = /^[a-z0-9]{8,40}$/;
// ---- HyperFrames (HTML로 만든 모션그래픽을 MP4로 렌더하는 도구, https://github.com/heygen-com/hyperframes) ----
// 수강생 AI가 읽을 HyperFrames 스킬을 강사의 개인 스킬 폴더(~/.claude/skills)가 아니라 workspace/.hyperframes 에 받아 둔다.
// 브리지를 켤 때 한 번 백그라운드로 받는다(npx 로 설치 없이). config.hyperframes 가 false 이면 쓰지 않는다.
const HF_HOME = path.join(WORKSPACE, '.hyperframes'), HF_SKILLS = path.join(HF_HOME, '.agents', 'skills');
const hfReady = () => cfg.hyperframes !== false && fs.existsSync(path.join(HF_SKILLS, 'hyperframes', 'SKILL.md'));
const hfLine = () => hfReady() ? `- 사용자가 하이퍼프레임(HyperFrames)이나 mp4 영상 파일을 요청할 때 HyperFrames를 쓴다(그 밖의 모션그래픽은 HTML 하나로 만든다). 이때 먼저 ${path.join(HF_SKILLS, 'hyperframes', 'SKILL.md')} 를 읽고 따른다(다른 HyperFrames 스킬도 ${HF_SKILLS} 에 있다 — 이 스킬 폴더는 작업 폴더 밖이어도 읽어도 된다). 스킬이 확인 질문을 하라고 해도 묻지 말고 추천 설정으로 렌더까지 끝낸다. 명령은 \`npx -y hyperframes ...\`(init·render 등)로 실행하고 preview 는 켜지 않는다. 프로젝트와 렌더한 mp4 는 이 작업 폴더 안에 두고, mp4 이름을 마지막에 알려 준다.\n` : '';
// ---- PPT 도구: pptxgenjs 를 workspace/.tools 에 한 번 받아 두고 NODE_PATH 로 쓰게 한다(python 이 없는 PC도 같은 방법으로) ----
const TOOLS = path.join(WORKSPACE, '.tools'), TOOLS_NM = path.join(TOOLS, 'node_modules');
process.env.NODE_PATH = [TOOLS_NM, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);   // AI가 실행하는 node 스크립트가 require('pptxgenjs') 를 찾게
const pptReady = () => fs.existsSync(path.join(TOOLS_NM, 'pptxgenjs', 'package.json'));
const pptLine = () => pptReady() ? `- PPT(.pptx)는 미리 설치된 pptxgenjs 로 만든다: 작업 폴더에 make-ppt.cjs 를 쓰고 \`node make-ppt.cjs\` 로 실행한다(\`const pptxgen = require('pptxgenjs')\`, 설치 불필요). pptx 내부 XML을 직접 조립하거나 python-pptx 를 설치하지 않는다.\n` : '';
function prepareTools() {
  if (pptReady()) return;
  fs.mkdirSync(TOOLS, { recursive: true });
  const c = spawn('npm install --no-audit --no-fund --prefix . pptxgenjs@4.0.1', { cwd: TOOLS, env: { ...process.env, NODE_USE_SYSTEM_CA: '1' }, windowsHide: true, shell: true, stdio: 'ignore' });
  c.on('close', code => console.log(pptReady() ? '  ✓ PPT 도구(pptxgenjs)를 받았습니다.' : `  ※ PPT 도구(pptxgenjs)를 받지 못했습니다(코드 ${code}). 인터넷을 확인하세요.`));
  c.on('error', () => {});
}
// ---- ffmpeg: 윈도 Codex 샌드박스는 명령을 다른 사용자(CodexSandboxOffline)로 돌린다. winget 으로 사용자 폴더에 깐 ffmpeg 는
//      그 사용자에게 읽기 권한이 없어 PATH 에 있어도 'Access is denied' 가 난다 → workspace/.tools/ffmpeg 에 복사해 Codex PATH 맨 앞에 둔다
const FF_DIR = path.join(TOOLS, 'ffmpeg');
function prepareFfmpeg() {
  if (process.platform !== 'win32' || !VERSION.codex) return;
  const src = (process.env.PATH || '').split(path.delimiter).find(d => d && path.resolve(d) !== FF_DIR && fs.existsSync(path.join(d, 'ffmpeg.exe')));
  // Program Files 등은 샌드박스도 읽을 수 있다 — 사용자 폴더 안에 있는 것만 복사(공유 빌드면 dll 도 함께)
  if (!src || !path.resolve(src).toLowerCase().startsWith(os.homedir().toLowerCase() + path.sep)) return;
  fs.mkdirSync(FF_DIR, { recursive: true });
  for (const n of fs.readdirSync(src).filter(n => /^(ffmpeg|ffprobe)\.exe$|\.dll$/i.test(n))) {
    const from = path.join(src, n), to = path.join(FF_DIR, n);
    try { if (fs.existsSync(to) && fs.statSync(to).size === fs.statSync(from).size) continue; } catch { continue; }
    fs.promises.copyFile(from, to + '.part').then(() => fs.promises.rename(to + '.part', to)).catch(() => {});
  }
}
function codexEnv() {
  const env = { ...process.env, HYPERFRAMES_SKIP_SKILLS: '1' };
  if (fs.existsSync(path.join(FF_DIR, 'ffmpeg.exe'))) { const k = Object.keys(env).find(k => /^path$/i.test(k)) || 'PATH'; env[k] = FF_DIR + path.delimiter + (env[k] || ''); }
  return env;
}
function agentsText() {
  const f = path.join(WORKSPACE, 'AGENTS.md');
  return (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/\s*$/, '\n') : '') + hfLine() + pptLine();
}
function prepareHyperframes() {
  if (cfg.hyperframes === false) return;
  fs.mkdirSync(HF_HOME, { recursive: true });
  const npx = (args, env, cb) => {   // 윈도의 npx.cmd 는 shell 로만 실행된다(인자는 단순한 낱말뿐)
    const c = spawn(['npx -y hyperframes', ...args].join(' '), { cwd: HF_HOME, env, windowsHide: true, shell: true, stdio: 'ignore' });
    c.on('close', cb); c.on('error', () => cb(1));
  };
  const was = hfReady();
  // 스킬은 HOME 을 바꿔서 workspace/.hyperframes 아래로만 받는다
  npx(['skills', 'update', 'motion-graphics', 'general-video'], { ...process.env, NODE_USE_SYSTEM_CA: '1', HOME: HF_HOME, USERPROFILE: HF_HOME }, code => {
    if (hfReady()) { if (!was) console.log('  ✓ HyperFrames 스킬을 받았습니다. 수강생 AI가 모션그래픽을 mp4로 만들 수 있습니다.'); }
    else console.log(`  ※ HyperFrames 스킬을 받지 못했습니다(코드 ${code}). 인터넷과 Node 22 이상인지 확인하세요. 모션그래픽은 HTML로만 만듭니다.`);
    // 렌더용 크롬은 평소 위치에 받아 둔다(첫 렌더가 느리지 않게)
    npx(['browser', 'ensure'], { ...process.env, NODE_USE_SYSTEM_CA: '1' }, () => {});
  });
}
function sessionDir(sid) {
  const dir = path.join(WORKSPACE, sid);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // AGENTS.md(+ HyperFrames 안내)를 넣는다. 내용이 바뀌면 이미 있는 폴더에도 새로 넣는다
  try { const want = agentsText(), mine = path.join(dir, 'AGENTS.md'); if (want && (!fs.existsSync(mine) || fs.readFileSync(mine, 'utf8') !== want)) fs.writeFileSync(mine, want, 'utf8'); } catch { /* noop */ }
  return dir;
}
function inside(base, rel) {
  const p = path.resolve(base, rel);
  return p === base || p.startsWith(base + path.sep) ? p : null;
}
function listFiles(base, dir = base, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'AGENTS.md') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (out.length < 400) listFiles(base, full, out); continue; }
    const st = fs.statSync(full);
    out.push({ path: path.relative(base, full).split(path.sep).join('/'), size: st.size, mtime: st.mtimeMs });
  }
  return out;
}
// 내려받기 이름(한글 그대로): Content-Disposition 의 filename* 에 UTF-8 로 넣는다
const attachment = name => ({ 'Content-Disposition': `attachment; filename="${name.replace(/[^\x20-\x7e]|["\\]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}` });
function sendFile(req, res, p, extra) {
  const st = fs.statSync(p);
  const type = MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
  if (range && (range[1] || range[2])) { // 영상 탐색(seek)용
    const start = range[1] ? Number(range[1]) : st.size - Number(range[2]);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Cache-Control': 'no-store', ...extra });
    return fs.createReadStream(p, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store', ...extra });
  fs.createReadStream(p).pipe(res);
}

// ---- 작업 폴더를 zip 하나로 (외부 프로그램 없이, 한글 이름은 UTF-8 표시) ----
const CRC_T = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = buf => { if (zlib.crc32) return zlib.crc32(buf); let c = 0xFFFFFFFF; for (const b of buf) c = CRC_T[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
function zipDir(base, list) {
  const parts = [], central = []; let off = 0;
  for (const f of list) {
    const data = fs.readFileSync(path.join(base, f.path)), name = Buffer.from(f.path, 'utf8');
    const store = /\.(mp4|webm|mov|mp3|wav|m4a|png|jpe?g|gif|webp|zip|pptx|docx|xlsx|hwpx|pdf)$/i.test(f.path);   // 이미 압축된 파일은 그대로
    const body = store ? data : zlib.deflateRawSync(data), crc = crc32(data), d = new Date(f.mtime);
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((Math.max(1980, d.getFullYear()) - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(store ? 0 : 8, 8);
    lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(body.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(store ? 0 : 8, 10);
    ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(body.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28); ch.writeUInt32LE(off, 42);
    parts.push(lh, name, body); central.push(ch, name);
    off += 30 + name.length + body.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(list.length, 8); end.writeUInt16LE(list.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16);
  return Buffer.concat([...parts, cd, end]);
}

// ---- 사용량 초과 감지 ----------------------------------------------------------
// Codex가 계정 사용량 한도(5시간·주간)에 걸리면 그 동안은 '사용량 초과'로 알려 브라우저가 다른 PC로 보낸다.
const limitedUntil = { claude: 0, codex: 0 };
const acctLimited = new Map();   // mixdog 계정 'provider|id' → 풀리는 시각 (그 계정만 쉬고, 같은 PC의 다른 계정은 계속 쓴다)
const LIMIT_RE = /usage limit|rate.?limit|quota|too many requests|\b429\b|limit reached|hit your .{0,20}limit|try again (in|at)/i;
function noteLimit(text, eng, acct) {
  if (!text || !LIMIT_RE.test(text)) return false;
  const m = /try again in\s+(?:(\d+)\s*h(?:ours?)?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?/i.exec(text);
  let ms = m && (m[1] || m[2]) ? ((+m[1] || 0) * 60 + (+m[2] || 0)) * 60000 : 30 * 60000;
  // Claude 는 'You've hit your weekly limit · resets 10pm (Asia/Seoul)' 처럼 풀리는 시각을 알려 준다 → 그때까지 보내지 않는다
  const rs = /resets\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i.exec(text);
  if (rs) { const d = new Date(); d.setHours((+rs[1] % 12) + (/pm/i.test(rs[3]) ? 12 : 0), +rs[2] || 0, 0, 0); if (d <= Date.now()) d.setDate(d.getDate() + 1); ms = d - Date.now(); }
  if (acct) {
    acctLimited.set(acct.key, Date.now() + Math.max(ms, 5 * 60000));
    console.log(`[사용량] mixdog ${acct.label}(${NAME[eng]}) 한도에 걸렸습니다. ${new Date(acctLimited.get(acct.key)).toLocaleTimeString('ko-KR')}까지 다른 계정을 씁니다.`);
    return true;
  }
  limitedUntil[eng] = Date.now() + Math.max(ms, 5 * 60000);
  console.log(`[사용량] ${NAME[eng]} 한도에 걸렸습니다. ${new Date(limitedUntil[eng]).toLocaleTimeString('ko-KR')}까지 다른 PC로 보냅니다.`);
  return true;
}
const acctFree = (provider, a) => !(Date.now() < (acctLimited.get(`${provider}|${a.id}`) || 0));
// mixdog 로 돌리는 엔진은 계정이 모두 쉬는 중일 때만 '사용량 초과'
const isLimited = eng => viaMix(eng) ? !mixAccounts(MX[eng].provider).some(a => acctFree(MX[eng].provider, a)) : Date.now() < limitedUntil[eng];
const limitEnd = eng => viaMix(eng) ? Math.min(...mixAccounts(MX[eng].provider).map(a => acctLimited.get(`${MX[eng].provider}|${a.id}`) || 0)) : limitedUntil[eng];

// ---- Codex / Claude 작업 ------------------------------------------------------------------
const jobs = new Map();          // jobId → {sid, events[], done, child}
const threadOwner = new Map();   // Codex 스레드 → 세션 (다른 사람 스레드 이어쓰기 방지)
const OWNERS = path.join(WORKSPACE, '.threads.json');
try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(OWNERS, 'utf8')))) threadOwner.set(k, v); } catch { /* 처음 */ }
const saveOwners = () => { try { fs.writeFileSync(OWNERS, JSON.stringify(Object.fromEntries(threadOwner))); } catch { /* noop */ } };
const running = () => [...jobs.values()].filter(j => !j.done).length;
const lastSeen = new Map();   // 세션 → 마지막 접속 시각 (PC별 참가 인원 계산)

// ---- 작업 기록 (강사가 모든 참가자의 스레드를 볼 수 있게) ----
// 한 번 실행할 때마다 {누가, 무엇을 시켰고, 무엇이 답했고, 어떤 파일이 생겼는지}를 남긴다. workspace/.turns.jsonl 에 이어 쓰고, 최근 2000개만 메모리에 둔다.
const TURNS = path.join(WORKSPACE, '.turns.jsonl');
let turns = [];
try { turns = fs.readFileSync(TURNS, 'utf8').split('\n').filter(Boolean).slice(-2000).map(l => JSON.parse(l)); } catch { /* 처음 */ }
const names = new Map();   // 세션 → 참가자 이름(의견 나누기에서 정한 가상 이름)
for (const t of turns) if (t.name) names.set(t.sid, t.name);
// 수강생이 올린 파일(레퍼런스 영상 등) — 결과물 목록·강사 영상 모아 보기에서 빼려고 세션별로 기억한다
const UPLOADS = path.join(WORKSPACE, '.uploads.json');
const uploads = new Map();   // 세션 → Set(올린 파일 이름)
try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(UPLOADS, 'utf8')))) uploads.set(k, new Set(v)); } catch { /* 처음 */ }
const saveUploads = () => { try { fs.writeFileSync(UPLOADS, JSON.stringify(Object.fromEntries([...uploads].map(([k, v]) => [k, [...v]])))); } catch { /* noop */ } };
const IS_VIDEO = /\.(mp4|webm|mov|m4v|avi|mkv)$/i;
// 이름으로 보아 참고·원본 영상(AI가 레퍼런스를 복사·변환한 것 포함)
const REF_NAME = /(^|[\/_\-. ])(ref|refs|reference|references|레퍼런스|참고|원본|source|src|input|orig|original)([\/_\-. ]|\d|$)/i;
const isRefName = p => (REF_NAME.test(p) || /(레퍼런스|참고|원본)/.test(p)) && !/(subtitl|caption|자막|final|output|render|result|결과|완성)/i.test(p);   // 결과물임을 밝힌 이름은 남긴다
const saveTurn = t => { try { fs.appendFileSync(TURNS, JSON.stringify(t) + '\n'); } catch { /* noop */ } };

// 강사 확인: 발표 화면 강사 모드의 서명 키(js/live-key.js 의 공개키)로 'cx-admin|시각' 에 서명한 값만 받는다
let ADMIN_KEY = null;
async function adminKey() {
  if (ADMIN_KEY) return ADMIN_KEY;
  let text = '';
  try { text = fs.readFileSync(path.join(SITE, 'js', 'live-key.js'), 'utf8'); } catch {
    try { text = await (await fetch(SITE_URL + '/js/live-key.js', { signal: AbortSignal.timeout(10000) })).text(); } catch { return null; }
  }
  const m = /"pub"\s*:\s*(\{[^}]*\})/.exec(text);
  try { ADMIN_KEY = m && crypto.createPublicKey({ key: JSON.parse(m[1]), format: 'jwk' }); } catch { ADMIN_KEY = null; }
  return ADMIN_KEY;
}
async function isAdmin(req) {
  const [t, sig] = String(req.headers['x-cx-admin'] || '').split('.');
  if (!t || !sig || Math.abs(Date.now() - Number(t)) > 10 * 60000) return false;
  const key = await adminKey(); if (!key) return false;
  try { return crypto.verify('sha256', Buffer.from(`cx-admin|${t}`), { key, dsaEncoding: 'ieee-p1363' }, Buffer.from(sig, 'base64')); } catch { return false; }
}
// 자리: /join 이나 실행으로 이 PC에 자리 잡은 수강생(3시간 동안 유지). 파일 목록만 본 사람은 세지 않는다
const seated = new Map();   // 세션 → 마지막으로 쓴 시각
const seatedNow = () => { const t = Date.now() - 3 * 3600000; return [...seated].filter(([, v]) => v > t).map(([k]) => k); };
const members = () => seatedNow().length;

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}

// ---- Claude stream-json → Codex 이벤트 모양 (발표 화면 codex.js 가 그대로 그린다) ----
//  system.init → thread.started · text → agent_message · thinking → reasoning · Bash/PowerShell/Read/Glob/Grep → command_execution
//  Write/Edit → file_change · TodoWrite → todo_list · WebSearch → web_search · 그 밖의 도구 → mcp_tool_call · result → turn.completed/failed
function claudeToCodex(dir) {
  const pending = new Map();   // tool_use_id → item
  let n = 0;
  const rel = p => { const r = path.relative(dir, String(p || '')); return r && !r.startsWith('..') ? r.split(path.sep).join('/') : String(p || ''); };
  const textOf = c => typeof c === 'string' ? c : Array.isArray(c) ? c.map(x => x.text || (x.type === 'image' ? '[이미지]' : '')).join('\n') : '';
  function toolItem(b) {
    const i = b.input || {}, id = b.id;
    switch (b.name) {
      case 'Bash': case 'PowerShell': return { id, type: 'command_execution', command: i.command || '', status: 'in_progress' };
      case 'Read': return { id, type: 'command_execution', command: `읽기 ${rel(i.file_path)}`, status: 'in_progress' };
      case 'Glob': return { id, type: 'command_execution', command: `찾기 ${i.pattern || ''}`, status: 'in_progress' };
      case 'Grep': return { id, type: 'command_execution', command: `검색 "${i.pattern || ''}"${i.path ? ' ' + rel(i.path) : ''}`, status: 'in_progress' };
      case 'Write': case 'Edit': case 'MultiEdit': case 'NotebookEdit': {
        const f = i.file_path || i.notebook_path || '';
        return { id, type: 'file_change', changes: [{ path: f, kind: b.name === 'Write' && !fs.existsSync(f) ? 'add' : 'update' }], status: 'in_progress' };
      }
      case 'TodoWrite': return { id: 'todo', type: 'todo_list', items: (i.todos || []).map(t => ({ text: t.content || '', completed: t.status === 'completed' })) };
      case 'WebSearch': return { id, type: 'web_search', query: i.query || '' };
      case 'WebFetch': return { id, type: 'mcp_tool_call', server: '웹', tool: i.url || '', status: 'in_progress' };
      default: return { id, type: 'mcp_tool_call', server: 'Claude', tool: b.name, status: 'in_progress' };
    }
  }
  return ev => {
    const out = [];
    if (ev.type === 'system' && ev.subtype === 'init' && ev.session_id) out.push({ type: 'thread.started', thread_id: ev.session_id, model: ev.model });
    else if (ev.type === 'assistant') {
      if (ev.error) return out;   // 인증·한도 오류 안내문 — 아래 result 에서 turn.failed 로 보여 준다
      for (const b of ev.message?.content || []) {
        if (b.type === 'text' && b.text.trim()) out.push({ type: 'item.completed', item: { id: 'c' + (++n), type: 'agent_message', text: b.text } });
        else if (b.type === 'thinking' && (b.thinking || '').trim()) out.push({ type: 'item.completed', item: { id: 'c' + (++n), type: 'reasoning', text: b.thinking } });
        else if (b.type === 'tool_use') {
          const it = toolItem(b);
          if (it.type === 'todo_list') { out.push({ type: 'item.updated', item: it }); continue; }
          pending.set(b.id, it);
          if (it.type !== 'file_change') out.push({ type: 'item.started', item: { ...it } });   // 파일 변경은 성공했을 때만 보여 준다
        }
      }
    } else if (ev.type === 'user' && Array.isArray(ev.message?.content)) {
      for (const b of ev.message.content) {
        const it = b.type === 'tool_result' && pending.get(b.tool_use_id);
        if (!it) continue;
        pending.delete(b.tool_use_id);
        const text = textOf(b.content);
        if (it.type === 'file_change') {
          if (b.is_error) out.push({ type: 'item.completed', item: { id: it.id, type: 'command_execution', command: `쓰기 ${rel(it.changes[0].path)}`, exit_code: 1, aggregated_output: text.slice(-2000) } });
          else out.push({ type: 'item.completed', item: { ...it, status: 'completed' } });
        } else if (it.type === 'command_execution') out.push({ type: 'item.completed', item: { ...it, status: b.is_error ? 'failed' : 'completed', exit_code: b.is_error ? 1 : 0, aggregated_output: text.slice(-6000) } });
        else out.push({ type: 'item.completed', item: { ...it, status: b.is_error ? 'failed' : 'completed' } });
      }
    } else if (ev.type === 'result') {
      if (ev.is_error || ev.subtype !== 'success') out.push({ type: 'turn.failed', error: { message: ev.result || (ev.errors || []).join('\n') || ev.subtype } });
      else out.push({ type: 'turn.completed', usage: ev.usage });
    }
    return out;
  };
}

// ---- mixdog: 수강생 ↔ 계정 배정 ----
// 수강생(세션)마다 계정 하나를 정해 두고 계속 쓴다. 새로 정할 때는 지금 참가 중인 사람이 가장 적게 쓰는 계정,
// 그다음 지금 실행 중인 작업이 적은 계정 — 4명이면 계정 4개에 한 명씩. 사용량이 다 찬 계정은 풀릴 때까지 건너뛴다.
const ACCTS = path.join(WORKSPACE, '.accounts.json');
const acctOf = new Map();   // '세션|provider' → 계정 id
try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(ACCTS, 'utf8')))) acctOf.set(k, v); } catch { /* 처음 */ }
const saveAccts = () => { try { fs.writeFileSync(ACCTS, JSON.stringify(Object.fromEntries(acctOf))); } catch { /* noop */ } };
function pickAccount(sid, provider, skip = [], reassign = false) {
  const list = mixAccounts(provider).filter(a => acctFree(provider, a) && !skip.includes(a.id));
  if (!list.length) return null;
  const key = `${sid}|${provider}`;
  const mine = !reassign && list.find(a => a.id === acctOf.get(key));
  if (mine) return mine;
  const active = new Set(seatedNow().filter(x => x !== sid));
  const users = id => [...acctOf].filter(([k, v]) => v === id && k.endsWith('|' + provider) && active.has(k.split('|')[0])).length;
  const runs = id => [...jobs.values()].filter(j => !j.done && j.account === `${provider}|${id}`).length;
  list.sort((x, y) => users(x.id) - users(y.id) || runs(x.id) - runs(y.id));
  acctOf.set(key, list[0].id); saveAccts();
  return list[0];
}
function mixEnv(provider, acc) {
  const env = { ...process.env, HYPERFRAMES_SKIP_SKILLS: '1' };
  for (const [name] of Object.values(MX_CRED)) delete env[name];
  env[MX_CRED[provider][0]] = acc.file;   // 이 실행은 이 계정의 자격 증명 파일만 쓴다
  return env;
}
// mixdog exec 는 한 번 묻고 끝나 이어 쓰기가 없다 → 브리지가 스레드마다 앞선 대화(요청·답)를 기억해 다음 요청에 붙인다
const MIXT = path.join(WORKSPACE, '.mixthreads.json');
const mixThreads = new Map();   // 스레드 id → [{u, a}]
try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(MIXT, 'utf8')))) mixThreads.set(k, v); } catch { /* 처음 */ }
const saveMixThreads = () => { try { fs.writeFileSync(MIXT, JSON.stringify(Object.fromEntries(mixThreads))); } catch { /* noop */ } };

// ---- mixdog exec --json → Codex 이벤트 모양 ----
//  thread.started(브리지가 정한 스레드 id로) · agent_message · reasoning 은 그대로, tool_call 은 도구 이름으로
//  shell → command_execution · edit/write/patch → file_change · read/grep/glob/find/list → command_execution(읽기·검색·찾기) · web_search · 그 밖 → mcp_tool_call
function mixToCodex(dir, tid, resumed) {
  let started = !!resumed;
  const rel = p => { const r = path.relative(dir, path.resolve(dir, String(p || ''))); return r && !r.startsWith('..') ? r.split(path.sep).join('/') : String(p || ''); };
  const str = v => typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v);
  function tool(ev) {
    const it = ev.item, n = String(it.name || '').toLowerCase(), a = it.arguments && typeof it.arguments === 'object' ? it.arguments : {};
    const done = ev.type === 'item.completed', ok = !/fail|error|denied/i.test(String(it.status || ''));
    const out = str(it.output), f = a.file_path || a.path || a.file || '';
    if (/^(edit|write|create|apply_patch|patch|multi_?edit|str_replace)/.test(n)) {   // 파일 변경은 성공했을 때만 보여 준다
      if (!done) return [];
      const files = f ? [f] : [...String(a.patch || a.input || a.diff || '').matchAll(/\*\*\* (?:Add|Update) File: (.+)/g)].map(m => m[1].trim());
      if (!ok) return [{ type: 'item.completed', item: { id: it.id, type: 'command_execution', command: `쓰기 ${files.map(rel).join(', ')}`, exit_code: 1, aggregated_output: out.slice(-2000) } }];
      return files.length ? [{ type: 'item.completed', item: { id: it.id, type: 'file_change', changes: files.map(x => ({ path: path.resolve(dir, x), kind: 'update' })), status: 'completed' } }] : [];
    }
    let item;
    if (/web_?search|search_web/.test(n)) item = { id: it.id, type: 'web_search', query: a.query || a.q || '' };
    else if (/shell|bash|powershell|exec|command|terminal/.test(n)) item = { id: it.id, type: 'command_execution', command: Array.isArray(a.command) ? a.command.join(' ') : String(a.command || a.cmd || a.script || n) };
    else if (/^read|view|open/.test(n)) item = { id: it.id, type: 'command_execution', command: `읽기 ${rel(f)}` };
    else if (/grep|search/.test(n)) item = { id: it.id, type: 'command_execution', command: `검색 "${a.pattern || a.query || ''}"${f ? ' ' + rel(f) : ''}` };
    else if (/glob|find|list|ls/.test(n)) item = { id: it.id, type: 'command_execution', command: `찾기 ${a.pattern || a.glob || rel(f) || ''}` };
    else item = { id: it.id, type: 'mcp_tool_call', server: 'mixdog', tool: it.name || '' };
    if (!done) return item.type === 'web_search' ? [] : [{ type: 'item.started', item: { ...item, status: 'in_progress' } }];
    if (item.type === 'command_execution') Object.assign(item, { status: ok ? 'completed' : 'failed', exit_code: ok ? 0 : 1, aggregated_output: out.slice(-6000) });
    else if (item.type === 'mcp_tool_call') item.status = ok ? 'completed' : 'failed';
    return [{ type: 'item.completed', item }];
  }
  return ev => {
    if (ev.type === 'thread.started') { if (started) return []; started = true; return [{ type: 'thread.started', thread_id: tid, model: ev.session && ev.session.model }]; }
    if (ev.type === 'item.completed' && ev.item && (ev.item.type === 'agent_message' || ev.item.type === 'reasoning')) return [{ type: 'item.completed', item: { id: ev.item.id, type: ev.item.type, text: ev.item.text || '' } }];
    if ((ev.type === 'item.started' || ev.item && ev.type === 'item.completed') && ev.item && ev.item.type === 'tool_call') return tool(ev);
    if (ev.type === 'turn.completed') return [{ type: 'turn.completed', usage: ev.usage }];
    if (ev.type === 'turn.failed') return [{ type: 'turn.failed', error: { message: (ev.error && ev.error.message) || '실행에 실패했습니다.' } }];
    return [];
  };
}

// 프롬프트에 모델을 적으면(예: 「sonnet으로」, 「haiku 모델로」, 「모델은 opus」, 「GPT-5로」) 그 요청은 그 모델로 실행한다.
// 「하이쿠 시를 써 줘」처럼 낱말만 나온 경우는 무시하도록 「~으로/로」나 「모델」이 붙은 경우만 본다.
const VER = '(?:[\\s-]*[\\d.]+)*', TAIL = '\\s*(?:모델)?\\s*(?:으로|로)(?![가-힣])';
const MODEL_PICK = [['opus', '오퍼스', 'claude-opus-5-5'], ['sonnet', '소넷', 'claude-sonnet-5-5'], ['haiku', '하이쿠', 'claude-haiku-5-5'], ['fable', '페이블', 'claude-fable-5-1']]
  .map(([en, ko, id]) => [new RegExp(`(?:claude[\\s-]*)?${en}${VER}${TAIL}|${ko}${VER}\\s*모델|모델(?:은|을|:)?\\s*(?:claude[\\s-]*)?(?:${en}|${ko})`, 'i'), 'claude', () => id])
  .concat([[new RegExp(`(gpt-\\d[\\w.\\-]*?)${TAIL}|모델(?:은|을|:)?\\s*(gpt-\\d[\\w.\\-]*)`, 'i'), 'codex', x => (x[1] || x[2]).toLowerCase()]]);
function pickModel(text) {
  for (const [re, engine, id] of MODEL_PICK) { const x = re.exec(text); if (x) return { engine, model: id(x) }; }
  return null;
}
async function startRun(req, res, sid) {
  let body;
  try { body = JSON.parse(await readBody(req)); } catch { return json(res, 400, { error: 'bad', message: '요청 형식이 잘못되었습니다.' }); }
  const want = pickModel(String(body.text || body.prompt || ''));
  let ENGINE = body.engine ? String(body.engine) : DEFAULT;
  if (want && want.engine !== ENGINE && ENGINES.includes(want.engine) && !isLimited(want.engine)) ENGINE = want.engine;   // 다른 엔진의 모델을 적었으면 그 엔진으로
  const MODEL = want && want.engine === ENGINE ? want.model : null, AGENT = NAME[ENGINE] || ENGINE;
  if (!ENGINES.includes(ENGINE)) return json(res, 503, { error: 'noengine', message: `${LABEL}에는 ${AGENT}가 설치되어 있지 않습니다.` });
  if (isLimited(ENGINE)) return json(res, 503, { error: 'limited', engine: ENGINE, message: `${LABEL}의 ${AGENT} 사용량이 다 찼습니다.`, limitedUntil: limitedUntil[ENGINE] });
  if ([...jobs.values()].some(j => !j.done && j.sid === sid)) return json(res, 409, { error: 'busy-session', message: '이미 작업 중입니다. 끝나거나 중지한 뒤 다시 보내 주세요.' });
  if (running() >= MAX_RUN) return json(res, 429, { error: 'full', message: `${LABEL}이(가) 다른 작업으로 바쁩니다.` });
  const prompt = String(body.prompt || '').trim();
  const shown = String(body.text || prompt).slice(0, 4000);   // 기록에는 앞선 대화 요약을 뺀, 사람이 실제로 쓴 글을 남긴다
  if (!prompt) return json(res, 400, { error: 'bad', message: '프롬프트가 비어 있습니다.' });
  // 스레드 주인: Codex 는 세션 키(예전 기록 그대로), Claude 는 '세션 키:claude' — 다른 사람·다른 엔진 스레드는 이어 쓰지 않는다
  const owner = ENGINE === 'codex' ? sid : `${sid}:${ENGINE}`;
  let threadId = /^[0-9a-f-]{8,64}$/i.test(body.threadId || '') ? body.threadId : null;
  if (threadId && threadOwner.get(threadId) !== owner) threadId = null;
  const dir = sessionDir(sid);
  const images = (Array.isArray(body.images) ? body.images : []).map(r => inside(dir, String(r))).filter(p => p && fs.existsSync(p));

  let cmd, a, o, input = prompt, conv = null, mix = null;
  if (viaMix(ENGINE)) {
    // mixdog: 이 수강생에게 정해 둔 계정 하나로 실행한다(그 계정 사용량이 다 차면 아래 close 에서 같은 PC의 다른 계정으로 바로 다시 실행)
    const mx = MX[ENGINE], acc = pickAccount(sid, mx.provider);
    if (!acc) return json(res, 503, { error: 'limited', engine: ENGINE, message: `${LABEL}의 ${AGENT} 계정 사용량이 모두 찼습니다.`, limitedUntil: limitEnd(ENGINE) });
    if (threadId && !mixThreads.has(threadId)) threadId = null;   // 예전 CLI 스레드는 이어 쓸 수 없다
    const tid = threadId || crypto.randomUUID();
    const head = `[작업 규칙] 먼저 작업 폴더의 AGENTS.md 를 읽고 따른다. 파일은 작업 폴더(${dir}) 안에만 만든다. 확인 질문 없이 끝까지 해낸다.`;
    const ask = input + (images.length ? `\n\n(첨부 이미지: ${images.map(x => path.relative(dir, x)).join(', ')} — read 도구로 열어 본다)` : '');
    let hist = (mixThreads.get(tid) || []).map(h => `사용자: ${h.u}\nAI: ${h.a}`).join('\n\n');
    hist = hist.slice(-Math.max(0, 26000 - head.length - ask.length));   // 윈도 명령줄 길이(32K) 안에 들어가게 오래된 대화부터 줄인다
    const message = [head, hist && `[앞선 대화]\n${hist}`, `[이번 요청]\n${ask}`].filter(Boolean).join('\n\n');
    mix = { provider: mx.provider, acc, tid, tried: [acc.id], held: null };
    cmd = process.execPath;
    a = [MIX_CLI, 'exec', '--provider', mx.provider, '--model', MODEL || mx.model, ...(mx.effort ? ['--effort', mx.effort] : []), '--json', '--web-search', message];
    o = { env: mixEnv(mx.provider, acc) };
    conv = mixToCodex(dir, tid);
    input = '';
  } else if (ENGINE === 'claude') {
    // Claude Code: 이 세션 폴더 안에서만 파일을 쓰고(acceptEdits), 정해 둔 명령만 실행한다. 강사 PC의 개인 설정·스킬·MCP는 쓰지 않는다.
    const agents = path.join(WORKSPACE, 'AGENTS.md');
    const sys = agentsText() + `- 작업 폴더: ${dir}\n- 첨부 이미지는 Read 도구로 열어 본다.`;
    const args = ['-p', '--output-format', 'stream-json', '--verbose', '--setting-sources', 'project', '--strict-mcp-config', '--disable-slash-commands',
      '--permission-mode', CC.permissionMode, '--append-system-prompt', sys];
    if (hfReady()) args.push('--add-dir', HF_SKILLS);   // HyperFrames 스킬 폴더는 읽을 수 있게
    if (MODEL || CC.model) args.push('--model', MODEL || CC.model);
    if (CC.effort) args.push('--effort', CC.effort);
    if (CC.tools && CC.tools.length) args.push('--tools', CC.tools.join(','));
    if (CC.allowedTools && CC.allowedTools.length) args.push('--allowedTools', CC.allowedTools.join(','));
    if (threadId) args.push('--resume', threadId);
    if (images.length) input += `\n\n(첨부 이미지: ${images.map(p => path.relative(dir, p)).join(', ')})`;
    [cmd, a, o] = claudeCmd(args);
    o = { ...o, env: claudeEnv() };
    conv = claudeToCodex(dir);
  } else {
    const args = ['exec', '--json', '--skip-git-repo-check', ...CODEX_ISOLATE, '-s', 'workspace-write', '-C', dir];
    if (MODEL || cfg.model) args.push('-m', MODEL || cfg.model);
    if (threadId) args.push('resume', threadId);
    for (const img of images) args.push(`--image=${img}`);
    args.push('-');
    [cmd, a, o] = codexCmd(args);
    o = { ...o, env: codexEnv() };
  }

  const id = crypto.randomBytes(9).toString('hex');
  const job = { sid, events: [], done: false, child: null, at: Date.now(), account: mix ? `${mix.provider}|${mix.acc.id}` : '' };
  jobs.set(id, job);
  const turn = { id, sid, name: names.get(sid) || '', engine: ENGINE, model: MODEL || '', label: LABEL, via: mix ? 'mixdog' : '', account: mix ? mix.acc.label : '', prompt: shown, at: job.at, status: 'running', answer: '', files: [] };
  turns.push(turn); if (turns.length > 2000) turns.splice(0, turns.length - 2000);
  // 시작할 때 이미 있던 영상 크기 — 끝나고 같은 크기의 새 영상이 생기면 복사본(참고 영상)으로 본다
  const preVideo = new Set(); try { for (const f of listFiles(dir)) if (IS_VIDEO.test(f.path)) preVideo.add(f.size); } catch { /* noop */ }
  const push = ev => job.events.push(ev);
  push({ type: 'bridge.started', resume: !!threadId, label: LABEL, engine: ENGINE, model: MODEL || (mix ? MX[ENGINE].model : null), account: mix ? mix.acc.label : undefined });
  console.log(`[${new Date().toLocaleTimeString('ko-KR')}] ${sid.slice(0, 6)} ${threadId ? '이어서' : '새 대화'}${mix ? ` [mixdog ${mix.acc.label}]` : ''} (실행 ${running()}/${MAX_RUN}) ${prompt.slice(0, 40).replace(/\s+/g, ' ')}`);

  const onEvent = (ev, release) => {
    // mixdog: 계정 사용량 초과로 끝난 실패는 잠시 붙잡아 둔다 → close 에서 다른 계정으로 다시 실행하면 화면에 실패가 보이지 않는다
    if (mix && !release && ev.type === 'turn.failed' && LIMIT_RE.test((ev.error && ev.error.message) || '')) { mix.held = ev; return; }
    if (ev.type === 'thread.started' && ev.thread_id) { threadOwner.set(ev.thread_id, owner); saveOwners(); }
    if (ev.type === 'item.completed' && ev.item?.type === 'agent_message') turn.answer = String(ev.item.text || '').slice(0, 8000);
    if (ev.type === 'item.completed' && ev.item?.type === 'file_change') for (const c of ev.item.changes || []) { const r = path.relative(dir, path.resolve(dir, String(c.path || ''))).split(path.sep).join('/'); if (r && !r.startsWith('..') && !turn.files.includes(r)) turn.files.push(r); }
    if (ev.type === 'turn.completed') turn.status = 'done';
    if (ev.type === 'turn.failed') turn.status = 'failed';
    const msg = ev.message || ev.error?.message || ev.item?.message || '';
    if (!mix && (ev.type === 'error' || ev.type === 'turn.failed' || ev.item?.type === 'error') && noteLimit(msg, ENGINE)) push({ type: 'bridge.limited', engine: ENGINE, message: msg, label: LABEL });
    push(ev);
  };
  const launch = () => {
    const child = spawn(cmd, a, { env: { ...process.env, HYPERFRAMES_SKIP_SKILLS: '1' }, ...o, cwd: dir, windowsHide: true });
    job.child = child;
    child.stdin.on('error', () => { /* 바로 꺼진 경우 */ });
    child.stdin.end(input, 'utf8');
    let buf = '', errTail = '';
    const onLine = line => {
      let ev; try { ev = JSON.parse(line); } catch { ev = { type: 'bridge.stdout', text: line }; }
      if (mix && ev.type === 'bridge.stdout') return;   // mixdog 의 안내 줄은 화면에 내지 않는다
      if (conv) conv(ev).forEach(x => onEvent(x)); else onEvent(ev);
    };
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const l = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (l) onLine(l); } });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', d => { errTail = (errTail + d).slice(-4000); });
    child.on('error', e => push({ type: 'bridge.error', message: `${AGENT}를 실행하지 못했습니다: ` + e.message }));
    child.on('close', code => {
      if (buf.trim()) onLine(buf.trim());
      const tail = errTail.split('\n').filter(l => l.trim() && !/Reading additional input from stdin|ExperimentalWarning|trace-warnings|^\[[a-z-]+\]/.test(l)).slice(-8).join('\n');
      if (mix && !job.stopped && (mix.held || (code && turn.status === 'running' && LIMIT_RE.test(tail)))) {
        // 이 계정의 사용량이 다 찼다 → 쉬게 하고, 같은 PC에서 쉬지 않는 다른 계정으로 바로 다시 실행한다
        const why = (mix.held && mix.held.error && mix.held.error.message) || tail;
        noteLimit(why, ENGINE, { key: `${mix.provider}|${mix.acc.id}`, label: mix.acc.label });
        const next = pickAccount(sid, mix.provider, mix.tried, true);
        if (next) {
          console.log(`[mixdog] ${sid.slice(0, 6)} ${mix.acc.label} 사용량 초과 → ${next.label}(으)로 다시 실행`);
          mix.tried.push(next.id); mix.acc = next; mix.held = null; turn.account = next.label; job.account = `${mix.provider}|${next.id}`;
          o = { ...o, env: mixEnv(mix.provider, next) };
          conv = mixToCodex(dir, mix.tid, true);
          return launch();
        }
        if (mix.held) { onEvent(mix.held, true); mix.held = null; }
        push({ type: 'bridge.limited', engine: ENGINE, message: why, label: LABEL });   // 이 PC의 계정이 모두 쉬는 중 → 브라우저가 다른 PC로
      } else if (mix && mix.held) { onEvent(mix.held, true); mix.held = null; }
      if (!mix && code && noteLimit(tail, ENGINE)) push({ type: 'bridge.limited', engine: ENGINE, message: tail, label: LABEL });
      push({ type: 'bridge.exit', code, stderr: code ? tail : '' });
      job.done = true; job.child = null; job.endedAt = Date.now();
      if (turn.status === 'running') turn.status = code === null || job.stopped ? 'stopped' : 'failed';
      if (mix && turn.status === 'done') {   // 다음 요청에 붙일 대화 기억(스레드마다 최근 12번)
        const h = (mixThreads.get(mix.tid) || []).concat({ u: shown.slice(0, 2000), a: turn.answer.slice(0, 3000) }).slice(-12);
        mixThreads.delete(mix.tid); mixThreads.set(mix.tid, h);
        while (mixThreads.size > 500) mixThreads.delete(mixThreads.keys().next().value);
        saveMixThreads();
      }
      // 명령(ffmpeg·node·HyperFrames 렌더 등)으로 만든 mp4·pptx 같은 결과물도 기록한다 — 이 작업 동안 새로 생기거나 바뀐 파일
      try {
        const rank = f => /\.(mp4|webm|pptx|pdf|hwpx|docx|xlsx)$/i.test(f) ? 0 : /\.html?$/i.test(f) ? 1 : /\.(png|jpe?g|gif|webp|svg|mp3|wav)$/i.test(f) ? 2 : 3;
        const up = uploads.get(sid) || new Set();
        // 결과물만: 수강생이 올린 파일, 이미 있던 영상의 복사본, 이름이 참고·원본인 영상은 뺀다
        const notResult = f => up.has(f.path) || (IS_VIDEO.test(f.path) && (preVideo.has(f.size) || isRefName(f.path)));
        const all = listFiles(dir), byPath = new Map(all.map(f => [f.path, f]));
        const fresh = all.filter(f => f.mtime >= job.at - 1000 && !notResult(f)).map(f => f.path);
        turn.files = [...new Set([...turn.files.filter(p => !byPath.has(p) || !notResult(byPath.get(p))), ...fresh])].sort((a, b) => rank(a) - rank(b)).slice(0, 40);
      } catch { /* 폴더를 못 읽으면 기록된 것만 */ }
      turn.endedAt = job.endedAt; saveTurn(turn);
    });
  };
  launch();
  json(res, 200, { jobId: id, label: LABEL, engine: ENGINE, model: MODEL });
}

// 끝난 작업 기록은 30분 뒤 지운다
setInterval(() => { const t = Date.now() - 30 * 60000; for (const [k, j] of jobs) if (j.done && j.endedAt < t) jobs.delete(k); }, 60000).unref();

// ---- HTTP 서버 -------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  // DNS 리바인딩 방지: Host는 이 PC 주소만 (터널은 Host를 localhost로 바꿔 보낸다)
  const host = (req.headers.host || '').toLowerCase();
  if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) { res.writeHead(403); return res.end(); }

  cors(req, res);
  const url = new URL(req.url, `http://${host}`);
  const route = url.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  try {
    if (req.method === 'GET' && route === '/health') {
      const engines = Object.fromEntries(ENGINES.map(e => [e, { version: VERSION[e], limited: isLimited(e), limitedUntil: isLimited(e) ? limitEnd(e) : 0, ...(viaMix(e) ? { via: 'mixdog', model: MX[e].model, accounts: mixAccounts(MX[e].provider).length } : {}) }]));
      return json(res, 200, { ok: true, label: LABEL, engines, zip: true, engine: DEFAULT, codex: VERSION[DEFAULT] || null, capacity: MAX_RUN, running: running(), members: members(), seats: SEATS,
        limited: ENGINES.every(e => isLimited(e)), limitedUntil: 0, needsCode: !!CODE });
    }
    if (req.method === 'GET' && route.startsWith('/ws/')) {   // 미리보기: 경로에 세션 키가 들어 있어 남의 파일은 못 본다
      const parts = route.slice(4).split('/');
      const sid = parts.shift();
      if (!SID_RE.test(sid)) { res.writeHead(404); return res.end(); }
      const p = inside(path.join(WORKSPACE, sid), decodeURIComponent(parts.join('/')));
      if (!p || !fs.existsSync(p) || !fs.statSync(p).isFile()) { res.writeHead(404); return res.end('not found'); }
      return sendFile(req, res, p, url.searchParams.has('dl') ? attachment(path.basename(p)) : {});
    }
    if (req.method === 'GET' && route.startsWith('/zip/')) {   // 결과물 모두 받기: 미리보기처럼 경로의 세션 키로 내 폴더만
      const sid = route.slice(5);
      const dir = path.join(WORKSPACE, sid);
      if (!SID_RE.test(sid) || !fs.existsSync(dir)) { res.writeHead(404); return res.end('not found'); }
      const list = listFiles(dir);
      if (!list.length) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('작업 폴더가 비어 있습니다.'); }
      if (list.reduce((a, f) => a + f.size, 0) > 1024 ** 3) { res.writeHead(413, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('파일이 너무 커서(1GB 넘음) 하나씩 받아 주세요.'); }
      const zip = zipDir(dir, list);
      res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Length': zip.length, 'Cache-Control': 'no-store', ...attachment(`AI결과물-${new Date().toISOString().slice(0, 10)}.zip`) });
      return res.end(zip);
    }
    const isApi = ['/files', '/join', '/upload', '/run', '/stop', '/delete', '/admin/turns', '/admin/delete'].includes(route) || route.startsWith('/job/');
    if (!isApi) {   // 발표 화면(../site)
      if (req.method !== 'GET') { res.writeHead(405); return res.end(); }
      let p = inside(SITE, decodeURIComponent(route).replace(/^\/+/, '') || 'index.html');
      if (!p) { res.writeHead(403); return res.end(); }
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
      if (!fs.existsSync(p) || path.relative(SITE, p).split(path.sep).some(seg => seg.startsWith('.'))) { res.writeHead(404); return res.end('not found'); }
      return sendFile(req, res, p);
    }

    // ---- 여기부터 API: 허용된 발표 페이지 + 입장 코드 + 세션 키가 있어야 한다
    // 같은 주소에서 연 발표 화면(GET)은 브라우저가 Origin을 안 붙이므로 Sec-Fetch-Site로 확인한다
    const sameOrigin = !req.headers.origin && req.headers['sec-fetch-site'] === 'same-origin';
    if (!sameOrigin && !allowedOrigin(req.headers.origin)) return json(res, 403, { error: 'origin', message: '허용되지 않은 페이지입니다. config.json의 origins를 확인하세요.' });
    if (CODE && String(req.headers['x-cx-code'] || '') !== CODE) return json(res, 401, { error: 'code', message: '입장 코드가 맞지 않습니다.' });
    const sid = String(req.headers['x-cx-session'] || '');
    if (!SID_RE.test(sid)) return json(res, 400, { error: 'session', message: '세션 정보가 없습니다.' });
    lastSeen.set(sid, Date.now());
    if (seatedNow().includes(sid)) seated.set(sid, Date.now());   // 자리 잡은 사람은 쓰는 동안 자리 유지
    const nm = (() => { try { return decodeURIComponent(String(req.headers['x-cx-name'] || '')).slice(0, 40); } catch { return ''; } })();
    if (nm) names.set(sid, nm);

    if (req.method === 'GET' && route === '/admin/turns') {   // 강사 모드: 이 PC에서 돌린 모든 참가자의 기록
      if (!(await isAdmin(req))) return json(res, 403, { error: 'admin', message: '강사 모드에서만 볼 수 있습니다.' });
      const since = Number(url.searchParams.get('since')) || Date.now() - 12 * 3600000;
      return json(res, 200, { label: LABEL, turns: turns.filter(t => t.at >= since).map(t => ({ ...t, name: t.name || names.get(t.sid) || '', uploads: [...(uploads.get(t.sid) || [])] })) });
    }

    if (req.method === 'POST' && route === '/admin/delete') {   // 강사 모드: 한 참가자의 실행 기록과 작업 폴더를 지운다
      if (!(await isAdmin(req))) return json(res, 403, { error: 'admin', message: '강사 모드에서만 지울 수 있습니다.' });
      let body = {}; try { body = JSON.parse(await readBody(req)); } catch { /* 빈 요청 */ }
      const who = String(body.sid || '');
      if (!SID_RE.test(who)) return json(res, 400, { error: 'bad', message: '참가자 정보가 없습니다.' });
      if ([...jobs.values()].some(j => j.sid === who && !j.done)) return json(res, 409, { error: 'busy', message: '그 참가자는 지금 작업 중입니다.' });
      const before = turns.length;
      turns = turns.filter(t => t.sid !== who);
      try { fs.writeFileSync(TURNS, turns.map(t => JSON.stringify(t)).join('\n') + (turns.length ? '\n' : ''), 'utf8'); } catch { /* noop */ }
      const dir = path.join(WORKSPACE, who);
      if (fs.existsSync(dir)) for (const e of fs.readdirSync(dir)) { if (e === 'AGENTS.md') continue; try { fs.rmSync(path.join(dir, e), { recursive: true, force: true }); } catch { /* 열려 있는 파일 */ } }
      return json(res, 200, { ok: true, turns: before - turns.length });
    }
    if (req.method === 'POST' && route === '/join') {   // 자리 잡기: 자리가 남았거나 이미 내 자리면 OK, 다 찼으면 429 → 브라우저가 다른 PC로
      const mine = seatedNow().includes(sid), others = seatedNow().filter(x => x !== sid).length;
      if (!mine && others >= SEATS && req.headers['x-cx-overflow'] !== '1') return json(res, 429, { error: 'seats-full', seats: SEATS, members: others, message: `${LABEL}의 자리(${SEATS}명)가 다 찼습니다.` });
      seated.set(sid, Date.now());
      return json(res, 200, { ok: true, label: LABEL, seats: SEATS, members: members() });
    }
    if (req.method === 'GET' && route === '/files') {
      return json(res, 200, { files: listFiles(sessionDir(sid)).sort((x, y) => y.mtime - x.mtime) });
    }
    if (req.method === 'POST' && route === '/run') {
      if (!(req.headers['content-type'] || '').includes('application/json')) return json(res, 415, { error: 'bad', message: 'JSON만 받습니다.' });
      seated.set(sid, Date.now());   // 실행한 사람은 이 PC에 자리 잡은 것으로 센다
      return startRun(req, res, sid);
    }
    if (req.method === 'GET' && route.startsWith('/job/')) {
      const job = jobs.get(route.slice(5));
      if (!job || job.sid !== sid) return json(res, 404, { error: 'nojob', message: '작업을 찾을 수 없습니다.' });
      const from = Math.max(0, Number(url.searchParams.get('from')) || 0);
      return json(res, 200, { events: job.events.slice(from), next: job.events.length, done: job.done });
    }
    if (req.method === 'POST' && route === '/stop') {
      let body = {}; try { body = JSON.parse(await readBody(req)); } catch { /* 빈 요청 */ }
      for (const [k, j] of jobs) if (j.sid === sid && !j.done && (!body.jobId || body.jobId === k)) { j.stopped = true; killTree(j.child); }
      return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && route === '/delete') {   // 스레드를 지울 때 그 스레드가 만든 파일도 지운다(내 세션 폴더 안에서만)
      let body = {}; try { body = JSON.parse(await readBody(req)); } catch { /* 빈 요청 */ }
      if ([...jobs.values()].some(j => j.sid === sid && !j.done)) return json(res, 409, { error: 'busy', message: '작업 중에는 지울 수 없습니다.' });
      const dir = sessionDir(sid);
      let deleted = 0;
      if (body.all === true) {
        for (const e of fs.readdirSync(dir)) {
          if (e === 'AGENTS.md') continue;
          try { fs.rmSync(path.join(dir, e), { recursive: true, force: true }); deleted++; } catch { /* 열려 있는 파일 */ }
        }
      } else {
        for (const rel of (Array.isArray(body.paths) ? body.paths : []).slice(0, 2000)) {
          const p = typeof rel === 'string' && inside(dir, rel);
          if (!p || p === dir || path.basename(p) === 'AGENTS.md' || !fs.existsSync(p) || !fs.statSync(p).isFile()) continue;
          try { fs.unlinkSync(p); deleted++; } catch { continue; }
          for (let d = path.dirname(p); d !== dir && d.startsWith(dir + path.sep); d = path.dirname(d)) {   // 비게 된 폴더도 정리
            try { if (fs.readdirSync(d).length) break; fs.rmdirSync(d); } catch { break; }
          }
        }
      }
      return json(res, 200, { ok: true, deleted });
    }
    if (req.method === 'PUT' && route === '/upload') {
      const name = path.basename(String(url.searchParams.get('name') || '')).replace(/[<>:"|?*\x00-\x1f]/g, '_');
      if (!name || name.startsWith('.')) return json(res, 400, { error: 'bad', message: '파일 이름이 잘못되었습니다.' });
      const dest = inside(sessionDir(sid), name);
      const limit = 1024 * 1024 * 1024; let size = 0;
      const out = fs.createWriteStream(dest);
      req.on('data', c => { size += c.length; if (size > limit) { req.destroy(); out.destroy(); fs.rm(dest, () => {}); } });
      req.pipe(out);
      out.on('finish', () => { if (!uploads.has(sid)) uploads.set(sid, new Set()); uploads.get(sid).add(name); saveUploads(); json(res, 200, { ok: true, path: name, size }); });
      out.on('error', e => json(res, 500, { error: 'io', message: e.message }));
      return;
    }
    json(res, 404, { error: 'notfound', message: 'not found' });
  } catch (e) {
    json(res, 500, { error: 'server', message: e.message });
  }
});

// ---- Cloudflare 임시 터널 -----------------------------------------------------------
let tunnelProc = null;
function findCloudflared() {
  const cands = [path.join(HERE, 'cloudflared.exe'), 'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe', 'C:\\Program Files\\cloudflared\\cloudflared.exe'];
  const wg = process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links', 'cloudflared.exe');
  if (wg) cands.push(wg);
  const hit = cands.find(p => fs.existsSync(p));
  if (hit) return hit;
  try { return execSync(process.platform === 'win32' ? 'where cloudflared' : 'which cloudflared', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split(/\r?\n/)[0].trim() || null; } catch { return null; }
}
// 발표 화면이 이 PC를 자동으로 찾도록 연결 주소를 알림 채널에 올린다(입장 코드로 서명 — 가짜 주소 차단). 1시간마다 다시 올림.
// 터널이 막 열린 직후에는 네트워크가 잠깐 불안정해 실패하기 쉬우므로, 실패하면 10초 간격으로 몇 번 더 시도한다.
function announce(pub) {
  if (!DISCOVERY) return;
  const sendOnce = async () => {
    const t = Date.now();
    const sig = crypto.createHmac('sha256', CODE).update(`${pub}|${LABEL}|${t}`).digest('hex');
    const r = await fetch(DISCOVERY, { method: 'POST', body: JSON.stringify({ url: pub, label: LABEL, t, sig }), signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  };
  let warned = false;
  const send = async (tries = 6, again = false) => {
    for (let i = 1; i <= tries; i++) {
      try {
        await sendOnce();
        if (warned) { console.log('  ✓ 자동 찾기 알림을 다시 보냈습니다. 발표 화면이 이 주소를 찾습니다.'); warned = false; }
        return;
      } catch (e) {
        if (i === 1 && !again) { console.log(`  ※ 자동 찾기 알림 실패(${e.cause?.code || e.message}) — 10초마다 다시 시도합니다...`); warned = true; }
        if (i < tries) await new Promise(r => setTimeout(r, 10000));
        else {   // 학교망은 여러 사람이 인터넷 주소 하나를 같이 써서 ntfy.sh 요청 한도(429)에 걸리기 쉽다 → 3분마다 다시 시도
          if (!again) console.log('  ※ 자동 찾기 알림을 아직 못 보냈습니다. 3분마다 다시 시도합니다. 급하면 [연결 관리]에 위 주소를 직접 넣어 주세요.');
          setTimeout(() => send(1, true), 180000).unref();
        }
      }
    }
  };
  send();
  setInterval(send, 3600000).unref();
}

function startTunnel() {
  const exe = findCloudflared();
  if (!exe) {
    console.log('  ※ cloudflared 가 없어 인터넷 연결 주소를 만들지 못했습니다. (이 PC에서만 사용 가능)');
    console.log('    설치: winget install --id Cloudflare.cloudflared -e   (설치 후 이 창을 다시 실행)\n');
    return;
  }
  tunnelProc = spawn(exe, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`, '--http-host-header', `localhost:${PORT}`], { windowsHide: true });
  let shown = false;
  const scan = d => {
    const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(String(d));
    if (!m || shown) return;
    shown = true;
    const pub = m[0];
    const join = `${SITE_URL}/?cx=${encodeURIComponent(pub)}${CODE ? `&code=${encodeURIComponent(CODE)}` : ''}#13`;
    fs.writeFileSync(path.join(HERE, '연결주소.txt'), `${LABEL} 연결 주소\n${pub}\n\n이 PC만 쓰는 참가 링크\n${join}\n`, 'utf8');
    try { execSync('clip', { input: pub }); } catch { /* 클립보드 없음 */ }
    announce(pub);
    console.log('  ┌─────────────────────────────────────────────────────────');
    console.log(`  │ ${LABEL} 연결 주소 (클립보드에 복사됨)`);
    console.log(`  │   ${pub}`);
    console.log(DISCOVERY ? '  │ 발표 화면이 이 주소를 자동으로 찾습니다. (안 되면 [연결 관리]에 붙여 넣기)' : '  │ 발표 화면 13번 → 왼쪽 아래 [연결 관리]에 이 주소를 붙여 넣으세요.');
    console.log('  └─────────────────────────────────────────────────────────\n');
  };
  tunnelProc.stdout.on('data', scan);
  tunnelProc.stderr.on('data', scan);
  tunnelProc.on('close', c => { if (!shown) console.log(`  ※ 터널을 열지 못했습니다(코드 ${c}). 인터넷 연결을 확인하세요.`); });
}

server.listen(PORT, '127.0.0.1', () => {
  console.log('');
  console.log(`  AI 브리지가 켜졌습니다. [${LABEL}]`);
  console.log(`  Claude     ${viaMix('claude') ? `${VERSION.claude} · effort ${MX.claude.effort}` : VERSION.claude ? `${VERSION.claude} · 모델 ${CC.model || '기본'} · effort ${CC.effort || '기본'}` : '없음 — npm i -g @anthropic-ai/claude-code 후 claude auth login'}`);
  console.log(`  Codex      ${viaMix('codex') ? `${VERSION.codex} · effort ${MX.codex.effort}` : VERSION.codex || '없음 — npm i -g @openai/codex 후 codex login'}`);
  if (!ENGINES.length) console.log('  ※ 쓸 수 있는 AI가 없습니다. Claude Code 나 Codex CLI 를 설치해 주세요.');
  if (MX && !MIX_CLI) console.log('  ※ mixdog 가 없어 Claude·Codex CLI 를 그대로 씁니다. (npm i -g mixdog 후 mixdog 에서 계정 로그인)');
  console.log(`  동시 실행  최대 ${MAX_RUN}개 · 자리 ${SEATS}명`);
  console.log(`  입장 코드  ${CODE || '(없음)'}`);
  console.log(`  작업 폴더  ${WORKSPACE}`);
  if (fs.existsSync(path.join(SITE, 'index.html'))) console.log(`  이 PC에서 발표 화면 열기  http://localhost:${PORT}/`);
  console.log('  이 창을 닫으면 브리지가 꺼집니다.\n');
  if (cfg.tunnel) startTunnel();
  prepareHyperframes();
  prepareTools();
  prepareFfmpeg();
});
server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.log(`포트 ${PORT}을(를) 이미 쓰고 있습니다. 브리지가 이미 켜져 있을 수 있습니다.`);
  else console.error(e);
});
const shutdown = () => { for (const j of jobs.values()) if (!j.done) killTree(j.child); if (tunnelProc) killTree(tunnelProc); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
::END server.mjs
::BEGIN config.json
{
  "port": 8787,
  "workspace": "workspace",
  "model": "",
  "origins": [
    "https://midong-edutech.vercel.app"
  ],
  "label": "",
  "accessCode": "",
  "maxConcurrent": 4,
  "seats": 4,
  "mixdog": {
    "claude": {
      "provider": "anthropic-oauth",
      "model": "claude-sonnet-5-5",
      "effort": "medium"
    },
    "codex": {
      "provider": "openai-oauth",
      "model": "gpt-6.1-sol",
      "effort": "high"
    }
  },
  "tunnel": true,
  "siteUrl": "https://midong-edutech.vercel.app",
  "discovery": "https://ntfy.sh/midong-cx-70402f1cb5f3ca16",
  "engine": "claude",
  "claude": {
    "model": "claude-sonnet-5-5",
    "effort": "high",
    "permissionMode": "acceptEdits"
  }
}
::END config.json
::BEGIN mixdog-check.mjs
// 올인원 bat 이 부르는 확인: 이 PC의 mixdog 에 로그인한 Claude·ChatGPT 계정 수 (server.mjs 의 mixAccounts 와 같은 방법)
// 끝 코드: 0 = 둘 다 있음, 2 = 하나만 있음, 1 = 없음
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DATA = process.env.MIXDOG_DATA_DIR || path.join(process.env.MIXDOG_HOME || path.join(os.homedir(), '.mixdog'), 'data');
const CRED = { 'anthropic-oauth': 'anthropic-oauth-credentials.json', 'openai-oauth': 'openai-oauth.json' };
let pools = {};
try { pools = JSON.parse(fs.readFileSync(path.join(DATA, 'provider-accounts.json'), 'utf8')).providers || {}; } catch { /* 계정 목록 없음 */ }
const count = provider => {
  const rows = pools[provider] && Array.isArray(pools[provider].accounts) && pools[provider].accounts.length ? pools[provider].accounts : [{ id: 'default' }];
  return rows.filter(a => fs.existsSync(a.id === 'default' ? path.join(DATA, CRED[provider]) : path.join(DATA, 'provider-accounts', provider, `${a.id}.json`))).length;
};
const claude = count('anthropic-oauth'), chatgpt = count('openai-oauth');
console.log(`  mixdog 계정: Claude ${claude}개 · ChatGPT ${chatgpt}개`);
process.exit(claude && chatgpt ? 0 : claude || chatgpt ? 2 : 1);
::END mixdog-check.mjs
::BEGIN AGENTS.md
# 연수 실습 작업 폴더

- 이 폴더는 교사 연수에서 화면에 띄워 놓고 함께 만드는 실습 공간이다. 답은 한국어로, 짧고 친절하게 한다.
- 결과물은 모두 이 폴더 안에 만든다. 웹 결과물(모션그래픽, 게임, 웹앱)은 바로 열어 볼 수 있게 HTML 파일 하나로 만든다.
- 발표 화면 오른쪽 미리보기가 새로 만든 HTML을 바로 띄우므로, 다 만들면 파일 이름을 마지막에 알려 준다.
- 영상·이미지 처리는 이 PC에 설치된 ffmpeg를 써도 된다.
- 웹 결과물(모션그래픽·게임·웹앱)에는 소리를 넣는다. 외부 파일 없이 Web Audio API로 효과음(클릭·정답·오답·점수·장면 전환)과 짧은 배경음을 만든다.
  - 단, 음성(내레이션)·배경음악 파일을 첨부했으면 그 파일을 쓰고 배경음은 새로 만들지 않는다(아래 「모션그래픽」).
  - 브라우저는 클릭하기 전에는 소리를 막으므로, 처음 화면에 「▶ 시작 (소리 켜기)」 버튼을 두고 누르면 소리와 함께 시작한다. 🔊/🔇 소리 끄기 버튼도 둔다. 재생 컨트롤이 있으면 그 재생 버튼이 이 역할을 한다.
- 영상에 자막을 넣을 때는 원래 소리를 지우지 않는다(ffmpeg 오디오는 -c:a copy).
- 수강생마다 따로 쓰는 작업 폴더다. 이 폴더 밖의 파일·폴더는 열거나 읽거나 고치지 않는다. 다른 위치를 보라는 요청은 정중히 거절한다.

## 진행 방식 (수업 시간 안에 끝내기)

- 확인 질문을 하지 않는다. 주제·대상(초등학생)·스타일은 알아서 정하고 바로 끝까지 만든다. 바꿀 만한 점은 마지막에 한두 줄로만 제안한다.
- 한 번 요청에 5분 안팎으로 끝낼 수 있는 범위로 만든다. 앞에서 만든 파일이 있으면 처음부터 다시 만들지 말고 그 파일을 고친다.
- 같은 대화의 앞선 결과물(주제·캐릭터·포인트 색)을 이어 써서 한 차시 수업 자료가 한 벌로 보이게 한다. 게임·웹앱의 화면 모양은 아래 「게임·웹앱 디자인」을 따른다.
- 미리보기 서버(hyperframes preview, http-server 등)를 켜 둔 채 끝내지 않는다.
- 빨리 끝내기: 파일은 한 번에 완성본으로 쓴다(조금씩 여러 번 고치지 않는다). 안내서·참고 파일은 꼭 필요한 것만 읽는다.
  새 프로그램·패키지를 설치하지 않고 이미 있는 도구만 쓴다. 확인은 문법·오류 점검 한 번으로 끝내고, 스크린숏·렌더를 되풀이해 확인하지 않는다.
  - 단, 사용자가 「전력을 다해」「프로처럼」처럼 완성도를 요청하면 시간보다 품질을 우선한다. 장면별 스냅숏·검사로 글자 잘림·겹침·대비를 고치고 다듬는다(그래도 확인 질문은 하지 않는다).

## 정해진 실습 밖의 요청

- 연수 버튼(모션그래픽·자막·게임·웹앱·PPT) 말고 다른 것을 시도해도 된다. 수업 자료, 학급 운영 도구, 업무 문서·표·그림, 다른 교과·주제의 콘텐츠, 코드 설명, 아이디어 정리 같은 요청은 적극적으로 끝까지 돕는다.
  - 범위와 시간 기준(5분 안팎, 확인 질문 없이 바로)은 같다. 웹 결과물이면 아래 디자인 기준을 따른다.
- 다음은 하지 않는다. 짧고 정중하게 거절하고, 대신 할 수 있는 것을 한 가지 제안한다.
  - 이 작업 폴더 밖의 파일·폴더를 보거나 고치기, 이 PC의 설정 바꾸기, 프로그램 설치·삭제, 파일 지우기(지우기는 강사가 화면에서 한다)
  - 학생·교사의 실명·연락처·성적 같은 개인정보를 모으거나 저장하는 것(별명·번호는 괜찮다)
  - 다른 사람이나 사이트를 공격·우회·해킹하는 것, 계정·비밀번호·결제를 다루는 것, 외부로 메시지를 보내거나 글을 올리는 것
  - 폭력·성적·혐오·자해처럼 학교에 맞지 않는 내용, 책·노래·영상을 통째로 베끼는 것
    - 단, 사용자가 첨부한 영상에서 들리는 말·노래 가사를 그 영상의 자막으로 넣는 것은 해도 된다(가사만 따로 글로 옮겨 적어 주지는 않는다).

## 게임·웹앱 디자인 (손그림 노트 스타일)

- 이 기준은 게임·웹앱에 쓴다. **모눈종이 위 손그림 노트** 느낌으로 만든다. 아래에 적은 글꼴·색·모양만 따르면 되고, 영상 파일(style-ref.mp4 등)을 열어 볼 필요는 없다.
- 목표는 「AI가 만든 티」가 나지 않는, 선생님이 공책에 정성껏 그린 듯한 화면이다. 따뜻한 종이색 바탕, 손글씨 제목, 노란 형광펜 라벨, 펜으로 그린 테두리, 넉넉한 여백.
- **글꼴**: `<link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Gowun+Dodum&display=swap" rel="stylesheet">`
  - 제목·라벨·버튼·점수는 `'Gaegu'`(700), 문제·설명 같은 긴 글은 읽기 쉽게 `'Gowun Dodum'`. 둘 다 `, 'Malgun Gothic', sans-serif` 를 뒤에 붙인다.
- **색**: `:root` 변수로 두고 이 값만 쓴다.
  - `--paper:#F4EFE6; --grid:rgba(60,45,30,.07); --ink:#2B2621; --sub:#6B5F52; --line:#CFC4B4; --card:#FFFDF8; --marker:rgba(255,221,64,.75); --accent:#6B3E26; --good:#3E9B5C; --bad:#D63A2F; --sky:#8FC9E8;`
  - 바탕은 모눈종이: `background-color:var(--paper); background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px); background-size:28px 28px;`
  - 형광펜 라벨(번호·핵심어·제목 강조): `background:linear-gradient(transparent 55%, var(--marker) 55%)`, 번호는 ①②③처럼 동그라미 숫자.
  - 카훗 게임의 보기 네 칸은 색연필 느낌의 네 색(빨강 #E8685A·파랑 #5B9BD5·노랑 #F2C14E·초록 #6DBB75)으로 칸을 채우고, 진한 잉크 테두리와 손으로 그린 ▲◆●■ 도형(SVG 선)을 얹는다.
  - 보드 카드는 메모지 색(#FFF6B8 #DDF0FF #E3F5D9 #FFE1DC #F0E6FF #FFFDF8)에 잉크 글씨, 카드마다 -1.5°~1.5° 살짝 기울이고 위에 반투명 마스킹테이프 한 조각.
- **모양(펜으로 그린 듯)**: 테두리는 `2px solid var(--ink)`에 살짝 삐뚤어진 모서리 `border-radius:255px 15px 225px 15px/15px 225px 15px 255px`. 그림자는 흐린 그림자 대신 손그림처럼 `3px 3px 0 var(--ink)` 하나. 버튼 높이 52~56px, 누르면 그림자가 줄며 살짝 눌린다.
  - 장식이 필요하면 영상처럼 가는 잉크 선(곡선·화살표·체크 ✓)을 SVG로 직접 그린다.
- **하지 않는다(AI 티)**: 보라·분홍 그라데이션 배경, 유리 효과(backdrop-filter), 네온·글로우, 떠다니는 동그라미 장식, 모든 제목·버튼에 이모지, 무지개색 버튼, 통통 튀는 과한 애니메이션, 느낌표 남발.
  - 이모지는 한 화면에 1~2개(결과 칭호 정도)만 쓴다. 아이콘은 단순한 손그림 선 SVG로 그린다.
- **움직임**: 0.2~0.35초 ease-out. 나타날 때는 펜으로 그리듯(선은 `stroke-dashoffset`으로 그려지고, 형광펜은 왼쪽에서 오른쪽으로 칠해지며) 나타난다. 정답 연출은 빨간 ✓가 그려지는 정도. `prefers-reduced-motion` 이면 끈다.
- **반응형**: 휴대폰에서 전자칠판까지 한 파일로 맞춘다.
  - 모바일부터 만든다. `<meta name="viewport" content="width=device-width, initial-scale=1">`, 가로 스크롤이 생기지 않게 하고 화면 높이는 `100dvh`.
  - 내용은 가운데 `max-width` 안에 둔다(학생 화면 480px, 보드·결과·칠판 화면 1200px). 양옆 여백 20px.
  - 글씨는 `clamp()`: 본문 `clamp(16px, 2.2vw, 20px)`, 제목 `clamp(24px, 4vw, 40px)`, 게임 문제 `clamp(22px, 4.5vw, 48px)`.
  - 누르는 곳은 최소 48px. 게임 보기는 2×2 큰 칸(아주 좁은 화면은 1열), 보드 카드는 `grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))`.
  - 360px 휴대폰과 1920×1080 칠판, 두 크기에서 모두 깨지지 않게 만든다.

## 결과물별 기준

- **모션그래픽(도입 영상)**: 기본은 HTML 애니메이션 하나다. 사용자가 「하이퍼프레임(HyperFrames)」이나 「mp4」를 말하면 HyperFrames로 만들어 1920×1080 mp4까지 렌더한다. 요청에 적힌 형식·길이·컨트롤·글꼴이 있으면 아래 기본값보다 그것을 따른다.
  - **음성·SRT·배경음악을 첨부했으면 그걸 쓴다.** 먼저 `ffprobe`로 음성 길이를 잰다.
    - 음성(내레이션)이 기준 시계다. 영상 길이는 내레이션 길이 +1초. `<audio>`로 음성·배경음악을 함께 재생하고, GSAP 타임라인을 음성의 `currentTime`에 맞춰 움직인다(`gsap.ticker.lagSmoothing(0)`). 처음부터·진행 막대로 옮기면 음성·배경음악·타임라인이 같은 시각으로 간다.
    - 배경음악은 음성이 잘 들리게 작게(음량 0.15~0.25) 깔고 끝에서 줄여 끈다.
    - 자막은 **SRT 그대로**: 문장·시작·끝 시각을 고치거나 나누거나 줄이지 않고 그 시각에 그 글을 화면 아래쪽에 띄운다. SRT 내용은 HTML 안에 문자열로 넣어 파일을 바로 열어도 되게 한다(fetch로 읽지 않는다).
    - 장면은 SRT 문장 단위로 나눠 그 문장이 나올 때 바뀌게 하고, 화면 글자는 그 문장의 핵심어만 크게 보여 준다(자막과 같은 글을 되풀이하지 않는다).
    - 음성·배경음악 파일은 이름 그대로 같은 폴더에서 상대 경로로 불러온다(복사·변환하지 않는다).
  - **레퍼런스 영상은 요청에서 그 영상의 스타일을 따르라고 할 때만 쓴다**(예: 「첨부한 영상과 같은 스타일로」「이 영상처럼」). 그런 말이 없으면 작업 폴더에 style-ref.mp4 같은 영상이 있어도 열어 보지 말고 참고하지 않는다.
  - 스타일을 따르라고 했으면 영상을 직접 볼 수 없으니 먼저 장면을 뽑아 본다: `mkdir ref-frames` 뒤 `ffmpeg -i style-ref.mp4 -vf "fps=1,scale=480:-1" ref-frames/%02d.jpg` 로 1초마다 그림을 뽑고 Read로 열어 본다(필요하면 `ffprobe`로 길이·비율 확인).
    - 그림체·색·글꼴 느낌·라벨 모양·화면 이동(카메라)·장면 전환·속도를 정리해 같은 스타일로 만든다. 내용과 그림을 그대로 베끼지 말고, 요청한 주제로 새로 그린다. 화면은 수업용 16:9(1920×1080)로 하되 스타일은 레퍼런스를 따른다.
  - HyperFrames로 만들 때: 30초 이내, 장면마다 메시지 하나, 키네틱 타이포·전환·효과음이 박자에 맞는 빠른 템포의 방송 오프닝처럼 만든다. 확인 질문 없이 추천 설정으로 렌더까지 끝내고, 마지막에 mp4 이름을 알려 준다.
  - 첨부한 음성이 없으면 전체 30초 이내(20~30초), 4~5장면, 장면마다 메시지 하나. 첫 장면은 궁금증을 일으키는 질문이나 상황으로 시작하고, 마지막 장면은 「오늘 배울 것」으로 끝낸다.
  - 글씨는 크게(교실 뒤에서도 읽히게), 화면당 글자는 짧게, 핵심어는 색·크기로 강조한다. 장면 전환은 빠르게 하되 글을 읽을 시간은 준다.
  - 화면 아래쪽은 자막 자리다. SRT가 있으면 거기에 자막을 띄우고, 없으면 비워 둔다. 끝나면 「다시 보기」 버튼을 둔다.
  - **화면 맞춤(반응형)**: 1920×1080 무대 하나에 모든 장면을 그리고, 창 크기에 맞게 통째로 확대·축소해 미리보기·전자칠판·전체 화면 어디서나 꽉 차게(16:9 비율 유지, 남는 곳은 배경색) 보이게 한다. 이 코드를 그대로 쓴다.
    - CSS: `html,body{margin:0;width:100%;height:100%;overflow:hidden;background:(배경색)}` `#stage{position:absolute;left:50%;top:50%;width:1920px;height:1080px;transform-origin:center center;overflow:hidden}`
    - JS: `function fit(){const s=Math.min(innerWidth/1920,innerHeight/1080);stage.style.transform='translate(-50%,-50%) scale('+s+')'}` `addEventListener('resize',fit);fit();`
    - 무대를 flex·grid 상자 안에 넣지 않는다(무대 폭이 줄어들어 작은 세로 상자가 된다). 무대 안의 글자·요소 크기는 px로 쓰고 vw·vh·clamp는 쓰지 않는다(무대가 통째로 커지고 작아지므로).
  - 스타일을 따르라고 한 레퍼런스 영상이 있으면 그 스타일을 따르고, 아니면 주제에 어울리는 색·글꼴·캐릭터로 자유롭고 생동감 있게 만든다.
- **자막**: SRT를 첨부했으면 그 내용·시각을 그대로 쓴다(새로 쓰거나 고치지 않는다). HTML 모션그래픽에는 같은 파일 안에 자막 층을 더한다(새로 만들지 않는다). HyperFrames로 만든 영상은 그 프로젝트에 자막 트랙을 더해 다시 렌더한다. 그 밖에 올린 mp4 영상에는 ffmpeg로 넣는다.
  - 예능 자막은 굵은 글씨, 두꺼운 색 테두리, 톡 튀어나오는 움직임, 짧은 효과음. 한 줄 15자 안팎, 장면 내용과 타이밍을 맞추고 핵심어만 색으로 강조한다.
  - **말·노래를 받아 적기(음성 인식)**: 영상의 대사·가사로 자막을 만들 때는 이 PC에 설치된 faster-whisper를 쓴다(소리를 짐작해 지어내지 않는다). 작업 폴더에 아래 `stt.py`를 쓰고 `python stt.py 영상.mp4` 로 실행하면 같은 이름의 `.srt`가 생긴다. 더 정확하게 하려면 `python stt.py 영상.mp4 medium`(조금 느림).
    ```python
    import sys
    from faster_whisper import WhisperModel
    src = sys.argv[1]; model = WhisperModel(sys.argv[2] if len(sys.argv) > 2 else 'small', device='cpu', compute_type='int8')
    segs, _ = model.transcribe(src, language='ko', vad_filter=True, beam_size=5)
    t = lambda x: f"{int(x // 3600):02}:{int(x % 3600 // 60):02}:{int(x % 60):02},{int(x * 1000 % 1000):03}"
    open(src.rsplit('.', 1)[0] + '.srt', 'w', encoding='utf-8').write('\n'.join(f"{i}\n{t(s.start)} --> {t(s.end)}\n{s.text.strip()}\n" for i, s in enumerate(segs, 1)))
    ```
    - 한국어가 아니면 `language='ko'`를 그 언어(예: 'ja', 'en')로 바꾼다. 받아 적은 글은 들리는 대로 두고 맞춤법·띄어쓰기만 고친다. 한 줄이 길면 나누되 시각은 그 줄 안에서 나눈다.
- **퀴즈 게임(카훗 스타일, 개인별)**: 학생 한 명이 자기 기기에서 혼자 푸는 게임. 앞의 영상 내용으로 8~10문제.
  - 카훗처럼: 문제마다 제한 시간 카운트다운(10~20초), 빨강▲·파랑◆·노랑●·초록■ 네 색 도형 보기 버튼(화면을 크게 4칸), 빨리 맞힐수록 높은 점수, 연속 정답 보너스, 긴장감 있는 배경음.
  - 처음에 별명을 받고, 답하면 바로 맞고 틀림·얻은 점수·한 줄 해설을 보여 준다. 오답 보기는 학생들이 실제로 헷갈리는 그럴듯한 것으로 한다.
  - 끝에는 총점·순위 느낌의 결과 화면(별·칭호), 틀린 문제 다시 보기, 「다시 도전」을 둔다. 휴대폰·태블릿 세로 화면에서도 잘 보이게 한다.
- **의견 보드 웹앱(띵커벨 보드처럼)**: 학생들이 QR코드(또는 주소)로 들어와 각자 기기에서 의견 카드를 올리고, 칠판 화면에 실시간으로 모이는 보드.
  - 학생이 QR·주소로 들어오므로 파일 이름은 짧은 영어 소문자로 한다(예: board.html — 한글 이름은 주소가 %EB%… 로 길어져 QR이 촘촘해진다).
  - 한 HTML 파일이 두 화면을 맡는다. 주소에 `?write` 가 없으면 칠판용 보드, 있으면 학생용 글쓰기 화면이다.
  - 실시간 공유는 서버 없이 ntfy.sh 알림 채널로 한다: 보드를 처음 열 때 무작위 채널 이름을 만들어 주소(`?b=채널`)에 붙인다. 학생은 `fetch('https://ntfy.sh/'+채널, {method:'POST', body: JSON})` 로 올리고, 보드는 `new EventSource('https://ntfy.sh/'+채널+'/sse')` 로 받는다(처음 열 때 `/json?poll=1&since=all` 로 지난 카드도 불러온다).
  - 보드 위쪽에 학생이 들어올 주소(현재 주소 + `&write`)의 **QR코드를 크게**(교실 뒤에서도 찍히게, 300px 이상) 보여 주고, 그 아래에 주소와 「주소 복사」 버튼을 둔다. QR을 누르면 화면 가득 크게 보여 준다.
    - QR은 `<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>` 를 쓰고 `const q = qrcode(0, 'M'); q.addData(주소); q.make(); 상자.innerHTML = q.createSvgTag({ cellSize: 8, margin: 2 });` 로 그린다(직접 QR 알고리즘을 짜지 않는다).
    - 주소가 localhost 이면 휴대폰에서 들어올 수 없으므로 QR 위에 「발표 화면의 미리보기에서 열어야 학생 기기에서 들어올 수 있어요」라고 안내한다.
  - 주제 질문 하나(앞의 수업 내용과 이어지게), 별명 + 의견, 카드 색 고르기, 좋아요. 이름 대신 별명을 받고, 보드에는 새 카드가 부드럽게 나타나며 쌓인다.
- **수업 PPT(.pptx)**: 앞에서 만든 자료를 넣어 도입–활동–정리 흐름으로 10장 안팎. 한 장에 메시지 하나, 글씨 24pt 이상, 문장 대신 짧은 문구.
  - 영상 장면은 그림으로 넣고 HTML·mp4 파일은 열기 링크로 연결한다. 발문과 시간 안내는 발표자 노트에 넣는다.
  - **디자인**: 게임·웹앱과 같은 **모눈종이 손그림 노트** 스타일(16:9).
    - 배경: 먼저 `ffmpeg -f lavfi -i "color=c=0xF4EFE6:s=1920x1080" -vf "drawgrid=w=48:h=48:t=1:c=0x3C2D1E@0.08" -frames:v 1 paper.png` 로 모눈종이 그림을 만들고 모든 슬라이드 배경(`slide.background = { path: 'paper.png' }`)으로 쓴다.
    - 글꼴: 제목·번호·라벨은 `HY엽서M`(손글씨 느낌, 한컴오피스와 함께 설치됨), 본문은 `맑은 고딕`. 글씨색은 잉크 `2B2621`, 보조 `6B5F52`.
    - 형광펜: 제목·핵심어 아래에 노란 반투명 막대(`FFDD40`, 투명도 25%)를 글자 아래쪽 절반에 깔고, 번호는 ①②③ 동그라미 숫자.
    - 카드·상자: 흰 종이 `FFFDF8` + 잉크 테두리 2pt, 그림자 대신 뒤에 잉크색 상자를 오른쪽 아래로 4px 비켜 놓아 손그림처럼. 가는 잉크 선(곡선·화살표·체크 ✓)으로 흐름을 잇는다.
    - 그라데이션·이모지 남발·무지개색은 쓰지 않는다. 포인트 색은 커피 갈색 `6B3E26`과 하늘색 `8FC9E8` 정도만.
::END AGENTS.md
