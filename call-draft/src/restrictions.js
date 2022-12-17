import { getPriorSaturday, getPriorSunday, getNextSaturday, getNextSunday, sameDay } from './utils'

// 3. Cannot work on weekends during and surrounding NF rotation.
// this will return false if a resident cannot work on a proposed weekend
export const queryNFWeekends = ({ NF }) => weekend => shift =>
  NF.reduce((okay, nf) =>
    okay &&
    !(getPriorSaturday(nf) <= weekend && weekend <= getNextSunday(nf)),
    true
  )

// Return false if a resident declared this a blackout day
export const queryBlackoutDays = ({ blackout }) => weekend => shift =>
  blackout.reduce((okay, bo) =>
  okay &&
  !sameDay(weekend, bo),
  true
)

// Cannot work on the same day at a different location
export const querySameDay = ({ assignedShifts }) => weekend => shift =>
  assignedShifts.reduce((okay, s) =>
  okay &&
  !sameDay(weekend, s.date),
  true
)

// cannot take call shifts when between two weeks assigned at CHOP

// Because this constraint requires knowledge of multiple CHOP weeks
// we cannot use a boolean and need to maintain state. 
export const queryCHOP = ({ CHOP }) => weekend => shift =>
  CHOP.reduce((conflict, cp) =>
    conflict + (
    sameDay(getPriorSaturday(cp), weekend) 
    || sameDay(getPriorSunday(cp), weekend)
    || sameDay(getNextSaturday(cp), weekend)
    || sameDay(getNextSunday(cp), weekend)),
  0
) < 2 

export const getUnrestrictedResidents = restrictions => residents => day => shift =>
  residents.filter(
    resident => restrictions.every(
      restriction => restriction(resident)(day)(shift)
    )
  )

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
  querySameDay,
  queryNFWeekends
]

export const softRestrictions = [
  querySameDay,
  queryNFWeekends,
  queryBlackoutDays,
  queryCHOP,
]
