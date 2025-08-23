// Script para testar validação do CompraForm no console do navegador
// Cole este código no console do navegador na página de nova compra

console.log('🧪 Iniciando teste de validação do CompraForm...');

// Função para simular preenchimento de campos
function preencherCampo(selector, valor) {
  const campo = document.querySelector(selector);
  if (campo) {
    campo.value = valor;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
    campo.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`✅ Campo ${selector} preenchido com: ${valor}`);
  } else {
    console.log(`❌ Campo ${selector} não encontrado`);
  }
}

// Função para clicar em botão
function clicarBotao(selector) {
  const botao = document.querySelector(selector);
  if (botao) {
    botao.click();
    console.log(`✅ Botão ${selector} clicado`);
    return true;
  } else {
    console.log(`❌ Botão ${selector} não encontrado`);
    return false;
  }
}

// Função para verificar mensagens de erro
function verificarErros() {
  const erros = document.querySelectorAll('[role="alert"], .text-red-600, .text-red-700');
  console.log(`🔍 Encontrados ${erros.length} elementos de erro:`);
  erros.forEach((erro, index) => {
    console.log(`  ${index + 1}. ${erro.textContent.trim()}`);
  });
  return erros.length > 0;
}

// Função para verificar se há itens na tabela
function verificarItens() {
  const linhasItens = document.querySelectorAll('tbody tr');
  console.log(`📋 Encontradas ${linhasItens.length} linhas de itens`);
  return linhasItens.length;
}

// Teste 1: Tentar salvar sem preencher nada
async function teste1() {
  console.log('\n🧪 TESTE 1: Salvar compra completamente vazia');
  
  // Verificar se há itens
  const numItens = verificarItens();
  console.log(`Número de itens: ${numItens}`);
  
  // Tentar salvar
  const salvou = clicarBotao('button[type="submit"]');
  
  if (salvou) {
    // Aguardar um pouco para a validação processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se apareceram erros
    const temErros = verificarErros();
    
    if (temErros) {
      console.log('✅ TESTE 1 PASSOU: Validação impediu salvar compra vazia');
    } else {
      console.log('❌ TESTE 1 FALHOU: Compra vazia foi salva sem validação!');
    }
  }
}

// Teste 2: Preencher campos obrigatórios mas sem itens
async function teste2() {
  console.log('\n🧪 TESTE 2: Salvar com campos obrigatórios mas sem itens');
  
  // Preencher obra (se houver select)
  const selectObra = document.querySelector('select[name="obraId"]');
  if (selectObra && selectObra.options.length > 1) {
    selectObra.selectedIndex = 1;
    selectObra.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Obra selecionada');
  }
  
  // Preencher data da compra
  preencherCampo('input[name="dataCompra"]', '2024-01-15');
  
  // Tentar salvar
  const salvou = clicarBotao('button[type="submit"]');
  
  if (salvou) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const temErros = verificarErros();
    
    if (temErros) {
      console.log('✅ TESTE 2 PASSOU: Validação impediu salvar sem itens');
    } else {
      console.log('❌ TESTE 2 FALHOU: Compra sem itens foi salva!');
    }
  }
}

// Teste 3: Adicionar item vazio e tentar salvar
async function teste3() {
  console.log('\n🧪 TESTE 3: Adicionar item vazio e tentar salvar');
  
  // Adicionar novo item
  const adicionou = clicarBotao('button:contains("Adicionar Novo Item"), button[class*="green"]');
  
  if (adicionou) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verificar se item foi adicionado
    const numItens = verificarItens();
    console.log(`Itens após adicionar: ${numItens}`);
    
    // Tentar salvar com item vazio
    const salvou = clicarBotao('button[type="submit"]');
    
    if (salvou) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const temErros = verificarErros();
      
      if (temErros) {
        console.log('✅ TESTE 3 PASSOU: Validação impediu salvar com item vazio');
      } else {
        console.log('❌ TESTE 3 FALHOU: Item vazio foi aceito!');
      }
    }
  }
}

// Executar todos os testes
async function executarTestes() {
  console.log('🚀 Iniciando bateria de testes de validação...');
  
  await teste1();
  await teste2();
  await teste3();
  
  console.log('\n🏁 Testes concluídos!');
  console.log('\n📋 RESUMO:');
  console.log('- Se todos os testes PASSARAM: a validação está funcionando');
  console.log('- Se algum teste FALHOU: há problema na validação');
}

// Executar automaticamente
executarTestes();

// Também disponibilizar funções individuais
window.testeValidacao = {
  executarTodos: executarTestes,
  teste1,
  teste2,
  teste3,
  verificarErros,
  verificarItens
};