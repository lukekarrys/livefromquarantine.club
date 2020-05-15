import { createMachine, assign } from "@xstate/fsm"
import { Data } from "../types"

interface DataContext {
  data?: Data
  error?: Error
}

export type FetchEvent = { type: "FETCH"; artistId: string }
export type SuccessEvent = { type: "SUCCESS"; data: Data }
export type ErrorEvent = { type: "ERROR"; data: Error }
type DataEvent = FetchEvent | SuccessEvent | ErrorEvent

type DataState =
  | {
      value: "idle"
      context: { data: undefined; error: undefined }
    }
  | {
      value: "loading"
      context: { data: undefined; error: undefined }
    }
  | {
      value: "success"
      context: { data: Data; error: undefined }
    }
  | {
      value: "failure"
      context: { data: undefined; error: Error }
    }

const dataMachine = createMachine<DataContext, DataEvent, DataState>({
  id: "data",
  initial: "idle",
  context: {
    data: undefined,
    error: undefined,
  },
  states: {
    idle: {
      on: {
        FETCH: "loading",
      },
    },
    loading: {
      entry: ["fetchData"],
      on: {
        SUCCESS: {
          target: "success",
          actions: assign<DataContext, SuccessEvent>({
            data: (context, event) => event.data,
          }),
        },
        ERROR: {
          target: "failure",
          actions: assign<DataContext, ErrorEvent>({
            error: (context, event) => event.data,
          }),
        },
      },
    },
    success: {},
    failure: {},
  },
})

export default dataMachine
