/// <reference types="next" />
/// <reference types="next/types/global" />
/// <reference types="next/image-types/global" />

export declare global {
  interface VdoCipherObject {
    otp: string
    playbackInfo: string
    theme: string
    container: HTMLElement
  }

  interface Window {
    vdo: {
      add: (obj: VdoCipherObject) => void
      d: Array<VdoCipherObject>
      l?: number
    }
  }
}
