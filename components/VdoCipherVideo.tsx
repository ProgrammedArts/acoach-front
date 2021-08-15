/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef } from 'react'

export interface VdoCipherVideoProps {
  otp: string
  playbackInfo: string
}

export default function VdoCipherVideo({ otp, playbackInfo }: VdoCipherVideoProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.innerHTML = `(function(v,i,d,e,o){v[o]=v[o]||{}; v[o].add = v[o].add || function V(a){
         (v[o].d=v[o].d||[]).push(a);};if(!v[o].l) { v[o].l=1*new Date();
         a=i.createElement(d); m=i.getElementsByTagName(d)[0]; a.async=1; a.src=e;
         m.parentNode.insertBefore(a,m);}})(window,document,"script",
         "https://player.vdocipher.com/playerAssets/1.6.10/vdo.js","vdo");
         vdo.add({
           otp: "${otp}",
           playbackInfo: "${playbackInfo}",
           theme: "9ae8bbe8dd964ddc9bdb932cca1cb59a",
           container: document.querySelector( "#embedBox" ),
         });`
    document.body.appendChild(script)
  }, [otp, playbackInfo])

  return (
    <div
      id="embedBox"
      style={{
        width: '1280px',
        maxWidth: '100%',
        height: 'auto',
      }}
    ></div>
  )
}
