// 🧪 TESTE DIRETO DE VALIDAÇÃO - Execute no console do navegador
// Página: http://localhost:5173/compras/nova

console.log('🧪 TESTE DIRETO DE VALIDAÇÃO INICIADO');

// Função para executar teste imediatamente
function executarTeste() {
  console.log('\n🔍 Procurando elementos do formulário...');
  
  // 1. Encontrar o formulário
  const form = document.querySelector('form');
  if (!form) {
    console.error('❌ Formulário não encontrado!');
    return false;
  }
  console.log('✅ Formulário encontrado');
  
  // 2. Encontrar o botão de submit
  const submitBtn = form.querySelector('button[type="submit"]') || document.querySelector('button[type="submit"]');
  if (!submitBtn) {
    console.error('❌ Botão de submit não encontrado!');
    return false;
  }
  console.log('✅ Botão de submit encontrado:', submitBtn.textContent.trim());
  
  // 3. Verificar estado inicial dos campos
  const obraSelect = document.querySelector('select[name="obraId"]');
  const dataInput = document.querySelector('input[name="dataCompra"]');
  
  console.log('\n📋 Estado inicial dos campos:');
  console.log('   Obra selecionada:', obraSelect ? obraSelect.value : 'Campo não encontrado');
  console.log('   Data preenchida:', dataInput ? dataInput.value : 'Campo não encontrado');
  
  // 4. Clicar no botão de submit
  console.log('\n🖱️ Clicando no botão de submit...');
  submitBtn.click();
  
  // 5. Aguardar um pouco e verificar erros
  setTimeout(() => {
    console.log('\n🔍 Verificando mensagens de erro...');
    
    // Procurar por diferentes tipos de elementos de erro
    const errorSelectors = [
      '[class*="text-red"]',
      '.text-red-600',
      '.text-red-700',
      '.text-red-500',
      '[role="alert"]',
      '.error',
      '[class*="error"]',
      '.text-danger',
      '[class*="danger"]'
    ];
    
    let totalErrors = 0;
    const foundErrors = [];
    
    errorSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent.trim();
        if (text && text.length > 0) {
          foundErrors.push({
            selector: selector,
            text: text,
            element: el
          });
          totalErrors++;
        }
      });
    });
    
    console.log(`\n📊 Total de erros encontrados: ${totalErrors}`);
    
    if (foundErrors.length > 0) {
      console.log('\n📋 ERROS ENCONTRADOS:');
      foundErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.selector}] ${error.text}`);
      });
      console.log('\n✅ VALIDAÇÃO FUNCIONANDO!');
    } else {
      console.log('\n❌ NENHUM ERRO ENCONTRADO - POSSÍVEL PROBLEMA NA VALIDAÇÃO!');
      
      // Verificar se o formulário foi submetido (mudança de página)
      const currentUrl = window.location.href;
      console.log('   URL atual:', currentUrl);
      
      if (currentUrl.includes('/compras/nova')) {
        console.log('   ✅ Ainda na página de criação (não foi submetido)');
      } else {
        console.log('   ❌ Página mudou - formulário pode ter sido submetido incorretamente!');
      }
    }
    
    // 6. Verificar campos específicos
    console.log('\n🔍 Verificação específica de campos:');
    
    // Verificar se há indicadores visuais de erro nos campos
    const obraContainer = obraSelect?.closest('.mb-4, .form-group, .field');
    const dataContainer = dataInput?.closest('.mb-4, .form-group, .field');
    
    if (obraContainer) {
      const hasError = obraContainer.querySelector('[class*="text-red"]');
      console.log(`   Campo Obra tem erro: ${hasError ? 'SIM' : 'NÃO'}`);
    }
    
    if (dataContainer) {
      const hasError = dataContainer.querySelector('[class*="text-red"]');
      console.log(`   Campo Data tem erro: ${hasError ? 'SIM' : 'NÃO'}`);
    }
    
    return foundErrors.length > 0;
  }, 1000);
  
  return true;
}

// Executar o teste
const resultado = executarTeste();
console.log('\n🏁 Teste iniciado:', resultado ? 'Sucesso' : 'Falha');

// Disponibilizar globalmente
window.executarTeste = executarTeste;
console.log('\n💡 Para executar novamente: executarTeste()');