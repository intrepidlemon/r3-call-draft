import { parseFormsDate } from './utils'

export const cleanResidentCSV = o => {
  let availableDates = Object.keys(o).filter(c => c.includes("["))
  return {
    name: o["What is your name? "],
    blackout: availableDates.filter(d => o[d] === "Blackout").map(parseFormsDate),
    preferNot: availableDates.filter(d => o[d] === "Prefer Not").map(parseFormsDate),
    preferToWork: availableDates.filter(d => o[d] === "Prefer to work").map(parseFormsDate),
  }
}

export const extractRotations = schedule => ({
  name: schedule.name,
  CHOP: Object.keys(schedule).filter(k => k !== "name" && schedule[k] === "CHOP").map(parseFormsDate),
  NF: Object.keys(schedule).filter(k => k !== "name" && schedule[k] !== null && schedule[k].includes("NF")).map(parseFormsDate),
})
