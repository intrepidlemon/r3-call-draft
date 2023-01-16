import React from 'react'
import { DateTime } from 'luxon'

import { useEngine } from '../engine/context'
import { isPartOfHolidayWeekend } from '../utils'

import Assigner from './assigner'

import styles from './tally.module.css'

const Tally = () => {
  const { requiredShifts, assignedShiftsByResident } = useEngine()
  if (!requiredShifts || requiredShifts.length === 0) {
    return null
  }

  const shiftNames = Object.keys(requiredShifts[0])
  shiftNames.shift(0)
  return <div className={styles.tally}>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>resident</th>
          { shiftNames.map(k => <th key={k}>{k}</th>)}
        </tr>
      </thead>
      <tbody>
        { Object.keys(assignedShiftsByResident).map(k => <Row key={k} name={k} shiftNames={shiftNames} shifts={assignedShiftsByResident[k]} />) }
      </tbody>
    </table>
  </div>
}

const Row = ({ name, shiftNames, shifts }) => {
  const { holidays } = useEngine()

  const counts = shifts.reduce((obj, s) => {
    const count = obj[s.shift] === undefined ? 0 : obj[s.shift]
    if (!isPartOfHolidayWeekend(holidays)(s.date)) {
      obj[s.shift] = count + 1
    }
    return obj
  }, {})
  const holidayCounts = shifts.reduce((obj, s) => {
    const count = obj[s.shift] === undefined ? 0 : obj[s.shift]
    if (isPartOfHolidayWeekend(holidays)(s.date)) {
      obj[s.shift] = count + 1
    }
    return obj
  }, {})
  return <tr>
    <td className={styles.resident}>{name}</td>
    { shiftNames.map(sn => <td>
        { counts[sn] === undefined ? 0 : counts[sn] } &nbsp;
        ({ holidayCounts[sn] === undefined ? 0 : holidayCounts[sn] })
      </td>)
    }
  </tr>
}

export default Tally
