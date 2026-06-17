import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import marcenariaApi, {
  type ConfiguracaoMarcenaria,
  type Chapa,
  type Fita,
  type TipoMovel,
  type Corredica,
  type Ferragem,
  type ConfigBase,
} from "../services/marcenariaApi";

// ─── defaults ─────────────────────────────────────────────────────────────────

const CONFIG_PADRAO: ConfigBase = {
  espEstrutura: 18,
  espFundo: 6,
  rasgoProfundidade: 10,
  rasgoBorda: 10,
  folgaPorta: 4,
  avancoTamponamento: 25,
  larguraReforco: 100,
  larguraTiraOculta: 60,
  kerfSerra: 3,
  margemPerda: 0.1,
  recuoPrateleira: 20,
  folgaPrateleiraLat: 2,
  folgaAlturaGaveta: 4,
  corCaixaInterna: "Branco",
  chapaLargura: 2750,
  chapaAltura: 1850,
};

const COMPRIMENTOS_PADRAO = [250, 300, 350, 400, 450, 500, 550, 600];
const TIPO_PORTA_OPTS = ["SOBREPOSTA", "EMBUTIDA", "MEIA"];

// ─── tipos auxiliares de formulário ──────────────────────────────────────────

type ChapaForm = Omit<Chapa, "id" | "configId">;
type FitaForm = Omit<Fita, "id" | "configId">;
type TipoForm = Omit<TipoMovel, "id" | "configId">;
type CorredicaForm = Omit<Corredica, "id" | "configId">;
type FerragemForm = Omit<Ferragem, "id" | "configId">;

const CHAPA_VAZIA: ChapaForm = { cor: "", espessura: 18, precoChapa: 0 };
const FITA_VAZIA: FitaForm = { cor: "", largura: 22, precoMetro: 0 };
const TIPO_VAZIO: TipoForm = {
  nome: "",
  tamponamentoTampo: false,
  tamponamentoLaterais: false,
  tamponamentoBase: false,
  tipoPorta: "SOBREPOSTA",
};
const CORREDICA_VAZIA: CorredicaForm = {
  tipo: "TELESCOPICA",
  nome: "",
  descontoLarguraMm: 63,
  comprimentos: "250,300,350,400,450,500,550,600",
};
const FERRAGEM_VAZIA: FerragemForm = {
  nome: "",
  tipo: "DOBRADICA",
  unidade: "un",
  preco: 0,
};

// ─── subcomponentes ───────────────────────────────────────────────────────────

