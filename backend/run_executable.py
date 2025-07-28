import os
import sys

# Suppress stderr to prevent weasyprint warnings from causing issues
if getattr(sys, 'frozen', False):
    from io import StringIO
    original_stderr = sys.stderr
    sys.stderr = StringIO()

# Add the bundled libraries to the path
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    os.environ['PATH'] = sys._MEIPASS + os.pathsep + os.environ.get('PATH', '')

import traceback
from pathlib import Path

# --- Primitive Logger (unchanged) ---
def primitive_log(message):
    try:
        if getattr(sys, 'frozen', False):
            base_dir = Path(sys.executable).parent
        else:
            base_dir = Path(__file__).resolve().parent.parent
        log_path = base_dir / 'primitive_debug.log'
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(f"{message}\n")
    except Exception:
        pass

# --- New diagnostic import ---
primitive_log("--- Starting new run ---")
if getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS'):
    meipass_path = Path(sys._MEIPASS)
    primitive_log(f"_MEIPASS={meipass_path}")
    
    # Add weasyprint path to sys.path
    weasyprint_path = meipass_path / 'weasyprint'
    if weasyprint_path.exists():
        primitive_log(f"Adding {weasyprint_path.parent} to sys.path")
        sys.path.insert(0, str(weasyprint_path.parent))
    else:
        primitive_log(f"weasyprint path {weasyprint_path} does not exist!")

primitive_log(f"sys.path={sys.path}")

# Diagnostic weasyprint import removed - now handled gracefully in core/utils.py



def main():
    """
    Entry point for the PyInstaller executable.
    """
    executable_dir = None
    try:
        # Restore stderr for main execution
        if getattr(sys, 'frozen', False) and 'original_stderr' in globals():
            sys.stderr = original_stderr
            
        # Determine base directory
        if getattr(sys, 'frozen', False):
            executable_dir = Path(sys.executable).parent
        else:
            executable_dir = Path(__file__).resolve().parent
        
        log_file_path = executable_dir / 'debug.log'
        os.environ.setdefault('SGO_LOG_FILE', str(log_file_path))

        primitive_log(f"Current sys.path: {sys.path}")
        primitive_log(f"Current PATH: {os.environ.get('PATH')}")

        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')

        # This import must happen after the settings module is defined.
        primitive_log("Attempting to import Django...")
        from django.core.management import execute_from_command_line
        primitive_log("Django imported successfully.")

        command_argv = [sys.argv[0], 'run_waitress']
        execute_from_command_line(command_argv)

    except Exception as e:
        tb_str = traceback.format_exc()
        fatal_error_msg = f"A fatal error occurred:\n\n{e}\n\n{tb_str}"
        # Log to primitive log first, in case it works
        primitive_log("--- FATAL ERROR ---")
        primitive_log(fatal_error_msg)

if __name__ == '__main__':
    main()