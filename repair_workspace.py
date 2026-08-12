from pathlib import Path
import json
import re

root = Path('.')

# 1. Root package.json
pkg = root / 'package.json'
root_data = json.loads(pkg.read_text())
root_data['packageManager'] = 'npm@10.8.2'
root_data.setdefault('devDependencies', {})
root_data['devDependencies']['turbo'] = '^2.10.9'
root_data['devDependencies']['typescript'] = '^5.5.4'
pkg.write_text(json.dumps(root_data, indent=2) + '\n')

# 2. turbo.json fix
turbo = root / 'turbo.json'
turbo_data = json.loads(turbo.read_text())
turbo_data['tasks'] = turbo_data.get('tasks', {})
turbo_data['tasks'].setdefault('build', {})
turbo_data['tasks']['build']['dependsOn'] = ['^build']
turbo_data['tasks'].setdefault('lint', {})
turbo_data['tasks'].setdefault('dev', {'cache': False, 'persistent': True})
turbo.write_text(json.dumps(turbo_data, indent=2) + '\n')

# 3. apps/api/package.json fix
api_pkg = root / 'apps' / 'api' / 'package.json'
api_data = json.loads(api_pkg.read_text())
api_data.setdefault('devDependencies', {})
api_data['devDependencies']['@types/express'] = '^4.17.21'
api_data['devDependencies']['@types/node'] = '^20.14.10'
api_data['devDependencies']['typescript'] = '^5.5.4'
api_pkg.write_text(json.dumps(api_data, indent=2) + '\n')

# 4. packages/* package.json normalization
for pkg_path in sorted(root.glob('packages/*/package.json')):
    data = json.loads(pkg_path.read_text())
    data['type'] = 'module'
    data['main'] = './dist/index.js'
    data['types'] = './dist/index.d.ts'
    data['exports'] = {
        '.': {
            'types': './dist/index.d.ts',
            'import': './dist/index.js',
        }
    }
    data.setdefault('scripts', {})
    data.setdefault('devDependencies', {})
    pkg_path.write_text(json.dumps(data, indent=2) + '\n')

# 5. packages tsconfig normalization
for ts_path in sorted(root.glob('packages/*/tsconfig.json')):
    data = json.loads(ts_path.read_text())
    data.setdefault('compilerOptions', {})
    data['compilerOptions']['module'] = 'NodeNext'
    data['compilerOptions']['moduleResolution'] = 'NodeNext'
    data['compilerOptions']['outDir'] = './dist'
    data['compilerOptions']['rootDir'] = './src'
    ts_path.write_text(json.dumps(data, indent=2) + '\n')

# 6. packages/config tsconfig.base.json ensure NodeNext
config_base = root / 'packages' / 'config' / 'tsconfig.base.json'
base_data = json.loads(config_base.read_text())
base_opts = base_data.setdefault('compilerOptions', {})
base_opts['module'] = 'NodeNext'
base_opts['moduleResolution'] = 'NodeNext'
config_base.write_text(json.dumps(base_data, indent=2) + '\n')

# 7. fix relative imports without .js extension in apps/* and packages/*
pattern = re.compile(r"(import\s+[^;]+?from\s+['\"]((?:\.\./|\./)[^'\"]+?)['\"])|(export\s+[^;]+?from\s+['\"]((?:\.\./|\./)[^'\"]+?)['\"])" )
file_exts = ['.ts', '.tsx']
for path in sorted(root.glob('**/*')):
    if path.suffix not in file_exts:
        continue
    if 'node_modules' in path.parts:
        continue
    if path.match('**/dist/**'):
        continue
    text = path.read_text()
    modified = text
    for match in re.finditer(r"((?:import|export)\s+[^;]+?from\s+['\"]((?:\.\./|\./)[^'\"]+?)['\"])", text):
        whole = match.group(1)
        rel = match.group(2)
        if not rel.endswith('.js') and not rel.endswith('.jsx') and not rel.endswith('.json') and not rel.endswith('.css') and not rel.endswith('.ts') and not rel.endswith('.tsx'):
            new_rel = rel + '.js'
            modified = modified.replace(whole, whole.replace(rel, new_rel))
    if modified != text:
        path.write_text(modified)

# 8. verify packages/ai-engine/src/spatial-qa.ts imports match geometry-engine exports
spatial_qa = root / 'packages' / 'ai-engine' / 'src' / 'spatial-qa.ts'
if spatial_qa.exists():
    text = spatial_qa.read_text()
    text = text.replace("from '@spatial/geometry-engine';", "from '@spatial/geometry-engine';")
    spatial_qa.write_text(text)

print('repair-script-done')
