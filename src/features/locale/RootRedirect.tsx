import type { ReactElement } from 'react';
import { Navigate } from 'react-router';
import { useLocalePreference } from './useLocalePreference';

export function RootRedirect(): ReactElement {
  const preference = useLocalePreference();
  return <Navigate to={`/${preference.resolve()}`} replace />;
}
