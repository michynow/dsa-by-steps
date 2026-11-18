export { initialCheckState, missesBeforeReveal } from './types';
export type {
  Answer,
  Check,
  CheckError,
  CheckId,
  CheckState,
  CheckStatus,
  OptionId,
  Verdict,
} from './types';
export { judge } from './judge';
export { canReveal, recordVerdict, reveal } from './check-state';
