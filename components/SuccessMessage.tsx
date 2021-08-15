import { DetailedHTMLProps, HTMLAttributes } from 'react'
import cx from 'classnames'
import styles from './SuccessMessage.module.scss'

export default function SuccessMessage(
  props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
) {
  return (
    <div {...props} className={cx(styles.SuccessMessage, props.className)}>
      {props.children}
    </div>
  )
}
