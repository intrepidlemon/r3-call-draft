import { createContext, useContext, useEffect } from 'react'
import { useImmerReducer } from 'use-immer'
import { parseDate } from '../utils'

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
      dispatch({
        type: "addRequiredShifts",
        data,
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
      break;
    }
    default: {
      throw Error('Unknown action: ' + action.type)
    }
  }
}

const initialEngine = {
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

