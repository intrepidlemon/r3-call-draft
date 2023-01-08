import { DateTime } from 'luxon'

export const parseFormsDate = d => DateTime.fromFormat(
    d.replace(" ", "").replace("[", "").replace("]", ""),
    "M/d/yyyy")

export const coerceLuxon = d => typeof d === "string" ? DateTime.fromISO(d) : d

export const coerceLuxonWrapper = f => d => f(coerceLuxon(d))

export const sameDay = (d1, d2) => coerceLuxon(d1).hasSame(coerceLuxon(d2), "day")

export const standardDate = d => DateTime.fromISO(d.toISOString().substring(0, 10))

// get Saturday prior to given day
// if current date is a Saturday, return the same Saturday
export const getPriorSaturday = coerceLuxonWrapper(day => day.minus({days: mod(day.weekday - 6, 7) }))

// get Sunday prior to given day
// if current date is a Sunday, return the same Sunday
export const getPriorSunday = coerceLuxonWrapper(day => day.minus({days: mod(day.weekday - 7, 7) }))

// get Saturday after given day
// if given day is a Sunday, return the same Sunday
export const getNextSaturday = coerceLuxonWrapper(day => day.plus({days: 6 - day.weekday}))

// get Sunday after given day
// if given day is a Sunday, return the same Sunday
export const getNextSunday = coerceLuxonWrapper(day => day.plus({days: 7 - day.weekday}))

export const mod = function (n, m) {
  // mod function that handles negative numbers, usage: mod(num, modulous)
  return ((n % m) + m) % m;
}

export const isHoliday = coerceLuxonWrapper(day => day.weekday !== 6 && day.weekday !== 7)

export const weekNumber = coerceLuxonWrapper(day =>
  day.weekday < 4
  ? day.weekNumber - 1
  : day.weekNumber
)

