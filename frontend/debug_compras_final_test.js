// Script de debug final para testar a página de compras
// Execute este script no console do navegador na página /compras/nova

console.log('🔍 INICIANDO TESTE FINAL DA PÁGINA DE COMPRAS');

// Função para aguardar elemento aparecer
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
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

// Função para simular digitação
function simulateTyping(element, text) {
  element.focus();
  element.value = text;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

// Função principal de teste
async function testarComprasCompleto() {
  console.log('\n=== VERIFICAÇÃO INICIAL DA PÁGINA ===');
  
  // 1. Verificar URL
  console.log('URL atual:', window.location.href);
  if (!window.location.href.includes('/compras/nova')) {
    console.error('❌ Não está na página de nova compra!');
    return;
  }
  
  // 2. Verificar se o formulário existe
  const form = document.querySelector('form');
  if (!form) {
    console.error('❌ Formulário não encontrado!');
    return;
  }
  console.log('✅ Formulário encontrado');
  
  // 3. Verificar campos básicos
  const campos = {
    'Data da Compra': 'input[name="dataCompra"], input[type="date"]',
    'Obra': 'input[placeholder*="obra"], input[placeholder*="Obra"]',
    'Fornecedor': 'input[name="fornecedor"]',
    'Nota Fiscal': 'input[name="notaFiscal"]'
  };
  
  console.log('\n=== VERIFICAÇÃO DOS CAMPOS ===');
  for (const [nome, seletor] of Object.entries(campos)) {
    const campo = document.querySelector(seletor);
    if (campo) {
      console.log(`✅ ${nome}: encontrado`);
      console.log(`   - Visível: ${campo.offsetParent !== null}`);
      console.log(`   - Habilitado: ${!campo.disabled}`);
    } else {
      console.log(`❌ ${nome}: NÃO encontrado (seletor: ${seletor})`);
    }
  }
  
  // 4. Verificar tabela de itens
  console.log('\n=== VERIFICAÇÃO DA TABELA DE ITENS ===');
  const tabela = document.querySelector('table');
  if (tabela) {
    console.log('✅ Tabela encontrada');
    const linhas = tabela.querySelectorAll('tbody tr');
    console.log(`   - Número de linhas: ${linhas.length}`);
    
    if (linhas.length > 0) {
      const primeiraLinha = linhas[0];
      const campos = primeiraLinha.querySelectorAll('input, select');
      console.log(`   - Campos na primeira linha: ${campos.length}`);
      
      // Verificar campo de material
      const campoMaterial = primeiraLinha.querySelector('input[placeholder*="material"], input[placeholder*="Material"]');
      if (campoMaterial) {
        console.log('✅ Campo de material encontrado');
      } else {
        console.log('❌ Campo de material NÃO encontrado');
      }
    }
  } else {
    console.log('❌ Tabela NÃO encontrada');
  }
  
  // 5. Verificar botões
  console.log('\n=== VERIFICAÇÃO DOS BOTÕES ===');
  const botaoSalvar = document.querySelector('button[type="submit"], button:contains("Salvar")');
  const botaoCancelar = document.querySelector('button:contains("Cancelar")');
  const botaoAdicionarItem = document.querySelector('button:contains("Adicionar")');
  
  console.log(`Botão Salvar: ${botaoSalvar ? '✅ encontrado' : '❌ NÃO encontrado'}`);
  console.log(`Botão Cancelar: ${botaoCancelar ? '✅ encontrado' : '❌ NÃO encontrado'}`);
  console.log(`Botão Adicionar Item: ${botaoAdicionarItem ? '✅ encontrado' : '❌ NÃO encontrado'}`);
  
  // 6. Verificar erros visíveis
  console.log('\n=== VERIFICAÇÃO DE ERROS ===');
  const erros = document.querySelectorAll('.text-red-600, .text-red-500, .border-red-500');
  console.log(`Elementos com erro visível: ${erros.length}`);
  if (erros.length > 0) {
    erros.forEach((erro, index) => {
      console.log(`   Erro ${index + 1}: ${erro.textContent || erro.outerHTML.substring(0, 100)}`);
    });
  }
  
  // 7. Teste de preenchimento básico
  console.log('\n=== TESTE DE PREENCHIMENTO ===');
  try {
    // Preencher fornecedor
    const campoFornecedor = document.querySelector('input[name="fornecedor"]');
    if (campoFornecedor) {
      simulateTyping(campoFornecedor, 'Fornecedor Teste');
      console.log('✅ Fornecedor preenchido');
    }
    
    // Preencher primeira linha de item
    const primeiraLinha = document.querySelector('tbody tr');
    if (primeiraLinha) {
      // Quantidade
      const campoQuantidade = primeiraLinha.querySelector('input[name="quantidade"]');
      if (campoQuantidade) {
        simulateTyping(campoQuantidade, '10');
        console.log('✅ Quantidade preenchida');
      }
      
      // Valor unitário
      const campoValor = primeiraLinha.querySelector('input[name="valorUnitario"]');
      if (campoValor) {
        simulateTyping(campoValor, '25.50');
        console.log('✅ Valor unitário preenchido');
      }
    }
    
    // Aguardar um pouco para ver se aparecem erros
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar novos erros após preenchimento
    const novosErros = document.querySelectorAll('.text-red-600, .text-red-500, .border-red-500');
    console.log(`Erros após preenchimento: ${novosErros.length}`);
    
  } catch (error) {
    console.error('❌ Erro durante preenchimento:', error);
  }
  
  // 8. Verificar estado do React (se possível)
  console.log('\n=== VERIFICAÇÃO DO ESTADO REACT ===');
  try {
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
      console.log('✅ Componente React detectado');
    } else if (reactRoot && reactRoot._reactInternalInstance) {
      console.log('✅ Componente React detectado (versão antiga)');
    } else {
      console.log('⚠️ Estado React não acessível diretamente');
    }
  } catch (error) {
    console.log('⚠️ Não foi possível acessar estado React:', error.message);
  }
  
  console.log('\n=== TESTE CONCLUÍDO ===');
  console.log('Para testar o salvamento, execute: testarSubmissao()');
}

// Função para testar submissão
function testarSubmissao() {
  console.log('\n=== TESTE DE SUBMISSÃO ===');
  const botaoSalvar = document.querySelector('button[type="submit"]');
  if (botaoSalvar) {
    console.log('Clicando no botão salvar...');
    botaoSalvar.click();
    
    // Verificar erros após 2 segundos
    setTimeout(() => {
      const erros = document.querySelectorAll('.text-red-600, .text-red-500');
      console.log(`Erros após submissão: ${erros.length}`);
      erros.forEach((erro, index) => {
        console.log(`   Erro ${index + 1}: ${erro.textContent}`);
      });
    }, 2000);
  } else {
    console.error('❌ Botão salvar não encontrado');
  }
}

// Executar teste automaticamente
testarComprasCompleto();

// Disponibilizar funções globalmente
window.testarComprasCompleto = testarComprasCompleto;
window.testarSubmissao = testarSubmissao;

console.log('\n📋 FUNÇÕES DISPONÍVEIS:');
console.log('- testarComprasCompleto(): executa teste completo');
console.log('- testarSubmissao(): testa o salvamento do formulário');