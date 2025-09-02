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
    WEASYPRINT_AVAILABLE = False

# Handle image processing imports
try:
    from PIL import Image, ImageDraw, ImageFont
    from pdf2image import convert_from_bytes
    IMAGE_PROCESSING_AVAILABLE = True
except ImportError as e:
    IMAGE_PROCESSING_AVAILABLE = False

# Handle office file processing imports
try:
    import docx
    import openpyxl
    OFFICE_PROCESSING_AVAILABLE = True
except ImportError:
    OFFICE_PROCESSING_AVAILABLE = False


def docx_to_html(file_content):
    """
    Converts the content of a .docx file to a simple HTML string.
    """
    if not OFFICE_PROCESSING_AVAILABLE:
        return "<html><body><p>DOCX processing library not available.</p></body></html>"
    try:
        document = docx.Document(BytesIO(file_content))
        html = "<html><body>"
        html += "<h1>Documento Word</h1>"
        for para in document.paragraphs:
            html += f"<p>{para.text}</p>"
        for table in document.tables:
            html += "<table border='1' style='border-collapse: collapse; width: 100%;'>"
            for row in table.rows:
                html += "<tr>"
                for cell in row.cells:
                    html += f"<td style='padding: 4px;'>{cell.text}</td>"
                html += "</tr>"
            html += "</table><br>"
        html += "</body></html>"
        return html
    except Exception as e:
        return f"<html><body><p>Error converting DOCX: {e}</p></body></html>"

def xlsx_to_html(file_content):
    """
    Converts the content of a .xlsx file to an HTML table string.
    """
    if not OFFICE_PROCESSING_AVAILABLE:
        return "<html><body><p>XLSX processing library not available.</p></body></html>"
    try:
        workbook = openpyxl.load_workbook(BytesIO(file_content))
        sheet = workbook.active
        html = "<html><body>"
        html += "<h1>Planilha Excel</h1>"
        html += "<table border='1' style='border-collapse: collapse; width: 100%;'>"
        for row in sheet.iter_rows():
            html += "<tr>"
            for cell in row:
                cell_value = cell.value if cell.value is not None else ""
                html += f"<td style='padding: 4px;'>{cell_value}</td>"
            html += "</tr>"
        html += "</table>"
        html += "</body></html>"
        return html
    except Exception as e:
        return f"<html><body><p>Error converting XLSX: {e}</p></body></html>"

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


def process_attachments_for_pdf(attachments):
    """
    Processes various attachment types for inclusion in a PDF.
    - Converts PDFs to images.
    - Converts DOCX/XLSX to HTML, then to an image.
    - Prepares images for base64 embedding.
    Accepts a list of attachment model instances (e.g., ArquivoObra, AnexoCompra).
    """
    if not IMAGE_PROCESSING_AVAILABLE or not WEASYPRINT_AVAILABLE:
        return []
    
    processed_attachments = []
    
    for anexo in attachments:
        try:
            # Generic attribute access
            file_field = getattr(anexo, 'arquivo', getattr(anexo, 'anexo', None))
            if not file_field:
                file_field = getattr(anexo, 'imagem', None) # Fallback for FotoObra
            if not file_field:
                continue

            nome_arquivo = getattr(anexo, 'nome_original', os.path.basename(file_field.name))
            descricao_anexo = getattr(anexo, 'descricao', '')
            
            file_field.seek(0)
            file_content = file_field.read()
            file_field.seek(0)
            
            file_extension = nome_arquivo.lower().split('.')[-1] if nome_arquivo else ''
            img_base64 = None
            
            if file_extension == 'pdf':
                try:
                    images = convert_from_bytes(file_content, first_page=1, last_page=1, dpi=150)
                    if images:
                        img = images[0]
                        buffer = BytesIO()
                        img.save(buffer, format='PNG')
                        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                except Exception as pdf_error:
                    print(f"Error converting PDF {nome_arquivo}: {pdf_error}")
                    # Create a placeholder image indicating the error
                    try:
                        font = ImageFont.truetype("arial.ttf", 15)
                    except IOError:
                        font = ImageFont.load_default()

                    img = Image.new('RGB', (800, 200), color = (230, 230, 230))
                    d = ImageDraw.Draw(img)
                    d.text((10,10), f"Could not render PDF: {nome_arquivo}", fill=(0,0,0), font=font)
                    d.text((10,35), "Reason: Missing system dependency 'poppler'.", fill=(0,0,0), font=font)
                    buffer = BytesIO()
                    img.save(buffer, format='PNG')
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    
            elif file_extension in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']:
                try:
                    img = Image.open(BytesIO(file_content))
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    buffer = BytesIO()
                    img.save(buffer, format='JPEG')
                    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                except Exception as img_error:
                    print(f"Error processing image {nome_arquivo}: {img_error}")
                    continue

            elif file_extension == 'docx':
                html_content = docx_to_html(file_content)
                png_bytes = HTML(string=html_content).write_png()
                img_base64 = base64.b64encode(png_bytes).decode('utf-8')

            elif file_extension == 'xlsx':
                html_content = xlsx_to_html(file_content)
                png_bytes = HTML(string=html_content).write_png()
                img_base64 = base64.b64encode(png_bytes).decode('utf-8')

            if img_base64:
                processed_attachments.append({
                    'nome': nome_arquivo,
                    'descricao': descricao_anexo,
                    'is_image': True,
                    'base64_data': img_base64
                })
                    
        except Exception as e:
            print(f"Error processing attachment ID {anexo.id}: {e}")
            continue
    
    return processed_attachments