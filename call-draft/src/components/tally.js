import React from 'react'

import { useEngine, residentsView } from '../engine/context'
import { isPartOfHolidayWeekend } from '../utils'
import {
  countShifts,
  getTotalDifficulty,
} from '../restrictions'

import styles from './tally.module.css'

const Tally = () => {
  const engine = useEngine()
  const { requiredShifts, holidays } = engine
  const residents = residentsView(engine)

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
          <th># shifts</th>
          <th>difficulty</th>
        </tr>
      </thead>
      <tbody>
        { residents.map(r => <Row
          key={r.name}
          resident={r}
          holidays={holidays}
          shiftNames={shiftNames}
          shifts={r.assignedShifts}
        />) }
      </tbody>
    </table>
  </div>
}

const Row = ({ resident, shiftNames, shifts, holidays }) => {

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
    <td className={styles.resident}>{resident.name}</td>
    { shiftNames.map(sn =>
      <td>
        { counts[sn] === undefined ? 0 : counts[sn] } &nbsp;
        { holidayCounts[sn] && `(${holidayCounts[sn]})` }
      </td>
    )}
      <td>
        { countShifts(resident)("all") }
      </td>
      <td>
        { getTotalDifficulty(holidays)(resident) }
      </td>
  </tr>
}

export default Tally
