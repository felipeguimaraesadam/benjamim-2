import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const PagamentoParceladoForm = ({ 
  tipoPagamento, 
  onTipoPagamentoChange, 
  parcelas, 
  onParcelasChange,
  valorTotal,
  dataPagamento,
  onDataPagamentoChange,
  CustomDateInput
}) => {
  const [quantidadeParcelas, setQuantidadeParcelas] = useState(2);
  const [parcelasCustomizadas, setParcelasCustomizadas] = useState([]);

  useEffect(() => {
    if (tipoPagamento === 'PARCELADO' && quantidadeParcelas >= 2) {
      const valorParcela = valorTotal / quantidadeParcelas;
      const hoje = new Date();
      const novasParcelas = Array.from({ length: quantidadeParcelas }, (_, index) => {
        const dataVencimento = new Date(hoje);
        dataVencimento.setMonth(hoje.getMonth() + index + 1);
        return {
          numero: index + 1,
          valor: parseFloat(valorParcela.toFixed(2)),
          dataVencimento: dataVencimento
        };
      });
      setParcelasCustomizadas(novasParcelas);
      onParcelasChange(novasParcelas);
    } else {
      setParcelasCustomizadas([]);
      onParcelasChange([]);
    }
  }, [tipoPagamento, quantidadeParcelas, valorTotal, onParcelasChange]);

  const handleParcelaChange = (index, field, value) => {
    const novasParcelas = [...parcelasCustomizadas];
    novasParcelas[index][field] = value;
    setParcelasCustomizadas(novasParcelas);
    onParcelasChange(novasParcelas);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-white">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Forma de Pagamento</h3>
      
      <div className="space-y-4">
        <div className="flex space-x-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="UNICO"
              checked={tipoPagamento === 'UNICO'}
              onChange={(e) => onTipoPagamentoChange(e.target.value)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Pagamento Único</span>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="PARCELADO"
              checked={tipoPagamento === 'PARCELADO'}
              onChange={(e) => onTipoPagamentoChange(e.target.value)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Pagamento Parcelado</span>
          </label>
        </div>

        {tipoPagamento === 'UNICO' && CustomDateInput && (
          <div className="mt-4">
            <label htmlFor="dataPagamento" className="block text-sm font-medium text-gray-700 mb-1">
              Data de Pagamento
            </label>
            <DatePicker
              selected={dataPagamento ? new Date(dataPagamento + 'T00:00:00') : null}
              onChange={date => onDataPagamentoChange(date.toISOString().split('T')[0])}
              dateFormat="dd/MM/yyyy"
              locale="pt-BR"
              customInput={<CustomDateInput />}
            />
          </div>
        )}

        {tipoPagamento === 'PARCELADO' && (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <label className="block text-sm font-medium text-gray-700">
                Quantidade de Parcelas:
              </label>
              <select
                value={quantidadeParcelas}
                onChange={(e) => setQuantidadeParcelas(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                  <option key={num} value={num}>{num}x</option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                Valor total: {formatCurrency(valorTotal)}
              </span>
            </div>

            {parcelasCustomizadas.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800">Detalhes das Parcelas</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {parcelasCustomizadas.map((parcela, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded border border-gray-200">
                      <span className="w-20 text-sm font-medium text-gray-700">
                        {parcela.numero}ª parcela
                      </span>
                      
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Valor</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={parcela.valor}
                          onChange={(e) => handleParcelaChange(index, 'valor', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0,00"
                        />
                      </div>
                      
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">Data de Vencimento</label>
                        <DatePicker
                          selected={parcela.dataVencimento}
                          onChange={(date) => handleParcelaChange(index, 'dataVencimento', date)}
                          dateFormat="dd/MM/yyyy"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholderText="Selecione a data"
                          minDate={new Date()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-blue-800">Total das parcelas:</span>
                    <span className="font-bold text-blue-900">
                      {formatCurrency(parcelasCustomizadas.reduce((sum, p) => sum + (p.valor || 0), 0))}
                    </span>
                  </div>
                  {Math.abs(parcelasCustomizadas.reduce((sum, p) => sum + (p.valor || 0), 0) - valorTotal) > 0.01 && (
                    <div className="mt-1 text-xs text-amber-600">
                      ⚠️ A soma das parcelas não confere com o valor total da compra
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PagamentoParceladoForm;