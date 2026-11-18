import type { ComponentPropsWithRef, ReactElement } from 'react';
import styles from './Button.module.css';

export type ButtonProps = Omit<ComponentPropsWithRef<'button'>, 'className'>;

export function Button({ type = 'button', ...props }: ButtonProps): ReactElement {
  return <button type={type} className={styles.button} {...props} />;
}
