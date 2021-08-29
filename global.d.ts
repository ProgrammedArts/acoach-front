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
