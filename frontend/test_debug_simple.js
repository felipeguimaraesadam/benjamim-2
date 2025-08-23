// Script de Debug DIRETO para Página de Compras
// Execute este script no console do navegador na página /compras/nova

console.log('🧪 INICIANDO DEBUG DIRETO DA PÁGINA DE COMPRAS');
console.log('URL atual:', window.location.href);

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

// Função principal de teste
async function testarPaginaCompras() {
  try {
    console.log('\n1️⃣ VERIFICANDO FORMULÁRIO...');
    
    // Aguardar formulário aparecer
    const form = await waitForElement('form', 3000);
    console.log('✅ Formulário encontrado:', form);
    
    // Verificar campos principais
    const campos = {
      obra: document.querySelector('input[placeholder*="obra" i], div[class*="obra" i] input, input[name*="obra" i]'),
      dataCompra: document.querySelector('input[type="date"], input[name*="data" i]'),
      material: document.querySelector('input[placeholder*="material" i], input[name*="material" i]'),
      quantidade: document.querySelector('input[type="number"], input[name*="quantidade" i], input[placeholder*="quantidade" i]'),
      valorUnitario: document.querySelector('input[name*="valor" i], input[placeholder*="valor" i]'),
      botaoSalvar: document.querySelector('button[type="submit"], button:contains("Salvar")'),
      botaoAddItem: document.querySelector('button[class*="add" i], button:contains("Adicionar")')
    };
    
    console.log('\n📋 CAMPOS ENCONTRADOS:');
    Object.entries(campos).forEach(([nome, elemento]) => {
      if (elemento) {
        console.log(`✅ ${nome}:`, {
          tag: elemento.tagName,
          type: elemento.type,
          name: elemento.name,
          placeholder: elemento.placeholder,
          className: elemento.className
        });
      } else {
        console.log(`❌ ${nome}: NÃO ENCONTRADO`);
      }
    });
    
    console.log('\n2️⃣ TESTANDO PREENCHIMENTO...');
    
    // Testar preenchimento da obra
    if (campos.obra) {
      console.log('Testando campo obra...');
      campos.obra.focus();
      campos.obra.value = 'Teste';
      campos.obra.dispatchEvent(new Event('input', { bubbles: true }));
      campos.obra.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Campo obra preenchido');
    }
    
    // Testar preenchimento da data
    if (campos.dataCompra) {
      console.log('Testando campo data...');
      campos.dataCompra.focus();
      campos.dataCompra.value = '2024-01-15';
      campos.dataCompra.dispatchEvent(new Event('input', { bubbles: true }));
      campos.dataCompra.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Campo data preenchido');
    }
    
    // Testar preenchimento do material
    if (campos.material) {
      console.log('Testando campo material...');
      campos.material.focus();
      campos.material.value = 'Cimento';
      campos.material.dispatchEvent(new Event('input', { bubbles: true }));
      campos.material.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('✅ Campo material preenchido');
    }
    
    // Aguardar um pouco para processar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n3️⃣ VERIFICANDO ERROS...');
    const erros = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error" i]');
    console.log('Erros visíveis:', erros.length);
    erros.forEach((erro, index) => {
      console.log(`Erro ${index + 1}:`, erro.textContent.trim());
    });
    
    console.log('\n4️⃣ TESTANDO SUBMISSÃO...');
    if (campos.botaoSalvar) {
      console.log('Clicando no botão salvar...');
      campos.botaoSalvar.click();
      
      // Aguardar e verificar novos erros
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const novosErros = document.querySelectorAll('.text-red-500, .text-red-600, .text-red-700, .error, [class*="error" i]');
      console.log('Erros após submissão:', novosErros.length);
      novosErros.forEach((erro, index) => {
        console.log(`Novo erro ${index + 1}:`, erro.textContent.trim());
      });
    }
    
    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error);
    console.log('\n🔍 INFORMAÇÕES DE DEBUG:');
    console.log('- Body HTML (primeiros 1000 chars):', document.body.innerHTML.substring(0, 1000));
    console.log('- Todos os inputs:', document.querySelectorAll('input'));
    console.log('- Todos os botões:', document.querySelectorAll('button'));
  }
}

// Executar teste
testarPaginaCompras();