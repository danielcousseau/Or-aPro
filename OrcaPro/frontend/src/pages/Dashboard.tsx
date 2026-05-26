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
import { Orcamento } from '../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface Metricas {
    projetosFechados: number;
    orcamentosPendentes: number;
    valorAguardando: number;
    faturamentoConfirmado: number;
    lucroProjetado: number;
    taxaConversao: number;
}

const CORES_STATUS: Record<string, string> = {
    'Aguardando': '#f39c12',
    'Aprovado':   '#3498db',
    'Produção':   '#9b59b6',
    'Instalação': '#e67e22',
    'Entregue':   '#27ae60'
};

export default function Dashboard() {
    const [metricas, setMetricas] = useState<Metricas>({
        projetosFechados: 0,
        orcamentosPendentes: 0,
        valorAguardando: 0,
        faturamentoConfirmado: 0,
        lucroProjetado: 0,
        taxaConversao: 0
    });

    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const [, resOrcamentos] = await Promise.all([
                api.get('/clientes'),
                api.get('/orcamentos')
            ]);

            const orcamentosData: Orcamento[] = resOrcamentos.data;
            setOrcamentos(orcamentosData);

            const statusFechados = ['Aprovado', 'Produção', 'Instalação', 'Entregue'];
            const fechados = orcamentosData.filter(orc => statusFechados.includes(orc.status ?? ''));
            const pendentes = orcamentosData.filter(orc => !orc.status || orc.status === 'Aguardando' || orc.status === 'analise');

            const faturamento = fechados.reduce((acc, orc) => acc + Number(orc.totalFinal), 0);

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
                    const subtotal = final / (lucroBase || 1);
                    lucroReal = final - subtotal;
                } else {
                    const qtde = Number(orc.lucroQtde) || 1;
                    lucroReal = lucroBase * qtde;
                }
                return acc + Math.max(0, lucroReal);
            }, 0);

            const valorNaMesa = pendentes.reduce((acc, orc) => acc + Number(orc.totalFinal), 0);
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

    const ambientes = orcamentos.reduce<Record<string, number>>((acc, orc) => {
        const amb = orc.ambiente || 'Não Informado';
        acc[amb] = (acc[amb] || 0) + 1;
        return acc;
    }, {});

    const ambientesOrdenados = Object.entries(ambientes).sort((a, b) => b[1] - a[1]);

    const dataGrafico = {
        labels: ambientesOrdenados.map(([k]) => k),
        datasets: [{
            label: 'Projetos',
            data: ambientesOrdenados.map(([, v]) => v),
            backgroundColor: 'rgba(0, 86, 163, 0.8)',
            borderColor: '#0056A3',
            borderWidth: 2,
            borderRadius: 6,
        }],
    };

    const statusCount = orcamentos.reduce<Record<string, number>>((acc, orc) => {
        const status = (!orc.status || orc.status === 'analise') ? 'Aguardando' : orc.status;
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

            <div className="bento-grid">
                {/* Linha 1 */}
                <div className="dashboard-card bento-span-2 bento-card-featured highlight-primary">
                    <span className="dashboard-label">Faturamento Confirmado</span>
                    <h2 className="text-primary">{formatarMoeda(metricas.faturamentoConfirmado)}</h2>
                </div>
                <div className="dashboard-card highlight-success">
                    <span className="dashboard-label">Lucro Projetado</span>
                    <h2 className="text-success">{formatarMoeda(metricas.lucroProjetado)}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Taxa de Conversão</span>
                    <h2>{metricas.taxaConversao.toFixed(1)}%</h2>
                </div>

                {/* Linha 2 */}
                <div className="dashboard-card">
                    <span className="dashboard-label">Projetos Fechados</span>
                    <h2>{metricas.projetosFechados}</h2>
                </div>
                <div className="dashboard-card">
                    <span className="dashboard-label">Orçamentos Pendentes</span>
                    <h2>{metricas.orcamentosPendentes}</h2>
                </div>
                <div className="dashboard-card bento-span-2" style={{ borderLeft: '4px solid #f39c12' }}>
                    <span className="dashboard-label">Valor em Negociação</span>
                    <h2 style={{ color: '#f39c12' }}>{formatarMoeda(metricas.valorAguardando)}</h2>
                </div>

                {/* Linha 3 — Gráficos */}
                <div className="dashboard-card bento-span-3">
                    <h3>Projetos por Ambiente</h3>
                    {orcamentos.length > 0 ? (
                        <div style={{ position: 'relative', height: `${Math.max(200, ambientesOrdenados.length * 48)}px`, width: '100%' }}>
                            <Bar data={dataGrafico} options={{
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: { x: { ticks: { precision: 0 } } }
                            }} />
                        </div>
                    ) : (
                        <p className="text-center text-soft">Cadastre orçamentos para visualizar o gráfico.</p>
                    )}
                </div>
                <div className="dashboard-card">
                    <h3 className="text-center">Status dos Orçamentos</h3>
                    {orcamentos.length > 0 ? (
                        <div style={{ position: 'relative', height: '280px', width: '100%', maxWidth: '320px', margin: '0 auto' }}>
                            <Doughnut data={dataStatusGrafico} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    ) : (
                        <p className="text-center text-soft">Sem dados de status.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
