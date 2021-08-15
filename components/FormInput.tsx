import { DetailedHTMLProps, InputHTMLAttributes } from 'react'
import styles from './FormInput.module.scss'

export interface FormInputProps
  extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  label: string
  id: string
}

export default function FormInput({ label, ...restInputProps }: FormInputProps) {
  return (
    <div className={styles.FormInput}>
      <input type="text" placeholder={label} {...restInputProps} />
    </div>
  )
}
