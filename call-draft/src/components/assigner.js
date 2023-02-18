import React from 'react'

import { TiUserAdd, TiWaves } from "react-icons/ti"

import { useEngine, useEngineDispatch } from '../engine/context'
import styles from './assigner.module.css'

const Assigner = ({ date, shift }) => {
  const { assignedShifts, focusedResident, focusedDate, focusedShift } = useEngine()

  const dispatch = useEngineDispatch()

  const setFocusResident = name => () => {
      dispatch({
      type: "setFocusResident",
      data: {
        name: name,
      }})
    }

  const workingResident = assignedShifts[date.toISO()] && assignedShifts[date.toISO()][shift]

  const setFocusDateAndShift = (date, shift) => () => {
    dispatch({
    type: "setFocusDateAndShift",
    data: {
      date: date,
      shift: shift,
    }})
  }

  if (date === focusedDate && shift === focusedShift) {
    return <div className={styles.parent}><TiWaves/></div>
  }

  return <button
    onClick={setFocusDateAndShift(date, shift)}
    className={workingResident === focusedResident && workingResident != null ? styles.active : styles.add}
    onMouseEnter={setFocusResident(workingResident)}
    onMouseLeave={setFocusResident(null)}
  >
      { workingResident !== undefined
        ? <div>{ workingResident }</div>
        : <TiUserAdd/>
      }
  </button>
}

export default Assigner
