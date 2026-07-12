# Prints do sistema (para a apresentação)

Estes arquivos são os "prints" que aparecem nos slides do tour do produto
("O Produto em Ação"). Hoje são **placeholders** (`.svg`). Para deixar a
apresentação profissional, troque-os por **screenshots reais** do OrçaPro em
produção.

## Arquivos esperados

Salve os screenshots com **exatamente estes nomes** (o `slides.md` já aponta
para eles):

| Arquivo             | Tela do sistema                         |
| ------------------- | --------------------------------------- |
| `dashboard`         | Dashboard (tela inicial)                |
| `novo-orcamento`    | Novo orçamento / orçamento inteligente  |
| `proposta`          | Proposta / PDF ao cliente               |
| `contrato`          | Contrato para assinatura online         |
| `kanban`            | Kanban de projetos                      |
| `financeiro`        | Financeiro / rentabilidade              |

## Formato recomendado

- **Extensão:** `.png` (melhor qualidade que `.jpg` para telas de sistema).
- **Proporção:** o layout `image-right` mostra a imagem numa coluna **vertical**
  e **corta** o que sobra. Duas opções:
  1. **Recomendado — print do celular/PWA** (formato retrato, ~1080×1920 ou
     recorte ~900×1080). Encaixa perfeito sem cortar nada.
  2. **Print do computador** (tela larga): funciona, mas o layout vai cortar as
     laterais e o topo/rodapé, mostrando só o centro. Se for por aqui, avise que
     eu troco esses slides para um layout que mostra a tela inteira emoldurada
     (estilo janela de navegador), sem corte.

## Como aplicar depois de tirar os prints

1. Coloque os `.png` nesta pasta (`public/prints/`).
2. Me avise: eu troco as referências de `.svg` para `.png` no `slides.md` e,
   se você tirou prints de computador, ajusto o layout para não cortar.
3. `npm run build` gera a versão final e o deploy publica no GitHub Pages.
