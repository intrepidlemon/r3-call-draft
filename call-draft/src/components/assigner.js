import React from 'react'
import { useState } from 'react'

import { TiUserAdd } from "react-icons/ti"

import { parseDate } from '../utils'
import { useEngine } from '../engine/context'
import styles from './assigner.module.css'

const Assigner = ({ date, shift }) => {
  const [open, setOpen] = useState(false)
  const { residents } = useEngine()

  if (open) {
    return <div/>
  }

  const parsedDate = parseDate(date)

  const workingResident = residents.find(
    r => r.assignedShifts.find(s => (s.date - parsedDate === 0) && s.shift === shift)
  )

  return <button
    onClick={() => setOpen(true)}
    className={styles.add}
  >
      { workingResident !== undefined
        ? workingResident.name
        : <TiUserAdd/>
      }
  </button>
}

export default Assigner
