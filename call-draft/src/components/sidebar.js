import React from 'react'

import { useEngine } from '../engine/context'

import List from './list'
import Picker from './picker'

import styles from './sidebar.module.css'

const Sidebar = () => {
  const engine = useEngine()
  const { focusedShift, focusedDate, assignedShifts } = engine

  return <div className={styles.sidebar}>
    {(focusedShift != null) &&
      <Picker assigned={assignedShifts[focusedDate.toISO()][focusedShift]} date={focusedDate} shift={focusedShift} />
    }
    <List/>
  </div>
}


export default Sidebar
