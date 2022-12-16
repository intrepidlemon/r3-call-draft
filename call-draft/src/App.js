import React from 'react';

import Engine from "./engine/engine";
import './App.css';

import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function renderDay(day) {
  const colors = ['rgb(240, 239, 239)', '#f44336', 'orange', '#4CAF50'];

  const date = day.getDate();
  const color = colors[getRandomInt(4)];

  return (
    <div className="day" style={{ backgroundColor: colors[0] }}></div>
  );
}

function App() {
  const [selected, setSelected] = React.useState();
  Engine()

  return (
    <div className="App">
      <header className="App-header">
        <DayPicker
          mode="single"
          styles={{
            cell: { 
              backgroundColor: 'red',
              margin: '25px',
              borderRadius: '10px'
            }
          }}
          selected={selected}
          onSelect={setSelected}
          numberOfMonths={2}
        />
      </header>
    </div>
  );
}

export default App;
