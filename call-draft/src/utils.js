import { DateTime } from 'luxon'

export const parseDate = d => DateTime.fromJSDate(
  new Date(Date.parse(d.replace("[", "").replace("]", "")))
)
