import React, { useRef } from 'react'
import { TiWaves } from 'react-icons/ti'

import { useEngine, useEngineDispatch } from '../engine/context'
import { useOnClickOutside } from '../react-utils'
import { getUnrestrictedResidents, softRestrictions } from '../restrictions'

import styles from './picker.module.css'

const Picker = ({ assigned, date, shift, close }) => {
  const ref = useRef()
  const { residents } = useEngine()
  const dispatch = useEngineDispatch()

  useOnClickOutside(ref, close)

  const unrestrictedResidents = getUnrestrictedResidents(softRestrictions)(residents)(date)(shift)

  return <div className={styles.parent}>
    <TiWaves/>
    <div ref={ref} className={styles.picker}>
      { unrestrictedResidents.map(r =>
        <div key={r.name}>
          <button
            onClick={() => {
              close()
              dispatch({
              type: "assignShift",
              data: {
                name: r.name,
                shift,
                date,
              }})
            }}
          >
            {r.name}
          </button>
        </div>
      )}
    </div>
  </div>
}

export default Picker
