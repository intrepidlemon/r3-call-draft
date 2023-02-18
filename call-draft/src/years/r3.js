import * as generic from './generic'
import { getPriorSaturday, getPriorSunday, getNextSaturday, getNextSunday, sameDay, isPartOfHolidayWeekend } from '../utils'

export const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=0&single=true&output=csv"
export const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=2004341310&single=true&output=csv"
export const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQdBkM4XlLYnuATduPs4eQBi77RNtIdaXX2HNVFPHzFgvl7tphlwcDYDiLs32RhDXuyIAZaMdFnJiAw/pub?gid=973200211&single=true&output=csv"

const PerShiftCaps = {
  "REGULAR" : {
    "Neuro": 6,
    "Body Call": 5,
    "NF HUP": 2,
    "NF PAH": 2,
  },

  "HOLIDAY" : {
    "Neuro": 3,
    "Body Call": 3,
    "NF HUP": 0,
    "NF PAH": 0,
  },
  "AGGREGATE NF": 3,
  "AGGREGATE NEURO": 6,
  "AGGREGATE BODY": 5,
  "TOTAL CAP": 14,
}

const DifficultyHeuristic = {
  "REGULAR" : {
    "Neuro": 1.0,
    "Body Call": 1.0,
    "NF HUP": 1.0,
    "NF PAH": 1.0,
  },

  "HOLIDAY" : {
    "Neuro": 1.25,
    "Body Call": 1.0,
    "NF HUP": 1.25,
    "NF PAH": 1.25,
  },
}

// shift is on the weekend of night float rotation
const queryNFWeekends = ({ NF }) => date => shift => NF.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryPPWeekends = ({ PP }) => date => shift => PP.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryGlobal = ({ GLOBAL }) => date => shift => GLOBAL.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryAIRP = ({ AIRP }) => date => shift => AIRP.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
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

const queryBelowNeuroHolidayCap           = generic.floatCap("Neuro", true, PerShiftCaps)
const queryBelowNeuroCap                  = generic.floatCap("Neuro", false, PerShiftCaps)
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


const queryBelowNeuroAggregateCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("Neuro"))
    return resident.assignedShifts.filter(s => s.shift.includes("Neuro")).length < PerShiftCaps["AGGREGATE NEURO"]
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
  "queryGlobal",
  "queryNFWeekends",
  "queryPPWeekends",
  "querySaturdayNightCallWeekend",
  "queryCHOP",
  "queryBelowNeuroHolidayCap",
  "queryBelowNeuroCap",
  "queryBelowBodyHolidayCap",
  "queryBelowBodyCap",
  "queryBelowHUPHolidayNightFloatCap",
  "queryBelowHUPNightFloatCap",
  "queryBelowPAHHolidayNightFloatCap",
  "queryBelowPAHNightFloatCap",
  "queryBelowAggregateNightFloatCap",
  "queryBelowBodyAggregateCap",
  "queryBelowNeuroAggregateCap",
  "queryBelowTotalCap",
]

export const softRestrictions = [
  ...generic.softRestrictions,
  "queryAIRP",
]

export const preferToWorkFilters = [
  ...generic.preferToWorkFilters,
]

export const constraintMap = {
  ...generic.constraintMap,
  "queryNFWeekends": {"msg": "Night float week", "fn": queryNFWeekends},
  "queryPPWeekends": {"msg": "Private practice week", "fn": queryPPWeekends},
  "querySaturdayNightCallWeekend": {"msg": "Night saturday call <> shift", "fn": querySaturdayNightCallWeekend},
  "queryAIRP": {"msg": "AIRP week", "fn": queryAIRP},
  "queryGlobal": {"msg": "Global studies week", "fn": queryGlobal},
  "queryCHOP": {"msg": "CHOP week", "fn": queryCHOP},
  "queryBelowNeuroHolidayCap": {"msg": "Max Neuro shifts", "fn": queryBelowNeuroHolidayCap},
  "queryBelowNeuroCap": {"msg": "Max Neuro shifts", "fn": queryBelowNeuroCap},
  "queryBelowBodyHolidayCap": {"msg": "Max holiday body shifts", "fn": queryBelowBodyHolidayCap},
  "queryBelowBodyCap": {"msg": "Max weekend body shifts", "fn": queryBelowBodyCap},
  "queryBelowHUPHolidayNightFloatCap": {"msg": "Max HUP holiday night shifts", "fn": queryBelowHUPHolidayNightFloatCap},
  "queryBelowHUPNightFloatCap": {"msg": "Max HUP night shifts", "fn": queryBelowHUPNightFloatCap},
  "queryBelowPAHHolidayNightFloatCap": {"msg": "Max PAH holiday night shifts", "fn": queryBelowPAHHolidayNightFloatCap},
  "queryBelowPAHNightFloatCap": {"msg": "Max PAH night shifts", "fn": queryBelowPAHNightFloatCap},
  "queryBelowAggregateNightFloatCap": {"msg": "Max night shifts", "fn": queryBelowAggregateNightFloatCap},
  "queryBelowBodyAggregateCap": {"msg": "Max body shifts", "fn": queryBelowBodyAggregateCap},
  "queryBelowTotalCap": {"msg": "Max shifts", "fn": queryBelowTotalCap},
}

export const getTotalDifficulty = holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

