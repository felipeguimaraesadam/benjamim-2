import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  DollarSign,
  BarChart3,
  FileText,
  Package,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  ChevronDown,
  ShoppingCart,
  Briefcase,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import * as api from '../services/api';
import fundoImage from '../assets/fundo.jpg';

// Cores para os gráficos seguindo o design system
const COLORS = {
  primary: '#2563eb',
  secondary: '#16a34a',
  accent: '#ea580c',
  warning: '#f59e0b',
  danger: '#dc2626',
  gray: '#64748b',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.warning,
];

const DashboardPage = () => {
  const [isManagementOpen, setManagementOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [errorStats, setErrorStats] = useState(null);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [isLoadingOcorrencias, setIsLoadingOcorrencias] = useState(true);
  const [chartData, setChartData] = useState({
    custos: [],
    atividade: [],
  });

  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    setErrorStats(null);
    try {
      const response = await api.getDashboardStats();
      setStats(response.data);

      // Buscar dados reais de custos por categoria
      await fetchRealChartData(response.data);
    } catch (err) {
      setErrorStats(
        err.message || 'Falha ao buscar estatísticas do dashboard.'
      );
      console.error('Fetch Dashboard Stats Error:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  const fetchRealChartData = useCallback(async statsData => {
    try {
      // Buscar dados reais de custos gerais do mês corrente
      const currentDate = new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );

      const custosResponse = await api.apiClient.get(
        '/relatorios/custo-geral/',
        {
          params: {
            data_inicio: firstDayOfMonth.toISOString().split('T')[0],
            data_fim: lastDayOfMonth.toISOString().split('T')[0],
          },
        }
      );

      // Buscar dados de atividade semanal (última semana)
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const atividadeResponse = await api.apiClient.get(
        '/relatorios/recursos-mais-utilizados/',
        {
          params: {
            inicio: lastWeekStart.toISOString().split('T')[0],
          },
        }
      );

      // Processar dados de custos reais
      const custosData = custosResponse.data;
      const custosChart = [];

      if (custosData.total_compras > 0) {
        custosChart.push({
          name: 'Compras',
          value: parseFloat(custosData.total_compras),
          color: COLORS.primary,
        });
      }

      if (custosData.total_despesas_extras > 0) {
        custosChart.push({
          name: 'Despesas Extras',
          value: parseFloat(custosData.total_despesas_extras),
          color: COLORS.secondary,
        });
      }

      // Se não há dados de custos, usar dados básicos do dashboard
      if (custosChart.length === 0 && statsData.custo_total_mes_corrente > 0) {
        custosChart.push({
          name: 'Custos Gerais',
          value: parseFloat(statsData.custo_total_mes_corrente),
          color: COLORS.primary,
        });
      }

      // Processar dados de atividade semanal
      const atividadeData = atividadeResponse.data || [];
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      const atividadeChart = [];

      // Criar dados de atividade por dia da semana
      for (let i = 0; i < 7; i++) {
        const dia = new Date(lastWeekStart);
        dia.setDate(dia.getDate() + i);
        const diaSemana = diasSemana[dia.getDay()];
        const dataFormatada = dia.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });

        // Contar funcionários e equipes ativos neste dia
        let funcionarios = 0;
        let equipes = 0;

        atividadeData.forEach(recurso => {
          if (recurso.recurso_nome.includes('Funcionário')) {
            funcionarios += Math.ceil(recurso.ocorrencias / 7); // Distribuir ao longo da semana
          } else if (recurso.recurso_nome.includes('Equipe')) {
            equipes += Math.ceil(recurso.ocorrencias / 7);
          }
        });

        atividadeChart.push({
          dia: `${diaSemana}\n${dataFormatada}`,
          funcionarios: funcionarios || 0, // Não usar dados falsos se não há dados reais
          equipes: equipes || 0,
        });
      }

      setChartData({
        custos: custosChart,
        atividade: atividadeChart,
      });
    } catch (err) {
      console.error('Erro ao buscar dados dos gráficos:', err);
      // Fallback para dados básicos se houver erro
      const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const atividadeFallback = [];
      for (let i = 0; i < 7; i++) {
        const dia = new Date(lastWeekStart);
        dia.setDate(dia.getDate() + i);
        const diaSemana = diasSemana[dia.getDay()];
        const dataFormatada = dia.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        });

        atividadeFallback.push({
          dia: `${diaSemana}\n${dataFormatada}`,
          funcionarios: 0,
          equipes: 0,
        });
      }

      setChartData({
        custos:
          statsData.custo_total_mes_corrente > 0
            ? [
                {
                  name: 'Custos Totais',
                  value: parseFloat(statsData.custo_total_mes_corrente),
                  color: COLORS.primary,
                },
              ]
            : [],
        atividade: atividadeFallback,
      });
    }
  }, []);

  const fetchOcorrencias = useCallback(async () => {
    setIsLoadingOcorrencias(true);
    try {
      const response = await api.getOcorrencias({
        ordering: '-data',
        limit: 10,
      });

      let ocorrenciasData = response.data.results || response.data || [];

      // Filtrar ocorrências dos últimos 30 dias no frontend se necessário
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTime = thirtyDaysAgo.getTime();

      ocorrenciasData = ocorrenciasData
        .filter(ocorrencia => {
          if (!ocorrencia.data) return true; // Incluir ocorrências sem data
          const ocorrenciaDate = new Date(ocorrencia.data);
          return ocorrenciaDate.getTime() >= thirtyDaysAgoTime;
        })
        .slice(0, 5); // Limitar a 5 mais recentes

      // Buscar detalhes adicionais se necessário
      const ocorrenciasEnriquecidas = await Promise.all(
        ocorrenciasData.map(async ocorrencia => {
          try {
            // Buscar detalhes da obra se tiver obra_id
            if (ocorrencia.obra && !ocorrencia.obra_nome) {
              try {
                const obraResponse = await api.getObraById(ocorrencia.obra);
                ocorrencia.obra_nome = obraResponse.data.nome_obra;
              } catch (obraErr) {
                console.warn('Erro ao buscar obra:', obraErr);
              }
            }

            // Buscar detalhes do funcionário se tiver funcionario_id
            if (ocorrencia.funcionario && !ocorrencia.funcionario_nome) {
              try {
                const funcionarioResponse = await api.getFuncionarioById(
                  ocorrencia.funcionario
                );
                ocorrencia.funcionario_nome =
                  funcionarioResponse.data.nome_completo ||
                  funcionarioResponse.data.nome;
              } catch (funcErr) {
                console.warn('Erro ao buscar funcionário:', funcErr);
              }
            }

            return ocorrencia;
          } catch (err) {
            console.warn('Erro ao buscar detalhes da ocorrência:', err);
            return ocorrencia;
          }
        })
      );

      setOcorrencias(ocorrenciasEnriquecidas);
    } catch (err) {
      console.error('Erro ao buscar ocorrências:', err);
      setOcorrencias([]);
    } finally {
      setIsLoadingOcorrencias(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchOcorrencias();
  }, [fetchStats, fetchOcorrencias]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-gray-100 font-medium">
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Carregando estatísticas...
          </p>
        </div>
      </div>
    );
  }

  if (errorStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-6 py-4 rounded-lg max-w-md">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <strong className="font-bold">Erro ao carregar estatísticas</strong>
          </div>
          <p className="mt-2">{errorStats}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.8)), url(${fundoImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Hero Section */}
      <div className="relative h-80 flex items-center justify-center">
        <div className="text-center text-white">
          <h1
            className="text-5xl md:text-6xl font-bold mb-4 text-white"
            style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)' }}
          >
            Sistema de Gerenciamento de Obras
          </h1>
          <p
            className="text-xl md:text-2xl font-light opacity-90"
            style={{ textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)' }}
          >
            Controle total dos seus projetos de construção
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Navegação Rápida */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 text-center">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Obras */}
            <Link
              to="/obras"
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <Building2 className="w-8 h-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                Obras
              </h3>
            </Link>

            {/* Compras */}
            <Link
              to="/compras"
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <ShoppingCart className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                Compras
              </h3>
            </Link>

            {/* Locações */}
            <Link
              to="/locacoes"
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <Calendar className="w-8 h-8 text-red-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                Locações
              </h3>
            </Link>

            {/* Despesas Extras */}
            <Link
              to="/despesas"
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <DollarSign className="w-8 h-8 text-yellow-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                Despesas Extras
              </h3>
            </Link>

            {/* Ocorrências */}
            <Link
              to="/ocorrencias"
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                Ocorrências
              </h3>
            </Link>

            {/* Gerenciamento Dropdown */}
            <div className="relative">
              <button
                onClick={() => setManagementOpen(!isManagementOpen)}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group w-full h-full flex flex-col items-center justify-center"
              >
                <Briefcase className="w-8 h-8 text-purple-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center">
                  Gerenciamento
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-500 dark:text-gray-400 ml-1 transition-transform ${
                    isManagementOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {isManagementOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                  <Link
                    to="/materiais"
                    className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Materiais
                  </Link>
                  <Link
                    to="/equipes"
                    className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Equipes
                  </Link>
                  <Link
                    to="/funcionarios"
                    className="block px-4 py-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Funcionários
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {stats && (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">
                      Obras Ativas
                    </p>
                    <p className="text-3xl font-bold">
                      {stats.obras_em_andamento}
                    </p>
                    <p className="text-blue-100 text-xs mt-1">Em andamento</p>
                  </div>
                  <Building2 className="w-12 h-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">
                      Funcionários
                    </p>
                    <p className="text-3xl font-bold">
                      {stats.total_funcionarios}
                    </p>
                    <p className="text-green-100 text-xs mt-1">
                      Ativos no sistema
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">
                      Custo Mensal
                    </p>
                    <p className="text-2xl font-bold">
                      R${' '}
                      {parseFloat(
                        stats.custo_total_mes_corrente
                      ).toLocaleString('pt-BR', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    <p className="text-orange-100 text-xs mt-1">Mês corrente</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-orange-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">
                      Ocorrências
                    </p>
                    <p className="text-3xl font-bold">
                      {isLoadingOcorrencias ? '...' : ocorrencias.length}
                    </p>
                    <p className="text-purple-100 text-xs mt-1">
                      Últimos 30 dias
                    </p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-purple-200" />
                </div>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Gráfico de Custos */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    Distribuição de Custos
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Custos do mês atual (compras e despesas extras)
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.custos}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.custos.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={value => [
                        `R$ ${value.toLocaleString('pt-BR')}`,
                        'Valor',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {chartData.custos.length === 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <AlertTriangle className="inline mr-1" size={16} />
                      Nenhum custo registrado para o mês atual.
                    </p>
                  </div>
                )}
              </div>

              {/* Gráfico de Atividade Semanal */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-500" />
                    Atividade Semanal
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Recursos ativos nos últimos 7 dias (baseado em locações
                    ativas)
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.atividade}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="opacity-30"
                    />
                    <XAxis
                      dataKey="dia"
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      interval={0}
                    />
                    <YAxis className="text-sm" />
                    <Tooltip
                      content={<CustomTooltip />}
                      formatter={(value, name) => [
                        value,
                        name === 'funcionarios' ? 'Funcionários' : 'Equipes',
                      ]}
                      labelFormatter={label =>
                        `Data: ${label.replace('\n', ' - ')}`
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="funcionarios"
                      stackId="1"
                      stroke={COLORS.primary}
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                      name="Funcionários"
                    />
                    <Area
                      type="monotone"
                      dataKey="equipes"
                      stackId="2"
                      stroke={COLORS.secondary}
                      fill={COLORS.secondary}
                      fillOpacity={0.6}
                      name="Equipes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {chartData.atividade &&
                  chartData.atividade.every(
                    item => item.funcionarios === 0 && item.equipes === 0
                  ) && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <AlertTriangle className="inline mr-1" size={16} />
                        Nenhuma atividade encontrada para os últimos 7 dias.
                        Isso pode indicar que não há locações ativas no período
                        ou que os dados são de períodos anteriores.
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* Painel de Ocorrências Recentes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-orange-500" />
                Ocorrências Recentes (30 dias)
              </h3>
              {isLoadingOcorrencias ? (
                <div className="flex items-center justify-center py-8">
                  <Activity className="w-6 h-6 text-blue-500 animate-spin mr-2" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Carregando ocorrências...
                  </span>
                </div>
              ) : ocorrencias.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Nenhuma ocorrência registrada nos últimos 30 dias.
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Verifique se há dados no sistema ou se a API está
                    funcionando corretamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {ocorrencias.map(ocorrencia => {
                      // Determinar cor do indicador baseado na gravidade
                      const getGravidadeColor = gravidade => {
                        switch (gravidade?.toLowerCase()) {
                          case 'alta':
                          case 'crítica':
                            return 'bg-red-500';
                          case 'média':
                          case 'moderada':
                            return 'bg-yellow-500';
                          case 'baixa':
                          case 'leve':
                            return 'bg-green-500';
                          default:
                            return 'bg-blue-500';
                        }
                      };

                      const getGravidadeBadge = gravidade => {
                        switch (gravidade?.toLowerCase()) {
                          case 'alta':
                          case 'crítica':
                            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
                          case 'média':
                          case 'moderada':
                            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
                          case 'baixa':
                          case 'leve':
                            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
                          default:
                            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
                        }
                      };

                      return (
                        <div
                          key={ocorrencia.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-3 h-3 rounded-full ${getGravidadeColor(ocorrencia.gravidade)}`}
                            ></div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800 dark:text-gray-100">
                                {ocorrencia.tipo || 'Ocorrência Registrada'}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {ocorrencia.observacao ||
                                  'Observação não informada'}
                              </p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                {ocorrencia.obra_nome && (
                                  <span className="flex items-center">
                                    <Building2 className="w-3 h-3 mr-1" />
                                    {ocorrencia.obra_nome}
                                  </span>
                                )}
                                {ocorrencia.funcionario_nome && (
                                  <span className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {ocorrencia.funcionario_nome}
                                  </span>
                                )}
                                {ocorrencia.responsavel && (
                                  <span className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {ocorrencia.responsavel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end space-y-2">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {ocorrencia.data
                                ? new Date(ocorrencia.data).toLocaleDateString(
                                    'pt-BR',
                                    {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    }
                                  )
                                : 'Data não informada'}
                            </p>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGravidadeBadge(ocorrencia.gravidade)}`}
                            >
                              {ocorrencia.gravidade || 'Normal'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 text-center">
                    <Link
                      to="/ocorrencias"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Ver Todas as Ocorrências
                    </Link>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
