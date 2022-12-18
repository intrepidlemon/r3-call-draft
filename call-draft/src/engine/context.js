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
    downloadRotations().then(downloadPreferences)
  }, [dispatch])

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
      engine.assignedShifts = Object.fromEntries(action.data.map(d => [
        d.date.toMillis(),
        Object.fromEntries(Object.keys(d).map(k =>[k, undefined]))
      ]))
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

      action.data.forEach(d => {
        engine.assignedShiftsByResident[d.name] = engine.assignedShiftsByResident[d.name] || []
      })
      break;
    }

    case 'assignShift': {
      clearShift(engine, action) // first remove all other residents who have the same shift

      const { date, shift, name } = action.data

      engine.assignedShiftsByResident[name].push({ date, shift })

      engine.assignedShifts[date.toMillis()][shift] = name
      break;
    }
    case 'clearShift': {
      clearShift(engine, action)
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

  assignedShifts: {},
  assignedShiftsByResident: {},
}

// reducers

const clearShift = (engine, action) => {
  const { date, shift } = action.data

  Object.keys(engine.assignedShiftsByResident).forEach(k => {
    engine.assignedShiftsByResident[k] = engine.assignedShiftsByResident[k].filter(s => !(sameDay(s.date, date) && shift === s.shift))
  })

  delete engine.assignedShifts[date.toMillis()][shift]
}

// views
export const residentsView = ({ residents, assignedShiftsByResident }) => residents.map(r => ({
  ...r,
  assignedShifts: assignedShiftsByResident[r.name],
}))
