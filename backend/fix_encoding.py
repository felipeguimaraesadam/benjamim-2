#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import sys

def fix_encoding_issues(text):
    """Fix common encoding issues in the JSON data"""
    if not isinstance(text, str):
        return text
    
    # Common encoding fixes - more comprehensive
    replacements = {
        'POR├': 'PORÃ',
        'S├O': 'SÃO', 
        'RESPONS┴VEL': 'RESPONSÁVEL',
        'PAIX├O': 'PAIXÃO',
        'JOS╔': 'JOSÉ',
        'PONTA POR├': 'PONTA PORÃ',
        'RUA PONTA POR├': 'RUA PONTA PORÃ',
        'VILA IPOJUCA\\nCEP': 'VILA IPOJUCA\nCEP',
        'VILA ROMANA\\nCEP': 'VILA ROMANA\nCEP',
        'PINHEIROS\\nCEP': 'PINHEIROS\nCEP',
        # Individual character fixes
        '├': 'Ã',
        '┴': 'Á', 
        '╔': 'É',
        '╟': 'Ç',
        '╬': 'Ô',
        '╡': 'Õ',
        '╨': 'Í',
        '╙': 'Ú',
        '┬': 'Â',
        '╩': 'Ê',
        '╦': 'Î',
        '╧': 'Û'
    }
    
    for wrong, correct in replacements.items():
        text = text.replace(wrong, correct)
    
    return text

def fix_json_encoding(input_file, output_file):
    """Fix encoding issues in JSON file"""
    try:
        # Try to read with different encodings
        encodings = ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']
        data = None
        
        for encoding in encodings:
            try:
                with open(input_file, 'r', encoding=encoding) as f:
                    content = f.read()
                    data = json.loads(content)
                print(f"Successfully read file with {encoding} encoding")
                break
            except (UnicodeDecodeError, json.JSONDecodeError) as e:
                print(f"Failed to read with {encoding}: {e}")
                continue
        
        if data is None:
            print("Could not read the file with any encoding")
            return False
        
        # Fix encoding issues recursively
        def fix_recursive(obj):
            if isinstance(obj, dict):
                return {key: fix_recursive(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [fix_recursive(item) for item in obj]
            elif isinstance(obj, str):
                return fix_encoding_issues(obj)
            else:
                return obj
        
        fixed_data = fix_recursive(data)
        
        # Write the fixed data with proper UTF-8 encoding
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(fixed_data, f, indent=2, ensure_ascii=False)
        
        print(f"Fixed encoding and saved to {output_file}")
        return True
        
    except Exception as e:
        print(f"Error fixing encoding: {e}")
        return False

if __name__ == '__main__':
    input_file = 'data_clean.json'
    output_file = 'data_fixed.json'
    
    if fix_json_encoding(input_file, output_file):
        # Replace the original file
        import shutil
        shutil.move(output_file, input_file)
        print("Successfully fixed data.json encoding")
    else:
        print("Failed to fix encoding")
        sys.exit(1)