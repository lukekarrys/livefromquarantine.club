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
