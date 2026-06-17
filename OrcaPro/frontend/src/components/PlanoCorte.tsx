// Visualização SVG do plano de corte guilhotina.
// Cada linha tracejada representa um corte que vai de ponta a ponta do retângulo atual.
import type { ResultadoNesting } from "../utils/nestingMarcenaria";

const EXIB_LARG = 560;

const CORES_PECA = [
  "#a8d8ea",
  "#f9d5a7",
  "#b5ead7",
  "#ffc8dd",
  "#cdb4db",
  "#caffbf",
  "#ffd6a5",
  "#a0c4ff",
  "#ffcfd2",
  "#d4e09b",
  "#e2b4bd",
  "#9bf6ff",
];

function corParaPeca(nome: string): string {
  let h = 0;
  for (let i = 0; i < nome.length; i++)
    h = (h * 31 + nome.charCodeAt(i)) & 0xffff;
  return CORES_PECA[h % CORES_PECA.length];
}

interface Props {
  resultado: ResultadoNesting;
  chapaLarg: number;
  chapaAlt: number;
  aviso?: string;
}

export default function PlanoCorte({
  resultado,
  chapaLarg,
  chapaAlt,
  aviso,
}: Props) {
  const escala = EXIB_LARG / chapaLarg;
  const exibAlt = Math.round(chapaAlt * escala);
  const areaChapa = chapaLarg * chapaAlt;

  // % de aproveitamento (área das peças / área da chapa)
  const areaPecas = (pecas: { larg: number; alt: number }[]) =>
    pecas.reduce((s, p) => s + p.larg * p.alt, 0);
  const aproveitChapa = (pecas: { larg: number; alt: number }[]) =>
    Math.round((areaPecas(pecas) / areaChapa) * 100);

  return (
    <div>
      <p
        style={{
          fontSize: 12,
          color: "var(--text-soft)",
          marginBottom: 8,
          marginTop: 0,
        }}
      >
        Plano de corte guilhotina — cada linha tracejada é um corte de ponta a
        ponta. Chapa real: {chapaLarg} × {chapaAlt} mm.
      </p>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          fontSize: 11,
          color: "var(--text-soft)",
          marginBottom: 12,
        }}
      >
        <span>
          <svg width="28" height="10">
            <line
              x1="0"
              y1="5"
              x2="28"
              y2="5"
              stroke="#1a6eb5"
              strokeWidth="1.5"
              strokeDasharray="6,3"
            />
          </svg>{" "}
          Corte (H ou V — sempre de ponta a ponta)
        </span>
        <span>
          <svg width="14" height="10">
            <rect
              x="0"
              y="0"
              width="14"
              height="10"
              fill="#e0e0e0"
              stroke="#bbb"
              strokeWidth="0.5"
            />
          </svg>{" "}
          Sobra
        </span>
      </div>

      {aviso && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 12px",
            background: "#fff3cd",
            borderRadius: "var(--radius-sm)",
            fontSize: 12,
          }}
        >
          ⚠ {aviso}
        </div>
      )}

      {resultado.grupos.map((grupo) => (
        <div
          key={`${grupo.cor}|${grupo.espessura}`}
          style={{ marginBottom: 28 }}
        >
          <h4
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              color: "var(--text-main)",
            }}
          >
            MDF <b>{grupo.cor}</b> {grupo.espessura} mm — {grupo.chapas.length}{" "}
            chapa{grupo.chapas.length !== 1 ? "s" : ""}
            {(() => {
              const usada = grupo.chapas.reduce(
                (s, ch) => s + areaPecas(ch.pecas),
                0,
              );
              const total = grupo.chapas.length * areaChapa;
              const pct = total > 0 ? Math.round((usada / total) * 100) : 0;
              return (
                <span style={{ color: "var(--text-soft)", fontWeight: 400 }}>
                  {" "}
                  · aproveitamento médio {pct}%
                </span>
              );
            })()}
          </h4>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
            {grupo.chapas.map((chapa) => (
              <div key={chapa.indice}>
                <p
                  style={{
                    fontSize: 11,
                    color: "var(--text-soft)",
                    margin: "0 0 4px",
                  }}
                >
                  Chapa {chapa.indice} — {chapa.pecas.length} peça
                  {chapa.pecas.length !== 1 ? "s" : ""} ·{" "}
                  <b style={{ color: "var(--text-main)" }}>
                    {aproveitChapa(chapa.pecas)}% aproveitado
                  </b>
                </p>

                <svg
                  width={EXIB_LARG}
                  height={exibAlt}
                  style={{
                    border: "2px solid var(--border)",
                    borderRadius: 4,
                    background: "#f5f5f5",
                    display: "block",
                  }}
                  role="img"
                  aria-label={`Plano de corte chapa ${chapa.indice}`}
                >
                  <defs>
                    <pattern
                      id={`hatch-${chapa.indice}`}
                      width="6"
                      height="6"
                      patternUnits="userSpaceOnUse"
                    >
                      <line
                        x1="0"
                        y1="6"
                        x2="6"
                        y2="0"
                        stroke="#ccc"
                        strokeWidth="0.7"
                      />
                    </pattern>
                  </defs>

                  {/* Fundo hachurado = sobra da chapa */}
                  <rect
                    x={0}
                    y={0}
                    width={EXIB_LARG}
                    height={exibAlt}
                    fill={`url(#hatch-${chapa.indice})`}
                  />

                  {/* Peças */}
                  {chapa.pecas.map((p, i) => {
                    const px = Math.round(p.x * escala);
                    const py = Math.round(p.y * escala);
                    const pw = Math.max(Math.round(p.larg * escala), 1);
                    const ph = Math.max(Math.round(p.alt * escala), 1);
                    const cor = corParaPeca(p.nome);

                    return (
                      <g key={i}>
                        <rect
                          x={px + 1}
                          y={py + 1}
                          width={pw - 2}
                          height={ph - 2}
                          fill={cor}
                          stroke="#555"
                          strokeWidth={0.8}
                        />

                        {/* Código da peça (P1, P2...) */}
                        {pw > 18 && ph > 12 && (
                          <text
                            x={px + pw / 2}
                            y={py + ph / 2 - (pw > 44 && ph > 26 ? 6 : 0)}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={Math.max(8, Math.min(13, ph / 3))}
                            fill="#111"
                            fontWeight="700"
                            style={{
                              userSelect: "none",
                              pointerEvents: "none",
                            }}
                          >
                            {p.codigo ?? p.nome}
                            {p.rotacionada ? " ↻" : ""}
                          </text>
                        )}

                        {/* Dimensões */}
                        {pw > 50 && ph > 28 && (
                          <text
                            x={px + pw / 2}
                            y={py + ph / 2 + Math.max(8, Math.min(12, ph / 3))}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={Math.max(6, Math.min(9, ph / 4))}
                            fill="#444"
                            style={{
                              userSelect: "none",
                              pointerEvents: "none",
                            }}
                          >
                            {p.larg}×{p.alt}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Linhas de corte — cada uma vai de ponta a ponta do seu retângulo */}
                  {chapa.cortes.map((c, i) => (
                    <line
                      key={i}
                      x1={Math.round(c.x1 * escala)}
                      y1={Math.round(c.y1 * escala)}
                      x2={Math.round(c.x2 * escala)}
                      y2={Math.round(c.y2 * escala)}
                      stroke="#1a6eb5"
                      strokeWidth={1.2}
                      strokeDasharray="6,3"
                    />
                  ))}
                </svg>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
