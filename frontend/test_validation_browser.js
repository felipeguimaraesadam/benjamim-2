// SCRIPT PARA TESTAR VALIDAÇÃO NO CONSOLE DO NAVEGADOR
// Execute este código no console do navegador na página de nova compra

console.log('🔍 INICIANDO TESTE DE VALIDAÇÃO NO NAVEGADOR');

// Função para testar se consegue salvar sem produtos
function testSaveWithoutProducts() {
  console.log('\n=== TESTE 1: TENTAR SALVAR SEM PRODUTOS ===');
  
  // Encontrar o botão de salvar
  const saveButton = document.querySelector('button[type="submit"]') || 
                    document.querySelector('button:contains("Salvar")') ||
                    Array.from(document.querySelectorAll('button')).find(btn => 
                      btn.textContent.includes('Salvar') || 
                      btn.textContent.includes('Registrar')
                    );
  
  if (!saveButton) {
    console.error('❌ Botão de salvar não encontrado!');
    return;
  }
  
  console.log('✅ Botão de salvar encontrado:', saveButton);
  
  // Verificar se há itens na tabela
  const itemRows = document.querySelectorAll('tbody tr');
  console.log(`📊 Número de linhas de itens encontradas: ${itemRows.length}`);
  
  // Verificar se há campos de material preenchidos
  const materialInputs = document.querySelectorAll('input[placeholder*="material"], select[name*="material"]');
  let hasFilledMaterial = false;
  
  materialInputs.forEach((input, index) => {
    const value = input.value || input.textContent;
    console.log(`📝 Material ${index + 1}: "${value}"`);
    if (value && value.trim() !== '') {
      hasFilledMaterial = true;
    }
  });
  
  console.log(`🎯 Tem material preenchido: ${hasFilledMaterial}`);
  
  // Tentar clicar no botão de salvar
  console.log('🚀 Tentando clicar no botão de salvar...');
  saveButton.click();
  
  // Aguardar um pouco e verificar se apareceu erro
  setTimeout(() => {
    const errorMessages = document.querySelectorAll('.text-red-500, .text-red-600, .error, [class*="error"]');
    console.log(`🔍 Mensagens de erro encontradas: ${errorMessages.length}`);
    
    errorMessages.forEach((error, index) => {
      console.log(`❌ Erro ${index + 1}: "${error.textContent}"`);
    });
    
    // Verificar se ainda está na mesma página (não salvou)
    if (window.location.pathname.includes('/compras')) {
      console.log('✅ VALIDAÇÃO FUNCIONOU: Ainda está na página de compras');
    } else {
      console.log('❌ PROBLEMA: Saiu da página de compras - pode ter salvado!');
    }
  }, 2000);
}

// Função para verificar o estado atual do formulário
function checkFormState() {
  console.log('\n=== ESTADO ATUAL DO FORMULÁRIO ===');
  
  // Verificar campos obrigatórios
  const obraSelect = document.querySelector('select[name="obra"], input[name="obra"]');
  const fornecedorInput = document.querySelector('input[name="fornecedor"]');
  const dataCompraInput = document.querySelector('input[name="dataCompra"], input[type="date"]');
  
  console.log('📋 Campos principais:');
  console.log(`  - Obra: "${obraSelect?.value || 'não encontrado'}"`);
  console.log(`  - Fornecedor: "${fornecedorInput?.value || 'não encontrado'}"`);
  console.log(`  - Data: "${dataCompraInput?.value || 'não encontrado'}"`);
  
  // Verificar itens
  const itemRows = document.querySelectorAll('tbody tr');
  console.log(`\n📦 Itens (${itemRows.length} linhas):`);
  
  itemRows.forEach((row, index) => {
    const materialInput = row.querySelector('input[placeholder*="material"], select');
    const quantidadeInput = row.querySelector('input[placeholder*="quantidade"], input[type="number"]');
    const valorInput = row.querySelector('input[placeholder*="valor"], input[placeholder*="preço"]');
    
    console.log(`  Item ${index + 1}:`);
    console.log(`    - Material: "${materialInput?.value || 'vazio'}"`);
    console.log(`    - Quantidade: "${quantidadeInput?.value || 'vazio'}"`);
    console.log(`    - Valor: "${valorInput?.value || 'vazio'}"`);
  });
}

// Função para preencher campos obrigatórios (exceto itens)
function fillRequiredFields() {
  console.log('\n=== PREENCHENDO CAMPOS OBRIGATÓRIOS ===');
  
  // Preencher obra (selecionar primeira opção)
  const obraSelect = document.querySelector('select[name="obra"]');
  if (obraSelect && obraSelect.options.length > 1) {
    obraSelect.selectedIndex = 1; // Primeira opção real (não o placeholder)
    obraSelect.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Obra selecionada');
  }
  
  // Preencher fornecedor
  const fornecedorInput = document.querySelector('input[name="fornecedor"]');
  if (fornecedorInput) {
    fornecedorInput.value = 'Fornecedor Teste';
    fornecedorInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Fornecedor preenchido');
  }
  
  // Preencher data
  const dataInput = document.querySelector('input[type="date"], input[name="dataCompra"]');
  if (dataInput) {
    dataInput.value = new Date().toISOString().split('T')[0];
    dataInput.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('✅ Data preenchida');
  }
  
  console.log('✅ Campos obrigatórios preenchidos (exceto itens)');
}

// Executar testes
console.log('🎯 COMANDOS DISPONÍVEIS:');
console.log('- checkFormState() - Verificar estado atual do formulário');
console.log('- fillRequiredFields() - Preencher campos obrigatórios');
console.log('- testSaveWithoutProducts() - Testar salvar sem produtos');

// Executar verificação inicial
checkFormState();

// Aguardar 3 segundos e testar
setTimeout(() => {
  console.log('\n🚀 EXECUTANDO TESTE AUTOMÁTICO...');
  fillRequiredFields();
  
  setTimeout(() => {
    testSaveWithoutProducts();
  }, 1000);
}, 3000);