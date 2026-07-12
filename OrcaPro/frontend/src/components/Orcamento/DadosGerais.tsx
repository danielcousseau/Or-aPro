import { useState, useEffect } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";
import { Cliente, OrcamentoFormData } from "../../types";

type ChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;
type FakeEvent = { target: { name: string; value: string } };

interface Props {
  orcamento: OrcamentoFormData;
  clientes: Cliente[];
  onChange: (e: ChangeEvent | FakeEvent) => void;
}

const AMBIENTES_PADRAO = [
  "Cozinha",
  "Quarto",
  "Sala",
  "Banheiro",
  "Escritório",
  "Lavanderia",
  "Varanda",
  "Área de Serviço",
  "Garagem",
];

export default function DadosGerais({ orcamento, clientes, onChange }: Props) {
  const [opcoesCustomizadas, setOpcoesCustomizadas] = useState<string[]>([]);

  useEffect(() => {
    api
      .get("/opcoes-customizadas?tipo=ambiente")
      .then((r) =>
        setOpcoesCustomizadas(r.data.map((o: { nome: string }) => o.nome)),
      )
      .catch(() => {});
  }, []);

  const todasOpcoes = [
    ...AMBIENTES_PADRAO,
    ...opcoesCustomizadas.filter((o) => !AMBIENTES_PADRAO.includes(o)),
  ];

  const isCustom =
    orcamento.ambiente && !AMBIENTES_PADRAO.includes(orcamento.ambiente);
  const [usandoOutros, setUsandoOutros] = useState(Boolean(isCustom));
  const [salvarComoFixo, setSalvarComoFixo] = useState(false);

  useEffect(() => {
    if (opcoesCustomizadas.length > 0 && orcamento.ambiente) {
      const all = [...AMBIENTES_PADRAO, ...opcoesCustomizadas];
      if (all.includes(orcamento.ambiente)) setUsandoOutros(false);
    }
  }, [opcoesCustomizadas, orcamento.ambiente]);

  const handleAmbienteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "Outros") {
      setUsandoOutros(true);
      setSalvarComoFixo(false);
      onChange({ target: { name: "ambiente", value: "" } });
    } else {
      setUsandoOutros(false);
      setSalvarComoFixo(false);
      onChange(e);
    }
  };

  const handleTextoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSalvarComoFixo(false);
    onChange(e);
  };

  const handleSalvarComoFixo = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const checked = e.target.checked;
    setSalvarComoFixo(checked);
    const ambienteAtual = String(orcamento.ambiente ?? "");
    if (checked && ambienteAtual.trim()) {
      try {
        await api.post("/opcoes-customizadas", {
          tipo: "ambiente",
          nome: ambienteAtual.trim(),
        });
        setOpcoesCustomizadas((prev) => [
          ...new Set([...prev, ambienteAtual.trim()]),
        ]);
        toast.success(`"${ambienteAtual}" salvo como opção fixa!`);
      } catch {
        setSalvarComoFixo(false);
        toast.error("Erro ao salvar opção.");
      }
    }
  };

  return (
    <div className="cliente-card highlight-primary">
      <h3>1. Dados Gerais</h3>
      <section className="form-section">
        <label>Cliente *</label>
        <select
          name="clienteId"
          value={orcamento.clienteId}
          onChange={onChange}
          required
        >
          <option value="">Selecione um cliente...</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </section>
      <div className="form-grid-1-1">
        <section className="form-section">
          <label>Ambiente</label>
          <select
            name="ambiente"
            value={usandoOutros ? "Outros" : orcamento.ambiente || ""}
            onChange={handleAmbienteChange}
          >
            <option value="">Selecione um ambiente...</option>
            {todasOpcoes.map((amb) => (
              <option key={amb} value={amb}>
                {amb}
              </option>
            ))}
            <option value="Outros">[ + ] Outro (Digitar manualmente)</option>
          </select>
          {usandoOutros && (
            <>
              <input
                type="text"
                name="ambiente"
                value={orcamento.ambiente}
                onChange={handleTextoChange}
                placeholder="Descreva o ambiente..."
                style={{ marginTop: "8px" }}
                autoFocus
              />
              {String(orcamento.ambiente ?? "").trim() && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "8px",
                    marginTop: "8px",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    color: "var(--text-soft)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={salvarComoFixo}
                    onChange={handleSalvarComoFixo}
                    style={{
                      width: "16px",
                      height: "16px",
                      marginTop: "2px",
                      flexShrink: 0,
                      cursor: "pointer",
                    }}
                  />
                  Salvar "{orcamento.ambiente}" como opção fixa
                </label>
              )}
            </>
          )}
        </section>
        <section className="form-section">
          <label>Tipo de Móvel</label>
          <input
            type="text"
            name="tipoMovel"
            value={orcamento.tipoMovel}
            onChange={onChange}
          />
        </section>
      </div>
    </div>
  );
}
