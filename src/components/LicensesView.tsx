import { useEffect, useState } from 'react';

type SbomComponent = {
    group?: string;
    name: string;
    version: string;
    scope?: string;
    licenses?: Array<{ license?: { id?: string; name?: string } }>;
};

type SbomDocument = {
    bomFormat: string;
    specVersion: string;
    components: SbomComponent[];
};

type LicensesState =
    | { status: 'loading' }
    | { status: 'loaded'; document: SbomDocument }
    | { status: 'error' };

const getLicenseName = (component: SbomComponent): string =>
    component.licenses
        ?.map((entry) => entry.license?.id ?? entry.license?.name ?? 'UNKNOWN')
        .join(', ') || 'UNKNOWN';

export function LicensesView() {
    const [state, setState] = useState<LicensesState>({ status: 'loading' });

    useEffect(() => {
        let active = true;
        fetch('/sbom.json')
            .then(async (response) => {
                if (!response.ok) throw new Error('SBOM request failed');
                return (await response.json()) as SbomDocument;
            })
            .then((document) => {
                if (active) setState({ status: 'loaded', document });
            })
            .catch(() => {
                if (active) setState({ status: 'error' });
            });

        return () => {
            active = false;
        };
    }, []);

    return (
        <section className="workspace-view" aria-label="Licenses">
            <div className="workspace-view-heading">
                <span className="eyebrow">OPEN SOURCE INVENTORY</span>
                <h2>Packages that make this board possible.</h2>
                <p>
                    Package names, versions, and license identifiers are generated from the project
                    lockfile.
                </p>
            </div>
            {state.status === 'loading' && (
                <p className="license-state">Loading package inventory...</p>
            )}
            {state.status === 'error' && (
                <p className="license-state error-text">The package inventory is unavailable.</p>
            )}
            {state.status === 'loaded' && (
                <>
                    <p className="license-summary">
                        {state.document.components.length} packages · CycloneDX{' '}
                        {state.document.specVersion}
                    </p>
                    <div className="license-table-wrap">
                        <table className="license-table">
                            <caption className="visually-hidden">Package licenses</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Package</th>
                                    <th scope="col">Version</th>
                                    <th scope="col">License</th>
                                    <th scope="col">Scope</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.document.components.map((component) => (
                                    <tr
                                        key={`${component.group ?? ''}/${component.name}@${component.version}`}
                                    >
                                        <th scope="row">
                                            {component.group
                                                ? `${component.group}/${component.name}`
                                                : component.name}
                                        </th>
                                        <td>{component.version}</td>
                                        <td>{getLicenseName(component)}</td>
                                        <td>{component.scope ?? 'required'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </section>
    );
}
