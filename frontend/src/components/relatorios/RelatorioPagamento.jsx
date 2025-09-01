import React, { useState, useEffect } from 'react';
import { getStartOfWeek, formatDateToYYYYMMDD, formatDateToDMY } from '../../utils/dateUtils';
import * as api from '../../services/api';
import SpinnerIcon from '../utils/SpinnerIcon';
import { toast } from 'react-toastify';

const RelatorioPagamento = ({ tipoRelatorio, onClose }) => {
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [preCheckData, setPreCheckData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtroLocacao, setFiltroLocacao] = useState('todos');
  const [expandedCompra, setExpandedCompra] = useState(null);

  const weekOptions = [
    { label: 'Esta Semana', value: 0 },
    { label: 'Semana Passada', value: -1 },
    { label: '2 Semanas Atrás', value: -2 },
    { label: '3 Semanas Atrás', value: -3 },
  ];

  const handleWeekSelectorChange = event => {
    const selectedWeekOffset = parseInt(event.target.value, 10);
    if (isNaN(selectedWeekOffset)) return;

    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today, 1);

    const targetMonday = new Date(startOfCurrentWeek);
    targetMonday.setDate(startOfCurrentWeek.getDate() + selectedWeekOffset * 7);

    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    setStartDate(formatDateToYYYYMMDD(targetMonday));
    setEndDate(formatDateToYYYYMMDD(targetSunday));
  };

  const handlePreCheck = async () => {
    if (!startDate || !endDate) {
      toast.warn('Por favor, selecione as datas de início e fim.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const params = { start_date: startDate, end_date: endDate, tipo: tipoRelatorio, filtro_locacao: filtroLocacao };
      const response = await api.getRelatorioPagamentoPreCheck(params);
      setPreCheckData(response.data);
      setStep(2);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Falha ao realizar pré-verificação.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { start_date: startDate, end_date: endDate, tipo: tipoRelatorio, filtro_locacao: filtroLocacao };
      const response = await api.generateRelatorioPagamento(params);
      setReportData(response.data);
      setStep(3);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Falha ao gerar relatório.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { start_date: startDate, end_date: endDate, tipo: tipoRelatorio, filtro_locacao: filtroLocacao };
      const response = await api.generateRelatorioPagamentoPDF(params);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `relatorio_pagamento_${tipoRelatorio}_${startDate}_a_${endDate}.pdf`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Relatório PDF gerado!');
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Falha ao gerar PDF do relatório.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const toggleCompraItems = (compraId) => {
    setExpandedCompra(expandedCompra === compraId ? null : compraId);
  };

  const renderComprasReport = () => (
    <div>
      {reportData.fornecedores_pagamentos && reportData.fornecedores_pagamentos.length > 0 ? (
        reportData.fornecedores_pagamentos.map(fornecedor => (
          <div key={fornecedor.fornecedor_nome} className="mb-6 p-3 border rounded-md">
            <h4 className="text-lg font-semibold text-blue-600 mb-2">
              {fornecedor.fornecedor_nome} - Total: {formatCurrency(fornecedor.total_a_pagar_periodo)}
            </h4>
            {fornecedor.detalhes_por_obra.map(obra => (
              <div key={obra.obra_id} className="mb-3 pl-3 border-l-2">
                <h5 className="text-md font-semibold text-gray-700">
                  Obra: {obra.obra_nome} - Total: {formatCurrency(obra.total_a_pagar_obra)}
                </h5>
                <table className="min-w-full text-xs mt-1">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Data Pag.</th>
                      <th className="px-2 py-1 text-left">Nota Fiscal</th>
                      <th className="px-2 py-1 text-left">Forma Pag.</th>
                      <th className="px-2 py-1 text-right">Valor (R$)</th>
                      <th className="px-2 py-1 text-center">Itens</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obra.compras_na_obra.map(compra => (
                      <React.Fragment key={compra.compra_id}>
                        <tr className="border-b">
                          <td className="px-2 py-1">{formatDateToDMY(compra.data_pagamento)}</td>
                          <td className="px-2 py-1">{compra.nota_fiscal}</td>
                          <td className="px-2 py-1">{compra.forma_pagamento} ({compra.numero_parcelas}x)</td>
                          <td className="px-2 py-1 text-right">{formatCurrency(compra.valor_total_liquido)}</td>
                          <td className="px-2 py-1 text-center">
                            <button onClick={() => toggleCompraItems(compra.compra_id)} className="text-blue-500 hover:underline">
                              {expandedCompra === compra.compra_id ? 'Ocultar' : 'Ver'}
                            </button>
                          </td>
                        </tr>
                        {expandedCompra === compra.compra_id && (
                          <tr>
                            <td colSpan="5" className="p-2 bg-gray-50">
                              <h6 className="font-semibold text-xs mb-1">Itens da Compra:</h6>
                              <ul className="list-disc pl-5">
                                {compra.itens.map(item => (
                                  <li key={item.id} className="text-xs">
                                    {item.quantidade}x {item.material.nome} @ {formatCurrency(item.valor_unitario)} = {formatCurrency(item.valor_total_item)}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>Nenhum pagamento de compra encontrado para o período selecionado.</p>
      )}
      {reportData.fornecedores_pagamentos && reportData.fornecedores_pagamentos.length > 0 && (
        <div className="mt-4 pt-2 border-t text-right">
          <p className="text-lg font-bold">
            Total Geral do Relatório: {formatCurrency(reportData.total_geral_periodo)}
          </p>
        </div>
      )}
    </div>
  );

  const renderLocacoesReport = () => (
    <div>
      {reportData.recursos_pagamentos.length > 0 ? (
        reportData.recursos_pagamentos.map(recurso => (
          <div key={recurso.recurso_nome} className="mb-6 p-3 border rounded-md">
            <h4 className="text-lg font-semibold text-blue-600 mb-2">
              {recurso.recurso_nome} - Total: {formatCurrency(recurso.total_a_pagar_periodo)}
            </h4>
            {recurso.detalhes_por_obra.map(obra => (
              <div key={obra.obra_id} className="mb-3 pl-3 border-l-2">
                <h5 className="text-md font-semibold text-gray-700">
                  Obra: {obra.obra_nome} - Total: {formatCurrency(obra.total_a_pagar_obra)}
                </h5>
                <table className="min-w-full text-xs mt-1">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Data Serviço</th>
                      <th className="px-2 py-1 text-left">Tipo Pag.</th>
                      <th className="px-2 py-1 text-left">Observações</th>
                      <th className="px-2 py-1 text-right">Valor (R$)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obra.locacoes_na_obra.map(loc => (
                      <tr key={loc.locacao_id} className="border-b">
                        <td className="px-2 py-1">{formatDateToDMY(loc.data_servico)}</td>
                        <td className="px-2 py-1">{loc.tipo_pagamento}</td>
                        <td className="px-2 py-1">{loc.observacoes}</td>
                        <td className="px-2 py-1 text-right">{formatCurrency(loc.valor_atribuido)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>Nenhum pagamento de locação encontrado para o período e filtros selecionados.</p>
      )}
      {reportData.recursos_pagamentos.length > 0 && (
        <div className="mt-4 pt-2 border-t text-right">
          <p className="text-lg font-bold">
            Total Geral do Relatório: {formatCurrency(reportData.total_geral_periodo)}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Relatório de Pagamento de {tipoRelatorio === 'compras' ? 'Compras' : 'Locações'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
          >
            &times;
          </button>
        </div>

        {error && <p className="text-red-500 dark:text-red-400 text-sm mb-3">{error}</p>}

        {step === 1 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Passo 1: Selecionar Semana</h3>
            <div className="mb-4">
              <label htmlFor="weekSelector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Selecionar Semana:
              </label>
              <select
                id="weekSelector"
                onChange={handleWeekSelectorChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                defaultValue=""
              >
                <option value="" disabled>Escolha uma semana...</option>
                {weekOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Data de Fim
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                />
              </div>
            </div>
            {tipoRelatorio === 'locacoes' && (
              <div className="mb-4">
                <label htmlFor="filtroLocacao" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filtrar Locações por:
                </label>
                <select
                  id="filtroLocacao"
                  value={filtroLocacao}
                  onChange={e => setFiltroLocacao(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="servicos">Serviços Externos</option>
                  <option value="funcionarios_e_equipes">Funcionários e Equipes</option>
                </select>
              </div>
            )}
            <button
              onClick={handlePreCheck}
              disabled={isLoading || !startDate || !endDate}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2 inline" /> : null}
              Verificar Pendências
            </button>
          </div>
        )}

        {step === 2 && preCheckData && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Passo 2: Pré-visualização</h3>
            {preCheckData.dias_sem_registros.length > 0 ? (
              <div className="p-4 mb-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                <p className="font-bold mb-1">Atenção!</p>
                <p>Os seguintes dias não possuem pagamentos registrados:</p>
                <ul className="list-disc list-inside">
                  {preCheckData.dias_sem_registros.map(day => (
                    <li key={day}>{formatDateToDMY(day)}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
                Nenhuma pendência encontrada. Todos os dias no período selecionado possuem registros.
              </p>
            )}
            <div className="flex justify-end space-x-3 mt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                Voltar
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={isLoading}
                className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg"
              >
                {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2 inline" /> : null}
                Gerar Relatório
              </button>
            </div>
          </div>
        )}

        {step === 3 && reportData && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Passo 3: Relatório Final</h3>
            <div className="overflow-x-auto">
              {tipoRelatorio === 'compras' ? renderComprasReport() : renderLocacoesReport()}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setStep(2)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md">
                Voltar
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={isLoading}
                className="px-4 py-2 bg-red-500 text-white rounded-md"
              >
                {isLoading ? <SpinnerIcon className="w-5 h-5 mr-2 inline" /> : null}
                Gerar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RelatorioPagamento;
