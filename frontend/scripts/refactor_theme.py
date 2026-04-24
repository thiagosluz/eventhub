import os
import re

TARGET_DIR = '/home/thiago/Projetos/eventhub/frontend/src/app/(admin)'

replacements = [
    # Backgrounds
    (r'\bbg-gray-900/50\b', 'bg-white/80 dark:bg-gray-900/50'),
    (r'\bbg-gray-900\b', 'bg-white dark:bg-gray-900'),
    
    # Borders
    (r'\bborder-gray-800\b', 'border-gray-200 dark:border-gray-800'),
    
    # Text
    (r'\btext-gray-100\b', 'text-gray-900 dark:text-gray-100'),
    (r'\btext-gray-300\b', 'text-gray-700 dark:text-gray-300'),
    (r'\btext-gray-400\b', 'text-gray-600 dark:text-gray-400'),
]

for root, _, files in os.walk(TARGET_DIR):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            for pattern, replacement in replacements:
                # Find the token, make sure it's not preceded by 'dark:' or 'light:' or part of another string
                regex = re.compile(r'(?<!dark:)(?<!\w)' + pattern)
                content = regex.sub(replacement, content)
            
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {filepath}")
