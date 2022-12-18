import React, { useRef, useState } from 'react'
import { TiWaves } from 'react-icons/ti'

import { useEngine, useEngineDispatch } from '../engine/context'
import { useOnClickOutside } from '../react-utils'
import { getUnrestrictedResidents, getConstraintsForResidents, hardRestrictions, softRestrictions } from '../restrictions'

import styles from './picker.module.css'

const Picker = ({ assigned, date, shift, close }) => {
  const ref = useRef()
  const { residents } = useEngine()
  const dispatch = useEngineDispatch()

  const [activeResident, setActiveResident] = useState('');


  const mapConstraintToMessage = {
    "queryNFWeekends": "Shift is adjacent to an assigned night float week. ",
    "queryBlackoutDays": "Shift is on resident's blackout day. ",
    "querySameDay": "Shift conflicts with another shift that day at a different location. ",
    "queryCHOP": "Shift is between two assigned CHOP weeks. ",
    "queryBelowHUPHolidayDayFloatCap": "Resident is at maximum number of HUP holiday day float shifts. ",
    "queryBelowHUPDayFloatCap": "Resident is at maximum number of HUP weekend day float shifts. ",
    "queryBelowPAHHolidayDayFloatCap": "Resident is at maximum number of PAH holiday day float shifts. ",
    "queryBelowPAHDayFloatCap": "Resident is at maximum number of PAH weekend day float shifts. ",
    "queryBelowBodyHolidayCap": "Resident is at maximum number of Body holiday day float shifts. ",
    "queryBelowBodyCap": "Resident is at maximum number of Body weekend day float shifts. ",
    "queryBelowHUPHolidayNightFloatCap": "Resident is at maximum number of HUP holiday night float shifts. ",
    "queryBelowHUPNightFloatCap": "Resident is at maximum number of HUP weekend night float shifts. ",
    "queryBelowPAHHolidayNightFloatCap": "Resident is at maximum number of PAH holiday night float shifts. ",
    "queryBelowPAHNightFloatCap": "Resident is at maximum number of PAH weekend night float shifts. ",
    "queryBelowAggregateNightFloatCap": "Resident is at maximum number of night float shifts. ",
    "queryBelowAggregateNormalDayFloatCap": "Resident is at maximum number of weekend day float shifts. ",
    "queryBelowAggregateHolidayDayFloatCap": "Resident is at maximum number of holiday day float shifts. ",
    "queryBelowBodyAggregateCap": "Resident is at maximum number of body day float shifts. ",
    "queryBelowTotalCap": "Resident is at maximum number of shifts. " 
  }

  const constraintsToErrorMessage = (constraintsForResident) => {
    let constraints = Object.keys(
      Object.fromEntries(Object.entries(constraintsForResident).filter(([k,v]) => !v)))
    let errorMessages = constraints.map((constraint) => mapConstraintToMessage[constraint])
    return errorMessages.join('')
  }


  const HoverText = ({errorMessage}) => {
  return (
    <>
      <div> {errorMessage} </div>
    </>
  );
};

  useOnClickOutside(ref, close)
  // should just filter based off of residentConstraints but I am currently too lazy and it is trivial
  const unrestrictedResidents = getUnrestrictedResidents(softRestrictions)(residents)(date)(shift)
  const residentConstraints = getConstraintsForResidents(hardRestrictions)(residents)(date)(shift)

  return <div className={styles.parent}>
    <TiWaves/>
    <div ref={ref} className={styles.picker}>
      { unrestrictedResidents.map(r =>
        <div key={r.name}>
          <button
            onMouseOver={() => setActiveResident(r.name)} onMouseOut={() => setActiveResident('')}
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
      {activeResident && <HoverText errorMessage={constraintsToErrorMessage(residentConstraints[activeResident])} />}
    </div>
  </div>
}

export default Picker
