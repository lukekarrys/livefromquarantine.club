import './dotenv'
import { PrismaClient, Media } from '@prisma/client'
import ms from 'ms'
import prettyMs from 'pretty-ms'

export const client = new PrismaClient({
  rejectOnNotFound: true,
})

export const get = async (
  id: string
): Promise<Media & { lastUpdatedDiff: number; lastUpdatedPretty: string }> => {
  const res = await client.media.findUnique({
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
}

export const update = async (id: string, data: unknown): Promise<Media> => {
  return client.media.upsert({
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
}
