import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatarMoeda } from '../utils/format';

// Registrando os componentes do gráfico
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
    const [metricas, setMetricas] = useState({
        projetosFechados: 0,
        orcamentosPendentes: 0,
        valorAguardando: 0,
        faturamentoConfirmado: 0,
        lucroProjetado: 0,
        taxaConversao: 0
    });

    const [orcamentos, setOrcamentos] = useState([]);

    // Busca tudo do backend assim que a tela carrega
    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            // Promise.all faz as duas buscas ao mesmo tempo pra ficar mais rápido
            const [resClientes, resOrcamentos] = await Promise.all([
                api.get('/clientes'),
                api.get('/orcamentos')
            ]);

            const clientesData = resClientes.data;
            const orcamentosData = resOrcamentos.data;

            setOrcamentos(orcamentosData);

            // STATUS REAIS DO KANBAN:
            const statusFechados = ['Aprovado', 'Produção', 'Instalação', 'Entregue'];
            
            // SEPARA OS ORÇAMENTOS POR REALIDADE COMERCIAL
            const fechados = orcamentosData.filter(orc => statusFechados.includes(orc.status));
            const pendentes = orcamentosData.filter(orc => !orc.status || orc.status === 'Aguardando');

            // A MÁGICA: Só soma faturamento e lucro do que virou negócio (projetos fechados)
            const faturamento = fechados.reduce((acc, orc) => acc + Number(orc.totalFinal), 0);
            
            // [Bugfix] Extrai o lucro real (R$) do Valor Final com base na regra de precificação usada
            const lucro = fechados.reduce((acc, orc) => {
                const lucroBase = Number(orc.lucroValor) || 0;
                const final = Number(orc.totalFinal) || 0;
                let lucroReal = 0;

                if (orc.tipoLucro === 'fixo') {
                    lucroReal = lucroBase;
                } else if (orc.tipoLucro === 'porcentagem') {
                    const subtotal = final / (1 + (lucroBase / 100));
                    lucroReal = final - subtotal;
                } else if (orc.tipoLucro === 'multiplicador') {
                    const subtotal = final / (lucroBase || 1); // Evita divisão por zero
                    lucroReal = final - subtotal;
                } else { // diária ou hora
                    const qtde = Number(orc.lucroQtde) || 1;
                    lucroReal = lucroBase * qtde;
                }
                return acc + Math.max(0, lucroReal); // Evita mostrar lucros negativos caso ocorra anomalia
            }, 0);
            
            // Valor na mesa: Quanto de dinheiro o marceneiro tá esperando os clientes aprovarem?
            const valorNaMesa = pendentes.reduce((acc, orc) => acc + Number(orc.totalFinal), 0);
            
            // Taxa de conversão: (Fechados / Total de Orçamentos) * 100
            const conversao = orcamentosData.length > 0 ? (fechados.length / orcamentosData.length) * 100 : 0;

            setMetricas({
                projetosFechados: fechados.length,
                orcamentosPendentes: pendentes.length,
                valorAguardando: valorNaMesa,
                faturamentoConfirmado: faturamento,
                lucroProjetado: lucro,
                taxaConversao: conversao
            });

        } catch (error) {
            console.error("Erro ao carregar dashboard", error);
        }
    };

    // Montando os dados para o Gráfico (Separando orçamentos por Ambiente)
    const ambientes = orcamentos.reduce((acc, orc) => {
        const amb = orc.ambiente || 'Não Informado';
        acc[amb] = (acc[amb] || 0) + 1;
        return acc;
    }, {});

    const dataGrafico = {
        labels: Object.keys(ambientes),
        datasets: [
            {
                label: 'Quantidade de Projetos',
                data: Object.values(ambientes),
                backgroundColor: 'rgba(0, 86, 163, 0.8)', /* Azul OrçaPro com transparência */
                borderColor: '#0056A3', /* Azul OrçaPro sólido */
                borderWidth: 2,
                borderRadius: 6, /* Arredondamento moderno nas barras */
            },
        ],
    };

    // Montando dados para o Gráfico de Status (Doughnut)
    // Agora associando uma cor FIXA para cada status para não embaralhar visualmente
    const CORES_STATUS = {
        'Aguardando': '#f39c12', // Laranja/Amarelado (Na mesa)
        'Aprovado': '#3498db',   // Azul (Fechado, vai começar)
        'Produção': '#9b59b6',   // Roxo (Mão na massa)
        'Instalação': '#e67e22', // Laranja Escuro (Na rua)
        'Entregue': '#27ae60'    // Verde (Sucesso/Dinheiro no bolso)
    };

    const statusCount = orcamentos.reduce((acc, orc) => {
        const status = orc.status || 'Aguardando';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const dataStatusGrafico = {
        labels: Object.keys(statusCount),
        datasets: [{
            data: Object.values(statusCount),
            backgroundColor: Object.keys(statusCount).map(status => CORES_STATUS[status] || '#95a5a6'),
            borderWidth: 1,
        }]
    };

    return (
        <div>
            <section className="dashboard-hero">
                <div>
                    <h1>Dashboard Gerencial</h1>
                    <p className="dashboard-subtitle">Acompanhe as métricas e o desempenho geral dos seus projetos.</p>
                </div>
            </section>

            {/* CARDS DE RESUMO */}
            <section className="dashboard-grid">
                <div className="dashboard-card">
                    <span className="dashboard-label">Projetos Fechados</span>
                    <h2>{metricas.projetosFechados}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Orçamentos Pendentes</span>
                    <h2>{metricas.orcamentosPendentes}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Taxa de Conversão</span>
                    <h2>{metricas.taxaConversao.toFixed(1)}%</h2>
                </div>
                <div className="dashboard-card" style={{ borderLeft: '4px solid #f39c12' }}>
                    <span className="dashboard-label">Valor em Negociação</span>
                    <h2 style={{ color: '#f39c12' }}>{formatarMoeda(metricas.valorAguardando)}</h2>
                </div>
                <div className="dashboard-card highlight-primary">
                    <span className="dashboard-label">Faturamento Confirmado</span>
                    <h2 className="text-primary">{formatarMoeda(metricas.faturamentoConfirmado)}</h2>
                </div>
                <div className="dashboard-card highlight-success">
                    <span className="dashboard-label">Lucro Projetado</span>
                    <h2 className="text-success">{formatarMoeda(metricas.lucroProjetado)}</h2>
                </div>
            </section>

            {/* SESSÃO DE GRÁFICOS LADO A LADO */}
            <div className="dashboard-grid-2">
                <section className="dashboard-card">
                    <h3 className="text-center">Projetos por Ambiente</h3>
                    {orcamentos.length > 0 ? (
                        <div style={{ position: 'relative', height: '280px', width: '100%' }}>
                            <Bar data={dataGrafico} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    ) : (
                        <p className="text-center text-soft">Cadastre orçamentos para visualizar o gráfico.</p>
                    )}
                </section>

                <section className="dashboard-card">
                    <h3 className="text-center">Status dos Orçamentos</h3>
                    {orcamentos.length > 0 ? (
                        <div style={{ position: 'relative', height: '280px', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                            <Doughnut data={dataStatusGrafico} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    ) : (
                        <p className="text-center text-soft">Sem dados de status.</p>
                    )}
                </section>
            </div>
        </div>
    );
}