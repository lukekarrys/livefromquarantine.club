import './dotenv'
import { PrismaClient, Media } from '@prisma/client'
import ms from 'ms'
import prettyMs from 'pretty-ms'

const prisma = new PrismaClient({
  rejectOnNotFound: true,
})

const createClient = (): {
  get: (
    id: string
  ) => Promise<Media & { lastUpdatedDiff: number; lastUpdatedPretty: string }>
  update: (id: string, data: unknown) => Promise<Media>
  client: PrismaClient
} => {
  return {
    client: prisma,
    get: async (id) => {
      const res = await prisma.media.findUnique({
        where: {
          aristOrId: id,
        },
      })
      const lastUpdatedDiff = Date.now() - res.lastUpdated.valueOf()
      const lastUpdatedPretty = prettyMs(lastUpdatedDiff)
      if (lastUpdatedDiff > ms('1d')) {
        throw new Error(
          `Found media for ${id} but it is ${lastUpdatedPretty} old (${res.lastUpdated.toJSON()})`
        )
      }
      return {
        ...res,
        lastUpdatedDiff,
        lastUpdatedPretty,
      }
    },
    update: async (id, data) => {
      const res = await prisma.media.upsert({
        where: {
          aristOrId: id,
        },
        update: {
          json: JSON.stringify(data),
          lastUpdated: new Date(),
        },
        create: {
          aristOrId: id,
          json: JSON.stringify(data),
          lastUpdated: new Date(),
        },
      })
      return res
    },
  }
}

export default createClient
