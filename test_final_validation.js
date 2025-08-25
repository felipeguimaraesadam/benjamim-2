// TESTE FINAL DE VALIDAÇÃO - Execute no console do navegador (F12)
// Este script testa a validação exata implementada no CompraForm

console.log('🔥 INICIANDO TESTE FINAL DE VALIDAÇÃO');

// Função para simular a lógica exata da validateForm
function testValidationLogic(items) {
  console.log('🔍 TESTE: Testando validação com items:', items);
  
  let hasAtLeastOneValidItem = false;
  let hasAnyFilledField = false;
  const errors = {};
  
  items.forEach((item, index) => {
    const materialIsSet = !!(item.material && item.material.id) || !!(item.materialId && item.materialId.trim());
    const quantidadeStr = String(item.quantidade || '').replace(',', '.').trim();
    const valorUnitarioStr = String(item.valorUnitario || '').replace(',', '.').trim();
    const quantidadeIsSet = quantidadeStr !== '';
    const valorUnitarioIsSet = valorUnitarioStr !== '';
    
    console.log(`🔍 TESTE Item ${index}:`, {
      materialIsSet,
      quantidadeIsSet,
      valorUnitarioIsSet,
      material: item.material,
      materialId: item.materialId,
      quantidade: item.quantidade,
      valorUnitario: item.valorUnitario
    });
    
    // Se qualquer campo foi preenchido, o item deve estar completo
    if (materialIsSet || quantidadeIsSet || valorUnitarioIsSet) {
      hasAnyFilledField = true;
      
      // Validar material
      if (!materialIsSet) {
        errors[`item_${index}_material`] = 'Material é obrigatório.';
      }
      
      // Validar quantidade
      if (!quantidadeIsSet || parseFloat(quantidadeStr) <= 0) {
        errors[`item_${index}_quantidade`] = 'Quantidade deve ser positiva.';
      }
      
      // Validar valor unitário
      if (!valorUnitarioIsSet || parseFloat(valorUnitarioStr) < 0) {
        errors[`item_${index}_valorUnitario`] = 'Valor unitário deve ser positivo ou zero.';
      }
      
      // Item é válido se todos os campos estão preenchidos corretamente
      if (materialIsSet && quantidadeIsSet && valorUnitarioIsSet && 
          parseFloat(quantidadeStr) > 0 && parseFloat(valorUnitarioStr) >= 0) {
        hasAtLeastOneValidItem = true;
      }
    }
  });
  
  // CORREÇÃO CRÍTICA: Sempre exigir pelo menos um item válido
  if (!hasAtLeastOneValidItem) {
    errors.form = 'Uma compra deve ter pelo menos um item válido com material, quantidade e valor unitário preenchidos.';
    console.log('🔍 TESTE: Nenhum item válido encontrado!');
  } else {
    console.log('🔍 TESTE: Pelo menos um item válido encontrado!');
  }
  
  console.log('🔍 TESTE: Erros encontrados:', errors);
  return Object.keys(errors).length === 0;
}

// Função para testar diferentes cenários
function runValidationTests() {
  console.log('\n=== TESTE 1: Item completamente vazio ===');
  const test1 = [{
    id: 'test1',
    material: null,
    materialId: '',
    quantidade: '',
    valorUnitario: ''
  }];
  const result1 = testValidationLogic(test1);
  console.log('✅ RESULTADO TESTE 1 (deve ser FALSE):', result1);
  
  console.log('\n=== TESTE 2: Item com apenas material ===');
  const test2 = [{
    id: 'test2',
    material: { id: '1', nome: 'Cimento' },
    materialId: '1',
    quantidade: '',
    valorUnitario: ''
  }];
  const result2 = testValidationLogic(test2);
  console.log('✅ RESULTADO TESTE 2 (deve ser FALSE):', result2);
  
  console.log('\n=== TESTE 3: Item completo e válido ===');
  const test3 = [{
    id: 'test3',
    material: { id: '1', nome: 'Cimento' },
    materialId: '1',
    quantidade: '10',
    valorUnitario: '25.50'
  }];
  const result3 = testValidationLogic(test3);
  console.log('✅ RESULTADO TESTE 3 (deve ser TRUE):', result3);
  
  console.log('\n=== TESTE 4: Múltiplos itens, um vazio, um válido ===');
  const test4 = [
    {
      id: 'test4a',
      material: null,
      materialId: '',
      quantidade: '',
      valorUnitario: ''
    },
    {
      id: 'test4b',
      material: { id: '1', nome: 'Cimento' },
      materialId: '1',
      quantidade: '10',
      valorUnitario: '25.50'
    }
  ];
  const result4 = testValidationLogic(test4);
  console.log('✅ RESULTADO TESTE 4 (deve ser TRUE):', result4);
  
  return { test1: result1, test2: result2, test3: result3, test4: result4 };
}

