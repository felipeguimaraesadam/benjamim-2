from django.http import HttpResponse
from django.template.loader import render_to_string
from django.conf import settings
import os

# Handle weasyprint import gracefully
try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except Exception as e:
    # If weasyprint fails to import, create dummy classes
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