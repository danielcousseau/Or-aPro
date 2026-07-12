---
name: testar-app-android
description: Use quando precisar buildar, instalar ou testar o app Android (Capacitor) no emulador Pixel 8 — inclui o ciclo de refresh do Service Worker e captura de tela. Evita redescobrir caminhos e armadilhas a cada sessão.
---

# Testar o app Android no emulador

Caminhos fixos desta máquina (não redescobrir):

- adb: `/c/Users/victo/AppData/Local/Android/Sdk/platform-tools/adb.exe`
- emulador: `/c/Users/victo/AppData/Local/Android/Sdk/emulator/emulator.exe` (AVD `Pixel_8`)
- JAVA_HOME p/ gradle: `D:\\AndroidStudio\\jbr`
- APK gerado: `OrcaPro/frontend/android/app/build/outputs/apk/debug/app-debug.apk`
- Activity: `com.orcapro.app/.MainActivity`

## Ciclo completo (Bash, um comando só)

```bash
# 1. Subir emulador se não estiver rodando ("$ADB" devices)
EMU="/c/Users/victo/AppData/Local/Android/Sdk/emulator/emulator.exe"
"$EMU" -avd Pixel_8 -no-snapshot-load > /dev/null 2>&1 &
# aguardar: "$ADB" wait-for-device + loop em getprop sys.boot_completed == 1 (~20s)

# 2. Build + instalar + refresh do SW (ver armadilha abaixo)
cd /d/Github/OrcaPro/OrcaPro/frontend && npx tsc --noEmit && npm run app:android
cd android && JAVA_HOME="D:\\AndroidStudio\\jbr" ./gradlew assembleDebug
ADB="/c/Users/victo/AppData/Local/Android/Sdk/platform-tools/adb.exe"
"$ADB" install -r app/build/outputs/apk/debug/app-debug.apk
"$ADB" shell am force-stop com.orcapro.app
"$ADB" shell am start -n com.orcapro.app/.MainActivity; sleep 15   # launch 1: SW baixa versão nova
"$ADB" shell am force-stop com.orcapro.app; sleep 3
"$ADB" shell am start -n com.orcapro.app/.MainActivity; sleep 10   # launch 2: SW novo ativo

# 3. Print
"$ADB" exec-out screencap -p > "$SCRATCHPAD/tela.png"   # depois Read no arquivo
```

## ARMADILHA principal: cache do Service Worker

O PWA precacheia os assets; **APK novo continua servindo o JS/CSS antigo** na 1ª abertura.
Sempre usar o ciclo duplo acima (launch 15s → force-stop → launch 10s). Se ainda vier
versão antiga, repetir o ciclo. `adb uninstall com.orcapro.app` resolve na hora mas
**apaga a sessão** (usuário precisa logar de novo — evitar; pedir pro Victor logar se preciso).

## Navegação por toque (device 1080x2400)

- Hambúrguer ☰: `input tap 90 220` · Avatar: `input tap 975 220` · Logo central: `540 220`
- Itens do menu aberto (y aprox.): Dashboard 373, Clientes 504, Materiais 636, Novo Orçamento 768,
  Corte 900, Histórico 1030, Produção 1162, Financeiro 1294, Marcenaria 1427 (x=240)
- Dropdown do avatar: Editar Perfil `786 390`, Sair `786 528`
- Rolar vertical: `input swipe 540 1700 540 400 250` · Kanban horizontal: swipe numa coluna vazia
- Prints têm escala: coordenadas exibidas ×1.2 = coordenadas do device

## Checagens antes de declarar pronto

`npx tsc --noEmit` (zero erros) + verificar a mudança **na tela** com print (não confiar só no build).
Ícone/splash mudou? Regenerar com `npx @capacitor/assets generate --android --iconBackgroundColor "#ffffff" --splashBackgroundColor "#ffffff"` (fontes em `frontend/assets/`; ícone = mesma arte do `public/icon-512.png`).