// Função para testar o estado atual do formulário
function testCurrentFormState() {
  console.log('\n🔥 TESTANDO ESTADO ATUAL DO FORMULÁRIO');
  
  // Tentar acessar o estado do React
  const compraFormElement = document.querySelector('form');
  if (!compraFormElement) {
    console.log('❌ Formulário não encontrado!');
    return;
  }
  
  // Verificar se há itens na tabela
  const itemRows = document.querySelectorAll('tbody tr');
  console.log(`📊 Encontradas ${itemRows.length} linhas de itens`);
  
  itemRows.forEach((row, index) => {
    const materialInput = row.querySelector('input[placeholder*="material"], input[placeholder*="Material"]');
    const quantidadeInput = row.querySelector('input[name="quantidade"]');
    const valorInput = row.querySelector('input[name="valorUnitario"]');
    
    console.log(`📋 Item ${index}:`, {
      material: materialInput ? materialInput.value : 'N/A',
      quantidade: quantidadeInput ? quantidadeInput.value : 'N/A',
      valorUnitario: valorInput ? valorInput.value : 'N/A'
    });
  });
}

// Função para tentar salvar e capturar erros
function testSaveAttempt() {
  console.log('\n🚀 TENTANDO SALVAR FORMULÁRIO');
  
  const saveButton = document.querySelector('button[type="submit"], button:contains("Salvar")');
  if (!saveButton) {
    console.log('❌ Botão de salvar não encontrado!');
    return;
  }
  
  console.log('🔘 Clicando no botão salvar...');
  saveButton.click();
  
  // Aguardar um pouco e verificar erros
  setTimeout(() => {
    const errorMessages = document.querySelectorAll('.text-red-600, .text-red-500, [class*="error"]');
    console.log(`🚨 Encontradas ${errorMessages.length} mensagens de erro:`);
    
    errorMessages.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.textContent.trim()}`);
    });
    
    // Verificar se ainda estamos na mesma página (não redirecionou)
    console.log('🌐 URL atual:', window.location.href);
    
    // Verificar console do navegador por logs
    console.log('📝 Verifique o console para logs de validação do React');
  }, 1000);
}

// Executar todos os testes
console.log('🎯 EXECUTANDO BATERIA DE TESTES...');
const testResults = runValidationTests();
testCurrentFormState();

console.log('\n📋 RESUMO DOS TESTES:');
console.log('- Teste 1 (item vazio):', testResults.test1 ? '❌ FALHOU' : '✅ PASSOU');
console.log('- Teste 2 (só material):', testResults.test2 ? '❌ FALHOU' : '✅ PASSOU');
console.log('- Teste 3 (item válido):', testResults.test3 ? '✅ PASSOU' : '❌ FALHOU');
console.log('- Teste 4 (misto):', testResults.test4 ? '✅ PASSOU' : '❌ FALHOU');

console.log('\n🎯 AGORA TESTE MANUAL:');
console.log('1. Preencha APENAS os campos Obra e Data da Compra');
console.log('2. DEIXE todos os itens vazios');
console.log('3. Execute: testSaveAttempt()');
console.log('4. Deve aparecer erro: "Uma compra deve ter pelo menos um item válido"');

// Disponibilizar função para teste manual
window.testSaveAttempt = testSaveAttempt;
window.testValidationLogic = testValidationLogic;

console.log('\n✅ SCRIPT CARREGADO! Execute testSaveAttempt() após preencher campos básicos.');