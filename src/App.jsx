import { useState } from 'react'
import reactLogo from './assets/react.svg'
import audio from './assets/audio.wav'
import viteLogo from '/vite.svg'
import './App.css'
import RecordRTCPromisesHandler from 'recordrtc'
import RecordRTC from 'recordrtc'
function App() {
  const [wsUrl, setWsUrl] = useState(null)
  const [socket, setSocket] = useState(null)
  const [audioSrc, setAudioSrc] = useState(null)
  const [transcript, setTranscript] = useState("transcription will appear here")
  
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
        setTranscript("")
        const socket = new WebSocket(wsUrl);

        socket.addEventListener("message", function(event) {
          // All the messages we are sending are in JSON format
          const message = JSON.parse(event.data.toString());
          if (message.type === 'transcript' && message.data.is_final) {
            setTranscript(transcript + message.data.utterance.text)
            //console.log(`${message.data.id}: ${message.data.utterance.text}`)
          }
      
          console.log(message);
        });
      
        socket.onopen = () => {
          console.log("WebSocket connection established");
        
          navigator.mediaDevices.getUserMedia({
            audio: true
              })
              .then(async function(stream) {
                console.log(stream)
                const recorder = new RecordRTCPromisesHandler(stream, 
                  {
                    type: 'audio',
                    mimeType: 'audio/wav',
                    recorderType: RecordRTC.StereoAudioRecorder,
                    timeSlice: 1000,
                    async ondataavailable(blob) {
                      const buffer = await blob.arrayBuffer();
                      // Remove WAV header
                      const modifiedBuffer = buffer.slice(44);
                      console.log("modifiedBuffer")
                      console.log(modifiedBuffer)
                      socket?.send(modifiedBuffer);
                    },
                    sampleRate: 48000,
                    desiredSampRate: 48000,
                    numberOfAudioChannels: 1
                  });
                await recorder.startRecording();
  
  
                const sleep = m => new Promise(r => setTimeout(r, m));
  
                await sleep(40000);
              
                  recorder.stopRecording(function() {
                      let blob = recorder.getBlob();
                      console.log("blob")
                      console.log(blob)
                      setAudioSrc(URL.createObjectURL(blob))
                  });

  
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
        <p>{transcript}</p>
        <audio src={audioSrc} controls />
      </div>
    </>
  )
}

export default App
