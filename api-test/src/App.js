import React, { useEffect, useState } from 'react'
import './App.css';
import Amplify, { API } from 'aws-amplify';
Amplify.configure({
  API: {
    endpoints: [
        {
            name: "MyAPIGatewayAPI",
            endpoint: "https://iskxq3a207.execute-api.ap-southeast-2.amazonaws.com/default"
        }
    ]
  }
});

function App() {
  const [pets, updatePets] = useState([])

  async function getData() {
    try {
      // const data = await API.get('cryptoapi', '/coins')
      const data = await API.get('MyAPIGatewayAPI', '/pets')
      console.log('data from Lambda REST API: ', data)
      updatePets(data)
    } catch (err) {
      console.log('error fetching data..', err)
    }
  }

  useEffect(() => {
    getData()
  }, [])

  return (
    <div>
      {
        pets.map((c, i) => (
          <div key={i}>
            <h2>{c.name}</h2>
            <p>{c.id}</p>
          </div>
        ))
      }
    </div>
  )
}

export default App;
