import cx from 'classnames'
import { ButtonHTMLAttributes, DetailedHTMLProps } from 'react'
import styles from './FormSubmit.module.scss'

export interface FormSubmitProps
  extends DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {
  status?: 'default' | 'success' | 'error'
}

export default function FormSubmit({
  status,
  className,
  children,
  ...restButtonProps
}: FormSubmitProps) {
  return (
    <button
      {...restButtonProps}
      className={cx(
        styles.FormSubmit,
        {
          [styles.success]: status === 'success',
          [styles.error]: status === 'error',
        },
        className
      )}
    >
      {children}
    </button>
  )
}
