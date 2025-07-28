import os
import sys
from pathlib import Path
from django.core.management import execute_from_command_line

def main():
    """
    Entry point for the PyInstaller executable.
    This script sets the default Django settings module and executes
    the 'run_waitress' management command to start the server.
    """
    # Determine the base directory for the log file.
    # If running as a frozen executable, the log will be next to the .exe.
    # Otherwise, it will be in the project's root directory during development.
    if getattr(sys, 'frozen', False):
        executable_dir = Path(sys.executable).parent
    else:
        executable_dir = Path(__file__).resolve().parent.parent

    log_file_path = executable_dir / 'debug.log'
    os.environ.setdefault('SGO_LOG_FILE', str(log_file_path))

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')

    # We build the command-line arguments to run the 'run_waitress' command.
    # sys.argv[0] is the name of the script/executable itself.
    # We replace any other arguments with 'run_waitress'.
    command_argv = [sys.argv[0], 'run_waitress']

    execute_from_command_line(command_argv)

if __name__ == '__main__':
    main()