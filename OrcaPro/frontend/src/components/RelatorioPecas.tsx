// Relatório de peças do projeto — uma seção por MÓDULO (móvel/ambiente),
// com código da peça no formato "módulo.peça" (ex: 2.3) e indicação de onde
// vai a fita de borda (risco vermelho sob a medida). Usado na tela e na
// impressão/PDF (mesmo layout).
import type { ResultadoMovel } from "../services/marcenariaApi";
import { arestasFita } from "../utils/fitaBorda";
import { gerarSiglasModulos, codigoPeca } from "../utils/siglaModulo";

export interface ModuloRelatorio {
  ambiente: string;
  nome: string;
  largura?: number;
  altura?: number;
  profundidade?: number;
  resultado: ResultadoMovel;
}

interface Props {
  titulo?: string;
  modulos: ModuloRelatorio[];
}

const COR_FITA = "#c0392b";

function fmtMm(n: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}

// Número de medida com risco indicando fita:
// 0 lados = sem risco | 1 lado = risco simples | 2 lados = risco duplo
function Medida({ valor, lados }: { valor: number; lados: 0 | 1 | 2 }) {
  const style: React.CSSProperties =
    lados === 0
      ? {}
      : lados === 1
        ? { borderBottom: `2px solid ${COR_FITA}`, paddingBottom: 1 }
        : { borderBottom: `4px double ${COR_FITA}`, paddingBottom: 1 };
  return <span style={style}>{fmtMm(valor)}</span>;
}

const cell: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid var(--border)",
};

export default function RelatorioPecas({ titulo, modulos }: Props) {
  const hoje = new Date().toLocaleDateString("pt-BR");
  const totalPecas = modulos.reduce(
    (s, m) => s + m.resultado.pecas.reduce((a, p) => a + p.qtd, 0),
    0,
  );

  // Sigla de cada módulo (ROP, COZ...) para identificar as peças na montagem.
  const siglas = gerarSiglasModulos(modulos);

  // ── Resumo de materiais consolidado (soma de todos os módulos) ──
  const chapasMap = new Map<
    string,
    { cor: string; espessura: number; m2: number }
  >();
  const fitaMap = new Map<
    string,
    { cor: string; largura: number; metros: number }
  >();
  for (const m of modulos) {
    for (const g of m.resultado.chapas) {
      const k = `${g.cor}|${g.espessura}`;
      const e = chapasMap.get(k) ?? {
        cor: g.cor,
        espessura: g.espessura,
        m2: 0,
      };
      e.m2 += g.m2ComPerda;
      chapasMap.set(k, e);
    }
    for (const f of m.resultado.fita) {
      const k = `${f.cor}|${f.largura}`;
      const e = fitaMap.get(k) ?? { cor: f.cor, largura: f.largura, metros: 0 };
      e.metros += f.metros;
      fitaMap.set(k, e);
    }
  }

  return (
    <div className="relatorio-pecas">
      {/* Cabeçalho do projeto */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>
          Relatório de Peças{titulo ? ` — ${titulo}` : ""}
        </h2>
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)" }}>
          {modulos.length} módulo{modulos.length !== 1 ? "s" : ""} ·{" "}
          {totalPecas} peças no total · {hoje}
        </p>
      </div>

      {/* Legenda da fita */}
      <div
        style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
          fontSize: 12,
          marginBottom: 16,
          padding: "8px 12px",
          background: "var(--panel-soft)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <b style={{ fontSize: 12 }}>Fita de borda:</b>
        <span>
          <span style={{ borderBottom: `2px solid ${COR_FITA}` }}>000</span> =
          fita em 1 lado dessa medida
        </span>
        <span>
          <span style={{ borderBottom: `4px double ${COR_FITA}` }}>000</span> =
          fita nos 2 lados dessa medida
        </span>
        <span>
          Código <b>ROP-3</b> = peça 3 do móvel de sigla <b>ROP</b> (a sigla de
          cada módulo está no título da seção)
        </span>
      </div>

      {/* Uma seção por módulo */}
      {modulos.map((m, mi) => {
        const mod = mi + 1;
        return (
          <div key={mi} style={{ marginBottom: 22 }}>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 14,
                color: "var(--primary)",
                borderBottom: "2px solid var(--primary)",
                paddingBottom: 4,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  background: "var(--primary)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 6,
                  marginRight: 8,
                  letterSpacing: 0.5,
                }}
              >
                {siglas[mi]}
              </span>
              Módulo {mod} — {m.ambiente}
              {m.nome ? ` — ${m.nome}` : ""}
              {m.largura && m.altura && m.profundidade ? (
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 12,
                    color: "var(--text-soft)",
                  }}
                >
                  {" "}
                  ({fmtMm(m.largura)} × {fmtMm(m.altura)} ×{" "}
                  {fmtMm(m.profundidade)} mm)
                </span>
              ) : null}
            </h3>

            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: "var(--primary)", color: "#fff" }}>
                  {[
                    "Cód.",
                    "Peça",
                    "Qtd",
                    "Largura × Altura (mm)",
                    "Esp.",
                    "Cor",
                    "Fita",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "7px 10px",
                        textAlign: "left",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.resultado.pecas.map((p, i) => {
                  const fita = arestasFita(p.nome, p.espessura);
                  return (
                    <tr
                      key={i}
                      style={{
                        background: i % 2 ? "var(--panel-soft)" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          ...cell,
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        {codigoPeca(siglas[mi], i + 1)}
                      </td>
                      <td style={cell}>{p.nome}</td>
                      <td style={{ ...cell, textAlign: "center" }}>{p.qtd}</td>
                      <td
                        style={{ ...cell, textAlign: "center", fontSize: 14 }}
                      >
                        <Medida valor={p.largura} lados={fita.ladosLargura} /> ×{" "}
                        <Medida valor={p.altura} lados={fita.ladosAltura} />
                      </td>
                      <td style={{ ...cell, textAlign: "center" }}>
                        {p.espessura}mm
                      </td>
                      <td style={cell}>{p.cor}</td>
                      <td style={{ ...cell, textAlign: "center" }}>
                        {fita.larguraFitaMm > 0
                          ? `${fita.larguraFitaMm}mm`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Resumo de materiais do projeto (todos os módulos somados) */}
      <div
        style={{
          padding: "14px 16px",
          background: "var(--panel-soft)",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
        }}
      >
        <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 13 }}>
          Resumo de Materiais do Projeto
        </p>

        {[...chapasMap.values()].map((g, i) => (
          <p
            key={i}
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              color: "var(--text-soft)",
            }}
          >
            MDF{" "}
            <b>
              {g.cor} {g.espessura}mm
            </b>
            : {g.m2.toFixed(2)} m² (com perda)
          </p>
        ))}

        {fitaMap.size > 0 && (
          <>
            <p
              style={{
                margin: "8px 0 4px",
                fontWeight: 600,
                fontSize: 12,
                color: "var(--text-soft)",
              }}
            >
              Fita de borda:
            </p>
            {[...fitaMap.values()].map((f, i) => (
              <p
                key={i}
                style={{
                  margin: "0 0 4px",
                  fontSize: 12,
                  color: "var(--text-soft)",
                }}
              >
                Fita{" "}
                <b>
                  {f.cor} {f.largura}mm
                </b>
                : {f.metros.toFixed(2)} m
              </p>
            ))}
          </>
        )}

        <p
          style={{
            margin: "10px 0 0",
            fontSize: 11,
            color: "var(--text-muted)",
          }}
        >
          O número exato de chapas aparece no Plano de Corte.
        </p>
      </div>
    </div>
  );
}
