import { DetailedHTMLProps, HTMLAttributes } from 'react'
import cx from 'classnames'
import styles from './ErrorMessage.module.scss'

export default function ErrorMessage(
  props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) {
  return (
    <div {...props} className={cx(styles.ErrorMessage, props.className)}>
      {props.children}
    </div>
  )
}
