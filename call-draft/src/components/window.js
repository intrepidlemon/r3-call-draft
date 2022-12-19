import React from 'react'

import Calendar from './calendar'
import List from './list'

import styles from './window.module.css'

const Window = () => <div className={styles.window}>
  <Calendar/>
  <List/>
</div>

export default Window
