/// <reference types="@types/youtube" />

// const localStorageMock = (() => {
//   let store = {}

//   return {
//     getItem: (key: string): string | null => store[key] || null,
//     setItem: (key: string, value: any): void =>
//       void (store[key] = value.toString()),
//     clear: (): void => void (store = {}),
//   }
// })()

// Object.defineProperty(window, "localStorage", {
//   value: localStorageMock,
// })

// class Player {
//   elt: HTMLElement
//   options: Partial<YT.PlayerOptions>

//   constructor(elt: HTMLElement, options: Partial<YT.PlayerOptions>) {
//     this.elt = elt
//     this.options = options
//   }
// }

// Object.defineProperty(window, "YT", {
//   value: {
//     Player,
//     PlayerState: {
//       UNSTARTED: -1,
//       ENDED: 0,
//       PLAYING: 1,
//       PAUSED: 2,
//       BUFFERING: 3,
//       CUED: 5,
//     },
//   },
// })
