// TESTE MANUAL DIRETO PARA COMPRAS
// Execute este código no console do navegador na página /compras/nova

console.log('🚀 INICIANDO TESTE MANUAL DE COMPRAS');

// Função principal de teste
function testeManualCompras() {
  try {
    console.log('\n1️⃣ VERIFICANDO ESTRUTURA DA PÁGINA...');
    
    // Verificar URL
    console.log('URL atual:', window.location.href);
    
    // Verificar se estamos na página correta
    if (!window.location.href.includes('/compras/nova')) {
      console.error('❌ ERRO: Não estamos na página /compras/nova!');
      return;
    }
    
    // Verificar formulário
    const form = document.querySelector('form');
    console.log('Formulário encontrado:', !!form);
    
    if (!form) {
      console.error('❌ ERRO CRÍTICO: Formulário não encontrado!');
      console.log('HTML da página:', document.body.innerHTML.substring(0, 1000));
      return;
    }
    
    console.log('\n2️⃣ VERIFICANDO CAMPOS DO FORMULÁRIO...');
    
    // Verificar campos principais
    const campos = {
      obra: document.querySelector('input[name="obraId"], select[name="obraId"], [data-testid="obra-autocomplete"]'),
      dataCompra: document.querySelector('input[name="dataCompra"], input[type="date"]'),
      fornecedor: document.querySelector('input[name="fornecedor"]'),
      material: document.querySelector('input[placeholder*="material" i], input[name*="material" i]'),
      quantidade: document.querySelector('input[name*="quantidade" i], input[placeholder*="quantidade" i]'),
      valorUnitario: document.querySelector('input[name*="valor" i], input[placeholder*="valor" i]'),
      botaoSalvar: document.querySelector('button[type="submit"], button:contains("Salvar")'),
      botaoAdicionar: document.querySelector('button:contains("Adicionar"), button[title*="adicionar" i]')
    };
    
    console.log('Campos encontrados:');
    Object.entries(campos).forEach(([nome, elemento]) => {
      console.log(`  ${nome}: ${elemento ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
      if (elemento) {
        console.log(`    - Tag: ${elemento.tagName}`);
        console.log(`    - Classes: ${elemento.className}`);
        console.log(`    - Name: ${elemento.name || 'N/A'}`);
        console.log(`    - Placeholder: ${elemento.placeholder || 'N/A'}`);
      }
    });
    
    console.log('\n3️⃣ VERIFICANDO TODOS OS INPUTS...');
    const todosInputs = document.querySelectorAll('input, select, textarea');
    console.log(`Total de inputs encontrados: ${todosInputs.length}`);
    
    todosInputs.forEach((input, index) => {
      console.log(`Input ${index + 1}:`, {
        tag: input.tagName,
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className,
        value: input.value
      });
    });
    
    console.log('\n4️⃣ VERIFICANDO BOTÕES...');
    const todosBotoes = document.querySelectorAll('button');
    console.log(`Total de botões encontrados: ${todosBotoes.length}`);
    
    todosBotoes.forEach((botao, index) => {
      console.log(`Botão ${index + 1}:`, {
        texto: botao.textContent.trim(),
        type: botao.type,
        className: botao.className,
        disabled: botao.disabled
      });
    });
    
    console.log('\n5️⃣ VERIFICANDO ERROS VISÍVEIS...');
    const erros = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error" i]');
    console.log(`Erros encontrados: ${erros.length}`);
    
    erros.forEach((erro, index) => {
      console.log(`Erro ${index + 1}: ${erro.textContent.trim()}`);
    });
    
    console.log('\n6️⃣ TESTANDO PREENCHIMENTO BÁSICO...');
    
    // Tentar preencher data
    if (campos.dataCompra) {
      console.log('Preenchendo data...');
      campos.dataCompra.value = '2024-01-15';
      campos.dataCompra.dispatchEvent(new Event('input', { bubbles: true }));
      campos.dataCompra.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Data preenchida');
    }
    
    // Tentar preencher fornecedor
    if (campos.fornecedor) {
      console.log('Preenchendo fornecedor...');
      campos.fornecedor.value = 'Fornecedor Teste';
      campos.fornecedor.dispatchEvent(new Event('input', { bubbles: true }));
      campos.fornecedor.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Fornecedor preenchido');
    }
    
    console.log('\n7️⃣ VERIFICANDO ESTADO APÓS PREENCHIMENTO...');
    
    // Aguardar um pouco
    setTimeout(() => {
      const novosErros = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error" i]');
      console.log(`Erros após preenchimento: ${novosErros.length}`);
      
      novosErros.forEach((erro, index) => {
        console.log(`Novo erro ${index + 1}: ${erro.textContent.trim()}`);
      });
      
      console.log('\n✅ TESTE MANUAL CONCLUÍDO!');
      console.log('\n📋 RESUMO:');
      console.log(`- Formulário: ${form ? 'OK' : 'ERRO'}`);
      console.log(`- Campos encontrados: ${Object.values(campos).filter(Boolean).length}/${Object.keys(campos).length}`);
      console.log(`- Total de inputs: ${todosInputs.length}`);
      console.log(`- Total de botões: ${todosBotoes.length}`);
      console.log(`- Erros iniciais: ${erros.length}`);
      console.log(`- Erros após teste: ${novosErros.length}`);
      
    }, 2000);
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE MANUAL:', error);
    console.log('Stack trace:', error.stack);
  }
}

// Executar teste
testeManualCompras();

console.log('\n🔧 COMANDOS ÚTEIS:');
console.log('- Para executar novamente: testeManualCompras()');
console.log('- Para ver todos os elementos: document.querySelectorAll("*")');
console.log('- Para ver o HTML: document.body.innerHTML');