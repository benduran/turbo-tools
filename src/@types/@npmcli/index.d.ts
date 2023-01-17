declare module '@npmcli/map-workspaces' {
  import type { PackageJson } from 'type-fest';
  export interface MapWorkspacesOpts {
    cwd: string;
    pkg: PackageJson;
  }

  function mapWorkspaces(opts: MapWorkspacesOpts): Promise<Map<string, string>>;

  export default mapWorkspaces;
}