function Tag({ label }: { label: string }) {
  return (
    <span
      style={{
        background: "var(--primary)",
        color: "#fff",
        fontSize: 11,
        padding: "2px 8px",
        borderRadius: 99,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function BtnIcon({
  onClick,
  title,
  cor = "var(--danger)",
}: {
  onClick: () => void;
  title: string;
  cor?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: cor,
        padding: 4,
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      ✕
    </button>
  );
}

// ─── card genérico de lista ───────────────────────────────────────────────────

function SecaoCard({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--panel)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-soft)",
        padding: "20px 24px",
        marginBottom: 20,
      }}
    >
      <h3
        style={{ margin: "0 0 16px", fontSize: 15, color: "var(--text-main)" }}
      >
        {titulo}
      </h3>
      {children}
    </div>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

export default function ConfiguracaoMarcenaria() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ConfiguracaoMarcenaria | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Wizard
  const [passo, setPasso] = useState(1);
  const [configBase, setConfigBase] = useState<ConfigBase>(CONFIG_PADRAO);
  const [novasChapas, setNovasChapas] = useState<ChapaForm[]>([]);
  const [novosTipos, setNovosTipos] = useState<TipoForm[]>([]);
  const [novasCorredicas, setNovasCorredicas] = useState<CorredicaForm[]>([]);
  const [chapaForm, setChapaForm] = useState<ChapaForm>(CHAPA_VAZIA);
  const [tipoForm, setTipoForm] = useState<TipoForm>(TIPO_VAZIO);
  const [correForm, setCorreForm] = useState<CorredicaForm>(CORREDICA_VAZIA);

  // Settings (pós-wizard)
  const [novaFita, setNovaFita] = useState<FitaForm>(FITA_VAZIA);
  const [novaChapaSettings, setNovaChapaSettings] =
    useState<ChapaForm>(CHAPA_VAZIA);
  const [novoTipoSettings, setNovoTipoSettings] =
    useState<TipoForm>(TIPO_VAZIO);
  const [novaCorreSettings, setNovaCorreSettings] =
    useState<CorredicaForm>(CORREDICA_VAZIA);
  const [novaFerragemSettings, setNovaFerragemSettings] =
    useState<FerragemForm>(FERRAGEM_VAZIA);

  useEffect(() => {
    marcenariaApi
      .buscarConfig()
      .then(({ data }) => {
        if (data.data) {
          setConfig(data.data);
          setConfigBase(data.data);
        }
      })
      .catch(() => toast.error("Erro ao carregar configuração."))
      .finally(() => setLoading(false));
  }, []);

  const recarregar = async () => {
    const { data } = await marcenariaApi.buscarConfig();
    if (data.data) setConfig(data.data);
  };

  // ── wizard ──────────────────────────────────────────────────────────────────

  const ehWizard = !config || !config.configurado;

  async function concluirWizard() {
    if (novasChapas.length === 0) {
      toast.warning("Adicione ao menos uma chapa.");
      return;
    }
    if (novosTipos.length === 0) {
      toast.warning("Adicione ao menos um tipo de móvel.");
      return;
    }
    setSalvando(true);
    try {
      await marcenariaApi.salvarConfig({ ...configBase, configurado: true });
      for (const c of novasChapas) await marcenariaApi.criarChapa(c);
      for (const t of novosTipos) await marcenariaApi.criarTipo(t);
      for (const r of novasCorredicas) await marcenariaApi.criarCorredica(r);
      await recarregar();
      toast.success("Marcenaria configurada com sucesso!");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  function adicionarChapaWizard() {
    if (!chapaForm.cor || chapaForm.precoChapa <= 0) {
      toast.warning("Preencha cor e preço da chapa.");
      return;
    }
    setNovasChapas((prev) => [...prev, { ...chapaForm }]);
    setChapaForm(CHAPA_VAZIA);
  }

  function adicionarTipoWizard() {
    if (!tipoForm.nome) {
      toast.warning("Informe o nome do tipo.");
      return;
    }
    setNovosTipos((prev) => [...prev, { ...tipoForm }]);
    setTipoForm(TIPO_VAZIO);
  }

  function adicionarCorreWizard() {
    if (!correForm.nome) {
      toast.warning("Informe o nome da corrediça.");
      return;
    }
    setNovasCorredicas((prev) => [...prev, { ...correForm }]);
    setCorreForm(CORREDICA_VAZIA);
  }

  // ── settings actions ────────────────────────────────────────────────────────

  async function deletar(fn: () => Promise<unknown>, msg: string) {
    try {
      await fn();
      await recarregar();
      toast.success(msg);
    } catch {
      toast.error("Erro ao remover.");
    }
  }

  async function adicionarChapa() {
    if (!novaChapaSettings.cor || novaChapaSettings.precoChapa <= 0) {
      toast.warning("Preencha cor e preço.");
      return;
    }
    try {
      await marcenariaApi.criarChapa(novaChapaSettings);
      await recarregar();
      setNovaChapaSettings(CHAPA_VAZIA);
      toast.success("Chapa adicionada.");
    } catch {
      toast.error("Erro ao adicionar chapa.");
    }
  }

  async function adicionarFita() {
    if (!novaFita.cor || novaFita.precoMetro <= 0) {
      toast.warning("Preencha cor e preço.");
      return;
    }
    try {
      await marcenariaApi.criarFita(novaFita);
      await recarregar();
      setNovaFita(FITA_VAZIA);
      toast.success("Fita adicionada.");
    } catch {
      toast.error("Erro ao adicionar fita.");
    }
  }

  async function adicionarTipo() {
    if (!novoTipoSettings.nome) {
      toast.warning("Informe o nome.");
      return;
    }
    try {
      await marcenariaApi.criarTipo(novoTipoSettings);
      await recarregar();
      setNovoTipoSettings(TIPO_VAZIO);
      toast.success("Tipo adicionado.");
    } catch {
      toast.error("Erro ao adicionar tipo.");
    }
  }

  async function adicionarCorre() {
    if (!novaCorreSettings.nome) {
      toast.warning("Informe o nome.");
      return;
    }
    try {
      await marcenariaApi.criarCorredica(novaCorreSettings);
      await recarregar();
      setNovaCorreSettings(CORREDICA_VAZIA);
      toast.success("Corrediça adicionada.");
    } catch {
      toast.error("Erro ao adicionar corrediça.");
    }
  }

  async function adicionarFerragem() {
    if (!novaFerragemSettings.nome || novaFerragemSettings.preco <= 0) {
      toast.warning("Preencha nome e preço.");
      return;
    }
    try {
      await marcenariaApi.criarFerragem(novaFerragemSettings);
      await recarregar();
      setNovaFerragemSettings(FERRAGEM_VAZIA);
      toast.success("Ferragem adicionada.");
    } catch {
      toast.error("Erro ao adicionar ferragem.");
    }
  }

  async function salvarBasico() {
    try {
      await marcenariaApi.salvarConfig(configBase);
      await recarregar();
      toast.success("Configurações salvas.");
    } catch {
      toast.error("Erro ao salvar.");
    }
  }

  // ── render ──────────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div
        style={{ padding: 32, textAlign: "center", color: "var(--text-soft)" }}
      >
        Carregando...
      </div>
    );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      {ehWizard ? (
        <WizardConfiguracao
          passo={passo}
          setPasso={setPasso}
          configBase={configBase}
          setConfigBase={setConfigBase}
          novasChapas={novasChapas}
          chapaForm={chapaForm}
          setChapaForm={setChapaForm}
          adicionarChapa={adicionarChapaWizard}
          removerChapa={(i) =>
            setNovasChapas((p) => p.filter((_, idx) => idx !== i))
          }
          novosTipos={novosTipos}
          tipoForm={tipoForm}
          setTipoForm={setTipoForm}
          adicionarTipo={adicionarTipoWizard}
          removerTipo={(i) =>
            setNovosTipos((p) => p.filter((_, idx) => idx !== i))
          }
          novasCorredicas={novasCorredicas}
          correForm={correForm}
          setCorreForm={setCorreForm}
          adicionarCorre={adicionarCorreWizard}
          removerCorre={(i) =>
            setNovasCorredicas((p) => p.filter((_, idx) => idx !== i))
          }
          concluir={concluirWizard}
          salvando={salvando}
        />
      ) : (
        <SettingsConfiguracao
          config={config!}
          configBase={configBase}
          setConfigBase={setConfigBase}
          salvarBasico={salvarBasico}
          novaChapa={novaChapaSettings}
          setNovaChapa={setNovaChapaSettings}
          adicionarChapa={adicionarChapa}
          deletarChapa={(id) =>
            deletar(() => marcenariaApi.deletarChapa(id), "Chapa removida.")
          }
          novaFita={novaFita}
          setNovaFita={setNovaFita}
          adicionarFita={adicionarFita}
          deletarFita={(id) =>
            deletar(() => marcenariaApi.deletarFita(id), "Fita removida.")
          }
          novoTipo={novoTipoSettings}
          setNovoTipo={setNovoTipoSettings}
          adicionarTipo={adicionarTipo}
          deletarTipo={(id) =>
            deletar(() => marcenariaApi.deletarTipo(id), "Tipo removido.")
          }
          novaCorre={novaCorreSettings}
          setNovaCorre={setNovaCorreSettings}
          adicionarCorre={adicionarCorre}
          deletarCorre={(id) =>
            deletar(
              () => marcenariaApi.deletarCorredica(id),
              "Corrediça removida.",
            )
          }
          novaFerragem={novaFerragemSettings}
          setNovaFerragem={setNovaFerragemSettings}
          adicionarFerragem={adicionarFerragem}
          deletarFerragem={(id) =>
            deletar(
              () => marcenariaApi.deletarFerragem(id),
              "Ferragem removida.",
            )
          }
        />
      )}
    </div>
  );
}

// ─── Wizard ───────────────────────────────────────────────────────────────────

interface WizardProps {
  passo: number;
  setPasso: (p: number) => void;
  configBase: ConfigBase;
  setConfigBase: (c: ConfigBase) => void;
  novasChapas: ChapaForm[];
  chapaForm: ChapaForm;
  setChapaForm: (f: ChapaForm) => void;
  adicionarChapa: () => void;
  removerChapa: (i: number) => void;
  novosTipos: TipoForm[];
  tipoForm: TipoForm;
  setTipoForm: (f: TipoForm) => void;
  adicionarTipo: () => void;
  removerTipo: (i: number) => void;
  novasCorredicas: CorredicaForm[];
  correForm: CorredicaForm;
  setCorreForm: (f: CorredicaForm) => void;
  adicionarCorre: () => void;
  removerCorre: (i: number) => void;
  concluir: () => void;
  salvando: boolean;
}

const PASSOS = ["Básico", "Chapas", "Tipos", "Corrediças", "Concluir"];

function WizardConfiguracao(props: WizardProps) {
  const { passo, setPasso } = props;

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "var(--primary)" }}>
          Configuração da Marcenaria
        </h1>
        <p style={{ color: "var(--text-soft)", marginTop: 8 }}>
          Vamos configurar sua marcenaria uma vez para que o sistema calcule os
          móveis automaticamente.
        </p>
      </div>

      {/* Steps */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginBottom: 32,
          flexWrap: "wrap",
        }}
      >
        {PASSOS.map((nome, idx) => {
          const num = idx + 1;
          const ativo = passo === num;
          const concluido = passo > num;
          return (
            <div
              key={num}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: concluido
                    ? "var(--success)"
                    : ativo
                      ? "var(--primary)"
                      : "var(--border)",
                  color: concluido || ativo ? "#fff" : "var(--text-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {concluido ? "✓" : num}
              </div>
              <span
                style={{
                  fontSize: 12,
                  color: ativo ? "var(--primary)" : "var(--text-soft)",
                  fontWeight: ativo ? 700 : 400,
                }}
              >
                {nome}
              </span>
              {idx < PASSOS.length - 1 && (
                <span style={{ color: "var(--border)", margin: "0 4px" }}>
                  ›
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div
        style={{
          background: "var(--panel)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-main)",
          padding: "28px 32px",
        }}
      >
        {passo === 1 && <PassoBasico {...props} />}
        {passo === 2 && <PassoChapas {...props} />}
        {passo === 3 && <PassoTipos {...props} />}
        {passo === 4 && <PassoCorredicas {...props} />}
        {passo === 5 && <PassoConcluir {...props} />}
      </div>

      {/* Nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 20,
        }}
      >
        {passo > 1 ? (
          <button className="btn-secondary" onClick={() => setPasso(passo - 1)}>
            ← Anterior
          </button>
        ) : (
          <span />
        )}
        {passo < 5 ? (
          <button className="btn-primary" onClick={() => setPasso(passo + 1)}>
            Próximo →
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={props.concluir}
            disabled={props.salvando}
          >
            {props.salvando ? "Salvando..." : "✓ Concluir Configuração"}
          </button>
        )}
      </div>
    </div>
  );
}

function PassoBasico({ configBase, setConfigBase }: WizardProps) {
  const set = (k: keyof ConfigBase, v: number | string) =>
    setConfigBase({ ...configBase, [k]: v });

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: 17 }}>
        Passo 1 — Configurações Básicas
      </h2>
      <p style={{ color: "var(--text-soft)", fontSize: 13 }}>
        Os valores padrão já estão preenchidos. Altere apenas se a sua
        marcenaria trabalha de forma diferente.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Campo label="Espessura MDF estrutural (mm)" hint="Padrão: 18 mm">
          <input
            type="number"
            value={configBase.espEstrutura}
            onChange={(e) => set("espEstrutura", +e.target.value)}
          />
        </Campo>
        <Campo label="Espessura do fundo (mm)" hint="Padrão: 6 mm">
          <input
            type="number"
            value={configBase.espFundo}
            onChange={(e) => set("espFundo", +e.target.value)}
          />
        </Campo>
        <Campo label="Folga de porta/gaveta (mm)" hint="Padrão: 4 mm">
          <input
            type="number"
            value={configBase.folgaPorta}
            onChange={(e) => set("folgaPorta", +e.target.value)}
          />
        </Campo>
        <Campo label="Margem de perda de chapa (%)" hint="Padrão: 10%">
          <input
            type="number"
            value={Math.round((configBase.margemPerda ?? 0.1) * 100)}
            onChange={(e) => set("margemPerda", +e.target.value / 100)}
          />
        </Campo>
        <Campo label="Profundidade do rasgo (mm)" hint="Padrão: 10 mm">
          <input
            type="number"
            value={configBase.rasgoProfundidade}
            onChange={(e) => set("rasgoProfundidade", +e.target.value)}
          />
        </Campo>
        <Campo label="Avanço do tamponamento (mm)" hint="Padrão: 25 mm">
          <input
            type="number"
            value={configBase.avancoTamponamento}
            onChange={(e) => set("avancoTamponamento", +e.target.value)}
          />
        </Campo>
      </div>
    </div>
  );
}

function PassoChapas({
  novasChapas,
  chapaForm,
  setChapaForm,
  adicionarChapa,
  removerChapa,
}: WizardProps) {
  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: 17 }}>Passo 2 — Chapas de MDF</h2>
      <p style={{ color: "var(--text-soft)", fontSize: 13 }}>
        Cadastre as chapas que você usa. A chapa padrão é 2750 × 1850 mm. O
        preço deve ser o valor da chapa inteira por cor.
      </p>

      {novasChapas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {novasChapas.map((c, i) => (
            <div key={i} style={itemStyle}>
              <span style={{ flex: 1 }}>
                <b>{c.cor}</b> — {c.espessura} mm — R$ {c.precoChapa.toFixed(2)}
              </span>
              <BtnIcon onClick={() => removerChapa(i)} title="Remover" />
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr auto",
          gap: 10,
          alignItems: "end",
        }}
      >
        <Campo label="Cor / Referência">
          <input
            placeholder="Ex: Branco TX"
            value={chapaForm.cor}
            onChange={(e) =>
              setChapaForm({ ...chapaForm, cor: e.target.value })
            }
          />
        </Campo>
        <Campo label="Espessura">
          <select
            value={chapaForm.espessura}
            onChange={(e) =>
              setChapaForm({ ...chapaForm, espessura: +e.target.value })
            }
          >
            <option value={18}>18 mm</option>
            <option value={6}>6 mm</option>
          </select>
        </Campo>
        <Campo label="Preço (chapa inteira) R$">
          <input
            type="number"
            step="0.01"
            placeholder="0,00"
            value={chapaForm.precoChapa || ""}
            onChange={(e) =>
              setChapaForm({ ...chapaForm, precoChapa: +e.target.value })
            }
          />
        </Campo>
        <button
          className="btn-primary"
          style={{ height: 38, marginBottom: 0 }}
          onClick={adicionarChapa}
        >
          + Add
        </button>
      </div>
      {novasChapas.length === 0 && (
        <p style={{ color: "var(--warning)", fontSize: 12, marginTop: 8 }}>
          ⚠ Adicione ao menos uma chapa para continuar.
        </p>
      )}
    </div>
  );
}

function PassoTipos({
  novosTipos,
  tipoForm,
  setTipoForm,
  adicionarTipo,
  removerTipo,
}: WizardProps) {
  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: 17 }}>Passo 3 — Tipos de Móvel</h2>
      <p style={{ color: "var(--text-soft)", fontSize: 13 }}>
        Defina as "classes" de móvel que você fabrica. Exemplos: "Aéreo",
        "Balcão", "Armário Alto".
      </p>

      {novosTipos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {novosTipos.map((t, i) => (
            <div key={i} style={itemStyle}>
              <span style={{ flex: 1 }}>
                <b>{t.nome}</b> — {t.tipoPorta}{" "}
                {t.tamponamentoLaterais ? "· Tamponado" : ""}
              </span>
              <BtnIcon onClick={() => removerTipo(i)} title="Remover" />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <Campo label="Nome do Tipo">
          <input
            placeholder="Ex: Armário Aéreo"
            value={tipoForm.nome}
            onChange={(e) => setTipoForm({ ...tipoForm, nome: e.target.value })}
          />
        </Campo>
        <Campo label="Tipo de Porta">
          <select
            value={tipoForm.tipoPorta}
            onChange={(e) =>
              setTipoForm({ ...tipoForm, tipoPorta: e.target.value })
            }
          >
            {TIPO_PORTA_OPTS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      <div style={{ display: "flex", gap: 20, margin: "12px 0 16px" }}>
        {(
          [
            "tamponamentoTampo",
            "tamponamentoLaterais",
            "tamponamentoBase",
          ] as const
        ).map((k) => (
          <label
            key={k}
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
              checked={tipoForm[k]}
              onChange={(e) =>
                setTipoForm({ ...tipoForm, [k]: e.target.checked })
              }
            />
            {k === "tamponamentoTampo"
              ? "Tampo"
              : k === "tamponamentoLaterais"
                ? "Laterais"
                : "Base"}
          </label>
        ))}
      </div>
      <button className="btn-primary" onClick={adicionarTipo}>
        + Adicionar Tipo
      </button>
      {novosTipos.length === 0 && (
        <p style={{ color: "var(--warning)", fontSize: 12, marginTop: 8 }}>
          ⚠ Adicione ao menos um tipo de móvel para continuar.
        </p>
      )}
    </div>
  );
}

function PassoCorredicas({
  novasCorredicas,
  correForm,
  setCorreForm,
  adicionarCorre,
  removerCorre,
}: WizardProps) {
  function toggleComprimento(mm: number) {
    const lista = correForm.comprimentos
      ? correForm.comprimentos.split(",").map(Number)
      : [];
    const nova = lista.includes(mm)
      ? lista.filter((x) => x !== mm)
      : [...lista, mm].sort((a, b) => a - b);
    setCorreForm({ ...correForm, comprimentos: nova.join(",") });
  }
  const selecionados = correForm.comprimentos
    ? correForm.comprimentos.split(",").map(Number)
    : [];

  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: 17 }}>
        Passo 4 — Corrediças (opcional)
      </h2>
      <p style={{ color: "var(--text-soft)", fontSize: 13 }}>
        Cadastre os modelos de corrediça que usa em gavetas. O desconto é a soma
        dos dois lados em centímetros (será convertido para mm).
      </p>

      {novasCorredicas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {novasCorredicas.map((c, i) => (
            <div key={i} style={itemStyle}>
              <span style={{ flex: 1 }}>
                <b>{c.nome}</b> — {c.tipo} — desconto {c.descontoLarguraMm} mm
              </span>
              <BtnIcon onClick={() => removerCorre(i)} title="Remover" />
            </div>
          ))}
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}
      >
        <Campo label="Nome">
          <input
            placeholder="Ex: Telescópica Hafele"
            value={correForm.nome}
            onChange={(e) =>
              setCorreForm({ ...correForm, nome: e.target.value })
            }
          />
        </Campo>
        <Campo label="Tipo">
          <select
            value={correForm.tipo}
            onChange={(e) =>
              setCorreForm({ ...correForm, tipo: e.target.value })
            }
          >
            <option value="TELESCOPICA">Telescópica</option>
            <option value="INVISIVEL">Invisível</option>
          </select>
        </Campo>
        <Campo label="Desconto (cm, 2 lados)" hint="Ex: 6,3 cm = 63 mm">
          <input
            type="number"
            step="0.1"
            value={correForm.descontoLarguraMm / 10}
            onChange={(e) =>
              setCorreForm({
                ...correForm,
                descontoLarguraMm: Math.round(+e.target.value * 10),
              })
            }
          />
        </Campo>
      </div>
      <div style={{ margin: "12px 0 16px" }}>
        <label
          style={{
            fontSize: 12,
            color: "var(--text-soft)",
            display: "block",
            marginBottom: 6,
          }}
        >
          Comprimentos disponíveis
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {COMPRIMENTOS_PADRAO.map((mm) => (
            <label
              key={mm}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selecionados.includes(mm)}
                onChange={() => toggleComprimento(mm)}
              />
              {mm} mm
            </label>
          ))}
        </div>
      </div>
      <button className="btn-primary" onClick={adicionarCorre}>
        + Adicionar Corrediça
      </button>
    </div>
  );
}

function PassoConcluir({
  novasChapas,
  novosTipos,
  novasCorredicas,
}: WizardProps) {
  return (
    <div>
      <h2 style={{ marginTop: 0, fontSize: 17 }}>Passo 5 — Revisão</h2>
      <div style={{ display: "grid", gap: 12 }}>
        <ResumoItem
          titulo="Chapas"
          qtd={novasChapas.length}
          items={novasChapas.map((c) => `${c.cor} (${c.espessura}mm)`)}
        />
        <ResumoItem
          titulo="Tipos de Móvel"
          qtd={novosTipos.length}
          items={novosTipos.map((t) => t.nome)}
        />
        <ResumoItem
          titulo="Corrediças"
          qtd={novasCorredicas.length}
          items={novasCorredicas.map((c) => c.nome)}
        />
      </div>
      {(novasChapas.length === 0 || novosTipos.length === 0) && (
        <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 16 }}>
          ⚠ Você precisa de ao menos 1 chapa e 1 tipo de móvel para concluir.
          Volte nos passos anteriores.
        </p>
      )}
    </div>
  );
}

function ResumoItem({
  titulo,
  qtd,
  items,
}: {
  titulo: string;
  qtd: number;
  items: string[];
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border)",
        background: "var(--panel-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: qtd > 0 ? 6 : 0,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13 }}>{titulo}</span>
        <Tag label={`${qtd} cadastrado${qtd !== 1 ? "s" : ""}`} />
      </div>
      {items.length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-soft)" }}>
          {items.join(" · ")}
        </p>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

interface SettingsProps {
  config: ConfiguracaoMarcenaria;
  configBase: ConfigBase;
  setConfigBase: (c: ConfigBase) => void;
  salvarBasico: () => void;
  novaChapa: ChapaForm;
  setNovaChapa: (f: ChapaForm) => void;
  adicionarChapa: () => void;
  deletarChapa: (id: number) => void;
  novaFita: FitaForm;
  setNovaFita: (f: FitaForm) => void;
  adicionarFita: () => void;
  deletarFita: (id: number) => void;
  novoTipo: TipoForm;
  setNovoTipo: (f: TipoForm) => void;
  adicionarTipo: () => void;
  deletarTipo: (id: number) => void;
  novaCorre: CorredicaForm;
  setNovaCorre: (f: CorredicaForm) => void;
  adicionarCorre: () => void;
  deletarCorre: (id: number) => void;
  novaFerragem: FerragemForm;
  setNovaFerragem: (f: FerragemForm) => void;
  adicionarFerragem: () => void;
  deletarFerragem: (id: number) => void;
}

function SettingsConfiguracao(props: SettingsProps) {
  const { config } = props;
  const set = (k: keyof ConfigBase, v: number | string) =>
    props.setConfigBase({ ...props.configBase, [k]: v });

  function toggleComprCorre(mm: number) {
    const lista = props.novaCorre.comprimentos
      ? props.novaCorre.comprimentos.split(",").map(Number)
      : [];
    const nova = lista.includes(mm)
      ? lista.filter((x) => x !== mm)
      : [...lista, mm].sort((a, b) => a - b);
    props.setNovaCorre({ ...props.novaCorre, comprimentos: nova.join(",") });
  }
  const selecionadosCorre = props.novaCorre.comprimentos
    ? props.novaCorre.comprimentos.split(",").map(Number)
    : [];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>Configuração da Marcenaria</h1>
      </div>

      {/* Configurações básicas */}
      <SecaoCard titulo="⚙ Configurações Básicas">
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Campo label="Espessura estrutural (mm)">
            <input
              type="number"
              value={props.configBase.espEstrutura}
              onChange={(e) => set("espEstrutura", +e.target.value)}
            />
          </Campo>
          <Campo label="Espessura fundo (mm)">
            <input
              type="number"
              value={props.configBase.espFundo}
              onChange={(e) => set("espFundo", +e.target.value)}
            />
          </Campo>
          <Campo label="Folga porta/gaveta (mm)">
            <input
              type="number"
              value={props.configBase.folgaPorta}
              onChange={(e) => set("folgaPorta", +e.target.value)}
            />
          </Campo>
          <Campo label="Margem de perda (%)">
            <input
              type="number"
              value={Math.round((props.configBase.margemPerda ?? 0.1) * 100)}
              onChange={(e) => set("margemPerda", +e.target.value / 100)}
            />
          </Campo>
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={props.salvarBasico}
        >
          Salvar
        </button>
      </SecaoCard>

      {/* Chapas */}
      <SecaoCard titulo="🪵 Chapas de MDF">
        {config.chapas.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {config.chapas.map((c) => (
              <div key={c.id} style={itemStyle}>
                <span style={{ flex: 1 }}>
                  <b>{c.cor}</b> — {c.espessura} mm — R${" "}
                  {c.precoChapa.toFixed(2)}
                </span>
                <BtnIcon
                  onClick={() => props.deletarChapa(c.id)}
                  title="Remover"
                />
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <Campo label="Cor">
            <input
              placeholder="Ex: Branco TX"
              value={props.novaChapa.cor}
              onChange={(e) =>
                props.setNovaChapa({ ...props.novaChapa, cor: e.target.value })
              }
            />
          </Campo>
          <Campo label="Espessura">
            <select
              value={props.novaChapa.espessura}
              onChange={(e) =>
                props.setNovaChapa({
                  ...props.novaChapa,
                  espessura: +e.target.value,
                })
              }
            >
              <option value={18}>18 mm</option>
              <option value={6}>6 mm</option>
            </select>
          </Campo>
          <Campo label="Preço R$">
            <input
              type="number"
              step="0.01"
              value={props.novaChapa.precoChapa || ""}
              onChange={(e) =>
                props.setNovaChapa({
                  ...props.novaChapa,
                  precoChapa: +e.target.value,
                })
              }
            />
          </Campo>
          <button
            className="btn-primary"
            style={{ height: 38 }}
            onClick={props.adicionarChapa}
          >
            + Add
          </button>
        </div>
      </SecaoCard>

      {/* Fitas */}
      <SecaoCard titulo="📏 Fitas de Borda">
        {config.fitas.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {config.fitas.map((f) => (
              <div key={f.id} style={itemStyle}>
                <span style={{ flex: 1 }}>
                  <b>{f.cor}</b> — {f.largura} mm — R$ {f.precoMetro.toFixed(2)}
                  /m
                </span>
                <BtnIcon
                  onClick={() => props.deletarFita(f.id)}
                  title="Remover"
                />
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <Campo label="Cor">
            <input
              placeholder="Ex: Branco"
              value={props.novaFita.cor}
              onChange={(e) =>
                props.setNovaFita({ ...props.novaFita, cor: e.target.value })
              }
            />
          </Campo>
          <Campo label="Largura (mm)">
            <select
              value={props.novaFita.largura}
              onChange={(e) =>
                props.setNovaFita({
                  ...props.novaFita,
                  largura: +e.target.value,
                })
              }
            >
              <option value={22}>22 mm</option>
              <option value={44}>44 mm</option>
            </select>
          </Campo>
          <Campo label="R$/metro">
            <input
              type="number"
              step="0.01"
              value={props.novaFita.precoMetro || ""}
              onChange={(e) =>
                props.setNovaFita({
                  ...props.novaFita,
                  precoMetro: +e.target.value,
                })
              }
            />
          </Campo>
          <button
            className="btn-primary"
            style={{ height: 38 }}
            onClick={props.adicionarFita}
          >
            + Add
          </button>
        </div>
      </SecaoCard>

      {/* Tipos de Móvel */}
      <SecaoCard titulo="🪑 Tipos de Móvel">
        {config.tiposMovel.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {config.tiposMovel.map((t) => (
              <div key={t.id} style={itemStyle}>
                <span style={{ flex: 1 }}>
                  <b>{t.nome}</b> — {t.tipoPorta}{" "}
                  {t.tamponamentoLaterais ? "· Tamponado" : ""}
                </span>
                <BtnIcon
                  onClick={() => props.deletarTipo(t.id)}
                  title="Remover"
                />
              </div>
            ))}
          </div>
        )}
        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}
        >
          <Campo label="Nome">
            <input
              placeholder="Ex: Aéreo"
              value={props.novoTipo.nome}
              onChange={(e) =>
                props.setNovoTipo({ ...props.novoTipo, nome: e.target.value })
              }
            />
          </Campo>
          <Campo label="Tipo de Porta">
            <select
              value={props.novoTipo.tipoPorta}
              onChange={(e) =>
                props.setNovoTipo({
                  ...props.novoTipo,
                  tipoPorta: e.target.value,
                })
              }
            >
              {TIPO_PORTA_OPTS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Campo>
        </div>
        <div style={{ display: "flex", gap: 20, margin: "10px 0 12px" }}>
          {(
            [
              "tamponamentoTampo",
              "tamponamentoLaterais",
              "tamponamentoBase",
            ] as const
          ).map((k) => (
            <label
              key={k}
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
                checked={props.novoTipo[k]}
                onChange={(e) =>
                  props.setNovoTipo({
                    ...props.novoTipo,
                    [k]: e.target.checked,
                  })
                }
              />
              {k === "tamponamentoTampo"
                ? "Tampo"
                : k === "tamponamentoLaterais"
                  ? "Laterais"
                  : "Base"}
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={props.adicionarTipo}>
          + Adicionar
        </button>
      </SecaoCard>

      {/* Corrediças */}
      <SecaoCard titulo="🔧 Corrediças">
        {config.corredicas.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {config.corredicas.map((c) => (
              <div key={c.id} style={itemStyle}>
                <span style={{ flex: 1 }}>
                  <b>{c.nome}</b> — {c.tipo} — {c.descontoLarguraMm} mm desconto
                </span>
                <BtnIcon
                  onClick={() => props.deletarCorre(c.id)}
                  title="Remover"
                />
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr",
            gap: 12,
          }}
        >
          <Campo label="Nome">
            <input
              placeholder="Ex: Telescópica 300mm"
              value={props.novaCorre.nome}
              onChange={(e) =>
                props.setNovaCorre({ ...props.novaCorre, nome: e.target.value })
              }
            />
          </Campo>
          <Campo label="Tipo">
            <select
              value={props.novaCorre.tipo}
              onChange={(e) =>
                props.setNovaCorre({ ...props.novaCorre, tipo: e.target.value })
              }
            >
              <option value="TELESCOPICA">Telescópica</option>
              <option value="INVISIVEL">Invisível</option>
            </select>
          </Campo>
          <Campo label="Desconto (cm, 2 lados)">
            <input
              type="number"
              step="0.1"
              value={props.novaCorre.descontoLarguraMm / 10}
              onChange={(e) =>
                props.setNovaCorre({
                  ...props.novaCorre,
                  descontoLarguraMm: Math.round(+e.target.value * 10),
                })
              }
            />
          </Campo>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            margin: "10px 0 12px",
          }}
        >
          {COMPRIMENTOS_PADRAO.map((mm) => (
            <label
              key={mm}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={selecionadosCorre.includes(mm)}
                onChange={() => toggleComprCorre(mm)}
              />
              {mm} mm
            </label>
          ))}
        </div>
        <button className="btn-primary" onClick={props.adicionarCorre}>
          + Adicionar
        </button>
      </SecaoCard>

      {/* Ferragens */}
      <SecaoCard titulo="🔩 Ferragens">
        {config.ferragens.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {config.ferragens.map((f) => (
              <div key={f.id} style={itemStyle}>
                <span style={{ flex: 1 }}>
                  <b>{f.nome}</b> — {f.tipo} — {f.unidade} — R${" "}
                  {f.preco.toFixed(2)}
                </span>
                <BtnIcon
                  onClick={() => props.deletarFerragem(f.id)}
                  title="Remover"
                />
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
            gap: 10,
            alignItems: "end",
          }}
        >
          <Campo label="Nome">
            <input
              placeholder="Ex: Dobradiça reta 35mm"
              value={props.novaFerragem.nome}
              onChange={(e) =>
                props.setNovaFerragem({
                  ...props.novaFerragem,
                  nome: e.target.value,
                })
              }
            />
          </Campo>
          <Campo label="Tipo">
            <select
              value={props.novaFerragem.tipo}
              onChange={(e) =>
                props.setNovaFerragem({
                  ...props.novaFerragem,
                  tipo: e.target.value,
                })
              }
            >
              <option value="DOBRADICA">Dobradiça</option>
              <option value="PUXADOR">Puxador</option>
              <option value="PE">Pé</option>
              <option value="OUTRO">Outro</option>
            </select>
          </Campo>
          <Campo label="Unidade">
            <select
              value={props.novaFerragem.unidade}
              onChange={(e) =>
                props.setNovaFerragem({
                  ...props.novaFerragem,
                  unidade: e.target.value,
                })
              }
            >
              <option value="un">un</option>
              <option value="par">par</option>
            </select>
          </Campo>
          <Campo label="R$/un">
            <input
              type="number"
              step="0.01"
              value={props.novaFerragem.preco || ""}
              onChange={(e) =>
                props.setNovaFerragem({
                  ...props.novaFerragem,
                  preco: +e.target.value,
                })
              }
            />
          </Campo>
          <button
            className="btn-primary"
            style={{ height: 38 }}
            onClick={props.adicionarFerragem}
          >
            + Add
          </button>
        </div>
      </SecaoCard>
    </div>
  );
}

// ─── Campo helper ─────────────────────────────────────────────────────────────

function Campo({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 12,
          color: "var(--text-soft)",
          marginBottom: 4,
          fontWeight: 600,
        }}
      >
        {label}{" "}
        {hint && (
          <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
            ({hint})
          </span>
        )}
      </label>
      <div style={{ display: "contents" }}>{children}</div>
    </div>
  );
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px 12px",
  borderRadius: "var(--radius-sm)",
  background: "var(--panel-soft)",
  border: "1px solid var(--border)",
  marginBottom: 6,
  fontSize: 13,
};
