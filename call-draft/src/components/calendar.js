import React from 'react'

import { useEngine } from '../engine/context'

import styles from './calendar.module.css'

const Calendar = () => {
  const { requiredShifts } = useEngine()

  if (!requiredShifts) {
    return null
  }

  return <table className={styles.table}>
    <thead>
      <tr>
        { Object.keys(requiredShifts[0]).map(k => <th>{k}</th>)}
      </tr>
    </thead>
    <tbody>
      { requiredShifts.map(r => <Row row={r} />) }
    </tbody>
  </table>
}

const Row = ({ row }) => {
  return <tr>
    {
      Object.keys(row).map(k => <Cell
        // TODO: make the names of each prop much more clear. Making some bad assumptions here
        date={row["date"]}
        shift={k}
        render={row[k]}
      />)
    }
  </tr>
}

const Cell = ({ date, shift, render }) => {
  if (shift === "date") {
    return <td>
      {render}
    </td>
  }
  if(render === "0") {
    return <td/>
  }

  return <td>
    <select>
      <option>what the bugger</option>
    </select>
  </td>
}

export default Calendar
