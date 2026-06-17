import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import marcenariaApi, {
  type ConfiguracaoMarcenaria,
  type ResultadoMovel,
  type FrenteInput,
  type SecaoFrente,
} from "../services/marcenariaApi";

// Estado de UI de cada seção da frente
type SecaoUI = {
  tamanhoMm: number;
  tipo: "PORTAS" | "GAVETAS";
  nPortas: number;
  nGavetas: number;
  corredicaIdx: number;
  comprimentoCorre: number;
};

// Um móvel já calculado e adicionado ao projeto (= um módulo)
type ItemProjeto = {
  ambiente: string;
  nome: string;
  largura: number;
  altura: number;
  profundidade: number;
  resultado: ResultadoMovel;
};

const AMBIENTES = [
  "Cozinha",
  "Sala",
  "Quarto",
  "Banheiro",
  "Área de Serviço",
  "Closet",
  "Escritório",
  "Outro",
];

import PlanoCorte from "../components/PlanoCorte";
import RelatorioPecas, {
  type ModuloRelatorio,
} from "../components/RelatorioPecas";
import {
  calcularNesting,
  expandirPecas,
  type ResultadoNesting,
} from "../utils/nestingMarcenaria";
import { gerarSiglasModulos, codigoPeca } from "../utils/siglaModulo";
import { mascaraMoeda } from "../utils/masks";

