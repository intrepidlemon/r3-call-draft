import React from 'react'

import Calendar from './calendar'
import Tally from './tally'
import List from './list'

import styles from './window.module.css'

const Window = () => <div className={styles.window}>
  <div>
    <Calendar/>
    <Tally/>
  </div>
  <List/>
</div>

export default Window
