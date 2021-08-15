import Image from 'next/image'
import Link from 'next/link'

export default function HeaderLogo() {
  return (
    <Link href="/" passHref>
      <a>
        <Image
          src="/images/logo.png"
          alt="A.Coach Logo"
          width={30}
          height={30}
          quality={100}
          layout="fixed"
        />
      </a>
    </Link>
  )
}
