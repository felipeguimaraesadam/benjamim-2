// Script de debug final para página de compras
// Execute este script no console do navegador na página /compras/nova

console.log('🔍 INICIANDO DEBUG FINAL DA PÁGINA DE COMPRAS');

// Função para aguardar elemento aparecer
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Elemento ${selector} não encontrado em ${timeout}ms`));
    }, timeout);
  });
}

// Função principal de debug
async function debugComprasPage() {
  console.log('\n=== VERIFICANDO ESTRUTURA DA PÁGINA ===');
  
  // 1. Verificar se estamos na página correta
  console.log('URL atual:', window.location.href);
  console.log('Título da página:', document.title);
  
  // 2. Verificar se o formulário existe
  const form = document.querySelector('form');
  console.log('Formulário encontrado:', !!form);
  
  if (!form) {
    console.error('❌ FORMULÁRIO NÃO ENCONTRADO!');
    return;
  }
  
  // 3. Verificar campos básicos
  console.log('\n=== VERIFICANDO CAMPOS BÁSICOS ===');
  
  const campos = {
    'Data da Compra': 'input[name="dataCompra"]',
    'Obra': 'input[placeholder*="obra" i], input[placeholder*="Selecione" i]',
    'Fornecedor': 'input[name="fornecedor"]',
    'Nota Fiscal': 'input[name="notaFiscal"]'
  };
  
  for (const [nome, seletor] of Object.entries(campos)) {
    const campo = document.querySelector(seletor);
    console.log(`${nome}:`, {
      encontrado: !!campo,
      valor: campo?.value || 'vazio',
      visível: campo ? window.getComputedStyle(campo).display !== 'none' : false
    });
  }
  
  // 4. Verificar tabela de itens
  console.log('\n=== VERIFICANDO TABELA DE ITENS ===');
  
  const tabela = document.querySelector('table');
  console.log('Tabela encontrada:', !!tabela);
  
  if (tabela) {
    const linhas = tabela.querySelectorAll('tbody tr');
    console.log('Número de linhas de itens:', linhas.length);
    
    if (linhas.length > 0) {
      const primeiraLinha = linhas[0];
      const campos = {
        'Material': 'input[placeholder*="material" i], input[placeholder*="Digite" i]',
        'Quantidade': 'input[name="quantidade"]',
        'Valor Unitário': 'input[name="valorUnitario"]',
        'Categoria de Uso': 'select[name="categoria_uso"]'
      };
      
      console.log('Campos na primeira linha:');
      for (const [nome, seletor] of Object.entries(campos)) {
        const campo = primeiraLinha.querySelector(seletor);
        console.log(`  ${nome}:`, {
          encontrado: !!campo,
          valor: campo?.value || 'vazio',
          visível: campo ? window.getComputedStyle(campo).display !== 'none' : false
        });
      }
    }
  }
  
  // 5. Verificar botões
  console.log('\n=== VERIFICANDO BOTÕES ===');
  
  const botoes = {
    'Adicionar Item': 'button:contains("Adicionar"), button[type="button"]:contains("Novo")',
    'Salvar': 'button[type="submit"], button:contains("Salvar")',
    'Cancelar': 'button:contains("Cancelar")'
  };
  
  // Função auxiliar para encontrar botão por texto
  function findButtonByText(text) {
    return Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.toLowerCase().includes(text.toLowerCase())
    );
  }
  
  console.log('Adicionar Item:', !!findButtonByText('adicionar'));
  console.log('Salvar:', !!findButtonByText('salvar'));
  console.log('Cancelar:', !!findButtonByText('cancelar'));
  
  // 6. Verificar erros visíveis
  console.log('\n=== VERIFICANDO ERROS ===');
  
  const erros = document.querySelectorAll('.text-red-600, .text-red-500, .border-red-500');
  console.log('Elementos com erro encontrados:', erros.length);
  
  if (erros.length > 0) {
    erros.forEach((erro, index) => {
      console.log(`Erro ${index + 1}:`, erro.textContent.trim());
    });
  }
  
  // 7. Verificar console do React
  console.log('\n=== VERIFICANDO ESTADO DO REACT ===');
  
  // Tentar acessar o estado do React através do DevTools
  if (window.React) {
    console.log('React detectado:', window.React.version || 'versão desconhecida');
  }
  
  // 8. Teste de preenchimento básico
  console.log('\n=== TESTE DE PREENCHIMENTO ===');
  
  try {
    // Preencher fornecedor
    const fornecedor = document.querySelector('input[name="fornecedor"]');
    if (fornecedor) {
      fornecedor.value = 'Fornecedor Teste';
      fornecedor.dispatchEvent(new Event('input', { bubbles: true }));
      fornecedor.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Fornecedor preenchido');
    }
    
    // Preencher quantidade na primeira linha
    const quantidade = document.querySelector('input[name="quantidade"]');
    if (quantidade) {
      quantidade.value = '10';
      quantidade.dispatchEvent(new Event('input', { bubbles: true }));
      quantidade.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Quantidade preenchida');
    }
    
    // Preencher valor unitário
    const valorUnitario = document.querySelector('input[name="valorUnitario"]');
    if (valorUnitario) {
      valorUnitario.value = '15.50';
      valorUnitario.dispatchEvent(new Event('input', { bubbles: true }));
      valorUnitario.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Valor unitário preenchido');
    }
    
    console.log('\n=== ESTADO APÓS PREENCHIMENTO ===');
    console.log('Fornecedor:', fornecedor?.value);
    console.log('Quantidade:', quantidade?.value);
    console.log('Valor Unitário:', valorUnitario?.value);
    
  } catch (error) {
    console.error('❌ Erro no teste de preenchimento:', error);
  }
  
  // 9. Função para testar submissão
  window.testarSubmissao = function() {
    console.log('\n=== TESTANDO SUBMISSÃO ===');
    
    const submitBtn = document.querySelector('button[type="submit"]') || findButtonByText('salvar');
    if (submitBtn) {
      console.log('Clicando no botão de salvar...');
      submitBtn.click();
      
      setTimeout(() => {
        const novosErros = document.querySelectorAll('.text-red-600, .text-red-500');
        console.log('Erros após submissão:', novosErros.length);
        novosErros.forEach((erro, index) => {
          console.log(`Erro ${index + 1}:`, erro.textContent.trim());
        });
      }, 1000);
    } else {
      console.error('❌ Botão de salvar não encontrado');
    }
  };
  
  console.log('\n✅ DEBUG CONCLUÍDO!');
  console.log('💡 Para testar a submissão, execute: testarSubmissao()');
}

// Executar o debug
debugComprasPage().catch(console.error);