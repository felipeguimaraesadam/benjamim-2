// DEBUGGING CRÍTICO - 18ª TENTATIVA - ANÁLISE COMPLETA
// Execute este script no console do navegador (F12) na página /compras/nova

window.debugValidationCritical = {
    // Interceptar o estado real do React
    getReactState() {
        console.log('🔍 INTERCEPTANDO ESTADO REACT...');
        
        // Tentar encontrar o componente React
        const reactRoot = document.querySelector('#root');
        if (reactRoot && reactRoot._reactInternalFiber) {
            console.log('✅ React Fiber encontrado');
        }
        
        // Interceptar através do DOM
        const form = document.querySelector('form');
        if (form) {
            console.log('✅ Formulário encontrado:', form);
            
            // Capturar todos os inputs de itens
            const materialInputs = document.querySelectorAll('input[placeholder*="material"], input[placeholder*="Material"]');
            const quantidadeInputs = document.querySelectorAll('input[type="number"]');
            const valorInputs = document.querySelectorAll('input[placeholder*="valor"], input[placeholder*="Valor"]');
            
            console.log('📋 INPUTS ENCONTRADOS:');
            console.log('   Materiais:', materialInputs.length);
            console.log('   Quantidades:', quantidadeInputs.length);
            console.log('   Valores:', valorInputs.length);
            
            // Capturar valores reais dos inputs
            const itensReais = [];
            const linhasItens = document.querySelectorAll('tr');
            
            linhasItens.forEach((linha, index) => {
                const materialInput = linha.querySelector('input[placeholder*="material"], input[placeholder*="Material"]');
                const quantidadeInput = linha.querySelector('input[type="number"]');
                const valorInput = linha.querySelector('input[placeholder*="valor"], input[placeholder*="Valor"]');
                
                if (materialInput || quantidadeInput || valorInput) {
                    const item = {
                        linha: index,
                        material: materialInput ? materialInput.value : '',
                        quantidade: quantidadeInput ? quantidadeInput.value : '',
                        valor: valorInput ? valorInput.value : ''
                    };
                    
                    if (item.material || item.quantidade || item.valor) {
                        itensReais.push(item);
                    }
                }
            });
            
            console.log('📦 ITENS CAPTURADOS DO DOM:', itensReais);
            return itensReais;
        }
        
        return [];
    },
    
    // Interceptar a função de validação
    interceptValidation() {
        console.log('🎯 INTERCEPTANDO VALIDAÇÃO...');
        
        // Tentar encontrar e interceptar a função de submit
        const submitButton = document.querySelector('button[type="submit"], button:contains("Salvar")');
        if (submitButton) {
            console.log('✅ Botão de submit encontrado:', submitButton);
            
            // Adicionar listener para interceptar o click
            submitButton.addEventListener('click', (e) => {
                console.log('🚨 SUBMIT INTERCEPTADO!');
                
                // Capturar estado no momento do submit
                const itensNoMomento = this.getReactState();
                console.log('📊 ITENS NO MOMENTO DO SUBMIT:', itensNoMomento);
                
                // Simular a validação que deveria acontecer
                const itensValidos = itensNoMomento.filter(item => {
                    const materialOk = item.material && item.material.trim() !== '';
                    const quantidadeOk = item.quantidade && !isNaN(parseFloat(item.quantidade));
                    const valorOk = item.valor && !isNaN(parseFloat(item.valor));
                    
                    console.log(`🔍 Item ${item.linha}:`, {
                        material: item.material,
                        materialOk,
                        quantidade: item.quantidade,
                        quantidadeOk,
                        valor: item.valor,
                        valorOk,
                        valido: materialOk && quantidadeOk && valorOk
                    });
                    
                    return materialOk && quantidadeOk && valorOk;
                });
                
                console.log('✅ ITENS VÁLIDOS ENCONTRADOS:', itensValidos.length);
                console.log('📋 DETALHES DOS ITENS VÁLIDOS:', itensValidos);
                
                if (itensValidos.length === 0) {
                    console.log('❌ PROBLEMA IDENTIFICADO: Nenhum item válido encontrado!');
                    console.log('🔧 POSSÍVEIS CAUSAS:');
                    console.log('   1. Inputs não estão sendo capturados corretamente');
                    console.log('   2. Valores não estão sendo lidos corretamente');
                    console.log('   3. Lógica de validação está incorreta');
                } else {
                    console.log('✅ ITENS VÁLIDOS ENCONTRADOS - VALIDAÇÃO DEVERIA PASSAR!');
                }
            });
        }
    },
    
    // Monitorar mudanças nos inputs
    monitorInputs() {
        console.log('👀 MONITORANDO MUDANÇAS NOS INPUTS...');
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    // Re-interceptar quando o DOM muda
                    setTimeout(() => {
                        this.interceptValidation();
                    }, 100);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['value']
        });
        
        // Também monitorar eventos de input
        document.addEventListener('input', (e) => {
            if (e.target.type === 'text' || e.target.type === 'number') {
                console.log('📝 INPUT MUDOU:', {
                    elemento: e.target,
                    valor: e.target.value,
                    placeholder: e.target.placeholder
                });
            }
        });
    },
    
    // Executar análise completa
    runCompleteAnalysis() {
        console.log('🚀 INICIANDO ANÁLISE CRÍTICA COMPLETA...');
        console.log('=' .repeat(60));
        
        // 1. Capturar estado atual
        const estadoAtual = this.getReactState();
        
        // 2. Interceptar validação
        this.interceptValidation();
        
        // 3. Monitorar mudanças
        this.monitorInputs();
        
        console.log('=' .repeat(60));
        console.log('✅ ANÁLISE CONFIGURADA!');
        console.log('📋 PRÓXIMOS PASSOS:');
        console.log('   1. Preencha o formulário com dados válidos');
        console.log('   2. Clique em "Salvar"');
        console.log('   3. Observe o console para ver onde está o problema');
        console.log('=' .repeat(60));
        
        return estadoAtual;
    }
};

// Executar automaticamente
console.log('🧪 DEBUGGING CRÍTICO - 18ª TENTATIVA');
window.debugValidationCritical.runCompleteAnalysis();

// Comandos disponíveis
console.log('\n🎯 COMANDOS DISPONÍVEIS:');
console.log('debugValidationCritical.getReactState() - Capturar estado atual');
console.log('debugValidationCritical.runCompleteAnalysis() - Executar análise completa');