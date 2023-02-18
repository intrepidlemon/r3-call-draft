import React, { useCallback, useState } from 'react'
import { DateTime } from 'luxon'

import { useEngine, residentsView, useEngineDispatch } from '../context'
import {
  getFlatListOfShifts,
  getAllUnrestrictedResidentsPerShift,
  getUnfilledShifts,
  hardRestrictions,
} from '../restrictions'

import styles from './list.module.css'

const List = () => {
  const engine = useEngine()
  const { holidays, requiredShifts, assignedShifts } = engine

  const [ list, setList ] = useState([])

  const refresh = useCallback(() => {
    const flatShifts = getFlatListOfShifts(requiredShifts)
    const unfilledShifts = getUnfilledShifts(flatShifts)(assignedShifts)
    const residents = residentsView(engine)

    const shiftsNeeded = getAllUnrestrictedResidentsPerShift(unfilledShifts)(hardRestrictions)(residents, holidays)
    const sortedShiftsNeeded = shiftsNeeded.sort((a, b) => a.availableResidents.length - b.availableResidents.length)

    setList(sortedShiftsNeeded)
  }, [holidays, requiredShifts, assignedShifts, engine])


  if (Object.keys(assignedShifts).length === 0) {
    return <div/>
  }

  return <div className={styles.list}>
    <button className={styles.refresh} onClick={refresh}>refresh</button>
    {
      list.map(s => <Entry date={s.date} shift={s.shift} availableResidents={s.availableResidents}/>)
    }
  </div>
}

const Entry = ({ date, shift, availableResidents }) => {

  const dispatch = useEngineDispatch()

  const setFocusDateAndShift = (date, shift) => () => {
    dispatch({
    type: "setFocusDateAndShift",
    data: {
      date: date,
      shift: shift,
    }})
  }

  return <div
    className={styles.entry}
    key={`${date.toMillis()}-${shift}`}
    onClick={setFocusDateAndShift(date, shift)}>
        {availableResidents.length} – {date.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)} – {shift}
      </div>
}

export default List
