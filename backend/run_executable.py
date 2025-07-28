import os
import sys
import traceback
from pathlib import Path

# It's crucial to attempt importing Django only after setting up the path
# and handling potential pre-execution errors.

# --- Primitive Logger ---
def primitive_log(message):
    """A simple logger that writes to a file in the executable's directory."""
    try:
        # Determine base directory safely
        if getattr(sys, 'frozen', False):
            # In a frozen app, sys.executable is the path to the .exe
            base_dir = Path(sys.executable).parent
        else:
            # In development, __file__ is in backend/, so we go up to the project root
            base_dir = Path(__file__).resolve().parent.parent

        log_path = base_dir / 'primitive_debug.log'
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(f"{message}\n")
    except Exception:
        # If even this fails, there's not much more we can do.
        pass

def main():
    """
    Entry point for the PyInstaller executable.
    """
    primitive_log("--- Executable Started ---")
    try:
        # Determine the base directory for the log file.
        if getattr(sys, 'frozen', False):
            executable_dir = Path(sys.executable).parent
            primitive_log(f"Running frozen. Executable dir: {executable_dir}")
        else:
            executable_dir = Path(__file__).resolve().parent.parent
            primitive_log(f"Running in dev. Project root dir: {executable_dir}")

        log_file_path = executable_dir / 'debug.log'
        os.environ.setdefault('SGO_LOG_FILE', str(log_file_path))
        primitive_log(f"SGO_LOG_FILE set to: {log_file_path}")

        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
        primitive_log("DJANGO_SETTINGS_MODULE set to: sgo_core.settings")

        # This import must happen after the settings module is defined.
        from django.core.management import execute_from_command_line

        command_argv = [sys.argv[0], 'run_waitress']
        primitive_log(f"Executing command: {command_argv}")

        execute_from_command_line(command_argv)
        primitive_log("Execution finished successfully.")

    except Exception as e:
        primitive_log("--- FATAL ERROR ---")
        primitive_log(f"An exception occurred: {e}")
        primitive_log(traceback.format_exc())
        # Also try to write to the intended Django log file as a fallback
        try:
            log_file_path_str = os.getenv('SGO_LOG_FILE', 'debug_fallback.log')
            with open(log_file_path_str, 'a', encoding='utf-8') as f:
                f.write("--- FATAL ERROR ---\n")
                f.write(f"An exception occurred: {e}\n")
                f.write(traceback.format_exc())
        except:
            pass  # Final attempt failed

if __name__ == '__main__':
    main()