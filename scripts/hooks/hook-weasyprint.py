from PyInstaller.utils.hooks import collect_data_files, collect_submodules

hiddenimports = collect_submodules('weasyprint')
datas = collect_data_files('weasyprint')
datas += collect_data_files('pyphen')
datas += collect_data_files('tinycss2')
datas += collect_data_files('cssselect2')