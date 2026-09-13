import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const lockfilePath = join(root, 'package-lock.json');
const outputPath = join(root, 'public', 'sbom.json');
const lockfile = JSON.parse(await readFile(lockfilePath, 'utf8'));
const rootPackage = lockfile.packages[''];
const directDependencies = new Set(Object.keys(rootPackage.dependencies ?? {}));

const packageNameFromPath = (packagePath) => {
    const segments = packagePath.replace(/^node_modules\//, '').split('/');
    return segments[0].startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
};

const packageGroup = (name) => (name.startsWith('@') ? name.split('/')[0] : undefined);

const components = Object.entries(lockfile.packages)
    .filter(
        ([packagePath, packageInfo]) =>
            packagePath !== '' && packagePath.includes('node_modules/') && !packageInfo.dev,
    )
    .map(([packagePath, packageInfo]) => {
        const name = packageNameFromPath(packagePath);
        const group = packageGroup(name);
        const component = {
            type: 'library',
            ...(group ? { group, name: name.slice(group.length + 1) } : { name }),
            version: packageInfo.version,
            scope: 'required',
            purl: `pkg:npm/${encodeURIComponent(name).replace('%2F', '/')}@${packageInfo.version}`,
            licenses: [{ license: { id: packageInfo.license ?? 'UNKNOWN' } }],
        };
        return component;
    })
    .sort((left, right) =>
        `${left.group ?? ''}/${left.name}`.localeCompare(`${right.group ?? ''}/${right.name}`),
    );

const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: 'urn:uuid:skillboard-hunter-sbom',
    version: 1,
    metadata: {
        timestamp: new Date().toISOString(),
        component: {
            type: 'application',
            name: 'skillboard-hunter',
            version: lockfile.version,
        },
    },
    components,
};

await writeFile(outputPath, `${JSON.stringify(sbom, null, 2)}\n`);
console.log(
    `Generated ${components.length} components from ${directDependencies.size} direct dependencies.`,
);
