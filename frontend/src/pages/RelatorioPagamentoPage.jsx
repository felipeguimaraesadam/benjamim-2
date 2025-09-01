import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RelatorioPagamento from '../components/relatorios/RelatorioPagamento';

const RelatorioPagamentoPage = () => {
  const { tipoRelatorio } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <RelatorioPagamento
      tipoRelatorio={tipoRelatorio}
      onClose={handleClose}
    />
  );
};

export default RelatorioPagamentoPage;
