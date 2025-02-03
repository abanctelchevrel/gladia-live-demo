import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'



function App() {
  const [wsUrl, setWsUrl] = useState(null)
  const [socket, setSocket] = useState(null)
  
      function saveWsUrl(event) {

        event.preventDefault();
        const formData = new FormData(event.target);
        const query = formData.get("query");
        console.log(`WS Url '${query}'`);
        setWsUrl(query);
        console.log(wsUrl)

      } 

      function startTranscription() {
        console.log("Starting transcription"); 
        console.log(wsUrl)

        const localSocket = new WebSocket(wsUrl);
        setSocket(localSocket);
      
      }


      function closeWS() {
        console.log("Closing WS");  
        console.log(socket)
        socket.close();
      }

  return (
    <>
      <h1>Gladia Live Transcription Demo</h1>
      <div className="card">
        <form onSubmit={saveWsUrl}>
          <input name="query"  placeholder="WS URL" />
          <button type="submit">Submit</button>
        </form>

        <button onClick={startTranscription} disabled={!wsUrl}>Open socket</button>

        <button onClick={closeWS} disabled={!socket}>Close WS</button>

      </div>
    </>
  )
}

export default App
