from django.http import HttpResponse
from django.template.loader import render_to_string
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
from PIL import Image
from pdf2image import convert_from_bytes
import base64
import io
import os
import logging

logger = logging.getLogger(__name__)


def generate_pdf_response(template_name, context, filename=None, css_string=None):
    """
    Gera uma resposta HTTP com PDF a partir de um template HTML.
    
    Args:
        template_name (str): Nome do template HTML
        context (dict): Contexto para renderização do template
        filename (str, optional): Nome do arquivo PDF para download
        css_string (str, optional): CSS customizado para o PDF
        
    Returns:
        HttpResponse: Resposta HTTP com o PDF gerado
    """
    try:
        # Renderiza o template HTML
        html_string = render_to_string(template_name, context)
        
        # Configuração de fontes
        font_config = FontConfiguration()
        
        # CSS base para PDFs
        base_css = CSS(string='''
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                font-family: Arial, sans-serif;
                font-size: 12px;
                line-height: 1.4;
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #333;
                padding-bottom: 10px;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                border-top: 1px solid #ccc;
                padding-top: 10px;
                font-size: 10px;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
            }
            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .mb-10 { margin-bottom: 10px; }
            .mt-10 { margin-top: 10px; }
        ''', font_config=font_config)
        
        # CSS customizado se fornecido
        stylesheets = [base_css]
        if css_string:
            custom_css = CSS(string=css_string, font_config=font_config)
            stylesheets.append(custom_css)
        
        # Gera o PDF
        html_doc = HTML(string=html_string)
        pdf_bytes = html_doc.write_pdf(stylesheets=stylesheets, font_config=font_config)
        
        # Cria a resposta HTTP
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        
        if filename:
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        else:
            response['Content-Disposition'] = 'inline'
            
        return response
        
    except Exception as e:
        logger.error(f"Erro ao gerar PDF: {str(e)}")
        raise Exception(f"Erro ao gerar PDF: {str(e)}")


def process_anexos_for_pdf(anexos_list):
    """
    Processa uma lista de anexos para inclusão em PDF.
    Converte PDFs e imagens para base64 para embedding.
    
    Args:
        anexos_list (list): Lista de objetos de anexo com atributo 'arquivo'
        
    Returns:
        list: Lista de dicionários com dados processados dos anexos
    """
    processed_anexos = []
    
    for anexo in anexos_list:
        try:
            if not anexo.arquivo:
                continue
                
            # Obtém informações do arquivo
            file_path = anexo.arquivo.path
            file_name = os.path.basename(file_path)
            file_extension = os.path.splitext(file_name)[1].lower()
            
            anexo_data = {
                'nome': file_name,
                'extensao': file_extension,
                'tipo': 'unknown',
                'base64': None,
                'erro': None
            }
            
            # Processa PDFs
            if file_extension == '.pdf':
                anexo_data['tipo'] = 'pdf'
                try:
                    with open(file_path, 'rb') as pdf_file:
                        pdf_bytes = pdf_file.read()
                    
                    # Converte primeira página do PDF para imagem
                    images = convert_from_bytes(pdf_bytes, first_page=1, last_page=1, dpi=150)
                    if images:
                        img = images[0]
                        # Redimensiona se muito grande
                        if img.width > 800:
                            ratio = 800 / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((800, new_height), Image.Resampling.LANCZOS)
                        
                        # Converte para base64
                        img_buffer = io.BytesIO()
                        img.save(img_buffer, format='PNG')
                        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
                        anexo_data['base64'] = f"data:image/png;base64,{img_base64}"
                        
                except Exception as e:
                    logger.warning(f"Erro ao processar PDF {file_name}: {str(e)}")
                    anexo_data['erro'] = f"Erro ao processar PDF: {str(e)}"
            
            # Processa imagens
            elif file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.bmp']:
                anexo_data['tipo'] = 'imagem'
                try:
                    with Image.open(file_path) as img:
                        # Converte para RGB se necessário
                        if img.mode in ('RGBA', 'LA', 'P'):
                            img = img.convert('RGB')
                        
                        # Redimensiona se muito grande
                        if img.width > 800:
                            ratio = 800 / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((800, new_height), Image.Resampling.LANCZOS)
                        
                        # Converte para base64
                        img_buffer = io.BytesIO()
                        img.save(img_buffer, format='JPEG', quality=85)
                        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
                        anexo_data['base64'] = f"data:image/jpeg;base64,{img_base64}"
                        
                except Exception as e:
                    logger.warning(f"Erro ao processar imagem {file_name}: {str(e)}")
                    anexo_data['erro'] = f"Erro ao processar imagem: {str(e)}"
            
            # Outros tipos de arquivo
            else:
                anexo_data['tipo'] = 'documento'
                anexo_data['base64'] = None  # Não processa outros tipos
            
            processed_anexos.append(anexo_data)
            
        except Exception as e:
            logger.error(f"Erro geral ao processar anexo: {str(e)}")
            processed_anexos.append({
                'nome': 'Arquivo com erro',
                'extensao': '',
                'tipo': 'erro',
                'base64': None,
                'erro': str(e)
            })
    
    return processed_anexos


