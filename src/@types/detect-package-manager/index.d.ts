declare module 'detect-package-manager' {
  export type PM = 'npm' | 'pnpm' | 'yarn';

  /**
   * Detects which package manager is being used in a particular repository
   */
  export function detect(opts?: Partial<{ cwd: string }>): Promise<PM>;
}
