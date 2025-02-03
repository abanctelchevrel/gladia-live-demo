import { useState } from 'react'
import reactLogo from './assets/react.svg'
import audio from './assets/audio.wav'
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
        console.log(audio)

      } 

      function startTranscription() {
        console.log("Starting transcription"); 
        console.log(wsUrl)

        const socket = new WebSocket(wsUrl);
        setSocket(socket);
        socket.addEventListener("message", function(event) {
          // All the messages we are sending are in JSON format
          const message = JSON.parse(event.data.toString());
          console.log(message);
        });
      
        socket.onopen = () => {
          console.log("WebSocket connection established");
          
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
              console.log("Microphone access granted");
              
              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorder.start(250); // Send audio chunks every 250ms
              
              mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
                  socket.send(event.data);
                }
              };
            })
            .catch(err => {
              console.error("Error accessing microphone:", err);
            });
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };
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
