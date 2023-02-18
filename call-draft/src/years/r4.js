import * as generic from './generic'
import { getPriorSaturday, getNextSunday, isPartOfHolidayWeekend } from '../utils'

export const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ8POx_2ekDFfj-3rHdkpuonPJGM8eTfAccsC_OjiqWTo3C22rDkH-fF6FEBS3CxtsqdukyplaiJKb/pub?gid=0&single=true&output=csv"
export const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ8POx_2ekDFfj-3rHdkpuonPJGM8eTfAccsC_OjiqWTo3C22rDkH-fF6FEBS3CxtsqdukyplaiJKb/pub?gid=1947318660&single=true&output=csv"
export const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZ8POx_2ekDFfj-3rHdkpuonPJGM8eTfAccsC_OjiqWTo3C22rDkH-fF6FEBS3CxtsqdukyplaiJKb/pub?gid=396610078&single=true&output=csv"

const PerShiftCaps = {
  "REGULAR" : {
    "Neuro": 2,
    "Swing PAH": 8,
  },

  "HOLIDAY" : {
    "Neuro": 3,
    "Swing PAH": 3,
  },
  "AGGREGATE NEURO": 3,
  "AGGREGATE SWING PAH": 8,
  "TOTAL CAP": 14,
}

const DifficultyHeuristic = {
  "REGULAR" : {
    "Neuro": 1.0,
    "Swing PAH": 1.0,
  },

  "HOLIDAY" : {
    "Neuro": 1.25,
    "Swing PAH": 1.25,
  },
}

const queryPPWeekends = ({ PP }) => date => shift => PP.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryPrNWeekends = ({ PRN }) => date => shift => PRN.reduce((okay, rotation_monday) =>
  okay &&
  !(getPriorSaturday(rotation_monday) <= date && date <= getNextSunday(rotation_monday)),
  true
)

const queryBelowNeuroHolidayCap      = generic.floatCap("Neuro", true, PerShiftCaps)
const queryBelowNeuroCap             = generic.floatCap("Neuro", false, PerShiftCaps)
const queryBelowSwingPAHHolidayCap   = generic.floatCap("Swing PAH", true, PerShiftCaps)
const queryBelowSwingPAHCap          = generic.floatCap("Swing PAH", false, PerShiftCaps)

const queryBelowNeuroAggregateCap = ( resident, holidays ) => date => shift => {
  if (shift.includes("Neuro"))
    return resident.assignedShifts.filter(s => s.shift.includes("Neuro")).length < PerShiftCaps["AGGREGATE NEURO"]
  return true
}

const queryBelowTotalCap = ( resident, holidays ) => date => shift =>
  resident.assignedShifts.length < PerShiftCaps["TOTAL CAP"]

export const hardRestrictions = [
  ...generic.hardRestrictions,
  "queryPPWeekends",
  "queryPrNWeekends",
  "queryBelowNeuroHolidayCap",
  "queryBelowNeuroCap",
  "queryBelowNeuroAggregateCap",
  "queryBelowSwingPAHHolidayCap",
  "queryBelowSwingPAHCap",
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
  "queryPPWeekends": {"msg": "Private practice week", "fn": queryPPWeekends},
  "queryPrNWeekends": {"msg": "Prebsy nights week", "fn": queryPrNWeekends},
  "queryBelowNeuroHolidayCap": {"msg": "Max Neuro shifts", "fn": queryBelowNeuroHolidayCap},
  "queryBelowNeuroCap": {"msg": "Max Neuro shifts", "fn": queryBelowNeuroCap},
  "queryBelowNeuroAggregateCap": {"msg": "Max night shifts", "fn": queryBelowNeuroAggregateCap},
  "queryBelowSwingPAHHolidayCap": {"msg": "Max Swing PAH holiday shifts", "fn": queryBelowSwingPAHHolidayCap},
  "queryBelowSwingPAHCap": {"msg": "Max Swing PAH shifts", "fn": queryBelowSwingPAHCap},
  "queryBelowTotalCap": {"msg": "Max shifts", "fn": queryBelowTotalCap},
}

export const getTotalDifficulty = holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

