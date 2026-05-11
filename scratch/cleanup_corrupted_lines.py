import os

path = 'src/components/admin/VariedadForm.tsx'
try:
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    for line in lines:
        # Check for the corrupted line pattern
        if 'fico"' in line and 'field="variedadesnombrecientifico"' in line and '<FieldCompare' not in line:
            print(f"Removing corrupted line: {line.strip()}")
            continue
        new_lines.append(line)

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Cleanup successful.")
except Exception as e:
    print(f"Error: {e}")
