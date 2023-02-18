import { getPriorSaturday, getPriorSunday, getNextSaturday, getNextSunday, sameDay, isPartOfHolidayWeekend } from './utils'
// shift is adjacent to an assigned night float week

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

// shift is on resident's blackout day
const queryBlackoutDays = ({ blackout }) => date => shift =>
  blackout.reduce((okay, bo) =>
  okay &&
  !sameDay(date, bo),
  true
)

const queryPreferNotDays = ({ preferNot }) => date => shift =>
  preferNot.reduce((okay, pn) =>
  okay &&
  !sameDay(date, pn),
  true
)

const queryPreferToWorkDays = ({ preferToWork }) => date => shift =>
  preferToWork.reduce((containsDay, ptw) =>
  containsDay ||
  sameDay(date, ptw),
  false
)

// shift conflicts with another shift that day at a different location
const querySameDay = ({ assignedShifts }) => date => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
  !sameDay(date, s.date),
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


const queryBelowPerShiftCap = ( resident, holidays ) => date => shift => {
  if (isPartOfHolidayWeekend(holidays)(date)) {
    return resident.assignedShifts.filter(s => isPartOfHolidayWeekend(holidays)(s.date) && s.shift === shift).length < PerShiftCaps["HOLIDAY"][shift]
  } else {
    return resident.assignedShifts.filter(s => !isPartOfHolidayWeekend(holidays)(s.date) && s.shift === shift).length < PerShiftCaps["REGULAR"][shift]
  }
}

const queryBelowHUPHolidayDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "DF HUP" && isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowHUPDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "DF HUP" && !isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowPAHHolidayDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "DF PAH" && isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowPAHDayFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "DF PAH" && !isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowBodyHolidayCap = ( resident, holidays ) => date => shift => {
  if (shift === "Body Call" && isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowBodyCap = ( resident, holidays ) => date => shift => {
  if (shift === "Body Call" && !isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowHUPHolidayNightFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "NF HUP" && isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowHUPNightFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "NF HUP" && !isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowPAHHolidayNightFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "NF PAH" && isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

const queryBelowPAHNightFloatCap = ( resident, holidays ) => date => shift => {
  if (shift === "NF PAH" && !isPartOfHolidayWeekend(holidays)(date))
    return queryBelowPerShiftCap(resident, holidays)(date)(shift)
  return true
}

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

export const getUnrestrictedResidents = restrictions => (residents, holidays) => day => shift =>
  residents.filter(
    resident => restrictions.every(
      restriction => constraintMap[restriction].fn(resident, holidays)(day)(shift)
    )
  )

export const getConstraintsForResidents = restrictions => (residents, holidays) => day => shift =>
  Object.fromEntries(residents.map(resident =>
    [
      resident.name,
      Object.fromEntries(restrictions.map(restriction =>
        [
          constraintMap[restriction].msg,
          constraintMap[restriction].fn(resident, holidays)(day)(shift)
        ]
      ))
    ]
  ))

export const getFlatListOfShifts = shifts =>
  shifts.map(shift => {
    const neededShifts = Object.keys(shift).filter(k => k !== "date" && shift[k] === "1")
    return neededShifts.map(shiftName => ({
      date: shift.date,
      shift: shiftName,
    }))
  }).flat()

export const getUnfilledShifts = shifts => assignedShifts => shifts.filter(s => assignedShifts[s.date][s.shift] === undefined)

export const getAllUnrestrictedResidentsPerShift = flatShifts => restrictions => (residents, holidays) =>
  flatShifts.map(shift => ({
      date: shift.date,
      shift: shift.shift,
      availableResidents: getUnrestrictedResidents(restrictions)(residents, holidays)(shift.date)(shift.shift),
  }))

export const hardRestrictions = [
  "queryNFWeekends",
  "querySameDay",
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
  "queryBlackoutDays",
]

export const softRestrictions = [
  "queryPreferNotDays",
]

export const preferToWorkFilters = [
  "queryPreferToWorkDays",
]

export const constraintMap = {
    "queryNFWeekends": {"msg": "Night float week", "fn": queryNFWeekends},
    "queryBlackoutDays": {"msg": "Blackout", "fn": queryBlackoutDays},
    "querySameDay": {"msg": "Same day shift", "fn": querySameDay},
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
    "queryPreferNotDays": {"msg": "Prefer to not work", "fn": queryPreferNotDays},
    "queryPreferToWorkDays": {"msg": "Prefer to work", "fn": queryPreferToWorkDays},
  }

const metadata = (residents, holidays) => (shift, name) => ({
  numTotalShifts: countShifts(residents.find(res => res.name === name))("all"),
  numSpecificShifts: countShifts(residents.find(res => res.name === name))(shift),
  totalDifficulty: getTotalDifficulty(holidays)(residents.find(res => res.name === name)),
})

export const splitResidents = (residents, holidays) => date => shift => {
  const hardConstraints = getConstraintsForResidents(hardRestrictions)(residents, holidays)(date)(shift)
  const softConstraints = getConstraintsForResidents(softRestrictions)(residents, holidays)(date)(shift)
  const preferred = getConstraintsForResidents(preferToWorkFilters)(residents, holidays)(date)(shift)

  const hardRestricted = Object.keys(hardConstraints).map(name => ({
    name,
    constraints: Object.keys(hardConstraints[name]).filter(k => !hardConstraints[name][k]),
    ...metadata(residents, holidays)(shift, name),
  })).filter(o => o.constraints.length > 0)
  const hardRestrictedNames = hardRestricted.map(o => o.name)

  const softRestricted = Object.keys(softConstraints).map(name => ({
    name,
    constraints: Object.keys(softConstraints[name]).filter(k => !softConstraints[name][k]),
    ...metadata(residents, holidays)(shift, name),
  })).filter(o => o.constraints.length > 0 && hardRestrictedNames.find(q => q === o.name) === undefined)
  const softRestrictedNames = softRestricted.map(o => o.name)

  const preferredToWork = Object.keys(preferred).map(name => ({
    name,
    preferred: Object.keys(preferred[name]).filter(k => preferred[name][k]),
    ...metadata(residents, holidays)(shift, name),
  })).filter(
    o => o.preferred.length > 0
    && hardRestrictedNames.find(q => q === o.name) === undefined
    && softRestrictedNames.find(q => q === o.name) === undefined
  )
  const preferredToWorkNames = preferredToWork.map(o => o.name)

  const neutral = residents.filter(r =>
    hardRestrictedNames.find(q => q === r.name) === undefined
    && softRestrictedNames.find(q => q === r.name) === undefined
    && preferredToWorkNames.find(q => q === r.name) === undefined
  ).map(r => ({
    name: r.name,
    constraints: [],
    ...metadata(residents, holidays)(shift, r.name),
  }))

  preferredToWork.sort((a, b) => a.totalDifficulty - b.totalDifficulty)
  neutral.sort((a, b) => a.totalDifficulty - b.totalDifficulty)
  softRestricted.sort((a, b) => a.totalDifficulty - b.totalDifficulty)
  hardRestricted.sort((a, b) => a.totalDifficulty - b.totalDifficulty)

  return {
    preferredToWork,
    neutral,
    softRestricted,
    hardRestricted,
  }
}

export const countShifts = resident => shift => {
  if (shift === "all") {
    return resident.assignedShifts.length
  }
  return resident.assignedShifts.filter(s => s.shift === shift).length
}

export const getTotalDifficulty = holidays => resident =>
  resident.assignedShifts.reduce((total, s) =>
    isPartOfHolidayWeekend(holidays)(s.date)
    ? total + DifficultyHeuristic["HOLIDAY"][s.shift]
    : total + DifficultyHeuristic["REGULAR"][s.shift]
  , 0)

