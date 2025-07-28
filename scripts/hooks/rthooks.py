import sys
import os

if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    # When running from a PyInstaller bundle, we need to tell weasyprint
    # where to find its data files.
    from weasyprint import __main__
    __main__.find_stylesheets = lambda: []
    __main__.find_fonts = lambda: []

    # Add the bundled DLLs to the PATH
    os.environ['PATH'] = sys._MEIPASS + os.pathsep + os.environ.get('PATH', '')