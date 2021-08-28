/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from 'react'

export interface VdoCipherVideoProps {
  otp: string
  playbackInfo: string
}

export default function VdoCipherVideo({ otp, playbackInfo }: VdoCipherVideoProps) {
  const embedBoxRef = useRef<HTMLDivElement>(null)

  function add(a: VdoCipherObject) {
    window.vdo.d = window.vdo.d || []
    window.vdo.d.push(a)
  }

  useEffect(() => {
    if (embedBoxRef.current) {
      const url = 'https://player.vdocipher.com/playerAssets/1.6.10/vdo.js'

      window.vdo = window.vdo || {}
      window.vdo.add = window.vdo.add || add
      if (!window.vdo.l) {
        window.vdo.l = new Date().getTime()
        const vdoJs = document.createElement('script')
        const firstScript = document.getElementsByTagName('script')[0]
        vdoJs.async = true
        vdoJs.src = url
        firstScript.parentNode?.insertBefore(vdoJs, firstScript)
      }
      window.vdo.add({
        otp,
        playbackInfo,
        theme: '9ae8bbe8dd964ddc9bdb932cca1cb59a',
        container: embedBoxRef.current,
      })
    }
  }, [otp, playbackInfo])

  return (
    <div
      id="embedBox"
      style={{
        width: '1280px',
        maxWidth: '100%',
        height: 'auto',
      }}
      ref={embedBoxRef}
      data-testid="vdocipher"
    ></div>
  )
}
