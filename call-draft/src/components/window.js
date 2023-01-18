import React from 'react'

import Calendar from './calendar'
import Tally from './tally'
import Sidebar from './sidebar'

import styles from './window.module.css'

const Window = () => <div className={styles.window}>
  <div>
    <Calendar/>
    <Tally/>
  </div>
  <Sidebar/>
</div>

export default Window
