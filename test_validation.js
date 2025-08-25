// Script para testar a validação do formulário de compra
// Execute este script no console do navegador na página de nova compra

console.log('🧪 TESTE: Iniciando teste de validação do formulário');

// Função para simular clique no botão de salvar
function testSaveWithoutProducts() {
  console.log('🧪 TESTE: Tentando salvar compra sem produtos...');
  
  // Encontrar o botão de salvar
  const saveButton = document.querySelector('button[type="submit"]') || 
                    document.querySelector('button:contains("Salvar")');
  
  if (saveButton) {
    console.log('🧪 TESTE: Botão de salvar encontrado:', saveButton);
    
    // Simular clique
    saveButton.click();
    
    // Aguardar um pouco e verificar se há erros na tela
    setTimeout(() => {
      const errorMessages = document.querySelectorAll('.text-red-600, .text-red-500, [class*="error"]');
      console.log('🧪 TESTE: Mensagens de erro encontradas:', errorMessages.length);
      
      errorMessages.forEach((error, index) => {
        console.log(`🧪 TESTE: Erro ${index + 1}:`, error.textContent);
      });
      
      // Verificar se há mensagem de erro específica sobre itens
      const formError = Array.from(errorMessages).find(el => 
        el.textContent.includes('item') || 
        el.textContent.includes('produto') ||
        el.textContent.includes('material')
      );
      
      if (formError) {
        console.log('✅ TESTE: Validação funcionando! Erro encontrado:', formError.textContent);
      } else {
        console.log('❌ TESTE: Validação pode não estar funcionando - nenhum erro sobre itens encontrado');
      }
    }, 1000);
  } else {
    console.log('❌ TESTE: Botão de salvar não encontrado');
  }
}

// Função para preencher campos obrigatórios (exceto itens)
function fillRequiredFields() {
  console.log('🧪 TESTE: Preenchendo campos obrigatórios...');
  
  // Preencher obra (se houver select)
  const obraSelect = document.querySelector('select[name="obra"], input[name="obra"]');
  if (obraSelect) {
    if (obraSelect.tagName === 'SELECT' && obraSelect.options.length > 1) {
      obraSelect.selectedIndex = 1;
      obraSelect.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('🧪 TESTE: Obra selecionada');
    }
  }
  
  // Preencher data da compra
  const dataCompraInput = document.querySelector('input[type="text"][readonly]');
  if (dataCompraInput) {
    // Simular clique para abrir o datepicker
    dataCompraInput.click();
    
    setTimeout(() => {
      // Tentar selecionar data atual no datepicker
      const todayButton = document.querySelector('.react-datepicker__day--today');
      if (todayButton) {
        todayButton.click();
        console.log('🧪 TESTE: Data da compra preenchida');
      }
    }, 500);
  }
}

// Executar testes
console.log('🧪 TESTE: Aguarde 2 segundos e execute testSaveWithoutProducts()');
console.log('🧪 TESTE: Ou execute fillRequiredFields() primeiro e depois testSaveWithoutProducts()');

// Disponibilizar funções globalmente
window.testSaveWithoutProducts = testSaveWithoutProducts;
window.fillRequiredFields = fillRequiredFields;

console.log('🧪 TESTE: Funções disponíveis:');
console.log('  - fillRequiredFields() - Preenche campos obrigatórios');
console.log('  - testSaveWithoutProducts() - Testa salvar sem produtos');