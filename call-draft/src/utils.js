import { DateTime } from 'luxon'

export const parseDate = d => DateTime.fromJSDate(
  new Date(Date.parse(d.replace("[", "").replace("]", ""))),
  { zone: "utc" }
).setZone("America/New_York", { keepLocalTime: true })

export const sameDay = (d1, d2) => d1.hasSame(d2, "day")

