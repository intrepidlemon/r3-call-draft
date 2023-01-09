import React, { useRef } from 'react'
import { DateTime } from 'luxon'
import { TiWaves } from 'react-icons/ti'

import { useEngine, residentsView, useEngineDispatch } from '../engine/context'
import { useOnClickOutside } from '../react-utils'
import {
  mapConstraintToMessage,
  splitResidents,
} from '../restrictions'

import styles from './picker.module.css'

const Picker = ({ assigned, date, shift, close }) => {
  const ref = useRef()
  const engine = useEngine()
  const residents = residentsView(engine)
  const dispatch = useEngineDispatch()

  useOnClickOutside(ref, close)
  const {preferredToWork, neutral, softRestricted, hardRestricted} = splitResidents(residents)(date)(shift)

  const assignResident = name => () => {
      close()
      dispatch({
      type: "assignShift",
      data: {
        name: name,
        shift,
        date,
      }})
    }

  return <div className={styles.parent}>
    <TiWaves/>
    <div ref={ref} className={styles.picker}>
      <h3>
        {date.toLocaleString(DateTime.DATE_HUGE)} – { shift }
      </h3>
        { assigned &&
          <div>
            assigned: { assigned } &nbsp;
            <button onClick={() => dispatch({ type: "clearShift", data: { date, shift }})}>
              clear
            </button>
          </div>
        }
      <div className={styles.container}>
          <h4>Prefer to work</h4>
          <div className={styles.preferred}>
            { preferredToWork.map(r => <Resident
              key={r.name}
              name={r.name}
              constraints={r.preferred}
              assign={assignResident(r.name)}
            />)}
          </div>
          <h4>Neutral</h4>
          <div className={styles.neutral}>
            { neutral.map(r => <Resident
              key={r.name}
              name={r.name}
              constraints={r.constraints}
              assign={assignResident(r.name)}
            />)}
          </div>
          <h4>Preferred not</h4>
          <div className={styles.soft_restricted}>
              { softRestricted.map(r => <Resident
                key={r.name}
                name={r.name}
                constraints={r.constraints}
                assign={assignResident(r.name)}
              />)}
          </div>
          <h4> Restricted </h4>
          <div className={styles.hard_restricted}>
              { hardRestricted.map(r => <Resident
                name={r.name}
                constraints={r.constraints}
                assign={assignResident(r.name)}
              />)}
          </div>
      </div>
    </div>
  </div>
}

const Resident = ({ name, constraints, assign }) =>
<div className={styles.resident}>
  <button
    onClick={assign}
  >
    {name}
  </button>
  <div className={styles.constraints}>
    { constraints.map(c =>
      <span> {mapConstraintToMessage[c]} </span>
    )}
  </div>
</div>

export default Picker
