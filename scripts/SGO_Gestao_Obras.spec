# -*- mode: python ; coding: utf-8 -*-

from PyInstaller.utils.hooks import collect_data_files, collect_submodules

block_cipher = None

# Collect the entire weasyprint package as data
datas = collect_data_files('weasyprint')
datas += collect_data_files('pyphen')
datas += collect_data_files('tinycss2')
datas += collect_data_files('cssselect2')

# Add Django project data
datas += [
    ('../backend/.env', '.'),
    ('../backend/db.sqlite3', '.'),
    ('../backend/static_react_build', 'static_react_build')
]

hiddenimports = [
    'weasyprint',
    'whitenoise.middleware',
    'django.contrib.staticfiles.apps.StaticFilesConfig',
    'django.contrib.admin.apps.AdminConfig',
    'rest_framework',
    'corsheaders',
    'core',
    'core.apps',
    'core.apps.CoreConfig',
    'core.urls',
    'core.urls.obra_urls',
    'core.urls.relatorio_urls',
    'core.views',
    'core.models',
    'core.serializers',
    'sgo_core',
    'sgo_core.settings',
    'sgo_core.urls',
    'sgo_core.wsgi',
    'waitress',
    'pyphen',
    'tinycss2',
    'cssselect2'
]
# Collect all submodules from core and sgo_core
hiddenimports += collect_submodules('core')
hiddenimports += collect_submodules('sgo_core')
hiddenimports += collect_submodules('weasyprint')


a = Analysis(['../backend/run_executable.py'],
             pathex=['../backend', 'C:/Program Files/GTK3-Runtime Win64/bin'],
             binaries=[],
             datas=datas,
             hiddenimports=hiddenimports,
             hookspath=['../scripts/hooks'],
             hooksconfig={},
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher,
             noarchive=False)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)

exe = EXE(pyz,
          a.scripts,
          [],
          exclude_binaries=True,
          name='SGO_Gestao_Obras.exe',
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          console=True)
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               name='SGO_Gestao_Obras')