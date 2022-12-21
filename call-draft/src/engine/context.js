import { createContext, useContext, useEffect } from 'react'
import { useImmerReducer } from 'use-immer'
import { freeze } from 'immer'

import { cleanResidentCSV, extractRotations } from '../csv-handling'
import { parseDate, sameDay } from '../utils'

import Papa from 'papaparse'

const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNefnctzjWPpE-rWcQyTesFq0GJaYjMQ-Ux20oO8bx-3GgLTCT7vkOxMzD0nq_dTviZ_SIyMMmlqt8/pub?gid=1433333551&single=true&output=csv"
const residentAssignedScheduleUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNefnctzjWPpE-rWcQyTesFq0GJaYjMQ-Ux20oO8bx-3GgLTCT7vkOxMzD0nq_dTviZ_SIyMMmlqt8/pub?gid=530426204&single=true&output=csv"
const residentPreferencesUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNefnctzjWPpE-rWcQyTesFq0GJaYjMQ-Ux20oO8bx-3GgLTCT7vkOxMzD0nq_dTviZ_SIyMMmlqt8/pub?gid=0&single=true&output=csv"

const EngineContext = createContext(null)
const EngineDispatchContext = createContext(null)

export const EngineProvider = ({ children }) => {
  const [engine, dispatch] = useImmerReducer(
    engineReducer,
    initialEngine,
  )

  useEffect(() => {
    // download shifts
    const downloadShifts = async () => {
      const data = await fetch(requiredShiftsURL)
        .then((r) => r.text())
        .then(t => Papa.parse(t, {header: true}).data)
      const parsedData = data.map(d => ({
        ...d,
        "date": parseDate(d.date),
      }))
      dispatch({
        type: "addRequiredShifts",
        data: freeze(parsedData),
      })
    }

    const downloadRotations = async () => {
      const data = await fetch(residentAssignedScheduleUrl)
        .then((r) => r.text())
        .then(t => Papa.parse(t, {header: true}).data)

      const parsedData = data.map(extractRotations)

      dispatch({
        type: "addRotations",
        data: parsedData,
      })
    }

    const downloadPreferences = async () => {
      const data = await fetch(residentPreferencesUrl)
        .then((r) => r.text())
        .then(t => Papa.parse(t, {header: true}).data)

      const parsedData = data.map(cleanResidentCSV)

      dispatch({
        type: "addPreferences",
        data: parsedData,
      })
    }

    downloadShifts()
      .then(downloadRotations)
      .then(downloadPreferences)
  }, [dispatch])

  const { assignedShifts, assignedShiftsByResident } = engine
  useEffect(() => {
    localStorage.setItem("assignedShifts", JSON.stringify(assignedShifts));
    localStorage.setItem("assignedShiftsByResident", JSON.stringify(assignedShiftsByResident));
  }, [assignedShifts, assignedShiftsByResident, dispatch]);

  return <EngineContext.Provider value={engine}>
    <EngineDispatchContext.Provider value={dispatch}>
      {children}
    </EngineDispatchContext.Provider>
  </EngineContext.Provider>
}

export const useEngine = () => useContext(EngineContext)
export const useEngineDispatch = () => useContext(EngineDispatchContext)

const engineReducer = (engine, action) => {
  switch (action.type) {

    case 'addRequiredShifts': {
      engine.requiredShifts = action.data
      break;
    }

    case 'addRotations': {
      engine.rotations = action.data
      break;
    }

    case 'addPreferences': {
      engine.preferences = action.data

      engine.residents = action.data.map(d => ({
        ...d,
        ...engine.rotations.find(({ name }) => name === d.name),
      }))

      const { assignedShifts } = engine
      if (Object.keys(assignedShifts).length === 0) {
        resetAllShifts(engine)
      }
      break;
    }

    case 'assignShift': {
      clearShift(engine, action) // first remove all other residents who have the same shift

      const { date, shift, name } = action.data

      engine.assignedShiftsByResident[name].push({ date: date.toISO(), shift })

      engine.assignedShifts[date.toISO()][shift] = name
      break;
    }
    case 'clearShift': {
      clearShift(engine, action)
      break;
    }

    case 'resetShifts': {
      resetAllShifts(engine)
      break;
    }

    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}


const initialEngine = {
  requiredShifts: [],
  rotations: [],
  preferences: [],
  residents: [],

  assignedShifts: JSON.parse(localStorage.getItem("assignedShifts")) || {},
  assignedShiftsByResident: JSON.parse(localStorage.getItem("assignedShiftsByResident")) || {},
}
console.log(JSON.parse(localStorage.getItem("assignedShifts")))

// reducers

const clearShift = (engine, action) => {
  const { date, shift } = action.data

  Object.keys(engine.assignedShiftsByResident).forEach(k => {
    engine.assignedShiftsByResident[k] = engine.assignedShiftsByResident[k].filter(s => !(sameDay(s.date, date) && shift === s.shift))
  })

  delete engine.assignedShifts[date.toISO()][shift]
}

const resetAllShifts = engine => {

  const { residents, requiredShifts } = engine

  residents.forEach(r => {
    engine.assignedShiftsByResident[r.name] = []
  })

  engine.assignedShifts = Object.fromEntries(requiredShifts.map(s => [
    s.date.toISO(),
    Object.fromEntries(Object.keys(s).map(k =>[k, undefined]))
  ]))

}

// views
export const residentsView = ({ residents, assignedShiftsByResident }) => residents.map(r => ({
  ...r,
  assignedShifts: assignedShiftsByResident[r.name],
}))
