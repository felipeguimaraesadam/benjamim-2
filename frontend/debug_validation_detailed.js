// SCRIPT DE DEBUG DETALHADO PARA VALIDAÇÃO DE ITENS
// Execute este script no console do navegador (F12) na página de nova compra

console.log('🔍 INICIANDO DEBUG DETALHADO DA VALIDAÇÃO');

// Função para debugar o estado atual dos itens
function debugCurrentItemsDetailed() {
  console.log('\n=== DEBUG DETALHADO DOS ITENS ===');
  
  // Tentar acessar o estado do React
  const compraFormElement = document.querySelector('form');
  if (!compraFormElement) {
    console.error('❌ Formulário não encontrado!');
    return null;
  }
  
  // Buscar todos os inputs de material, quantidade e valor unitário
  const materialInputs = document.querySelectorAll('input[placeholder*="material" i], input[placeholder*="buscar" i]');
  const quantidadeInputs = document.querySelectorAll('input[name="quantidade"]');
  const valorInputs = document.querySelectorAll('input[name="valorUnitario"]');
  
  console.log('📊 Inputs encontrados:', {
    materiais: materialInputs.length,
    quantidades: quantidadeInputs.length,
    valores: valorInputs.length
  });
  
  const items = [];
  
  // Analisar cada linha de item
  for (let i = 0; i < Math.max(quantidadeInputs.length, valorInputs.length); i++) {
    const materialInput = materialInputs[i];
    const quantidadeInput = quantidadeInputs[i];
    const valorInput = valorInputs[i];
    
    const item = {
      index: i,
      material: {
        input: materialInput,
        value: materialInput?.value || '',
        hasValue: !!(materialInput?.value?.trim())
      },
      quantidade: {
        input: quantidadeInput,
        value: quantidadeInput?.value || '',
        hasValue: !!(quantidadeInput?.value?.trim()),
        numericValue: parseFloat((quantidadeInput?.value || '').replace(',', '.'))
      },
      valorUnitario: {
        input: valorInput,
        value: valorInput?.value || '',
        hasValue: !!(valorInput?.value?.trim()),
        numericValue: parseFloat((valorInput?.value || '').replace(',', '.'))
      }
    };
    
    // Verificar se o item é válido segundo a lógica do CompraForm
    const materialIsSet = item.material.hasValue;
    const quantidadeIsSet = item.quantidade.hasValue && item.quantidade.numericValue > 0;
    const valorUnitarioIsSet = item.valorUnitario.hasValue && item.valorUnitario.numericValue >= 0;
    
    item.validation = {
      materialIsSet,
      quantidadeIsSet,
      valorUnitarioIsSet,
      hasAnyField: materialIsSet || quantidadeIsSet || valorUnitarioIsSet,
      isCompleteAndValid: materialIsSet && quantidadeIsSet && valorUnitarioIsSet
    };
    
    items.push(item);
    
    console.log(`\n📋 Item ${i}:`, {
      material: `"${item.material.value}" (válido: ${materialIsSet})`,
      quantidade: `"${item.quantidade.value}" (válido: ${quantidadeIsSet}, numérico: ${item.quantidade.numericValue})`,
      valorUnitario: `"${item.valorUnitario.value}" (válido: ${valorUnitarioIsSet}, numérico: ${item.valorUnitario.numericValue})`,
      validation: item.validation
    });
  }
  
  return items;
}

// Função para simular a validação exata do CompraForm
function simulateExactValidationDetailed() {
  console.log('\n=== SIMULANDO VALIDAÇÃO EXATA DO COMPRAFORM ===');
  
  const items = debugCurrentItemsDetailed();
  if (!items) return false;
  
  let hasAnyFilledField = false;
  let hasValidItem = false;
  const errors = {};
  
  items.forEach((item, index) => {
    const { material, quantidade, valorUnitario, validation } = item;
    
    console.log(`\n🔍 Validando item ${index}:`);
    
    // Replicar a lógica exata do validateForm
    const materialIsSet = validation.materialIsSet;
    const quantidadeIsSet = validation.quantidadeIsSet;
    const valorUnitarioIsSet = validation.valorUnitarioIsSet;
    
    console.log('  - Material definido:', materialIsSet);
    console.log('  - Quantidade definida:', quantidadeIsSet);
    console.log('  - Valor unitário definido:', valorUnitarioIsSet);
    
    // Se qualquer campo foi preenchido, o item deve estar completo
    if (materialIsSet || quantidadeIsSet || valorUnitarioIsSet) {
      hasAnyFilledField = true;
      console.log('  ✅ Item tem pelo menos um campo preenchido');
      
      // Validar material
      if (!materialIsSet) {
        errors[`item_${index}_material`] = 'Material é obrigatório.';
        console.log('  ❌ Erro: Material não definido');
      }
      
      // Validar quantidade
      if (!quantidadeIsSet) {
        errors[`item_${index}_quantidade`] = 'Quantidade deve ser positiva.';
        console.log('  ❌ Erro: Quantidade inválida');
      }
      
      // Validar valor unitário
      if (!valorUnitarioIsSet) {
        errors[`item_${index}_valorUnitario`] = 'Valor unitário deve ser não negativo.';
        console.log('  ❌ Erro: Valor unitário inválido');
      }
      
      // Se todos os campos estão válidos, este item é válido
      if (materialIsSet && quantidadeIsSet && valorUnitarioIsSet) {
        hasValidItem = true;
        console.log('  ✅ Item VÁLIDO!');
      } else {
        console.log('  ❌ Item INVÁLIDO - campos obrigatórios faltando');
      }
    } else {
      console.log('  ⚪ Item vazio - ignorado');
    }
  });
  
  console.log('\n📊 RESULTADO DA VALIDAÇÃO:');
  console.log('  - Tem algum campo preenchido:', hasAnyFilledField);
  console.log('  - Tem pelo menos um item válido:', hasValidItem);
  console.log('  - Erros encontrados:', Object.keys(errors).length);
  console.log('  - Detalhes dos erros:', errors);
  
  // Verificar se a validação passaria
  const wouldPass = hasValidItem;
  console.log('\n🎯 VALIDAÇÃO PASSARIA:', wouldPass ? '✅ SIM' : '❌ NÃO');
  
  if (!wouldPass && hasAnyFilledField) {
    console.log('💡 DIAGNÓSTICO: Há campos preenchidos mas nenhum item está completamente válido');
  } else if (!wouldPass && !hasAnyFilledField) {
    console.log('💡 DIAGNÓSTICO: Nenhum campo foi preenchido');
  }
  
  return { wouldPass, hasValidItem, hasAnyFilledField, errors, items };
}

