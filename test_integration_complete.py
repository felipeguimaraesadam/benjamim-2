#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste de Integração Completo do Sistema de Monitoramento
Este script verifica todas as funcionalidades implementadas conforme docs/implementar.md

Funcionalidades testadas:
1. Sistema de logging backend (Django)
2. Endpoint frontend-error-log
3. Integração frontend-backend
4. Performance e stress tests
5. Testes de regressão
"""

import requests
import json
import time
import logging
import sys
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('integration_test.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

class IntegrationTester:
    def __init__(self):
        self.backend_url = "http://127.0.0.1:8000"
        self.frontend_url = "http://localhost:5173"
        # self.api_endpoint = f"{self.backend_url}/api/frontend-error-log/"  # Temporariamente desabilitado
        self.test_results = []
        self.start_time = None
        
    def log_test_result(self, test_name: str, status: str, details: str, duration: float = 0):
        """Registra resultado de um teste"""
        result = {
            "test_name": test_name,
            "status": status,
            "details": details,
            "duration_ms": round(duration * 1000, 2),
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status_emoji = "✅" if status == "PASS" else "❌"
        logger.info(f"{status_emoji} {test_name}: {details} ({duration*1000:.1f}ms)")
    
    def test_server_availability(self):
        """Testa se os servidores estão rodando"""
        logger.info("🔍 Testando disponibilidade dos servidores...")
        
        # Teste Backend
        start = time.time()
        try:
            response = requests.get(f"{self.backend_url}/admin/", timeout=5)
            duration = time.time() - start
            if response.status_code in [200, 302]:  # 302 = redirect para login
                self.log_test_result(
                    "Backend Server Availability", 
                    "PASS", 
                    f"Backend respondendo (status: {response.status_code})",
                    duration
                )
            else:
                self.log_test_result(
                    "Backend Server Availability", 
                    "FAIL", 
                    f"Backend não respondeu adequadamente (status: {response.status_code})",
                    duration
                )
        except Exception as e:
            duration = time.time() - start
            self.log_test_result(
                "Backend Server Availability", 
                "FAIL", 
                f"Erro ao conectar com backend: {str(e)}",
                duration
            )
        
        # Teste Frontend
        start = time.time()
        try:
            response = requests.get(self.frontend_url, timeout=5)
            duration = time.time() - start
            if response.status_code == 200:
                self.log_test_result(
                    "Frontend Server Availability", 
                    "PASS", 
                    f"Frontend respondendo (status: {response.status_code})",
                    duration
                )
            else:
                self.log_test_result(
                    "Frontend Server Availability", 
                    "FAIL", 
                    f"Frontend não respondeu adequadamente (status: {response.status_code})",
                    duration
                )
        except Exception as e:
            duration = time.time() - start
            self.log_test_result(
                "Frontend Server Availability", 
                "FAIL", 
                f"Erro ao conectar com frontend: {str(e)}",
                duration
            )
    
    def test_error_logging_endpoint(self):
        """Testa o endpoint de logging de erros"""
        logger.info("🔍 Testando endpoint de logging de erros...")
        
        test_cases = [
            {
                "name": "Error Log - JavaScript Error",
                "data": {
                    "type": "javascript",
                    "message": "TypeError: Cannot read property 'test' of undefined",
                    "url": "http://localhost:5173/dashboard",
                    "line": 42,
                    "column": 15,
                    "stack": "Error at line 42:15",
                    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "timestamp": datetime.now().isoformat()
                }
            },
            {
                "name": "Error Log - Network Error",
                "data": {
                    "type": "network",
                    "message": "Failed to fetch data from API",
                    "url": "http://localhost:5173/obras",
                    "status": 500,
                    "timestamp": datetime.now().isoformat()
                }
            },
            {
                "name": "Error Log - User Action Error",
                "data": {
                    "type": "user_action",
                    "message": "Form validation failed",
                    "url": "http://localhost:5173/obras/new",
                    "action": "form_submit",
                    "timestamp": datetime.now().isoformat()
                }
            }
        ]
        
        for test_case in test_cases:
            start = time.time()
            try:
                response = requests.post(
                    self.api_endpoint,
                    json=test_case["data"],
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                duration = time.time() - start
                
                if response.status_code == 200:
                    self.log_test_result(
                        test_case["name"],
                        "PASS",
                        f"Log registrado com sucesso (status: {response.status_code})",
                        duration
                    )
                else:
                    self.log_test_result(
                        test_case["name"],
                        "FAIL",
                        f"Falha ao registrar log (status: {response.status_code})",
                        duration
                    )
            except Exception as e:
                duration = time.time() - start
                self.log_test_result(
                    test_case["name"],
                    "FAIL",
                    f"Erro na requisição: {str(e)}",
                    duration
                )
    
    def test_performance_stress(self):
        """Testa performance sob carga"""
        logger.info("🔍 Testando performance sob carga...")
        
        def send_error_log(i):
            try:
                data = {
                    "type": "stress_test",
                    "message": f"Stress test error #{i}",
                    "url": "http://localhost:5173/stress-test",
                    "timestamp": datetime.now().isoformat()
                }
                response = requests.post(
                    self.api_endpoint,
                    json=data,
                    headers={"Content-Type": "application/json"},
                    timeout=5
                )
                return response.status_code == 200
            except:
                return False
        
        # Teste com 100 requisições simultâneas
        start = time.time()
        num_requests = 100
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(send_error_log, i) for i in range(num_requests)]
            results = [future.result() for future in as_completed(futures)]
        
        duration = time.time() - start
        success_count = sum(results)
        success_rate = (success_count / num_requests) * 100
        
        if success_rate >= 95:  # 95% de sucesso é aceitável
            self.log_test_result(
                "Performance Stress Test",
                "PASS",
                f"Taxa de sucesso: {success_rate:.1f}% ({success_count}/{num_requests}) em {duration:.2f}s",
                duration
            )
        else:
            self.log_test_result(
                "Performance Stress Test",
                "FAIL",
                f"Taxa de sucesso baixa: {success_rate:.1f}% ({success_count}/{num_requests})",
                duration
            )
    
    def test_data_validation(self):
        """Testa validação de dados"""
        logger.info("🔍 Testando validação de dados...")
        
        test_cases = [
            {
                "name": "Validation - Empty Data",
                "data": {},
                "expected_status": [200, 400]  # Ambos são aceitáveis
            },
            {
                "name": "Validation - Invalid JSON",
                "data": "invalid json",
                "expected_status": [400, 500]
            },
            {
                "name": "Validation - Very Large Message",
                "data": {
                    "type": "test",
                    "message": "A" * 10000,  # 10KB de dados
                    "timestamp": datetime.now().isoformat()
                },
                "expected_status": [200, 413]  # 413 = Payload Too Large
            },
            {
                "name": "Validation - Special Characters",
                "data": {
                    "type": "test",
                    "message": "Erro com caracteres especiais: áéíóú çñü 🚀 💻 ⚡",
                    "url": "http://localhost:5173/test?param=value&other=测试",
                    "timestamp": datetime.now().isoformat()
                },
                "expected_status": [200]
            }
        ]
        
        for test_case in test_cases:
            start = time.time()
            try:
                if isinstance(test_case["data"], str):
                    # Teste com JSON inválido
                    response = requests.post(
                        self.api_endpoint,
                        data=test_case["data"],
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                else:
                    response = requests.post(
                        self.api_endpoint,
                        json=test_case["data"],
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                
                duration = time.time() - start
                
                if response.status_code in test_case["expected_status"]:
                    self.log_test_result(
                        test_case["name"],
                        "PASS",
                        f"Validação funcionou corretamente (status: {response.status_code})",
                        duration
                    )
                else:
                    self.log_test_result(
                        test_case["name"],
                        "FAIL",
                        f"Status inesperado: {response.status_code} (esperado: {test_case['expected_status']})",
                        duration
                    )
            except Exception as e:
                duration = time.time() - start
                self.log_test_result(
                    test_case["name"],
                    "FAIL",
                    f"Erro na requisição: {str(e)}",
                    duration
                )
    
    def test_http_methods(self):
        """Testa diferentes métodos HTTP"""
        logger.info("🔍 Testando métodos HTTP...")
        
        methods = [
            {"method": "GET", "expected": [200], "should_work": True},
            {"method": "POST", "expected": [200], "should_work": True},
            {"method": "PUT", "expected": [405], "should_work": False},
            {"method": "DELETE", "expected": [405], "should_work": False},
            {"method": "PATCH", "expected": [405], "should_work": False}
        ]
        
        for method_test in methods:
            start = time.time()
            try:
                if method_test["method"] == "GET":
                    response = requests.get(self.api_endpoint, timeout=5)
                elif method_test["method"] == "POST":
                    response = requests.post(
                        self.api_endpoint,
                        json={"type": "test", "message": "test"},
                        timeout=5
                    )
                elif method_test["method"] == "PUT":
                    response = requests.put(self.api_endpoint, timeout=5)
                elif method_test["method"] == "DELETE":
                    response = requests.delete(self.api_endpoint, timeout=5)
                elif method_test["method"] == "PATCH":
                    response = requests.patch(self.api_endpoint, timeout=5)
                
                duration = time.time() - start
                
                if response.status_code in method_test["expected"]:
                    action = "aceito" if method_test["should_work"] else "rejeitado corretamente"
                    self.log_test_result(
                        f"HTTP Method - {method_test['method']}",
                        "PASS",
                        f"Método {action} (status: {response.status_code})",
                        duration
                    )
                else:
                    self.log_test_result(
                        f"HTTP Method - {method_test['method']}",
                        "FAIL",
                        f"Status inesperado: {response.status_code} (esperado: {method_test['expected']})",
                        duration
                    )
            except Exception as e:
                duration = time.time() - start
                self.log_test_result(
                    f"HTTP Method - {method_test['method']}",
                    "FAIL",
                    f"Erro na requisição: {str(e)}",
                    duration
                )
    
    def generate_report(self):
        """Gera relatório final dos testes"""
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["status"] == "PASS"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        total_duration = time.time() - self.start_time
        
        report = {
            "summary": {
                "total_tests": total_tests,
                "passed_tests": passed_tests,
                "failed_tests": failed_tests,
                "success_rate": round(success_rate, 2),
                "total_duration_seconds": round(total_duration, 2)
            },
            "test_results": self.test_results,
            "timestamp": datetime.now().isoformat(),
            "environment": {
                "backend_url": self.backend_url,
                "frontend_url": self.frontend_url,
                "python_version": sys.version
            }
        }
        
        # Salva relatório
        report_file = f"integration_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # Log do resumo
        logger.info("\n" + "="*60)
        logger.info("📊 RELATÓRIO FINAL DOS TESTES DE INTEGRAÇÃO")
        logger.info("="*60)
        logger.info(f"Total de testes: {total_tests}")
        logger.info(f"Testes aprovados: {passed_tests}")
        logger.info(f"Testes falharam: {failed_tests}")
        logger.info(f"Taxa de sucesso: {success_rate:.1f}%")
        logger.info(f"Duração total: {total_duration:.2f}s")
        logger.info(f"Relatório salvo em: {report_file}")
        
        if failed_tests > 0:
            logger.info("\n❌ TESTES QUE FALHARAM:")
            for result in self.test_results:
                if result["status"] == "FAIL":
                    logger.info(f"  - {result['test_name']}: {result['details']}")
        
        if success_rate == 100:
            logger.info("\n🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.")
        elif success_rate >= 90:
            logger.info("\n⚠️  Sistema funcionando bem, mas há alguns problemas menores.")
        else:
            logger.info("\n🚨 ATENÇÃO: Sistema com problemas significativos!")
        
        logger.info("\n📋 PRÓXIMOS PASSOS:")
        logger.info("1. Execute este script regularmente para detectar regressões")
        logger.info("2. Integre no pipeline de CI/CD")
        logger.info("3. Configure alertas para falhas")
        logger.info("4. Monitore logs de produção")
        
        return report
    
    def run_all_tests(self):
        """Executa todos os testes"""
        self.start_time = time.time()
        
        logger.info("🚀 Iniciando testes de integração completos...")
        logger.info(f"Backend: {self.backend_url}")
        logger.info(f"Frontend: {self.frontend_url}")
        logger.info("="*60)
        
        try:
            self.test_server_availability()
            self.test_error_logging_endpoint()
            self.test_data_validation()
            self.test_http_methods()
            self.test_performance_stress()
            
        except KeyboardInterrupt:
            logger.info("\n⏹️  Testes interrompidos pelo usuário")
        except Exception as e:
            logger.error(f"\n💥 Erro inesperado durante os testes: {str(e)}")
        finally:
            return self.generate_report()

def main():
    """Função principal"""
    print("🔧 Sistema de Testes de Integração - SGO")
    print("Verificando funcionalidades de monitoramento e debugging...\n")
    
    tester = IntegrationTester()
    report = tester.run_all_tests()
    
    # Retorna código de saída baseado no resultado
    if report["summary"]["failed_tests"] == 0:
        sys.exit(0)  # Sucesso
    else:
        sys.exit(1)  # Falha

if __name__ == "__main__":
    main()