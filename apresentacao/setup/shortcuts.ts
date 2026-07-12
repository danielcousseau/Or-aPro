import { defineShortcutsSetup } from "@slidev/types";

// Mantém apenas a navegação um a um (setas, espaço, PageUp/Down).
// Remove os atalhos que abrem o painel de overview ('o'), o diálogo
// de busca de slides ('g') e o modo escuro ('d').
// Importante: os itens mantidos precisam preservar o `name` original,
// senão o Slidev assume formato legado e restaura todos os padrões.
export default defineShortcutsSetup((_nav, base) => {
  const manter = new Set([
    "next_space",
    "prev_space",
    "next_right",
    "prev_left",
    "next_page_key",
    "prev_page_key",
    "next_down",
    "prev_up",
    "next_shift",
    "prev_shift",
    "hide_overview",
  ]);
  return base.filter((s) => s.name && manter.has(String(s.name)));
});
