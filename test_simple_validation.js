// TESTE FINAL - VALIDAÇÃO DE COMPRA SEM PRODUTOS
// Execute este código no console do navegador (F12) na página de nova compra

console.log('🚨 TESTE CRÍTICO: Verificando se a validação está funcionando');

// Função principal de teste
function testeValidacaoFinal() {
    console.log('\n=== INICIANDO TESTE DE VALIDAÇÃO ===');
    
    // 1. Verificar se estamos na página correta
    if (!window.location.pathname.includes('compras') || !window.location.pathname.includes('nova')) {
        console.error('❌ ERRO: Não estamos na página de nova compra!');
        console.log('   URL atual:', window.location.pathname);
        return;
    }
    
    console.log('✅ Estamos na página de nova compra');
    
    // 2. Verificar estado inicial do formulário
    verificarEstadoFormulario();
    
    // 3. Preencher apenas campos básicos (SEM ITENS)
    preencherCamposBasicos();
    
    // 4. Tentar salvar
    setTimeout(() => {
        tentarSalvar();
    }, 1000);
}

// Verificar estado do formulário
function verificarEstadoFormulario() {
    console.log('\n📋 ESTADO ATUAL DO FORMULÁRIO:');
    
    // Verificar campos básicos
    const obra = document.querySelector('input[name="obraId"], select[name="obraId"]');
    const dataCompra = document.querySelector('input[name="dataCompra"]');
    const fornecedor = document.querySelector('input[name="fornecedor"]');
    
    console.log('- Obra:', obra ? obra.value || 'vazio' : 'não encontrado');
    console.log('- Data:', dataCompra ? dataCompra.value || 'vazio' : 'não encontrado');
    console.log('- Fornecedor:', fornecedor ? fornecedor.value || 'vazio' : 'não encontrado');
    
    // Verificar itens na tabela
    const linhasItens = document.querySelectorAll('table tbody tr');
    console.log(`- Itens na tabela: ${linhasItens.length}`);
    
    linhasItens.forEach((linha, index) => {
        const material = linha.querySelector('input[name*="material"], td:first-child');
        const quantidade = linha.querySelector('input[name*="quantidade"]');
        const valor = linha.querySelector('input[name*="valor"]');
        
        console.log(`  Item ${index + 1}:`);
        console.log(`    Material: ${material ? (material.value || material.textContent || 'vazio') : 'não encontrado'}`);
        console.log(`    Quantidade: ${quantidade ? (quantidade.value || 'vazio') : 'não encontrado'}`);
        console.log(`    Valor: ${valor ? (valor.value || 'vazio') : 'não encontrado'}`);
    });
}

// Preencher apenas campos básicos
function preencherCamposBasicos() {
    console.log('\n📝 PREENCHENDO CAMPOS BÁSICOS (SEM ITENS):');
    
    try {
        // Preencher data da compra
        const dataCompra = document.querySelector('input[name="dataCompra"]');
        if (dataCompra) {
            const hoje = new Date().toISOString().split('T')[0];
            dataCompra.value = hoje;
            dataCompra.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Data preenchida:', hoje);
        }
        
        // Preencher obra (se for select)
        const selectObra = document.querySelector('select[name="obraId"]');
        if (selectObra && selectObra.options.length > 1) {
            selectObra.selectedIndex = 1; // Primeira opção válida
            selectObra.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Obra selecionada:', selectObra.options[1].text);
        }
        
        // Preencher fornecedor
        const fornecedor = document.querySelector('input[name="fornecedor"]');
        if (fornecedor) {
            fornecedor.value = 'Fornecedor Teste';
            fornecedor.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Fornecedor preenchido');
        }
        
        console.log('✅ Campos básicos preenchidos - NENHUM ITEM ADICIONADO');
        
    } catch (error) {
        console.error('❌ Erro ao preencher campos:', error);
    }
}

