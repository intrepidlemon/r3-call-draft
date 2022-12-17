import { parseDate } from './utils'

export const cleanResidentCSV = o => {
  let availableDates = Object.keys(o).filter(c => c.includes("["))
  return {
    name: o["What is your name? "],
    blackout: availableDates.filter(d => o[d] == "Blackout").map(parseDate),
    preferNot: availableDates.filter(d => o[d] == "Prefer Not").map(parseDate),
    preferToWork: availableDates.filter(d => o[d] == "Prefer to work").map(parseDate),
  }
}

export const extractRotations = schedule => ({
  name: schedule.name,
  CHOP: Object.keys(schedule).filter(k => k != "name" && schedule[k] == "CHOP").map(parseDate),
  NF: Object.keys(schedule).filter(k => k != "name" && schedule[k] != null && schedule[k].includes("NF")).map(parseDate),
})
