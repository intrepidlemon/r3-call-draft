import { getPriorSaturday, getPriorSunday, getNextSaturday, getNextSunday, sameDay, isHoliday } from './utils'

// shift is adjacent to an assigned night float week
export const queryNFWeekends = ({ NF }) => weekend => shift =>
  NF.reduce((okay, nf) =>
    okay &&
    !(getPriorSaturday(nf) <= weekend && weekend <= getNextSunday(nf)),
    true
  )

// shift is on resident's blackout day
export const queryBlackoutDays = ({ blackout }) => weekend => shift =>
  blackout.reduce((okay, bo) =>
  okay &&
  !sameDay(weekend, bo),
  true
)

// shift conflicts with another shift that day at a different location
export const querySameDay = ({ assignedShifts }) => weekend => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
  !sameDay(weekend, s.date),
  true
)

// day shift is adjacent to a night shift
// TODO: IMPLEMENT THIS

// night shift is adjacent to a day shift
// TODO: IMPLEMENT THIS

// shift is between two assigned CHOP weeks

export const queryCHOP = ({ CHOP }) => weekend => shift =>
  CHOP.reduce((conflict, cp) =>
    conflict + (
    sameDay(getPriorSaturday(cp), weekend)
    || sameDay(getPriorSunday(cp), weekend)
    || sameDay(getNextSaturday(cp), weekend)
    || sameDay(getNextSunday(cp), weekend)),
  0
) < 2


const PerShiftCaps = {
  "REGULAR" : {
    "DF HUP": 8,
    "DF PAH": 8,
    "Body Call": 2,
    "NF HUP": 3,
    "NF PAH": 3,
  },

  "HOLIDAY" : {
    "DF HUP": 1,
    "DF PAH": 1,
    "Body Call": 2,
    "NF HUP": 1,
    "NF PAH": 1,
  }
}

const queryBelowPerShiftCap = ( resident ) => weekend => shift => {
  if (isHoliday(weekend)) {
    return resident.assignedShifts.filter(s => isHoliday(s.date) && s.shift === shift).length < PerShiftCaps["HOLIDAY"][shift]
  } else {
    return resident.assignedShifts.filter(s => !isHoliday(s.date) && s.shift === shift).length < PerShiftCaps["REGULAR"][shift]
  }
}

export const queryBelowHUPHolidayDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF HUP" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowHUPDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF HUP" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHHolidayDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF PAH" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHDayFloatCap = ( resident ) => weekend => shift => {
  if (shift === "DF PAH" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowBodyHolidayCap = ( resident ) => weekend => shift => {
  if (shift === "Body Call" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowBodyCap = ( resident ) => weekend => shift => {
  if (shift === "Body Call" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowHUPHolidayNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF HUP" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowHUPNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF HUP" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHHolidayNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF PAH" && isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowPAHNightFloatCap = ( resident ) => weekend => shift => {
  if (shift === "NF PAH" && !isHoliday(weekend))
    return queryBelowPerShiftCap(resident)(weekend)(shift)
  return true
}

export const queryBelowAggregateNightFloatCap = ( resident ) => weekend => shift => {
  if (shift.includes("NF"))
    return resident.assignedShifts.filter(s => s.shift.includes("NF")).length < 5
  return true
}

export const queryBelowAggregateNormalDayFloatCap = ( resident ) => weekend => shift => {
  if (shift.includes("DF") && !isHoliday(weekend))
    return resident.assignedShifts.filter(s => !isHoliday(s.date) && s.shift.includes("DF")).length < 13
  return true
}

export const queryBelowAggregateHolidayDayFloatCap = ( resident ) => weekend => shift => {
  if (shift.includes("DF") && isHoliday(weekend))
    return resident.assignedShifts.filter(s => isHoliday(s.date) && s.shift.includes("DF")).length < 1
  return true
}

export const queryBelowBodyAggregateCap = ( resident ) => weekend => shift => {
  if (shift.includes("Body"))
    return resident.assignedShifts.filter(s => s.shift.includes("Body")).length < 2
  return true
}

export const queryBelowTotalCap = ( resident ) => weekend => shift =>
  resident.assignedShifts.length < 19

export const getUnrestrictedResidents = restrictions => residents => day => shift =>
  residents.filter(
    resident => restrictions.every(
      restriction => restriction(resident)(day)(shift)
    )
  )

export const getConstraintsForResidents = restrictions => residents => day => shift =>
  Object.fromEntries(residents.map(resident =>
    [
      resident.name,
      Object.fromEntries(restrictions.map(restriction =>
        [
          restriction.name,
          restriction(resident)(day)(shift)
        ]
      ))
    ]
  ))

export const getAllUnrestrictedResidentsPerShift = shifts => restrictions => residents =>
  shifts.map(shift => {
    const neededShifts = Object.keys(shift).filter(k => k !== "date" && shift[k])
    return neededShifts.map(shiftName => ({
      date: shift.date,
      shift: shiftName,
      availableResidents: getUnrestrictedResidents(restrictions)(residents)(shift.date)(shiftName),
    }))
  })

export const hardRestrictions = [
  queryNFWeekends,
  querySameDay,
  queryCHOP,
  queryBelowHUPHolidayDayFloatCap,
  queryBelowHUPDayFloatCap,
  queryBelowPAHHolidayDayFloatCap,
  queryBelowPAHDayFloatCap,
  queryBelowBodyHolidayCap,
  queryBelowBodyCap,
  queryBelowHUPHolidayNightFloatCap,
  queryBelowHUPNightFloatCap,
  queryBelowPAHHolidayNightFloatCap,
  queryBelowPAHNightFloatCap,
  queryBelowAggregateNightFloatCap,
  queryBelowAggregateNormalDayFloatCap,
  queryBelowAggregateHolidayDayFloatCap,
  queryBelowBodyAggregateCap,
  queryBelowTotalCap
]

export const softRestrictions = [
  queryBlackoutDays,
]
