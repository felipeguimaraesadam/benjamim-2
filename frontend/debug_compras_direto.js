// Script de debug direto para executar no console do navegador
// Execute este script na página /compras/nova

console.log('🔥 INICIANDO DEBUG DIRETO DA PÁGINA DE COMPRAS');

// 1. Verificar se estamos na página correta
if (!window.location.pathname.includes('/compras/nova')) {
  console.error('❌ Execute este script na página /compras/nova');
} else {
  console.log('✅ Página correta detectada');
}

// 2. Verificar se o formulário existe
const form = document.querySelector('form');
console.log('📋 Formulário encontrado:', !!form);

if (!form) {
  console.error('❌ Formulário não encontrado!');
  console.log('🔍 Elementos disponíveis na página:');
  console.log('- Divs:', document.querySelectorAll('div').length);
  console.log('- Inputs:', document.querySelectorAll('input').length);
  console.log('- Buttons:', document.querySelectorAll('button').length);
} else {
  console.log('✅ Formulário encontrado');
  
  // 3. Verificar campos principais
  const campos = {
    'Data da Compra': document.querySelector('input[name="dataCompra"]'),
    'Obra': document.querySelector('input[placeholder*="obra"], input[placeholder*="Obra"]'),
    'Fornecedor': document.querySelector('input[name="fornecedor"]'),
    'Nota Fiscal': document.querySelector('input[name="notaFiscal"]'),
    'Material (primeiro item)': document.querySelector('input[placeholder*="material"], input[placeholder*="Material"]'),
    'Quantidade': document.querySelector('input[name="quantidade"]'),
    'Valor Unitário': document.querySelector('input[name="valorUnitario"]')
  };
  
  console.log('🔍 VERIFICAÇÃO DE CAMPOS:');
  Object.entries(campos).forEach(([nome, elemento]) => {
    if (elemento) {
      console.log(`✅ ${nome}: encontrado`);
    } else {
      console.log(`❌ ${nome}: NÃO encontrado`);
    }
  });
  
  // 4. Verificar se há itens na tabela
  const tabela = document.querySelector('table');
  const linhasItens = document.querySelectorAll('tbody tr');
  console.log('📊 Tabela de itens:', {
    tabelaEncontrada: !!tabela,
    numeroLinhas: linhasItens.length
  });
  
  // 5. Verificar botões
  const botoes = {
    'Adicionar Item': document.querySelector('button:contains("Adicionar"), button[title*="Adicionar"]'),
    'Salvar': document.querySelector('button[type="submit"]'),
    'Cancelar': document.querySelector('button:contains("Cancelar")')
  };
  
  console.log('🔘 VERIFICAÇÃO DE BOTÕES:');
  Object.entries(botoes).forEach(([nome, elemento]) => {
    if (elemento) {
      console.log(`✅ ${nome}: encontrado`);
    } else {
      console.log(`❌ ${nome}: NÃO encontrado`);
    }
  });
  
  // 6. Verificar erros visíveis
  const erros = document.querySelectorAll('.text-red-600, .text-red-500, .border-red-500');
  console.log('⚠️ Erros visíveis na página:', erros.length);
  if (erros.length > 0) {
    erros.forEach((erro, index) => {
      console.log(`Erro ${index + 1}:`, erro.textContent || erro.outerHTML);
    });
  }
  
  // 7. Tentar preencher campos básicos
  console.log('🧪 TESTANDO PREENCHIMENTO DE CAMPOS:');
  
  // Preencher fornecedor
  const fornecedorInput = document.querySelector('input[name="fornecedor"]');
  if (fornecedorInput) {
    fornecedorInput.focus();
    fornecedorInput.value = 'Fornecedor Teste';
    fornecedorInput.dispatchEvent(new Event('input', { bubbles: true }));
    fornecedorInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Fornecedor preenchido');
  } else {
    console.log('❌ Campo fornecedor não encontrado');
  }
  
  // Preencher quantidade (se existir)
  const quantidadeInput = document.querySelector('input[name="quantidade"]');
  if (quantidadeInput) {
    quantidadeInput.focus();
    quantidadeInput.value = '10';
    quantidadeInput.dispatchEvent(new Event('input', { bubbles: true }));
    quantidadeInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Quantidade preenchida');
  } else {
    console.log('❌ Campo quantidade não encontrado');
  }
  
  // Preencher valor unitário (se existir)
  const valorInput = document.querySelector('input[name="valorUnitario"]');
  if (valorInput) {
    valorInput.focus();
    valorInput.value = '25.50';
    valorInput.dispatchEvent(new Event('input', { bubbles: true }));
    valorInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Valor unitário preenchido');
  } else {
    console.log('❌ Campo valor unitário não encontrado');
  }
  
  // 8. Verificar estado após preenchimento
  setTimeout(() => {
    console.log('🔍 ESTADO APÓS PREENCHIMENTO:');
    const errosApos = document.querySelectorAll('.text-red-600, .text-red-500, .border-red-500');
    console.log('Erros após preenchimento:', errosApos.length);
    
    if (errosApos.length > 0) {
      errosApos.forEach((erro, index) => {
        console.log(`Erro ${index + 1}:`, erro.textContent || erro.outerHTML);
      });
    }
    
    // Verificar valores dos campos
    console.log('Valores dos campos:');
    console.log('- Fornecedor:', fornecedorInput?.value || 'N/A');
    console.log('- Quantidade:', quantidadeInput?.value || 'N/A');
    console.log('- Valor Unitário:', valorInput?.value || 'N/A');
    
  }, 1000);
  
  // 9. Função para tentar submeter o formulário
  window.testarSubmissao = function() {
    console.log('🚀 TESTANDO SUBMISSÃO DO FORMULÁRIO');
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      console.log('Clicando no botão de salvar...');
      submitBtn.click();
      
      setTimeout(() => {
        const errosSubmissao = document.querySelectorAll('.text-red-600, .text-red-500, .border-red-500');
        console.log('Erros após tentativa de submissão:', errosSubmissao.length);
        if (errosSubmissao.length > 0) {
          errosSubmissao.forEach((erro, index) => {
            console.log(`Erro submissão ${index + 1}:`, erro.textContent || erro.outerHTML);
          });
        }
      }, 1000);
    } else {
      console.log('❌ Botão de submit não encontrado');
    }
  };
  
  console.log('✅ Debug concluído. Execute testarSubmissao() para testar a submissão.');
}

console.log('🔥 FIM DO DEBUG DIRETO');