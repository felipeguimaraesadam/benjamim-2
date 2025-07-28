import os
import sys
from django.core.management import execute_from_command_line

def main():
    """
    Entry point for the PyInstaller executable.
    This script sets the default Django settings module and executes
    the 'run_waitress' management command to start the server.
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')

    # We build the command-line arguments to run the 'run_waitress' command.
    # sys.argv[0] is the name of the script/executable itself.
    # We replace any other arguments with 'run_waitress'.
    command_argv = [sys.argv[0], 'run_waitress']

    execute_from_command_line(command_argv)

if __name__ == '__main__':
    main()