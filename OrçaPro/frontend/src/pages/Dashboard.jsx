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

// Registrando os componentes do gráfico
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
    const [metricas, setMetricas] = useState({
        totalClientes: 0,
        totalOrcamentos: 0,
        faturamentoTotal: 0,
        lucroTotal: 0,
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

            // A Mágica Matemática: soma todos os orçamentos e lucros
            const faturamento = orcamentosData.reduce((acc, orc) => acc + Number(orc.totalFinal), 0);
            const lucro = orcamentosData.reduce((acc, orc) => acc + Number(orc.lucroValor), 0);
            
            // Taxa de conversão: (Aprovados / Total) * 100
            const aprovados = orcamentosData.filter(orc => orc.status === 'Aprovado' || orc.status === 'Concluído').length;
            const conversao = orcamentosData.length > 0 ? (aprovados / orcamentosData.length) * 100 : 0;

            setMetricas({
                totalClientes: clientesData.length,
                totalOrcamentos: orcamentosData.length,
                faturamentoTotal: faturamento,
                lucroTotal: lucro,
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
    const statusCount = orcamentos.reduce((acc, orc) => {
        const status = orc.status || 'Pendente';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const dataStatusGrafico = {
        labels: Object.keys(statusCount),
        datasets: [{
            data: Object.values(statusCount),
            backgroundColor: ['#f1c40f', '#27ae60', '#e74c3c', '#3498db', '#95a5a6'], // Amarelo, Verde, Vermelho, Azul, Cinza
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
                    <span className="dashboard-label">Clientes Cadastrados</span>
                    <h2>{metricas.totalClientes}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Orçamentos Gerados</span>
                    <h2>{metricas.totalOrcamentos}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Taxa de Conversão</span>
                    <h2>{metricas.taxaConversao.toFixed(1)}%</h2>
                </div>
                <div className="dashboard-card highlight-primary">
                    <span className="dashboard-label">Faturamento Total</span>
                    <h2 className="text-primary">R$ {metricas.faturamentoTotal.toFixed(2)}</h2>
                </div>
                <div className="dashboard-card highlight-success">
                    <span className="dashboard-label">Lucro Estimado</span>
                    <h2 className="text-success">R$ {metricas.lucroTotal.toFixed(2)}</h2>
                </div>
            </section>

            {/* SESSÃO DE GRÁFICOS LADO A LADO */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '30px' }}>
                <section className="dashboard-card chart-section">
                    <h3 className="text-center">Projetos por Ambiente</h3>
                    {orcamentos.length > 0 ? (
                        <Bar data={dataGrafico} options={{ responsive: true, maintainAspectRatio: false }} />
                    ) : (
                        <p className="text-center text-soft">Cadastre orçamentos para visualizar o gráfico.</p>
                    )}
                </section>

                <section className="dashboard-card chart-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 className="text-center">Status dos Orçamentos</h3>
                    {orcamentos.length > 0 ? (
                        <div style={{ width: '80%', height: '300px' }}><Doughnut data={dataStatusGrafico} options={{ responsive: true, maintainAspectRatio: false }} /></div>
                    ) : (
                        <p className="text-center text-soft">Sem dados de status.</p>
                    )}
                </section>
            </div>
        </div>
    );
}