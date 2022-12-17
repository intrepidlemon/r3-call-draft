import { DateTime } from 'luxon'

export const parseDate = d => DateTime.fromJSDate(
  new Date(Date.parse(d.replace("[", "").replace("]", ""))),
  { zone: "utc" }
).setZone("America/New_York", { keepLocalTime: true })

export const sameDay = (d1, d2) => d1.hasSame(d2, "day")

export const standardDate = d => DateTime.fromISO(d.toISOString().substring(0, 10))

// get Saturday prior to given day
// if current date is a Saturday, return the same Saturday
export const getPriorSaturday = day => day.minus({days: mod(day.weekday - 6, 7) })

// get Sunday after given day
// if given day is a Sunday, return the same Sunday
export const getNextSunday = day => day.plus({days: 7 - day.weekday})

export const mod = function (n, m) {
  // mod function that handles negative numbers, usage: mod(num, modulous)
  return ((n % m) + m) % m;
}

