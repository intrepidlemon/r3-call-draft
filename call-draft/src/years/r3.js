import * as generic from './generic'
import { getPriorSaturday, getPriorSunday, getNextSaturday, getNextSunday, sameDay, isPartOfHolidayWeekend } from '../utils'
// shift is adjacent to an assigned night float week

export const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=0&single=true&output=csv"
export const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=2004341310&single=true&output=csv"
export const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=973200211&single=true&output=csv"

const PerShiftCaps = {
  "REGULAR" : {
    "DF HUP": 6,
    "DF PAH": 6,
    "Body Call": 2,
    "NF HUP": 2,
    "NF PAH": 2,
  },

  "HOLIDAY" : {
    "DF HUP": 3,
    "DF PAH": 3,
    "Body Call": 1,
    "NF HUP": 1,
    "NF PAH": 1,
  },
  "AGGREGATE NF": 5,
  "AGGREGATE DF": 13,
  "AGGREGATE HOLIDAY DF": 3,
  "AGGREGATE BODY": 3,
  "TOTAL CAP": 19,
}

const DifficultyHeuristic = {
  "REGULAR" : {
    "DF HUP": 1.0,
    "DF PAH": 1.0,
    "Body Call": 0.75,
    "NF HUP": 1.0,
    "NF PAH": 1.0,
  },

  "HOLIDAY" : {
    "DF HUP": 1.25,
    "DF PAH": 1.25,
    "Body Call": 1,
    "NF HUP": 1.25,
    "NF PAH": 1.25,
  },
}

const queryNFWeekends = ({ NF }) => date => shift => NF.reduce((okay, nf) =>
  okay &&
  !(getPriorSaturday(nf) <= date && date <= getNextSunday(nf)),
  true
)

// shift is on the same day as a saturday night call
const querySaturdayNightCallWeekend = ({ assignedShifts }) => date => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
    !(
      (s.shift.includes("NF") && sameDay(getPriorSaturday(date), s.date))
      || (shift.includes("NF") && sameDay(getPriorSaturday(s.date), date))
    ),
  true
)
// shift is between two assigned CHOP weeks

const queryCHOP = ({ CHOP }) => date => shift =>
  CHOP.reduce((conflict, cp) =>
    conflict + (
    sameDay(getPriorSaturday(cp), date)
    || sameDay(getPriorSunday(cp), date)
    || sameDay(getNextSaturday(cp), date)
    || sameDay(getNextSunday(cp), date)),
  0
) < 2


const queryBelowHUPHolidayDayFloatCap     = generic.floatCap("DF HUP", true, PerShiftCaps)
const queryBelowHUPDayFloatCap            = generic.floatCap("DF HUP", false, PerShiftCaps)
const queryBelowPAHHolidayDayFloatCap     = generic.floatCap("DF PAH", true, PerShiftCaps)
const queryBelowPAHDayFloatCap            = generic.floatCap("DF PAH", false, PerShiftCaps)
const queryBelowBodyHolidayCap            = generic.floatCap("Body Call", true, PerShiftCaps)
const queryBelowBodyCap                   = generic.floatCap("Body Call", true, PerShiftCaps)
const queryBelowHUPHolidayNightFloatCap   = generic.floatCap("NF HUP", true, PerShiftCaps)
const queryBelowHUPNightFloatCap          = generic.floatCap("NF HUP", false, PerShiftCaps)
const queryBelowPAHHolidayNightFloatCap   = generic.floatCap("NF PAH", true, PerShiftCaps)
const queryBelowPAHNightFloatCap          = generic.floatCap("NF PAH", false, PerShiftCaps)

const queryBelowAggregateNightFloatCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("NF"))
    return resident.assignedShifts.filter(s => s.shift.includes("NF")).length < PerShiftCaps["AGGREGATE NF"]
  return true
}

const queryBelowAggregateNormalDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("DF") && !isPartOfHolidayWeekend(holidays)(date))
    return resident.assignedShifts.filter(s => !isPartOfHolidayWeekend(holidays)(s.date) && s.shift.includes("DF")).length < PerShiftCaps["AGGREGATE DF"]
  return true
}

const queryBelowAggregateHolidayDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("DF") && isPartOfHolidayWeekend(holidays)(date))
    return resident.assignedShifts.filter(s => isPartOfHolidayWeekend(holidays)(s.date) && s.shift.includes("DF")).length < PerShiftCaps["AGGREGATE HOLIDAY DF"]
  return true
}

const queryBelowBodyAggregateCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("Body"))
    return resident.assignedShifts.filter(s => s.shift.includes("Body")).length < PerShiftCaps["AGGREGATE BODY"]
  return true
}

const queryBelowTotalCap = ( resident, holidays ) => date => shift =>
  resident.assignedShifts.length < PerShiftCaps["TOTAL CAP"]

export const hardRestrictions = [
  ...generic.hardRestrictions,
  "queryNFWeekends",
  "querySaturdayNightCallWeekend",
  "queryCHOP",
  "queryBelowHUPHolidayDayFloatCap",
  "queryBelowHUPDayFloatCap",
  "queryBelowPAHHolidayDayFloatCap",
  "queryBelowPAHDayFloatCap",
  "queryBelowBodyHolidayCap",
  "queryBelowBodyCap",
  "queryBelowHUPHolidayNightFloatCap",
  "queryBelowHUPNightFloatCap",
  "queryBelowPAHHolidayNightFloatCap",
  "queryBelowPAHNightFloatCap",
  "queryBelowAggregateNightFloatCap",
  "queryBelowAggregateNormalDayFloatCap",
  "queryBelowAggregateHolidayDayFloatCap",
  "queryBelowBodyAggregateCap",
  "queryBelowTotalCap",
]

export const softRestrictions = [
  ...generic.softRestrictions,
]

export const preferToWorkFilters = [
  ...generic.preferToWorkFilters,
]

export const constraintMap = {
  ...generic.constraintMap,
  "queryNFWeekends": {"msg": "Night float week", "fn": queryNFWeekends},
  "querySaturdayNightCallWeekend": {"msg": "Night saturday call <> shift", "fn": querySaturdayNightCallWeekend},
  "queryCHOP": {"msg": "CHOP week", "fn": queryCHOP},
  "queryBelowHUPHolidayDayFloatCap": {"msg": "Max HUP holiday day shifts", "fn": queryBelowHUPHolidayDayFloatCap},
  "queryBelowHUPDayFloatCap": {"msg": "Max HUP day shifts", "fn": queryBelowHUPDayFloatCap},
  "queryBelowPAHHolidayDayFloatCap": {"msg": "Max PAH holiday day shifts", "fn": queryBelowPAHHolidayDayFloatCap},
  "queryBelowPAHDayFloatCap": {"msg": "Max PAH day shifts", "fn": queryBelowPAHDayFloatCap},
  "queryBelowBodyHolidayCap": {"msg": "Max holiday body shifts", "fn": queryBelowBodyHolidayCap},
  "queryBelowBodyCap": {"msg": "Max weekend body shifts", "fn": queryBelowBodyCap},
  "queryBelowHUPHolidayNightFloatCap": {"msg": "Max HUP holiday night shifts", "fn": queryBelowHUPHolidayNightFloatCap},
  "queryBelowHUPNightFloatCap": {"msg": "Max HUP night shifts", "fn": queryBelowHUPNightFloatCap},
  "queryBelowPAHHolidayNightFloatCap": {"msg": "Max PAH holiday night shifts", "fn": queryBelowPAHHolidayNightFloatCap},
  "queryBelowPAHNightFloatCap": {"msg": "Max PAH night shifts", "fn": queryBelowPAHNightFloatCap},
  "queryBelowAggregateNightFloatCap": {"msg": "Max night shifts", "fn": queryBelowAggregateNightFloatCap},
  "queryBelowAggregateNormalDayFloatCap": {"msg": "Max day shifts", "fn": queryBelowAggregateNormalDayFloatCap},
  "queryBelowAggregateHolidayDayFloatCap": {"msg": "Max holiday day shifts", "fn": queryBelowAggregateHolidayDayFloatCap},
  "queryBelowBodyAggregateCap": {"msg": "Max body shifts", "fn": queryBelowBodyAggregateCap},
  "queryBelowTotalCap": {"msg": "Max shifts", "fn": queryBelowTotalCap},
}

export const getTotalDifficulty = holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

