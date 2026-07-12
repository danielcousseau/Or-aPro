import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { toast } from "react-toastify";

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const userId = searchParams.get("id");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [concluido, setConcluido] = useState(false);
  const navigate = useNavigate();

  if (!token || !userId) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100dvh",
          padding: "24px 16px",
          boxSizing: "border-box",
        }}
      >
        <div
          className="cliente-card"
          style={{
            maxWidth: "400px",
            width: "100%",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <h2 style={{ color: "var(--primary)" }}>Link Inválido</h2>
          <p style={{ color: "var(--text-soft)", marginBottom: "24px" }}>
            Este link de redefinição é inválido ou expirou. Solicite um novo
            link.
          </p>
          <button
            onClick={() => navigate("/esqueci-senha")}
            style={{ width: "100%" }}
          >
            Solicitar Novo Link
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (novaSenha !== confirmar) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (novaSenha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);
    try {
      await api.post("/reset-password", { token, userId, novaSenha });
      setConcluido(true);
      toast.success("Senha redefinida com sucesso!");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string } } };
      toast.error(
        axiosError.response?.data?.error || "Link inválido ou expirado.",
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100dvh",
        padding: "24px 16px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="cliente-card"
        style={{ maxWidth: "400px", width: "100%", padding: "30px" }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "24px",
            color: "var(--primary)",
          }}
        >
          Nova Senha
        </h2>

        {concluido ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-soft)", marginBottom: "24px" }}>
              Sua senha foi redefinida com sucesso. Faça login com a nova senha.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{ width: "100%" }}
            >
              Ir para o Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <section className="form-section">
              <label>Nova Senha</label>
              <input
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                autoFocus
              />
            </section>
            <section className="form-section">
              <label>Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repita a nova senha"
                minLength={6}
                required
              />
            </section>
            <button
              type="submit"
              disabled={carregando}
              style={{
                width: "100%",
                marginTop: "8px",
                opacity: carregando ? 0.7 : 1,
                cursor: carregando ? "not-allowed" : "pointer",
              }}
            >
              {carregando ? "Salvando..." : "Redefinir Senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
