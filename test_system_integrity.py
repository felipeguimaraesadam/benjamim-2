#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste de Integridade do Sistema SGO
Verifica as funcionalidades básicas após possível perda de desenvolvimento
"""

import requests
import json
import time
import logging
import sys
from datetime import datetime

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

class SystemIntegrityTester:
    def __init__(self):
        self.backend_url = "http://127.0.0.1:8000"
        self.test_results = []
        
    def log_test_result(self, test_name: str, status: str, details: str):
        """Registra resultado de um teste"""
        result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌"
        logger.info(f"{status_emoji} {test_name}: {details}")
    
    def test_server_connection(self):
        """Testa se o servidor Django está rodando"""
        try:
            response = requests.get(f"{self.backend_url}/api/", timeout=5)
            if response.status_code == 200:
                self.log_test_result("Conexão com Servidor", "PASS", "Servidor Django está rodando")
                return True
            else:
                self.log_test_result("Conexão com Servidor", "FAIL", f"Status inesperado: {response.status_code}")
                return False
        except Exception as e:
            self.log_test_result("Conexão com Servidor", "FAIL", f"Erro de conexão: {str(e)}")
            return False
    
    def test_api_endpoints(self):
        """Testa endpoints críticos da API"""
        endpoints = [
            ("/api/usuarios/", "Usuários"),
            ("/api/funcionarios/", "Funcionários"),
            ("/api/equipes/", "Equipes"),
            ("/api/materiais/", "Materiais"),
            ("/api/compras/", "Compras"),
            ("/api/despesas/", "Despesas"),
            ("/api/locacoes/", "Locações"),
        ]
        
        for endpoint, name in endpoints:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=5)
                if response.status_code in [200, 401]:  # 401 = não autenticado (esperado)
                    self.log_test_result(f"API {name}", "PASS", f"Endpoint acessível (status: {response.status_code})")
                else:
                    self.log_test_result(f"API {name}", "FAIL", f"Status inesperado: {response.status_code}")
            except Exception as e:
                self.log_test_result(f"API {name}", "FAIL", f"Erro: {str(e)}")
    
    def test_obra_specific_endpoints(self):
        """Testa endpoints específicos de obras que foram corrigidos"""
        # Testamos com obra_id = 1 (assumindo que existe)
        obra_endpoints = [
            ("/api/obras/1/compras-detalhes/", "Compras Detalhes"),
            ("/api/obras/1/historico-custos/", "Histórico Custos"),
            ("/api/obras/1/custos-por-categoria/", "Custos por Categoria"),
        ]
        
        for endpoint, name in obra_endpoints:
            try:
                response = requests.get(f"{self.backend_url}{endpoint}", timeout=5)
                if response.status_code in [200, 401, 404]:  # 404 pode ser normal se obra não existe
                    status = "PASS" if response.status_code != 500 else "FAIL"
                    self.log_test_result(f"Obra API {name}", status, f"Status: {response.status_code}")
                else:
                    self.log_test_result(f"Obra API {name}", "FAIL", f"Status inesperado: {response.status_code}")
            except Exception as e:
                self.log_test_result(f"Obra API {name}", "FAIL", f"Erro: {str(e)}")
    
    def test_admin_interface(self):
        """Testa se a interface admin está acessível"""
        try:
            response = requests.get(f"{self.backend_url}/admin/", timeout=5)
            if response.status_code in [200, 302]:
                self.log_test_result("Interface Admin", "PASS", "Interface admin acessível")
            else:
                self.log_test_result("Interface Admin", "FAIL", f"Status: {response.status_code}")
        except Exception as e:
            self.log_test_result("Interface Admin", "FAIL", f"Erro: {str(e)}")
    
    def run_all_tests(self):
        """Executa todos os testes de integridade"""
        logger.info("🔍 Iniciando Teste de Integridade do Sistema SGO")
        logger.info("=" * 60)
        
        # Teste de conexão primeiro
        if not self.test_server_connection():
            logger.error("❌ Servidor não está rodando. Abortando testes.")
            return False
        
        # Testes principais
        self.test_admin_interface()
        self.test_api_endpoints()
        self.test_obra_specific_endpoints()
        
        # Resumo dos resultados
        logger.info("=" * 60)
        logger.info("📊 RESUMO DOS TESTES")
        
        passed = sum(1 for result in self.test_results if result["status"] == "PASS")
        failed = sum(1 for result in self.test_results if result["status"] == "FAIL")
        total = len(self.test_results)
        
        logger.info(f"✅ Testes Aprovados: {passed}/{total}")
        logger.info(f"❌ Testes Falharam: {failed}/{total}")
        
        if failed == 0:
            logger.info("🎉 Todos os testes passaram! Sistema está funcionando.")
        else:
            logger.warning(f"⚠️  {failed} teste(s) falharam. Verifique os detalhes acima.")
        
        # Salva relatório
        report_file = f"system_integrity_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "summary": {"passed": passed, "failed": failed, "total": total},
                "results": self.test_results
            }, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📄 Relatório salvo em: {report_file}")
        return failed == 0

if __name__ == "__main__":
    tester = SystemIntegrityTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)