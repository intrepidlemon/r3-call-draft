import React, { useRef, useState } from 'react'
import { DateTime } from 'luxon'
import { TiWaves } from 'react-icons/ti'

import { useEngine, residentsView, useEngineDispatch } from '../engine/context'
import { useOnClickOutside } from '../react-utils'
import {
  getUnrestrictedResidents,
  getConstraintsForResidents,
  hardRestrictions,
  softRestrictions,
  preferToWorkFilters,
  mapConstraintToMessage,
  splitResidents,
} from '../restrictions'

import styles from './picker.module.css'

const Picker = ({ assigned, date, shift, close }) => {
  const ref = useRef()
  const engine = useEngine()
  const residents = residentsView(engine)
  const dispatch = useEngineDispatch()

  const [activeResident, setActiveResident] = useState('');

  const constraintsToErrorMessage = (constraintsForResident) => {
    let constraints = Object.keys(
      Object.fromEntries(Object.entries(constraintsForResident).filter(([k,v]) => !v)))
    let errorMessages = constraints.map((constraint) => mapConstraintToMessage[constraint])
    return errorMessages.join('')
  }

  useOnClickOutside(ref, close)
  const hardConstraints = getConstraintsForResidents(hardRestrictions)(residents)(date)(shift)
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
      <h3>{date.toLocaleString(DateTime.DATE_HUGE)} – { shift }</h3>
      <div className={styles.container}>
        <div className={styles.left}>
          <h4>Prefer to work</h4>
          <div className={styles.preferred}>
            { preferredToWork.map(r => <Resident
              name={r.name}
              constraints={r.preferred}
              assign={assignResident(r.name)}
            />)}
          </div>
          <h4>Neutral</h4>
          <div className={styles.neutral}>
            { neutral.map(r => <Resident
              name={r.name}
              constraints={r.constraints}
              assign={assignResident(r.name)}
            />)}
          </div>
        </div>
        <div className={styles.right}>
          <h4>Preferred not</h4>
          <div className={styles.soft_restricted}>
              { softRestricted.map(r => <Resident
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
