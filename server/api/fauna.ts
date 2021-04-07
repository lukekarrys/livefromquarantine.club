import { Client, query as q } from 'faunadb'
import { PreloadedData } from '../types'

const MatchById = (id: string) => q.Match(q.Index('media_by_id'), id)

type MediaData = { data: { id: string; json: string } }

const createClient = (
  secret = ''
): {
  get: (id: string) => Promise<PreloadedData>
  update: (id: string, data: unknown) => Promise<MediaData & { ref: string }>
} => {
  const client = new Client({ secret })

  return {
    get: async (id) => {
      const res = await client.query<MediaData>(q.Get(MatchById(id)))
      return JSON.parse(res.data.json) as PreloadedData
    },
    update: async (id, data) => {
      return client.query(
        q.Let(
          {
            match: MatchById(id),
            data: { data: { id, json: JSON.stringify(data) } },
          },
          q.If(
            q.Exists(q.Var('match')),
            q.Update(q.Select('ref', q.Get(q.Var('match'))), q.Var('data')),
            q.Create(q.Collection('media'), q.Var('data'))
          )
        )
      )
    },
  }
}

export default createClient
