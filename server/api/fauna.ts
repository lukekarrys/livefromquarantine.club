import './dotenv'
import { Client, query as q } from 'faunadb'
import { PreloadedData } from '../types'

const { FAUNA_SECRET } = process.env

if (!FAUNA_SECRET) {
  throw new Error('Needs FAUNA_SECRET')
}

const client = new Client({ secret: FAUNA_SECRET, keepAlive: false })

const MatchById = (id: string) => q.Match(q.Index('media_by_id'), id)

export const update = async (
  id: string,
  data: unknown
): Promise<MediaData & { ref: string }> => {
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
}

type MediaData = { data: { id: string; json: string } }

export const get = async (id: string): Promise<PreloadedData> => {
  const res = await client.query<MediaData>(q.Get(MatchById(id)))
  return JSON.parse(res.data.json) as PreloadedData
}
