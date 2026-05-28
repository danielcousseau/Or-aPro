import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import DadosGerais from "../components/Orcamento/DadosGerais";
import ListaMateriais from "../components/Orcamento/ListaMateriais";
import ResumoValores from "../components/Orcamento/ResumoValores";
import { toast } from "react-toastify";
import { mascaraMoeda, desmascararMoeda } from "../utils/masks";
import {
  OrcamentoFormData,
  MaterialSelecionado,
  Material,
  OrcamentoMaterialItem,
  FormaPagamento,
  Cliente,
  Totais,
} from "../types";

type ChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;
type FakeEvent = { target: { name: string; value: string } };

const ORCAMENTO_VAZIO: OrcamentoFormData = {
  titulo: "",
  clienteId: "",
  tipoMovel: "",
  ambiente: "",
  medidas: "",
  tipoMaoDeObra: "porcentagem",
  maoDeObraValor: "",
  maoDeObraQtde: 1,
  tipoLucro: "porcentagem",
  lucroValor: "",
  lucroQtde: 1,
  prazo: "",
  pagamento: "",
  validade: "",
  observacoes: "",
};

export default function NovoOrcamento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(!!id);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [materiaisDb, setMateriaisDb] = useState<Material[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);

  const [orcamento, setOrcamento] = useState<OrcamentoFormData>(() => {
    if (id) return ORCAMENTO_VAZIO;
    const rascunho = localStorage.getItem("rascunhoOrcamento");
    return rascunho
      ? JSON.parse(rascunho)
      : { ...ORCAMENTO_VAZIO, maoDeObraQtde: undefined };
  });

  const [materiaisSelecionados, setMateriaisSelecionados] = useState<
    MaterialSelecionado[]
  >(() => {
    if (id) return [];
    const rascunho = localStorage.getItem("rascunhoMateriais");
    return rascunho
      ? JSON.parse(rascunho)
      : [
          {
            idFalso: self.crypto?.randomUUID() || Date.now(),
            nome: "",
            valor: "",
            quantidade: 1,
          },
        ];
  });

  const [totais, setTotais] = useState<Totais>({
    materiais: 0,
    maoDeObra: 0,
    lucro: 0,
    final: 0,
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (id) {
      setCarregando(true);
      Promise.all([
        api.get("/clientes"),
        api.get("/materiais"),
        api.get(`/orcamentos/${id}`),
        api.get("/formas-pagamento").catch(() => ({ data: [] })),
      ])
        .then(([resClientes, resMateriais, resOrcamento, resFormas]) => {
          setClientes(resClientes.data);
          setMateriaisDb(resMateriais.data);
          setFormasPagamento(resFormas.data || []);

          const data = resOrcamento.data;
          setOrcamento({
            titulo: data.titulo || "",
            clienteId: data.clienteId || "",
            tipoMovel: data.tipoMovel || "",
            ambiente: data.ambiente || "",
            medidas: data.medidas || "",
            tipoMaoDeObra: data.tipoMaoDeObra || "porcentagem",
            maoDeObraValor:
              data.tipoMaoDeObra === "fixo"
                ? mascaraMoeda(data.maoDeObraValor)
                : data.maoDeObraValor || 0,
            maoDeObraQtde: data.maoDeObraQtde || 1,
            tipoLucro: data.tipoLucro || "porcentagem",
            lucroValor:
              data.tipoLucro === "fixo"
                ? mascaraMoeda(data.lucroValor)
                : data.lucroValor || 0,
            lucroQtde: data.lucroQtde || 1,
            prazo: data.prazo || "",
            pagamento: data.pagamento || "",
            validade: data.validade || "",
            observacoes: data.observacoes || "",
          });

          if (data.materiais && data.materiais.length > 0) {
            setMateriaisSelecionados(
              data.materiais.map((m: OrcamentoMaterialItem) => ({
                idFalso: m.id || Date.now() + Math.random(),
                id: m.id,
                materialId: m.materialId ?? null,
                nome: m.nome,
                valor: mascaraMoeda(m.valor),
                quantidade: m.quantidade || 1,
              })),
            );
          }
          setCarregando(false);
        })
        .catch(() => {
          toast.error("Erro ao carregar orçamento para edição.");
          navigate("/historico");
        });
    } else {
      api.get("/clientes").then((res) => setClientes(res.data));
      api.get("/materiais").then((res) => setMateriaisDb(res.data));
      api
        .get("/formas-pagamento")
        .then((res) => setFormasPagamento(res.data))
        .catch(() => {});
      setCarregando(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    const custoMateriais = materiaisSelecionados.reduce(
      (acc, mat) => acc + desmascararMoeda(mat.valor) * mat.quantidade,
      0,
    );

    let valorMaoDeObra = 0;
    const valorBase = desmascararMoeda(orcamento.maoDeObraValor);
    const qtde = Number(orcamento.maoDeObraQtde) || 1;

    if (orcamento.tipoMaoDeObra === "fixo") {
      valorMaoDeObra = valorBase;
    } else if (orcamento.tipoMaoDeObra === "porcentagem") {
      valorMaoDeObra = custoMateriais * (valorBase / 100);
    } else if (orcamento.tipoMaoDeObra === "multiplicador") {
      valorMaoDeObra = Math.max(0, custoMateriais * valorBase - custoMateriais);
    } else {
      valorMaoDeObra = valorBase * qtde;
    }

    let valorLucro = 0;
    const subtotal = custoMateriais + valorMaoDeObra;
    const lucroBase = desmascararMoeda(orcamento.lucroValor);
    const lucroQtdeNum = Number(orcamento.lucroQtde) || 1;

    if (orcamento.tipoLucro === "fixo") {
      valorLucro = lucroBase;
    } else if (orcamento.tipoLucro === "porcentagem") {
      valorLucro = subtotal * (lucroBase / 100);
    } else if (orcamento.tipoLucro === "multiplicador") {
      valorLucro = Math.max(0, subtotal * lucroBase - subtotal);
    } else {
      valorLucro = lucroBase * lucroQtdeNum;
    }

    setTotais({
      materiais: custoMateriais,
      maoDeObra: valorMaoDeObra,
      lucro: valorLucro,
      final: custoMateriais + valorMaoDeObra + valorLucro,
    });
  }, [orcamento, materiaisSelecionados]);

  useEffect(() => {
    if (!id)
      localStorage.setItem("rascunhoOrcamento", JSON.stringify(orcamento));
  }, [orcamento, id]);

  useEffect(() => {
    if (!id)
      localStorage.setItem(
        "rascunhoMateriais",
        JSON.stringify(materiaisSelecionados),
      );
  }, [materiaisSelecionados, id]);

  const handleChange = (e: ChangeEvent | FakeEvent) => {
    const { name, value } = e.target;
    let novoValor: string | number = value;
    if (name === "maoDeObraValor" && orcamento.tipoMaoDeObra === "fixo")
      novoValor = mascaraMoeda(value);
    if (name === "lucroValor" && orcamento.tipoLucro === "fixo")
      novoValor = mascaraMoeda(value);
    setOrcamento((prev) => ({ ...prev, [name]: novoValor }));
  };

  const adicionarLinhaMaterial = () => {
    setMateriaisSelecionados([
      ...materiaisSelecionados,
      {
        idFalso: self.crypto?.randomUUID() || Date.now(),
        nome: "",
        valor: "",
        quantidade: 1,
      },
    ]);
  };

  const removerLinhaMaterial = (idFalso: string | number) => {
    setMateriaisSelecionados(
      materiaisSelecionados.filter((m) => m.idFalso !== idFalso),
    );
  };

  const atualizarMaterialSelecionado = (
    idFalso: string | number,
    campo: string,
    valor: string,
  ) => {
    const novaLista = materiaisSelecionados.map((mat) => {
      if (mat.idFalso === idFalso) {
        let novoMat = { ...mat, [campo]: valor };
        if (campo === "valor") novoMat.valor = mascaraMoeda(valor);
        if (campo === "selectDb") {
          if (valor !== "") {
            const materialDoBanco = materiaisDb.find(
              (m) => m.id === Number(valor),
            );
            if (materialDoBanco) {
              novoMat.nome = materialDoBanco.nome;
              novoMat.valor = mascaraMoeda(materialDoBanco.valor);
              novoMat.materialId = materialDoBanco.id;
            }
          } else {
            novoMat.materialId = null;
          }
        }
        return novoMat;
      }
      return mat;
    });
    setMateriaisSelecionados(novaLista);
  };

  const salvarOrcamento = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (salvando) return;

    if (!orcamento.clienteId) {
      toast.warn("Selecione um cliente antes de gerar o orçamento!");
      return;
    }

    setSalvando(true);

    const dadosParaEnviar = {
      ...orcamento,
      maoDeObraValor: desmascararMoeda(orcamento.maoDeObraValor),
      lucroValor: desmascararMoeda(orcamento.lucroValor),
      totalFinal: totais.final,
      materiais: materiaisSelecionados
        .filter((m) => m.nome !== "")
        .map((m) => ({
          ...(m.id ? { id: m.id } : {}),
          nome: m.nome,
          valor: desmascararMoeda(m.valor),
          quantidade: Number(m.quantidade) || 1,
          materialId: m.materialId ?? null,
        })),
    };

    try {
      const response = id
        ? await api.put(`/orcamentos/${id}`, dadosParaEnviar)
        : await api.post("/orcamentos", dadosParaEnviar);

      const alertas: string[] = response.data.alertasEstoque || [];
      if (alertas.length > 0) {
        toast.warn(`Estoque baixo após salvar: ${alertas.join(", ")}`);
      }

      if (id) {
        toast.success("Orçamento atualizado com sucesso!");
      } else {
        toast.success("Orçamento gerado e salvo de forma segura!");
      }
      localStorage.removeItem("rascunhoOrcamento");
      localStorage.removeItem("rascunhoMateriais");
      navigate("/historico");
    } catch {
      toast.error("Falha de comunicação com o servidor. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div
        className="container text-center"
        style={{ marginTop: "40px", padding: "40px" }}
      >
        <h2 className="text-primary">Carregando Orçamento...</h2>
        <p className="text-soft">Buscando informações no banco de dados.</p>
      </div>
    );
  }

  return (
    <div>
      <h1>{id ? "Editar Orçamento" : "Novo Orçamento"}</h1>

      <form onSubmit={salvarOrcamento}>
        <DadosGerais
          orcamento={orcamento}
          clientes={clientes}
          onChange={handleChange}
        />
        <ListaMateriais
          materiaisSelecionados={materiaisSelecionados}
          materiaisDb={materiaisDb}
          onAdd={adicionarLinhaMaterial}
          onRemove={removerLinhaMaterial}
          onUpdate={atualizarMaterialSelecionado}
        />
        <ResumoValores
          orcamento={orcamento}
          totais={totais}
          formasPagamento={formasPagamento}
          onChange={handleChange}
        />

        <div className="form-buttons">
          <button
            type="submit"
            disabled={salvando}
            style={{
              opacity: salvando ? 0.7 : 1,
              cursor: salvando ? "not-allowed" : "pointer",
              fontSize: "1.1rem",
              padding: "16px 24px",
            }}
          >
            {salvando
              ? "Salvando..."
              : id
                ? "Atualizar Orçamento Salvo"
                : "Gerar e Salvar Orçamento"}
          </button>
          {id && (
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/historico")}
            >
              Cancelar Edição
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