// Tentar salvar o formulário
function tentarSalvar() {
    console.log('\n🚨 TENTANDO SALVAR COMPRA SEM PRODUTOS...');
    
    try {
        // Encontrar botão de salvar
        const botaoSalvar = document.querySelector('button[type="submit"]') ||
                           document.querySelector('button:contains("Salvar")') ||
                           document.querySelector('.btn-primary') ||
                           Array.from(document.querySelectorAll('button')).find(btn => 
                               btn.textContent.toLowerCase().includes('salvar'));
        
        if (!botaoSalvar) {
            console.error('❌ Botão de salvar não encontrado!');
            return;
        }
        
        console.log('✅ Botão de salvar encontrado:', botaoSalvar.textContent);
        
        // Capturar URL atual antes do clique
        const urlAntes = window.location.href;
        console.log('📍 URL antes do clique:', urlAntes);
        
        // Clicar no botão
        console.log('🔄 Clicando no botão de salvar...');
        botaoSalvar.click();
        
        // Aguardar e verificar resultado
        setTimeout(() => {
            verificarResultadoTeste(urlAntes);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao tentar salvar:', error);
    }
}

// Verificar resultado do teste
function verificarResultadoTeste(urlAntes) {
    console.log('\n🔍 VERIFICANDO RESULTADO DO TESTE:');
    
    const urlDepois = window.location.href;
    console.log('📍 URL depois do clique:', urlDepois);
    
    // Verificar se redirecionou
    if (urlAntes !== urlDepois) {
        console.log('❌ PROBLEMA CRÍTICO: A página redirecionou!');
        console.log('   Isso indica que a compra foi salva SEM validação!');
        console.log('   🚨 A VALIDAÇÃO NÃO ESTÁ FUNCIONANDO! 🚨');
        return;
    }
    
    // Verificar mensagens de erro
    const erros = document.querySelectorAll('.alert-danger, .error, .text-danger, [class*="error"], .text-red-600');
    
    if (erros.length > 0) {
        console.log('✅ VALIDAÇÃO FUNCIONANDO! Mensagens de erro encontradas:');
        erros.forEach((erro, index) => {
            const texto = erro.textContent.trim();
            if (texto) {
                console.log(`   ${index + 1}. ${texto}`);
            }
        });
        
        // Verificar se há erro específico sobre itens
        const temErroItens = Array.from(erros).some(erro => 
            erro.textContent.toLowerCase().includes('item') ||
            erro.textContent.toLowerCase().includes('produto'));
        
        if (temErroItens) {
            console.log('✅ PERFEITO: Erro específico sobre itens/produtos encontrado!');
        } else {
            console.log('⚠️  ATENÇÃO: Erro encontrado, mas não específico sobre itens');
        }
        
    } else {
        console.log('❌ PROBLEMA CRÍTICO: Nenhuma mensagem de erro encontrada!');
        console.log('   🚨 A VALIDAÇÃO NÃO ESTÁ FUNCIONANDO! 🚨');
        
        // Verificar console para erros JavaScript
        console.log('   Verifique se há erros JavaScript no console que podem estar quebrando a validação.');
    }
    
    // Verificar se ainda estamos na página de nova compra
    if (window.location.pathname.includes('nova')) {
        console.log('✅ Permaneceu na página de nova compra (bom sinal)');
    } else {
        console.log('❌ PROBLEMA: Saiu da página de nova compra!');
    }
    
    console.log('\n📊 RESUMO DO TESTE:');
    console.log('- Campos básicos preenchidos: ✅');
    console.log('- Nenhum item adicionado: ✅');
    console.log('- Tentativa de salvar: ✅');
    console.log('- Resultado:', erros.length > 0 ? '✅ VALIDAÇÃO OK' : '❌ VALIDAÇÃO FALHOU');
}

// Executar teste automaticamente
console.log('🚀 Executando teste em 2 segundos...');
setTimeout(testeValidacaoFinal, 2000);

// Funções auxiliares para execução manual
window.testeValidacaoFinal = testeValidacaoFinal;
window.verificarEstadoFormulario = verificarEstadoFormulario;
window.preencherCamposBasicos = preencherCamposBasicos;
window.tentarSalvar = tentarSalvar;

console.log('\n📋 COMANDOS DISPONÍVEIS:');
console.log('- testeValidacaoFinal() - Executa o teste completo');
console.log('- verificarEstadoFormulario() - Mostra estado atual');
console.log('- preencherCamposBasicos() - Preenche campos sem itens');
console.log('- tentarSalvar() - Tenta salvar o formulário');