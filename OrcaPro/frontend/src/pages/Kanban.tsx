import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";
import { Orcamento } from "../types";

const COLUNAS = [
  "Aguardando",
  "Aprovado",
  "Produção",
  "Instalação",
  "Entregue",
];

const COR_COLUNA: Record<string, string> = {
  Aguardando: "#f59e0b",
  Aprovado: "#3b82f6",
  Produção: "#8b5cf6",
  Instalação: "#f97316",
  Entregue: "#10b981",
};

interface OrcamentoComContrato extends Orcamento {
  contratoToken?: string | null;
  contratoAceito?: boolean;
  contratoAceitoEm?: string | null;
}

const STATUS_COM_ORDEM = ["Aprovado", "Produção", "Instalação", "Entregue"];

export default function Kanban() {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<OrcamentoComContrato[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<string | null>(null);
  const dragOver = useRef<string | null>(null);

  useEffect(() => {
    carregarOrcamentos();
  }, []);

  const carregarOrcamentos = async () => {
    try {
      const response = await api.get("/orcamentos");
      setOrcamentos(response.data);
    } catch (error) {
      console.error("Erro ao carregar orçamentos", error);
    }
  };

  const mudarStatus = async (id: number, novoStatus: string) => {
    try {
      const res = await api.patch(`/orcamentos/${id}/status`, {
        status: novoStatus,
      });
      setOrcamentos((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...res.data } : o)),
      );
    } catch {
      toast.error("Erro ao atualizar status do projeto.");
    }
  };

  // --- Drag & Drop handlers ---
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setColunaAlvo(null);
    dragOver.current = null;
  };

  const handleDragOver = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOver.current !== coluna) {
      dragOver.current = coluna;
      setColunaAlvo(coluna);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // só limpa se saiu da coluna de verdade (não de um filho)
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      dragOver.current = null;
      setColunaAlvo(null);
    }
  };

  const handleDrop = (e: React.DragEvent, coluna: string) => {
    e.preventDefault();
    if (draggingId !== null) {
      const orc = orcamentos.find((o) => o.id === draggingId);
      const statusAtual = orc?.status || "Aguardando";
      if (statusAtual !== coluna) {
        mudarStatus(draggingId, coluna);
      }
    }
    setDraggingId(null);
    setColunaAlvo(null);
    dragOver.current = null;
  };

  // --- Gerar contrato para orçamentos Aprovados sem token ---
  const gerarContrato = async (id: number) => {
    try {
      const res = await api.post(`/orcamentos/${id}/gerar-contrato`);
      setOrcamentos((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...res.data } : o)),
      );
      toast.success("Contrato gerado! Agora você pode compartilhar.");
    } catch {
      toast.error("Erro ao gerar contrato.");
    }
  };

  // --- WhatsApp do contrato ---
  const compartilharContrato = (orc: OrcamentoComContrato) => {
    if (!orc.contratoToken) return;
    const link = `${window.location.origin}/contrato/${orc.contratoToken}`;
    const telefone = orc.cliente?.telefone?.replace(/\D/g, "") || "";
    const mensagem = encodeURIComponent(
      `Olá ${orc.cliente?.nome?.trim() || ""}!\n\nSeu projeto foi aprovado!\n\nSegue o link do contrato para você revisar e confirmar:\n${link}\n\nQualquer dúvida, estou à disposição!`,
    );
    const url = telefone
      ? `https://wa.me/55${telefone}?text=${mensagem}`
      : `https://wa.me/?text=${mensagem}`;
    window.open(url, "_blank");
  };

  const orcamentosFiltrados = termoBusca
    ? orcamentos.filter(
        (o) =>
          o.titulo?.toLowerCase().includes(termoBusca.toLowerCase()) ||
          o.cliente?.nome?.toLowerCase().includes(termoBusca.toLowerCase()),
      )
    : orcamentos;

  return (
    <div>
      <h1>Quadro de Produção</h1>
      <div className="search-bar" style={{ marginBottom: "24px" }}>
        <p style={{ margin: 0 }}>
          Acompanhe o andamento dos projetos. Arraste os cards ou use o menu
          para mudar o status.
        </p>
        <input
          type="text"
          placeholder="Buscar por título ou cliente..."
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
        />
      </div>

      <div className="kanban-board">
        {COLUNAS.map((coluna) => {
          const orcamentosDaColuna = orcamentosFiltrados.filter(
            (o) =>
              o.status === coluna ||
              (coluna === "Aguardando" &&
                (!o.status || !COLUNAS.includes(o.status))),
          );
          const isAlvo = colunaAlvo === coluna && draggingId !== null;

          return (
            <div
              key={coluna}
              className="kanban-col"
              style={{
                borderTopColor: COR_COLUNA[coluna],
                outline: isAlvo ? `2px dashed ${COR_COLUNA[coluna]}` : "none",
                background: isAlvo ? `${COR_COLUNA[coluna]}10` : undefined,
                transition: "background 0.15s, outline 0.15s",
              }}
              onDragOver={(e) => handleDragOver(e, coluna)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, coluna)}
            >
              <h3 className="kanban-col-title">
                {coluna}{" "}
                <span
                  style={{
                    background: COR_COLUNA[coluna],
                    color: "#fff",
                    borderRadius: "999px",
                    padding: "1px 8px",
                    fontSize: "0.75rem",
                  }}
                >
                  {orcamentosDaColuna.length}
                </span>
              </h3>

              {orcamentosDaColuna.length === 0 && (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                    padding: "20px 0",
                  }}
                >
                  Nenhum projeto
                </p>
              )}

              {orcamentosDaColuna.map((orc) => (
                <div
                  key={orc.id}
                  className="kanban-card"
                  draggable
                  onDragStart={(e) => handleDragStart(e, orc.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    cursor: "grab",
                    opacity: draggingId === orc.id ? 0.4 : 1,
                    transition: "opacity 0.15s",
                  }}
                >
                  <h4>{orc.titulo}</h4>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      margin: "0 0 4px",
                      color: "var(--text-soft)",
                    }}
                  >
                    {orc.cliente?.nome || "Sem cliente"}
                  </p>
                  <p className="kanban-valor">
                    R$ {Number(orc.totalFinal).toFixed(2)}
                  </p>

                  <select
                    value={orc.status || "Aguardando"}
                    onChange={(e) => mudarStatus(orc.id, e.target.value)}
                    style={{
                      marginBottom:
                        orc.status === "Aprovado" && orc.contratoToken
                          ? "8px"
                          : "0",
                    }}
                  >
                    {COLUNAS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  {/* Botões de contrato — só aparecem em cards Aprovados */}
                  {orc.status === "Aprovado" && !orc.contratoToken && (
                    <button
                      onClick={() => gerarContrato(orc.id)}
                      style={{
                        marginTop: "8px",
                        background: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      📄 Gerar Contrato
                    </button>
                  )}

                  {orc.status === "Aprovado" && orc.contratoToken && (
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: orc.contratoAceito ? "#10b981" : "#3b82f6",
                        }}
                      >
                        {orc.contratoAceito
                          ? "✓ Contrato aceito"
                          : "📄 Contrato gerado"}
                      </div>
                      <button
                        onClick={() => compartilharContrato(orc)}
                        style={{
                          background: "#25d366",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 10px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          width: "100%",
                        }}
                      >
                        Compartilhar Contrato
                      </button>
                    </div>
                  )}

                  {STATUS_COM_ORDEM.includes(orc.status ?? "") && (
                    <button
                      onClick={() => navigate(`/ordem-producao/${orc.id}`)}
                      style={{
                        marginTop: "8px",
                        background: "#7c3aed",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      🔨 Ver Ordem de Produção
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
