#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import webbrowser
import threading
import time

# Define the URL to open (adjust if your server runs on a different port/host)
BROWSER_URL = 'http://127.0.0.1:8000'

def open_browser_after_delay():
    """Waits for a few seconds then opens the web browser."""
    try:
        # A short delay to give the server a chance to start
        time.sleep(3)  # Adjust delay as needed
        print(f"Attempting to open browser at {BROWSER_URL}...")
        webbrowser.open_new_tab(BROWSER_URL)
        print("Browser open command issued.")
    except Exception as e:
        print(f"Could not open browser: {e}", file=sys.stderr)

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sgo_core.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    # Check if running as a PyInstaller bundle and if the command is 'runserver'
    # sys.frozen is set by PyInstaller when running from a bundle
    # sys._MEIPASS is the path to the temporary folder where bundled files are extracted
    is_frozen = getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')
    is_runserver_command = 'runserver' in sys.argv

    # If it's a bundled app and the command is runserver (or no command, which defaults to runserver for executables)
    # For PyInstaller executables, sys.argv might just be [manage.py] or [your_executable_name.exe]
    # Django's execute_from_command_line handles the default 'runserver' if no other command is given.
    # We need to ensure 'runserver' is effectively the command being run.
    # A simple check for 'runserver' in sys.argv is a good start.
    # If PyInstaller is invoked with just `manage.py` (no specific command),
    # Django itself might not default to `runserver` in that context when called from `execute_from_command_line`.
    # However, our build_executable.bat calls `pyinstaller manage.py ...` without specifying a command for the exe to run,
    # so the exe itself would need `runserver` passed to it, or we assume `manage.py` inside the exe defaults to it.
    # For an executable, `sys.argv[0]` is the exe name. `sys.argv[1:]` are the args.
    # If `len(sys.argv) == 1` (only exe name), `execute_from_command_line` might not default to `runserver`.
    # It's safer if `runserver` is an explicit argument or if we force it for the bundled app.

    # Let's refine the condition: open browser if frozen and 'runserver' is intended.
    # If the executable is run without arguments, Django's default behavior for `manage.py`
    # (when `sys.argv` is effectively `['manage.py']`) is to show help.
    # The PyInstaller build command `pyinstaller manage.py ...` means the *resulting executable*
    # will behave like `manage.py`. So, running `SGO_Gestao_Obras.exe` is like `python manage.py`.
    # To make it run the server, one would typically run `SGO_Gestao_Obras.exe runserver`.
    # So, checking for 'runserver' in `sys.argv` is correct.

    if is_frozen and is_runserver_command:
        print("[INFO] Running in PyInstaller bundle, 'runserver' command detected.")
        print("[INFO] Starting browser opening thread...")
        # Start the browser opening in a separate thread
        # This allows the server to start without being blocked by webbrowser.open
        # and also handles the delay gracefully.
        thread = threading.Thread(target=open_browser_after_delay)
        thread.daemon = True  # Allow main program to exit even if this thread is running
        thread.start()
        print("[INFO] Browser opening thread started.")

    try:
        execute_from_command_line(sys.argv)
    except Exception as e:
        if is_frozen:
            print(f"An error occurred: {e}", file=sys.stderr)
            # In a frozen app, stderr might not be visible. Consider logging to a file.
            # Keep the application running for a bit so the user can see the error if it's a console app.
            time.sleep(10) # Keep console open for 10 seconds to see error
        raise # Re-raise the exception

if __name__ == '__main__':
    main()
