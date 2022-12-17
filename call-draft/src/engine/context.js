import { createContext, useContext, useEffect } from 'react'
import { useImmerReducer } from 'use-immer'
import { freeze } from 'immer'
import { parseDate, sameDay } from '../utils'

import Papa from 'papaparse'

const requiredShiftsURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQNefnctzjWPpE-rWcQyTesFq0GJaYjMQ-Ux20oO8bx-3GgLTCT7vkOxMzD0nq_dTviZ_SIyMMmlqt8/pub?gid=1433333551&single=true&output=csv"

const EngineContext = createContext(null)
const EngineDispatchContext = createContext(null)

export const EngineProvider = ({ children }) => {
  const [engine, dispatch] = useImmerReducer(
    engineReducer,
    initialEngine,
  )

  useEffect(() => {
    const func = async () => {
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
    func()
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

    case 'assignShift': {
      clearShift(engine, action) // first remove all other residents who have the same shift

      const { date, shift, name } = action.data

      const ri = engine.residents.findIndex(r => r.name === name)
      engine.residents[ri].assignedShifts.push({ date, shift })

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
  assignedShifts: {},
  residents: [
  {
    name: "Xi",
    assignedShifts: [ { date: parseDate("2023-09-03"), shift: "DF HUP" } ],
  },
  {
    name: "Gangaram",
    assignedShifts: [],
  },
]}

// reducers

const clearShift = (engine, action) => {
  const { date, shift } = action.data

  engine.residents.forEach(r => {
    r.assignedShifts = r.assignedShifts.filter(s => !(sameDay(s.date, date) && shift === s.shift))
  })

  delete engine.assignedShifts[date.toMillis()][shift]
}