export default function CortePecas() {
  const navigate = useNavigate();

  const [configMarcenaria, setConfigMarcenaria] = useState<
    ConfiguracaoMarcenaria | null | undefined
  >(undefined);
  const [resultadoMotor, setResultadoMotor] = useState<ResultadoMovel | null>(
    null,
  );
  const [calculando, setCalculando] = useState(false);
  // Planos de corte gerados (1 = tudo junto; vários = um por ambiente)
  const [planos, setPlanos] = useState<
    { titulo: string; resultado: ResultadoNesting }[]
  >([]);
  const [modoPlano, setModoPlano] = useState<"JUNTO" | "AMBIENTE">("JUNTO");
  const [planoAberto, setPlanoAberto] = useState(false);

  // Projeto = vários móveis (módulos), cada um com ambiente + nome
  const [projeto, setProjeto] = useState<ItemProjeto[]>([]);
  const [ambiente, setAmbiente] = useState(AMBIENTES[0]);
  const [nomeMovel, setNomeMovel] = useState("");
  const [printNode, setPrintNode] = useState<React.ReactNode>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const relatorioRef = useRef<HTMLDivElement>(null);
  const planoRef = useRef<HTMLDivElement>(null);

  const [titulo, setTitulo] = useState("");
  const [pi, setPi] = useState({
    largura: 800,
    altura: 720,
    profundidade: 560,
    tipoMovelIdx: 0,
    corAcabamento: "",
    corFundo: "",
    tipoTampo: "MDF" as "MDF" | "PEDRA",
    ladoOcultoNaCor: false,
    nPrateleiras: 1,
  });

  // Frente em seções (cada parte: portas ou gavetas)
  const [orientacao, setOrientacao] = useState<"HORIZONTAL" | "VERTICAL">(
    "HORIZONTAL",
  );
  const [secoes, setSecoes] = useState<SecaoUI[]>([
    {
      tamanhoMm: 764,
      tipo: "PORTAS",
      nPortas: 2,
      nGavetas: 3,
      corredicaIdx: 0,
      comprimentoCorre: 400,
    },
  ]);
  // Veio por COR de material: cor marcada = respeita o veio (trava o giro).
  // Branco e cores lisas não têm veio; madeirado/amadeirado tem.
  const [veioCores, setVeioCores] = useState<Record<string, boolean>>({});

  // Carrega config da marcenaria
  useEffect(() => {
    marcenariaApi
      .buscarConfig()
      .then((res) => {
        const cfg = res.data.data;
        if (!cfg?.configurado) {
          setConfigMarcenaria(null);
          return;
        }
        setConfigMarcenaria(cfg);
        const estr = cfg.chapas.find((c) => c.espessura === 18);
        const fundo = cfg.chapas.find((c) => c.espessura === 6) ?? estr;
        setPi((prev) => ({
          ...prev,
          corAcabamento: prev.corAcabamento || estr?.cor || "",
          corFundo: prev.corFundo || fundo?.cor || estr?.cor || "",
        }));
      })
      .catch(() => setConfigMarcenaria(null));
  }, []);

  // Impressão via portal: renderiza só o conteúdo escolhido fora do app-shell
  useEffect(() => {
    if (!printNode) return;
    document.body.classList.add("modo-impressao");
    const aposImprimir = () => {
      document.body.classList.remove("modo-impressao");
      setPrintNode(null);
    };
    window.addEventListener("afterprint", aposImprimir, { once: true });
    const t = window.setTimeout(() => window.print(), 150);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", aposImprimir);
      document.body.classList.remove("modo-impressao");
    };
  }, [printNode]);

  const calcularProjeto = async () => {
    const tipos = configMarcenaria?.tiposMovel ?? [];
    const tipo = tipos[pi.tipoMovelIdx];
    if (!tipo) {
      toast.warning("Selecione um tipo de móvel.");
      return;
    }
    if (!pi.corAcabamento) {
      toast.warning("Selecione a cor de acabamento.");
      return;
    }

    // Monta a frente: 1 seção → modelo antigo (frente única, respeita tipoPorta);
    // 2+ seções → modelo novo (seções + divisórias automáticas).
    const E = configMarcenaria!.espEstrutura ?? 18;
    const FP = configMarcenaria!.folgaPorta ?? 4;
    const REF = configMarcenaria!.larguraReforco ?? 100;
    const vaoAltura =
      pi.tipoTampo === "MDF" ? pi.altura - 2 * E : pi.altura - E - REF;

    const conteudoDaSecao = (s: SecaoUI, openH: number): FrenteInput => {
      if (s.tipo === "PORTAS") {
        return { tipo: "PORTAS", nPortas: Math.max(1, s.nPortas) };
      }
      const corre = configMarcenaria!.corredicas[s.corredicaIdx];
      const nG = Math.max(1, s.nGavetas);
      const altFrente = (openH - (nG + 1) * FP) / nG;
      return {
        tipo: "GAVETAS",
        gavetas: Array.from({ length: nG }, () => ({
          alturaFrente: altFrente,
          descontoLarguraMm: corre?.descontoLarguraMm ?? 63,
          comprimentoCorredica: s.comprimentoCorre,
        })),
      };
    };

    let frentePayload: FrenteInput | undefined;
    let secoesPayload: SecaoFrente[] | undefined;
    let orientacaoPayload: "HORIZONTAL" | "VERTICAL" | undefined;

    if (secoes.length === 1) {
      frentePayload = conteudoDaSecao(secoes[0], vaoAltura);
    } else {
      orientacaoPayload = orientacao;
      secoesPayload = secoes.map((s) => ({
        tamanhoMm: s.tamanhoMm,
        conteudo: conteudoDaSecao(
          s,
          orientacao === "HORIZONTAL" ? vaoAltura : s.tamanhoMm,
        ),
      }));
    }

    setCalculando(true);
    try {
      const { data } = await marcenariaApi.calcular({
        largura: pi.largura,
        altura: pi.altura,
        profundidade: pi.profundidade,
        tipoTampo: pi.tipoTampo,
        corAcabamento: pi.corAcabamento,
        corFundo: pi.corFundo || pi.corAcabamento,
        ladoOcultoNaCor: pi.ladoOcultoNaCor,
        tamponamentoTampo: tipo.tamponamentoTampo,
        tamponamentoLaterais: tipo.tamponamentoLaterais,
        tamponamentoBase: tipo.tamponamentoBase,
        tipoPorta: tipo.tipoPorta as "SOBREPOSTA" | "EMBUTIDA" | "MEIA",
        frente: frentePayload,
        secoes: secoesPayload,
        orientacaoSecoes: orientacaoPayload,
        nPrateleiras: pi.nPrateleiras,
      });
      setResultadoMotor(data.data);
    } catch (err) {
      // Mostra o motivo real vindo do backend (validação Zod, etc.)
      const resp = (
        err as {
          response?: {
            data?: {
              error?: string;
              details?: { campo: string; mensagem: string }[];
            };
          };
        }
      )?.response?.data;
      const detalhe = resp?.details?.length
        ? resp.details.map((d) => `${d.campo}: ${d.mensagem}`).join(" · ")
        : resp?.error;
      toast.error(
        detalhe
          ? `Não deu pra calcular — ${detalhe}`
          : "Erro ao calcular. Verifique a configuração da marcenaria.",
      );
    } finally {
      setCalculando(false);
    }
  };

  // ── Projeto efetivo = módulos já adicionados + o móvel calculado agora ──
  // (o móvel recém-calculado entra como último módulo "em edição", para que o
  //  relatório e o plano se atualizem na hora ao recalcular.)
  const itemAtual: ItemProjeto | null = resultadoMotor
    ? {
        ambiente,
        nome:
          nomeMovel.trim() ||
          configMarcenaria?.tiposMovel[pi.tipoMovelIdx]?.nome ||
          "Móvel (em edição)",
        largura: pi.largura,
        altura: pi.altura,
        profundidade: pi.profundidade,
        resultado: resultadoMotor,
      }
    : null;
  const itensEfetivos: ItemProjeto[] = itemAtual
    ? [...projeto, itemAtual]
    : projeto;

  const modulos: ModuloRelatorio[] = itensEfetivos.map((it) => ({
    ambiente: it.ambiente,
    nome: it.nome,
    largura: it.largura,
    altura: it.altura,
    profundidade: it.profundidade,
    resultado: it.resultado,
  }));

  // Sigla de cada módulo (ROP, COZ...) — mesma lógica do relatório, para que o
  // código no plano de corte bata com o código na tabela de peças.
  const siglasProjeto = gerarSiglasModulos(itensEfetivos);

  // Cada tipo de peça do projeto com código "SIGLA-peça" (ex: ROP-3) e o ambiente
  const tiposProjeto = itensEfetivos.flatMap((it, mi) =>
    it.resultado.pecas.map((p, idx) => ({
      nome: p.nome,
      qtd: p.qtd,
      largura: p.largura,
      altura: p.altura,
      espessura: p.espessura,
      cor: p.cor,
      codigo: codigoPeca(siglasProjeto[mi], idx + 1),
      ambiente: it.ambiente,
    })),
  );

  const coresProjeto = [
    ...new Set(
      itensEfetivos.flatMap((it) => it.resultado.chapas.map((g) => g.cor)),
    ),
  ];

  // Materiais (cor|espessura) que respeitam o veio
  const montarVeioSet = (cores: Record<string, boolean>): Set<string> => {
    const s = new Set<string>();
    for (const it of itensEfetivos) {
      for (const g of it.resultado.chapas) {
        if (cores[g.cor]) s.add(`${g.cor}|${g.espessura}`);
      }
    }
    return s;
  };

  const adicionarAoProjeto = () => {
    if (!resultadoMotor) return;
    const nome =
      nomeMovel.trim() ||
      configMarcenaria?.tiposMovel[pi.tipoMovelIdx]?.nome ||
      "Móvel";
    setProjeto((prev) => [
      ...prev,
      {
        ambiente,
        nome,
        largura: pi.largura,
        altura: pi.altura,
        profundidade: pi.profundidade,
        resultado: resultadoMotor,
      },
    ]);
    setResultadoMotor(null);
    setNomeMovel("");
    toast.success(`Móvel adicionado ao projeto (${ambiente}).`);
  };

  const removerItem = (idx: number) => {
    setProjeto((prev) => prev.filter((_, i) => i !== idx));
    setPlanos([]);
    setPlanoAberto(false);
  };

  const gerarPlanoCom = (
    cores: Record<string, boolean>,
    modo: "JUNTO" | "AMBIENTE",
  ) => {
    if (itensEfetivos.length === 0 || !configMarcenaria) return;
    const W = configMarcenaria.chapaLargura ?? 2750;
    const H = configMarcenaria.chapaAltura ?? 1850;
    const kerf = configMarcenaria.kerfSerra ?? 3;
    const veio = montarVeioSet(cores);

    if (modo === "JUNTO") {
      setPlanos([
        {
          titulo: "Projeto completo",
          resultado: calcularNesting(
            expandirPecas(tiposProjeto),
            W,
            H,
            kerf,
            veio,
          ),
        },
      ]);
    } else {
      const ambientes = [...new Set(itensEfetivos.map((i) => i.ambiente))];
      setPlanos(
        ambientes.map((amb) => ({
          titulo: amb,
          resultado: calcularNesting(
            expandirPecas(tiposProjeto.filter((t) => t.ambiente === amb)),
            W,
            H,
            kerf,
            veio,
          ),
        })),
      );
    }
    setPlanoAberto(true);
  };

  const gerarPlano = () => gerarPlanoCom(veioCores, modoPlano);

  const imprimirRelatorio = () => {
    if (modulos.length === 0) return;
    setPrintNode(<RelatorioPecas titulo={titulo} modulos={modulos} />);
  };

  const imprimirPlano = () => {
    if (planos.length === 0) {
      gerarPlano();
      toast.info("Gerando o plano de corte — clique em imprimir novamente.");
      return;
    }
    setPrintNode(
      <div>
        {planos.map((pl, i) => (
          <div key={i} style={{ marginBottom: 24 }}>
            <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>
              Plano de Corte — {pl.titulo}
            </h2>
            <PlanoCorte
              resultado={pl.resultado}
              chapaLarg={configMarcenaria?.chapaLargura ?? 2750}
              chapaAlt={configMarcenaria?.chapaAltura ?? 1850}
            />
          </div>
        ))}
      </div>,
    );
  };

  // Baixa um elemento da tela como PDF (mesmo padrão das telas de orçamento)
  const baixarPdf = async (el: HTMLDivElement | null, nomeArquivo: string) => {
    if (!el) return;
    setGerandoPdf(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: nomeArquivo,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(el)
        .save();
    } catch {
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setGerandoPdf(false);
    }
  };

  const nomeArquivo = (prefixo: string) =>
    `${prefixo}_${titulo ? titulo.replace(/\s+/g, "_") : "projeto"}.pdf`;

  const baixarPdfRelatorio = () =>
    baixarPdf(relatorioRef.current, nomeArquivo("Relatorio_Pecas"));

  const baixarPdfPlano = () => {
    if (planos.length === 0) {
      gerarPlano();
      toast.info("Gerando o plano de corte — clique em Baixar PDF de novo.");
      return;
    }
    if (!planoAberto) {
      setPlanoAberto(true);
      toast.info("Abrindo o plano — clique em Baixar PDF de novo.");
      return;
    }
    baixarPdf(planoRef.current, nomeArquivo("Plano_Corte"));
  };

  const usarNoOrcamento = () => {
    if (itensEfetivos.length === 0) return;
    const linhas = itensEfetivos.flatMap((it) =>
      it.resultado.pecas.map((peca) => {
        const grupo = it.resultado.chapas.find(
          (g) => g.cor === peca.cor && g.espessura === peca.espessura,
        );
        const custoUnit =
          grupo?.precoM2 != null ? peca.m2Unit * grupo.precoM2 : 0;
        return {
          nome: `[${it.ambiente}${it.nome ? " - " + it.nome : ""}] ${peca.nome} | ${peca.largura}×${peca.altura}mm | ${peca.espessura}mm ${peca.cor}`,
          valor: mascaraMoeda(custoUnit),
          quantidade: peca.qtd,
        };
      }),
    );
    localStorage.setItem("pecasParaOrcamento", JSON.stringify(linhas));
    if (titulo) localStorage.setItem("tituloParaOrcamento", titulo);
    toast.success("Projeto enviado. Abrindo novo orçamento...");
    navigate("/orcamento");
  };

  // ── render ──────────────────────────────────────────────────────────────────

  if (configMarcenaria === undefined) {
    return (
      <div
        style={{ padding: 32, textAlign: "center", color: "var(--text-soft)" }}
      >
        Carregando...
      </div>
    );
  }

  if (configMarcenaria === null) {
    return (
      <div>
        <h1>Corte &amp; Peças</h1>
        <div
          style={{
            marginTop: 16,
            padding: "16px 20px",
            background: "var(--panel-soft)",
            borderRadius: "var(--radius-sm)",
            border: "1px dashed var(--border)",
            fontSize: 14,
            color: "var(--text-soft)",
          }}
        >
          ⚙{" "}
          <Link to="/marcenaria" style={{ color: "var(--primary)" }}>
            Configure sua marcenaria
          </Link>{" "}
          (chapas, fitas e tipos de móvel) para gerar peças e plano de corte.
        </div>
      </div>
    );
  }

  const cfg = configMarcenaria;

  // ── seções: helpers e medidas de apoio ──
  const E = cfg.espEstrutura ?? 18;
  const REF = cfg.larguraReforco ?? 100;
  const vaoLargura = pi.largura - 2 * E;
  const vaoAltura =
    pi.tipoTampo === "MDF" ? pi.altura - 2 * E : pi.altura - E - REF;
  const alvoSecoes = orientacao === "HORIZONTAL" ? vaoLargura : vaoAltura;
  const usadoSecoes =
    secoes.reduce((a, s) => a + s.tamanhoMm, 0) + (secoes.length - 1) * E;
  const sobra = alvoSecoes - usadoSecoes;

  const atualizarSecao = (idx: number, patch: Partial<SecaoUI>) =>
    setSecoes((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  const adicionarSecao = () =>
    setSecoes((prev) => [
      ...prev,
      {
        tamanhoMm: Math.max(0, Math.round(sobra - E)) || 300,
        tipo: "PORTAS",
        nPortas: 1,
        nGavetas: 3,
        corredicaIdx: 0,
        comprimentoCorre: 400,
      },
    ]);
  const removerSecao = (idx: number) =>
    setSecoes((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <h1>Corte &amp; Peças</h1>
      <p style={{ color: "var(--text-soft)", marginTop: -8, fontSize: 14 }}>
        Gere as peças do móvel, o relatório com a fita de borda e o plano de
        corte. Tudo imprimível — e, se quiser, vira um orçamento.
      </p>

      {/* Calculadora */}
      <div
        className="no-print"
        style={{
          marginTop: 16,
          background: "var(--panel)",
          border: "2px solid var(--primary)",
          borderRadius: "var(--radius-md)",
          padding: "20px 24px",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <h3
          style={{ margin: "0 0 16px", fontSize: 16, color: "var(--primary)" }}
        >
          Calculadora do Móvel
        </h3>

        <div style={{ marginBottom: 16 }}>
          <CampoP label="Nome do Projeto (opcional)">
            <input
              placeholder="Ex: Casa do Cliente João"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </CampoP>
        </div>

        {/* Dimensões */}
        <div style={grid3}>
          <CampoP label="Largura (mm)">
            <input
              type="number"
              value={pi.largura || ""}
              onChange={(e) =>
                setPi((p) => ({ ...p, largura: +e.target.value }))
              }
            />
          </CampoP>
          <CampoP label="Altura (mm)">
            <input
              type="number"
              value={pi.altura || ""}
              onChange={(e) =>
                setPi((p) => ({ ...p, altura: +e.target.value }))
              }
            />
          </CampoP>
          <CampoP label="Profundidade (mm)">
            <input
              type="number"
              value={pi.profundidade || ""}
              onChange={(e) =>
                setPi((p) => ({ ...p, profundidade: +e.target.value }))
              }
            />
          </CampoP>
        </div>

        {/* Tipo e cores */}
        <div style={grid3}>
          <CampoP label="Tipo de Móvel">
            <select
              value={pi.tipoMovelIdx}
              onChange={(e) =>
                setPi((p) => ({ ...p, tipoMovelIdx: +e.target.value }))
              }
            >
              {cfg.tiposMovel.map((t, i) => (
                <option key={t.id} value={i}>
                  {t.nome}
                </option>
              ))}
            </select>
          </CampoP>
          <CampoP label="Cor Acabamento">
            <select
              value={pi.corAcabamento}
              onChange={(e) =>
                setPi((p) => ({ ...p, corAcabamento: e.target.value }))
              }
            >
              {[
                ...new Set(
                  cfg.chapas
                    .filter((c) => c.espessura === 18)
                    .map((c) => c.cor),
                ),
              ].map((cor) => (
                <option key={cor} value={cor}>
                  {cor}
                </option>
              ))}
            </select>
          </CampoP>
          <CampoP label="Cor Fundo">
            <select
              value={pi.corFundo}
              onChange={(e) =>
                setPi((p) => ({ ...p, corFundo: e.target.value }))
              }
            >
              {[...new Set(cfg.chapas.map((c) => c.cor))].map((cor) => (
                <option key={cor} value={cor}>
                  {cor}
                </option>
              ))}
            </select>
          </CampoP>
        </div>

        {/* Opções */}
        <div style={grid3}>
          <CampoP label="Tipo de Tampo">
            <select
              value={pi.tipoTampo}
              onChange={(e) =>
                setPi((p) => ({
                  ...p,
                  tipoTampo: e.target.value as "MDF" | "PEDRA",
                }))
              }
            >
              <option value="MDF">MDF</option>
              <option value="PEDRA">Pedra (sem tampo)</option>
            </select>
          </CampoP>
          <CampoP label="Nº de Prateleiras">
            <select
              value={pi.nPrateleiras}
              onChange={(e) =>
                setPi((p) => ({ ...p, nPrateleiras: +e.target.value }))
              }
            >
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </CampoP>
          <CampoP label="Lado oculto na cor">
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                marginTop: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={pi.ladoOcultoNaCor}
                onChange={(e) =>
                  setPi((p) => ({ ...p, ladoOcultoNaCor: e.target.checked }))
                }
              />
              Tira oculta colorida
            </label>
          </CampoP>
        </div>

        {/* Frente em seções (portas / gavetas + divisórias automáticas) */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <label
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-main)",
              }}
            >
              Frente do móvel — {secoes.length}{" "}
              {secoes.length === 1 ? "seção" : "seções"}
            </label>
            {secoes.length >= 2 && (
              <div style={{ display: "flex", gap: 8 }}>
                {(["HORIZONTAL", "VERTICAL"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrientacao(o)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1.5px solid var(--primary)",
                      background:
                        orientacao === o ? "var(--primary)" : "transparent",
                      color: orientacao === o ? "#fff" : "var(--primary)",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {o === "HORIZONTAL" ? "↔ Lado a lado" : "↕ Empilhadas"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {secoes.map((s, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 14px",
                marginBottom: 10,
                background: "var(--panel-soft)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <b style={{ fontSize: 13 }}>Seção {idx + 1}</b>
                {secoes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerSecao(idx)}
                    title="Remover seção"
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--danger)",
                      cursor: "pointer",
                      fontSize: 16,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                {secoes.length >= 2 && (
                  <CampoP
                    label={
                      orientacao === "HORIZONTAL"
                        ? "Largura da seção (mm)"
                        : "Altura da seção (mm)"
                    }
                  >
                    <input
                      type="number"
                      value={s.tamanhoMm || ""}
                      onChange={(e) =>
                        atualizarSecao(idx, { tamanhoMm: +e.target.value })
                      }
                    />
                  </CampoP>
                )}
                <CampoP label="Conteúdo">
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {(["PORTAS", "GAVETAS"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => atualizarSecao(idx, { tipo: t })}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "var(--radius-sm)",
                          border: "1.5px solid var(--primary)",
                          background:
                            s.tipo === t ? "var(--primary)" : "transparent",
                          color: s.tipo === t ? "#fff" : "var(--primary)",
                          cursor: "pointer",
                          fontWeight: 600,
                          fontSize: 13,
                        }}
                      >
                        {t === "PORTAS" ? "Portas" : "Gavetas"}
                      </button>
                    ))}
                  </div>
                </CampoP>
              </div>

              {s.tipo === "PORTAS" ? (
                <CampoP label="Nº de Portas">
                  <select
                    value={s.nPortas}
                    onChange={(e) =>
                      atualizarSecao(idx, { nPortas: +e.target.value })
                    }
                  >
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "porta" : "portas"}
                      </option>
                    ))}
                  </select>
                </CampoP>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      cfg.corredicas.length > 0 ? "1fr 1fr 1fr" : "1fr",
                    gap: 12,
                  }}
                >
                  <CampoP label="Nº de Gavetas">
                    <select
                      value={s.nGavetas}
                      onChange={(e) =>
                        atualizarSecao(idx, { nGavetas: +e.target.value })
                      }
                    >
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "gaveta" : "gavetas"}
                        </option>
                      ))}
                    </select>
                  </CampoP>
                  {cfg.corredicas.length > 0 && (
                    <>
                      <CampoP label="Corrediça">
                        <select
                          value={s.corredicaIdx}
                          onChange={(e) => {
                            const ci = +e.target.value;
                            const corre = cfg.corredicas[ci];
                            const primeiro = corre?.comprimentos
                              ? Number(corre.comprimentos.split(",")[0])
                              : 400;
                            atualizarSecao(idx, {
                              corredicaIdx: ci,
                              comprimentoCorre: primeiro,
                            });
                          }}
                        >
                          {cfg.corredicas.map((c, i) => (
                            <option key={c.id} value={i}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                      </CampoP>
                      <CampoP label="Comprimento (mm)">
                        <select
                          value={s.comprimentoCorre}
                          onChange={(e) =>
                            atualizarSecao(idx, {
                              comprimentoCorre: +e.target.value,
                            })
                          }
                        >
                          {(cfg.corredicas[s.corredicaIdx]?.comprimentos ?? "")
                            .split(",")
                            .filter(Boolean)
                            .map((mm) => (
                              <option key={mm} value={+mm}>
                                {mm} mm
                              </option>
                            ))}
                        </select>
                      </CampoP>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={adicionarSecao}
              style={{
                background: "transparent",
                color: "var(--primary)",
                border: "1.5px dashed var(--primary)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 16px",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              + Adicionar Seção
            </button>

            {secoes.length >= 2 && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color:
                    Math.abs(sobra) <= 1 ? "var(--success)" : "var(--danger)",
                }}
              >
                {orientacao === "HORIZONTAL" ? "Largura" : "Altura"} usada:{" "}
                {usadoSecoes} / {alvoSecoes} mm
                {Math.abs(sobra) <= 1
                  ? " ✓"
                  : sobra > 0
                    ? ` (faltam ${Math.round(sobra)} mm)`
                    : ` (excesso de ${Math.round(-sobra)} mm)`}
              </span>
            )}
          </div>

          {secoes.length >= 2 && (
            <p
              style={{
                fontSize: 11,
                color: "var(--text-soft)",
                margin: "8px 0 0",
              }}
            >
              O sistema adiciona {secoes.length - 1} divisória
              {secoes.length - 1 !== 1 ? "s" : ""}{" "}
              {orientacao === "HORIZONTAL"
                ? "em pé (vertical)"
                : "deitada(s) (horizontal)"}{" "}
              automaticamente.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={calcularProjeto}
          disabled={calculando}
          style={{
            background: "var(--primary)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "10px 24px",
            fontWeight: 700,
            cursor: calculando ? "not-allowed" : "pointer",
            opacity: calculando ? 0.7 : 1,
          }}
        >
          {calculando ? "Calculando..." : "Calcular Peças"}
        </button>
      </div>

      {/* Após calcular: adicionar este móvel ao projeto */}
      {resultadoMotor && (
        <div
          className="no-print"
          style={{
            marginTop: 16,
            background: "var(--panel)",
            border: "2px solid #27ae60",
            borderRadius: "var(--radius-md)",
            padding: "16px 20px",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14 }}>
            ✓ Móvel calculado — {resultadoMotor.pecas.length} tipos de peça.
            Escolha o ambiente e adicione ao projeto.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 12,
              alignItems: "end",
            }}
          >
            <CampoP label="Ambiente">
              <select
                value={ambiente}
                onChange={(e) => setAmbiente(e.target.value)}
              >
                {AMBIENTES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </CampoP>
            <CampoP label="Nome do móvel">
              <input
                placeholder="Ex: Armário aéreo"
                value={nomeMovel}
                onChange={(e) => setNomeMovel(e.target.value)}
              />
            </CampoP>
            <button
              type="button"
              onClick={adicionarAoProjeto}
              style={{ ...btnSuccess, height: 40 }}
            >
              ➕ Adicionar ao Projeto
            </button>
          </div>
        </div>
      )}

      {/* Projeto montado */}
      {itensEfetivos.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {/* Lista de módulos */}
          <div
            className="no-print"
            style={{
              background: "var(--panel)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-soft)",
              padding: "16px 20px",
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>
              Projeto — {itensEfetivos.length} módulo
              {itensEfetivos.length !== 1 ? "s" : ""}
            </h3>
            {projeto.map((it, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 13,
                }}
              >
                <span>
                  <b>Módulo {idx + 1}</b> — {it.ambiente}
                  {it.nome ? ` — ${it.nome}` : ""}{" "}
                  <span style={{ color: "var(--text-soft)" }}>
                    ({it.resultado.pecas.length} tipos de peça)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removerItem(idx)}
                  title="Remover módulo"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--danger)",
                    cursor: "pointer",
                    fontSize: 16,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            {itemAtual && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  fontSize: 13,
                  color: "var(--text-soft)",
                  fontStyle: "italic",
                }}
              >
                <span>
                  <b>Módulo {projeto.length + 1}</b> — {itemAtual.ambiente}
                  {itemAtual.nome ? ` — ${itemAtual.nome}` : ""} — calculado,
                  ainda não adicionado
                </span>
              </div>
            )}
          </div>

          {/* Ações do projeto */}
          <div
            className="no-print"
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <button
              type="button"
              onClick={baixarPdfRelatorio}
              disabled={gerandoPdf}
              style={{ ...btnPrimary, opacity: gerandoPdf ? 0.7 : 1 }}
            >
              {gerandoPdf ? "Gerando..." : "📄 Baixar PDF (Relatório)"}
            </button>
            <button
              type="button"
              onClick={imprimirRelatorio}
              style={btnOutline}
            >
              🖨 Imprimir Relatório
            </button>
            <button type="button" onClick={gerarPlano} style={btnOutline}>
              📐 {planoAberto ? "Atualizar" : "Ver"} Plano de Corte
            </button>
            {planoAberto && (
              <button
                type="button"
                onClick={baixarPdfPlano}
                disabled={gerandoPdf}
                style={{ ...btnPrimary, opacity: gerandoPdf ? 0.7 : 1 }}
              >
                {gerandoPdf ? "Gerando..." : "📄 Baixar PDF (Plano)"}
              </button>
            )}
            {planoAberto && (
              <button type="button" onClick={imprimirPlano} style={btnOutline}>
                🖨 Imprimir Plano
              </button>
            )}
            <button type="button" onClick={usarNoOrcamento} style={btnSuccess}>
              ✓ Usar o Projeto em um Orçamento
            </button>
          </div>

          {/* Modo do plano de corte */}
          <div
            className="no-print"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              Plano de corte:
            </span>
            {(["JUNTO", "AMBIENTE"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setModoPlano(m);
                  if (planoAberto) gerarPlanoCom(veioCores, m);
                }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "1.5px solid var(--primary)",
                  background:
                    modoPlano === m ? "var(--primary)" : "transparent",
                  color: modoPlano === m ? "#fff" : "var(--primary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 12,
                }}
              >
                {m === "JUNTO" ? "Tudo junto" : "Por ambiente"}
              </button>
            ))}
          </div>

          {/* Veio por cor (projeto) */}
          {coresProjeto.length > 0 && (
            <div
              className="no-print"
              style={{
                marginBottom: 16,
                padding: "10px 14px",
                background: "var(--panel-soft)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--text-main)",
                }}
              >
                Veio do material — marque as cores que têm veio (madeirado).
                Cores lisas, como branco, não precisam.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                {coresProjeto.map((cor) => (
                  <label
                    key={cor}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!veioCores[cor]}
                      onChange={(e) => {
                        const novo = { ...veioCores, [cor]: e.target.checked };
                        setVeioCores(novo);
                        if (planoAberto) gerarPlanoCom(novo, modoPlano);
                      }}
                    />
                    {cor}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Relatório de peças do projeto (tela) */}
          <div
            ref={relatorioRef}
            style={{
              background: "var(--panel)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-soft)",
              padding: "20px 24px",
            }}
          >
            <RelatorioPecas titulo={titulo} modulos={modulos} />
          </div>

          {/* Plano(s) de corte (tela) */}
          {planoAberto && planos.length > 0 && (
            <div
              style={{
                marginTop: 20,
                background: "var(--panel)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-soft)",
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Plano de Corte
                  {modoPlano === "AMBIENTE" ? " (por ambiente)" : ""}
                </h3>
                <button
                  type="button"
                  className="no-print"
                  onClick={() => setPlanoAberto(false)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 18,
                    color: "var(--text-soft)",
                  }}
                >
                  ✕
                </button>
              </div>
              <div ref={planoRef}>
                {planos.map((pl, i) => (
                  <div key={i} style={{ marginBottom: 24 }}>
                    <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>
                      {pl.titulo}
                    </h4>
                    <PlanoCorte
                      resultado={pl.resultado}
                      chapaLarg={cfg.chapaLargura ?? 2750}
                      chapaAlt={cfg.chapaAltura ?? 1850}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Portal de impressão */}
      {printNode &&
        createPortal(<div id="area-impressao">{printNode}</div>, document.body)}
    </div>
  );
}

function CampoP({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          color: "var(--text-soft)",
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 12,
  marginBottom: 16,
};

const btnPrimary: React.CSSProperties = {
  background: "var(--primary)",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "10px 20px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnOutline: React.CSSProperties = {
  background: "transparent",
  color: "var(--primary)",
  border: "2px solid var(--primary)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 20px",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSuccess: React.CSSProperties = {
  background: "#27ae60",
  color: "#fff",
  border: "none",
  borderRadius: "var(--radius-sm)",
  padding: "10px 20px",
  fontWeight: 700,
  cursor: "pointer",
};
