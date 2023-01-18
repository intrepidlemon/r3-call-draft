import React from 'react'
import { useState } from 'react'

import { TiUserAdd } from "react-icons/ti"

import { useEngine, useEngineDispatch } from '../engine/context'
import styles from './assigner.module.css'

import Picker from './picker'

const Assigner = ({ date, shift }) => {
  const [open, setOpen] = useState(false)
  const { assignedShifts, focusedResident } = useEngine()

  const dispatch = useEngineDispatch()

  const setFocusResident = name => () => {
      dispatch({
      type: "setFocusResident",
      data: {
        name: name,
      }})
    }

  const workingResident = assignedShifts[date.toISO()] && assignedShifts[date.toISO()][shift]

  if (open) {
    return <Picker
      assigned={workingResident}
      date={date}
      shift={shift}
      close={() => setOpen(false)}
    />
  }

  return <button
    onClick={() => setOpen(true)}
    className={workingResident === focusedResident ? styles.active : styles.add}
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
