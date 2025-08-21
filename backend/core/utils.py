from django.http import HttpResponse
from django.template.loader import render_to_string
from django.conf import settings
import os
import base64
from io import BytesIO

# Handle weasyprint import gracefully
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except Exception as e:
    # If weasyprint fails to import, create dummy classes

# Handle image processing imports
try:
    from PIL import Image
    from pdf2image import convert_from_bytes
    IMAGE_PROCESSING_AVAILABLE = True
except ImportError as e:
    IMAGE_PROCESSING_AVAILABLE = False
    class HTML:
        def __init__(self, *args, **kwargs):
            pass
        def write_pdf(self, *args, **kwargs):
            raise ImportError("WeasyPrint is not available")
    
    class CSS:
        def __init__(self, *args, **kwargs):
            pass
    
    WEASYPRINT_AVAILABLE = False

def generate_pdf_response(template_name, context, css_path, filename):
    """
    Gera uma resposta HTTP com um PDF a partir de um template HTML.
    """
    if not WEASYPRINT_AVAILABLE:
        return HttpResponse("PDF generation is not available. WeasyPrint could not be loaded.", status=500)
    
    html_string = render_to_string(template_name, context)
    
    try:
        css_string = open(css_path, 'r').read()
    except FileNotFoundError:
        return HttpResponse("CSS file not found.", status=500)

    try:
        html = HTML(string=html_string, base_url=settings.STATIC_ROOT)
        css = CSS(string=css_string)
        
        pdf_file = html.write_pdf(stylesheets=[css])
        
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    except Exception as e:
        return HttpResponse(f"Error generating PDF: {str(e)}", status=500)


def process_anexos_for_pdf(anexos):
    """
    Processa anexos para inclusão no PDF.
    Converte PDFs em imagens e prepara imagens para base64.
    """
    if not IMAGE_PROCESSING_AVAILABLE:
        return []
    
    processed_anexos = []
    
    for anexo in anexos:
        try:
            # Ler o arquivo
            anexo.anexo.seek(0)
            file_content = anexo.anexo.read()
            anexo.anexo.seek(0)  # Reset para uso posterior
            
            file_extension = anexo.nome_arquivo.lower().split('.')[-1] if anexo.nome_arquivo else ''
            
            if file_extension == 'pdf':
                # Converter PDF para imagem
                try:
                    images = convert_from_bytes(file_content, first_page=1, last_page=1, dpi=150)
                    if images:
                        # Usar apenas a primeira página
                        img = images[0]
                        
                        # Redimensionar se necessário
                        max_width = 800
                        if img.width > max_width:
                            ratio = max_width / img.width
                            new_height = int(img.height * ratio)
                            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        
                        # Converter para base64
                        buffer = BytesIO()
                        img.save(buffer, format='PNG')
                        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                        
                        processed_anexos.append({
                            'nome': anexo.nome_arquivo or f'Anexo PDF {anexo.id}',
                            'descricao': anexo.descricao or '',
                            'is_image': True,
                            'format': 'png',
                            'base64_data': img_base64
                        })
                except Exception as pdf_error:
                    print(f"Erro ao converter PDF {anexo.nome_arquivo}: {pdf_error}")
                    continue
                    
            elif file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']:
                # Processar imagem diretamente
                try:
                    img = Image.open(BytesIO(file_content))
                    
                    # Converter para RGB se necessário
                    if img.mode in ('RGBA', 'LA', 'P'):
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                        img = background
                    
                    # Redimensionar se necessário
                    max_width = 800
                    if img.width > max_width:
                        ratio = max_width / img.width
                        new_height = int(img.height * ratio)
                        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                    
                    # Converter para base64
                    buffer = BytesIO()
                    format_map = {'jpg': 'jpeg', 'jpeg': 'jpeg', 'png': 'png', 'gif': 'png', 'bmp': 'png', 'webp': 'png'}
                    save_format = format_map.get(file_extension, 'png')
                    img.save(buffer, format=save_format.upper())
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    
                    processed_anexos.append({
                        'nome': anexo.nome_arquivo or f'Anexo {anexo.id}',
                        'descricao': anexo.descricao or '',
                        'is_image': True,
                        'format': save_format,
                        'base64_data': img_base64
                    })
                except Exception as img_error:
                    print(f"Erro ao processar imagem {anexo.nome_arquivo}: {img_error}")
                    continue
                    
        except Exception as e:
            print(f"Erro ao processar anexo {anexo.id}: {e}")
            continue
    
    return processed_anexos