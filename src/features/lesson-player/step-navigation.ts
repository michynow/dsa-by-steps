export interface StepNavigation {
  readonly previousPath: string | undefined;
  readonly nextPath: string | undefined;
  readonly nextBlocked: boolean;
  readonly go: (path: string) => void;
}
