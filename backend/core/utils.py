from django.http import HttpResponse
from django.template.loader import render_to_string
from django.conf import settings
import os
from weasyprint import HTML, CSS

def generate_pdf_response(template_name, context, css_path, filename):
    """
    Gera uma resposta HTTP com um PDF a partir de um template HTML.
    """
    html_string = render_to_string(template_name, context)
    
    try:
        css_string = open(css_path, 'r').read()
    except FileNotFoundError:
        return HttpResponse("CSS file not found.", status=500)

    html = HTML(string=html_string, base_url=settings.STATIC_ROOT)
    css = CSS(string=css_string)
    
    pdf_file = html.write_pdf(stylesheets=[css])
    
    response = HttpResponse(pdf_file, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    
    return response