// Função para testar o salvamento
function testSaveAttemptDetailed() {
  console.log('\n=== TESTANDO TENTATIVA DE SALVAMENTO ===');
  
  const validationResult = simulateExactValidationDetailed();
  
  // Tentar encontrar o botão de salvar
  const saveButton = document.querySelector('button[type="submit"]');
  if (saveButton) {
    console.log('\n🔘 Botão de salvar encontrado:', saveButton.textContent.trim());
    console.log('   - Desabilitado:', saveButton.disabled);
    console.log('   - Classes:', saveButton.className);
  } else {
    console.log('\n❌ Botão de salvar não encontrado!');
  }
  
  // Simular o que aconteceria no handleSubmit
  console.log('\n🚀 SIMULANDO HANDLESUBMIT:');
  
  if (!validationResult.wouldPass) {
    console.log('❌ Validação falharia - erro seria mostrado');
    if (validationResult.hasAnyFilledField) {
      console.log('   Mensagem: "Adicione pelo menos um item válido à compra."');
    } else {
      console.log('   Mensagem: "Uma compra deve ter pelo menos um item."');
    }
    return false;
  }
  
  // Simular a filtragem de itens para envio
  const itemsToSubmit = validationResult.items.filter(item => {
    const hasValidData = item.validation.isCompleteAndValid;
    console.log(`   Item ${item.index} seria enviado:`, hasValidData);
    return hasValidData;
  });
  
  console.log('\n📤 Itens que seriam enviados:', itemsToSubmit.length);
  
  if (itemsToSubmit.length === 0) {
    console.log('❌ ERRO CRÍTICO: Nenhum item seria enviado mesmo passando na validação!');
    return false;
  }
  
  console.log('✅ Salvamento prosseguiria normalmente');
  return true;
}

// Função para executar debug completo
function runCompleteDetailedDebug() {
  console.log('🚀 EXECUTANDO DEBUG COMPLETO DETALHADO');
  console.log('=====================================');
  
  const items = debugCurrentItemsDetailed();
  const validation = simulateExactValidationDetailed();
  const saveTest = testSaveAttemptDetailed();
  
  console.log('\n📋 RESUMO FINAL:');
  console.log('================');
  console.log('- Itens encontrados:', items?.length || 0);
  console.log('- Validação passaria:', validation?.wouldPass || false);
  console.log('- Salvamento funcionaria:', saveTest);
  
  if (items && items.length > 0) {
    console.log('\n🔍 ANÁLISE POR ITEM:');
    items.forEach((item, i) => {
      console.log(`  Item ${i}: Material="${item.material.value}" Qtd="${item.quantidade.value}" Valor="${item.valorUnitario.value}" Válido=${item.validation.isCompleteAndValid}`);
    });
  }
  
  return { items, validation, saveTest };
}

// Disponibilizar funções globalmente
window.debugCurrentItemsDetailed = debugCurrentItemsDetailed;
window.simulateExactValidationDetailed = simulateExactValidationDetailed;
window.testSaveAttemptDetailed = testSaveAttemptDetailed;
window.runCompleteDetailedDebug = runCompleteDetailedDebug;

console.log('\n✅ SCRIPT DE DEBUG DETALHADO CARREGADO!');
console.log('📝 Comandos disponíveis:');
console.log('  - debugCurrentItemsDetailed() - Analisa itens atuais');
console.log('  - simulateExactValidationDetailed() - Simula validação');
console.log('  - testSaveAttemptDetailed() - Testa salvamento');
console.log('  - runCompleteDetailedDebug() - Executa tudo');
console.log('\n🎯 Execute: runCompleteDetailedDebug()');