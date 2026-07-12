import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { User } from "../types";

interface MenuProps {
  user: User | null;
  avatarUrl: string | null;
  onLogout: () => void;
}

export default function Menu({ user, avatarUrl, onLogout }: MenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const perfilRef = useRef<HTMLDivElement>(null);

  // Fecha o menu deslizante sempre que a rota muda (ao clicar num link)
  useEffect(() => {
    setDrawerAberto(false);
  }, [location.pathname]);

  // Fecha o menu deslizante com a tecla Esc
  useEffect(() => {
    if (!drawerAberto) return;
    function handleEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerAberto(false);
    }
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [drawerAberto]);

  const isActive = (path: string): string => {
    const active =
      location.pathname === path ||
      (path === "/orcamento" && location.pathname.startsWith("/orcamento"));
    return active ? "menu-active" : "";
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        perfilRef.current &&
        !perfilRef.current.contains(event.target as Node)
      ) {
        setPerfilAberto(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPerfilAberto(false);
    }
    if (perfilAberto) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [perfilAberto]);

  return (
    <nav className="menu no-print">
      <button
        className="menu-hamburguer"
        onClick={() => setDrawerAberto(true)}
        aria-label="Abrir menu"
        aria-expanded={drawerAberto}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <Link to="/" className="menu-logo">
        <img src="/icon-192.png" alt="OrçaPro" />
        <span className="menu-logo-text">
          <span style={{ color: "#8B6035" }}>Orça</span>
          <span style={{ color: "#2C2C2C" }}>Pro</span>
        </span>
      </Link>

      {drawerAberto && (
        <div
          className="menu-backdrop"
          onClick={() => setDrawerAberto(false)}
          aria-hidden="true"
        />
      )}

      <div className={`menu-links ${drawerAberto ? "menu-links-aberto" : ""}`}>
        <button
          className="menu-drawer-close"
          onClick={() => setDrawerAberto(false)}
          aria-label="Fechar menu"
        >
          ✕
        </button>
        <Link to="/" className={isActive("/")}>
          Dashboard
        </Link>
        <Link to="/clientes" className={isActive("/clientes")}>
          Clientes
        </Link>
        <Link to="/materiais" className={isActive("/materiais")}>
          Materiais
        </Link>
        <Link to="/orcamento" className={isActive("/orcamento")}>
          Novo Orçamento
        </Link>
        <Link to="/corte" className={isActive("/corte")}>
          Corte &amp; Peças
        </Link>
        <Link to="/historico" className={isActive("/historico")}>
          Histórico
        </Link>
        <Link to="/kanban" className={isActive("/kanban")}>
          Produção
        </Link>
        <Link to="/financeiro" className={isActive("/financeiro")}>
          Financeiro
        </Link>
        <Link to="/marcenaria" className={isActive("/marcenaria")}>
          Marcenaria
        </Link>
      </div>

      {user && (
        <div className="menu-user" ref={perfilRef}>
          <button
            className="menu-user-btn"
            onClick={() => setPerfilAberto(!perfilAberto)}
            title="Meu Perfil"
          >
            <div className="menu-user-avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : user.nome ? (
                user.nome.charAt(0).toUpperCase()
              ) : (
                "U"
              )}
            </div>
            <div className="menu-user-name">
              <strong>{user.nome || user.usuario}</strong>
              <span>@{user.usuario}</span>
            </div>
          </button>

          {perfilAberto && (
            <div className="menu-user-dropdown">
              <button
                onClick={() => {
                  setPerfilAberto(false);
                  navigate("/perfil");
                }}
                className="btn-edit"
                style={{
                  width: "100%",
                  minHeight: "auto",
                  padding: "10px",
                  fontSize: "0.85rem",
                  marginBottom: "8px",
                }}
              >
                Editar Perfil
              </button>
              <button
                onClick={onLogout}
                className="btn-delete"
                style={{
                  width: "100%",
                  minHeight: "auto",
                  padding: "10px",
                  fontSize: "0.85rem",
                }}
              >
                Sair do Sistema
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
