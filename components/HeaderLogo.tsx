import styles from './HeaderLogo.module.scss'
import Image from 'next/image'
import Link from 'next/link'

export default function HeaderLogo() {
  return (
    <Link href="/" passHref>
      <Image
        src="/images/logo.png"
        alt="A.Coach Logo"
        width={30}
        height={30}
        quality={100}
        layout="fixed"
      />
    </Link>
  )
}
