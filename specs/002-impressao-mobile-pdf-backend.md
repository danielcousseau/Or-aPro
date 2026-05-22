# Spec: Impressão Mobile-Friendly + PDF Gerado no Backend

> **Status:** Implementado (layout do PDF em refinamento)
> **Data:** 2026-05-21
> **Autor:** Victor

---

## Problema

A tela de "Ver / Imprimir" do histórico estava completamente quebrada no mobile: botões de ação (Imprimir, Baixar PDF, WhatsApp, Voltar) transbordavam para fora da tela, o grid de dados ficava espremido e ilegível, e o preview do orçamento quebrava o layout.

Além disso, o PDF gerado pelo `html2pdf.js` no frontend estava cortando para uma segunda página em branco — causado pelo fato de o html2pdf capturar o DOM no viewport estreito do mobile, fazendo o conteúdo transbordar.

Na hora de imprimir, o navegador adicionava o nome do arquivo no topo e a URL no rodapé da folha.

## Solução

Três mudanças independentes:

1. **Layout mobile responsivo** no `ImprimirOrcamento.jsx` — botões com `flex-wrap`, header empilha verticalmente, grid de dados vira coluna única, caixa de total ocupa largura total.

2. **PDF gerado no backend** via `pdfkit` — elimina a dependência do viewport do usuário, garantindo A4 fixo e consistente em qualquer dispositivo.

3. **Remoção do cabeçalho/rodapé nativos do navegador** na impressão (`window.print`) via `@page { margin: 0 }` + `padding: 15mm` no `.print-page`.

## Usuários afetados

- **Marceneiro (mobile):** acessa o histórico e aperta "Ver / Imprimir" pelo celular — antes quebrado, agora funcional
- **Marceneiro (desktop):** "Baixar PDF" agora gera arquivo no servidor (mais rápido, sem travar o navegador)

## Fluxo principal

1. Marceneiro abre o Histórico e toca "Ver / Imprimir"
2. Tela de orçamento abre responsiva (funciona em qualquer tela)
3. Barra de ação sticky no topo com 4 botões:
   - **Imprimir** → `window.print()` sem cabeçalho/rodapé do browser
   - **Baixar PDF** → chama `GET /api/orcamentos/:id/pdf`, recebe PDF do servidor
   - **WhatsApp** → gera link seguro via token JWT, abre wa.me
   - **Voltar** → navega de volta ao histórico

## Critérios de aceitação

- [x] Botões não transbordam no mobile (flex-wrap em 2 colunas)
- [x] Grid de dados (Cliente / Projeto) vira coluna única em telas < 600px
- [x] Caixa de total ocupa largura completa no mobile
- [x] Impressão não exibe nome do arquivo nem URL do browser
- [x] "Baixar PDF" usa endpoint do backend, funciona no mobile sem travar
- [x] PDF gerado em A4 fixo, sem segunda página em branco
- [ ] Layout do PDF "Baixar PDF" ainda em refinamento para fechar com o visual do template HTML

## Fora do escopo

- Personalização do template de impressão por marceneiro
- PDF com materiais detalhados listados (apenas resumo)
- Suporte a múltiplas páginas para orçamentos com observações muito longas

## Design técnico

### Backend

- `pdfkit ^0.15.0` adicionado ao `package.json`
- `OrcamentoController.gerarPDF` — gera PDF em buffer (Promise + chunks), evita `ERR_STREAM_WRITE_AFTER_END`
- `PDFDocument({ size: 'A4', margin: 0 })` — `margin: 0` desativa a auto-paginação do pdfkit
- `require('pdfkit')` é lazy (dentro da função, não no topo do módulo) — evita crash de startup se o pacote ainda não estiver instalado
- Logo carregada via `path.join(__dirname, '../../../frontend/public/logo-orcapro.png')` — funciona no Render que clona o repo inteiro
- Rota: `GET /api/orcamentos/:id/pdf` (protegida, antes de `GET /:id`)
- Número sequencial calculado no backend com a mesma lógica do frontend (sort por `createdAt`)

### Frontend

- `ImprimirOrcamento.jsx` — removido `html2pdf.js` e `useRef`
- `baixarPDF()` usa `api.get('/orcamentos/:id/pdf', { responseType: 'blob' })` e cria link de download via `URL.createObjectURL`
- CSS modular no `<style>` interno: `.print-action-bar`, `.print-header`, `.print-data-grid`, `.print-total-section`, `.print-footer`
- `@media print { @page { margin: 0 } }` remove cabeçalho/rodapé nativos; `padding: 15mm` no `.print-page` preserva margem de conteúdo

### Banco de dados

- Nenhuma alteração necessária

## Bugs encontrados durante implementação

- **`require('pdfkit')` no topo do módulo** derrubava o `OrcamentoController` inteiro no startup se o pdfkit não estivesse instalado ainda, quebrando também o WhatsApp. Fix: lazy require dentro da função.
- **`doc.text(str, x, { options })`** — pdfkit interpreta o 3º argumento como coordenada `y` (número). Quando é um objeto, vira `NaN` e a geração do PDF trava com `unsupported number: NaN`. Fix: sempre usar a assinatura de 4 argumentos `doc.text(str, x, y, { options })`.
- **`ERR_STREAM_WRITE_AFTER_END`** — quando o pdfkit lançava erro após já ter começado a escrever na resposta, o stream ficava corrompido. Fix: gerar o PDF em buffer antes de enviar qualquer header HTTP.
- **`roundedRect + fillAndStroke`** gerava artefato de retângulo na segunda página. Fix: trocar por `rect + stroke` simples.
