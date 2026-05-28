---
name: gerar-pdf-orcamento
description: Use whenever the user asks how to generate a PDF, change the PDF layout, add content to the orçamento/proposta document, or use html2pdf.js in OrcaPro. The single source of truth is DocumentoOrcamento.tsx — never duplicate PDF layout elsewhere.
---

# Gerar PDF de Orçamento — Padrão OrcaPro

O PDF de orçamento e proposta é sempre gerado no **frontend** via `html2pdf.js`, usando o componente `DocumentoOrcamento.tsx` como fonte única de layout.

## Arquitetura (nunca desviar disso)

```
DocumentoOrcamento.tsx       ← fonte única de layout (materiais, mão de obra, totais, logo)
       ↓                              ↓
ImprimirOrcamento.tsx         Proposta.tsx
(versão técnica p/ marceneiro) (versão comercial p/ cliente)
       ↓                              ↓
html2pdf.js (download PDF)    html2pdf.js (download PDF)
```

**Nunca criar um terceiro layout.** Sempre modificar `DocumentoOrcamento.tsx`.

## Como usar html2pdf.js

### Instalação (já instalado no projeto)

```bash
# já está em package.json — não instalar novamente
# tipos declarados em src/types/html2pdf.d.ts
```

### Padrão de uso

```typescript
import html2pdf from "html2pdf.js";

const gerarPDF = () => {
  const elemento = document.getElementById("documento-orcamento");
  if (!elemento) return;

  const opcoes = {
    margin: [10, 10, 10, 10], // [top, right, bottom, left] em mm
    filename: `orcamento-${id}.pdf`,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opcoes).from(elemento).save();
};
```

### Tipo correto para margin (armadilha conhecida)

```typescript
// O tipo margin aceita number | number[] — conforme declarado em html2pdf.d.ts
margin: 10; // todos os lados iguais
margin: [10, 10, 10, 10]; // top, right, bottom, left
```

## Como modificar o layout do documento

### 1. Editar `DocumentoOrcamento.tsx`

```
OrcaPro/frontend/src/components/DocumentoOrcamento.tsx
```

Props que ele recebe: `orcamento`, `cliente`, `nomeMarcenaria`, `logoMarcenaria`, `modo` ('tecnico' | 'comercial')

### 2. Estilos — sempre em `index.css`

```css
/* OrcaPro/frontend/src/index.css */

/* Classes do documento */
.doc-header { ... }
.doc-tabela-materiais { ... }
.doc-totais { ... }

/* Estilos de impressão — SEMPRE aqui, nunca inline */
@media print {
  .no-print { display: none !important; }
  .doc-header { break-after: avoid; }
}
```

**Nunca** colocar `@media print` em `<style>` inline ou dentro do componente — não funciona no mobile.

### 3. Logo da marcenaria

```typescript
// Já vem como base64 da API — usar diretamente no <img>
<img
  src={logoMarcenaria ?? '/logo-orcapro.png'}
  alt="Logo"
  style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
/>
```

## Checklist antes de finalizar mudança em PDF

- [ ] Layout alterado em `DocumentoOrcamento.tsx` (não em ImprimirOrcamento ou Proposta diretamente)?
- [ ] Estilos adicionados em `index.css` com classes `.doc-*`?
- [ ] Estilos de impressão no bloco `@media print` do `index.css`?
- [ ] Testado: visualização na tela ✓, impressão Ctrl+P ✓, download PDF ✓?
- [ ] Logo da marcenaria ainda aparece corretamente?
- [ ] PDF gerado em A4 portrait com margens adequadas?