def generate_report_pdf(title, data, template_name='reports/base_report.html', 
                       filename=None, custom_css=None):
    """
    Gera um PDF de relatório com formatação padrão.
    
    Args:
        title (str): Título do relatório
        data (dict): Dados para o relatório
        template_name (str): Nome do template a usar
        filename (str, optional): Nome do arquivo para download
        custom_css (str, optional): CSS customizado
        
    Returns:
        HttpResponse: Resposta HTTP com o PDF
    """
    context = {
        'title': title,
        'data': data,
        'generated_at': timezone.now(),
    }
    
    if not filename:
        filename = f"{title.lower().replace(' ', '_')}_report.pdf"
    
    return generate_pdf_response(
        template_name=template_name,
        context=context,
        filename=filename,
        css_string=custom_css
    )


def create_pdf_from_html(html_content, css_content=None, filename=None):
    """
    Cria um PDF diretamente a partir de conteúdo HTML.
    
    Args:
        html_content (str): Conteúdo HTML
        css_content (str, optional): Conteúdo CSS
        filename (str, optional): Nome do arquivo
        
    Returns:
        HttpResponse: Resposta HTTP com o PDF
    """
    try:
        font_config = FontConfiguration()
        
        stylesheets = []
        if css_content:
            stylesheets.append(CSS(string=css_content, font_config=font_config))
        
        html_doc = HTML(string=html_content)
        pdf_bytes = html_doc.write_pdf(stylesheets=stylesheets, font_config=font_config)
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        
        if filename:
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
        else:
            response['Content-Disposition'] = 'inline'
            
        return response
        
    except Exception as e:
        logger.error(f"Erro ao criar PDF: {str(e)}")
        raise Exception(f"Erro ao criar PDF: {str(e)}")


def validate_pdf_file(file):
    """
    Valida se um arquivo é um PDF válido.
    
    Args:
        file: Arquivo para validação
        
    Returns:
        bool: True se válido, False caso contrário
    """
    try:
        if not file:
            return False
            
        # Verifica extensão
        if not file.name.lower().endswith('.pdf'):
            return False
        
        # Verifica magic number do PDF
        file.seek(0)
        header = file.read(4)
        file.seek(0)
        
        return header == b'%PDF'
        
    except Exception:
        return False


def get_pdf_page_count(file_path):
    """
    Obtém o número de páginas de um arquivo PDF.
    
    Args:
        file_path (str): Caminho para o arquivo PDF
        
    Returns:
        int: Número de páginas ou 0 se erro
    """
    try:
        images = convert_from_bytes(open(file_path, 'rb').read())
        return len(images)
    except Exception as e:
        logger.error(f"Erro ao contar páginas do PDF: {str(e)}")
        return 0