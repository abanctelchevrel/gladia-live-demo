import { useState } from 'react'
import reactLogo from './assets/react.svg'
import audio from './assets/audio.wav'
import viteLogo from '/vite.svg'
import './App.css'
import RecordRTCPromisesHandler from 'recordrtc'
import RecordRTC from 'recordrtc'
function App() {
  const [apiKey, setApiKey] = useState(null)
  const [wsUrl, setWsUrl] = useState(null)
  const [socket, setSocket] = useState(null)
  const [recorder, setRecorder] = useState(null)
  const [codeSwitching, setCodeSwitching] = useState(false)
  const [audioEnhancer, setAudioEnhancer] = useState(false)
  const [audioSrc, setAudioSrc] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  var transcript = ""
  const [viewTranscript, setTranscript] = useState(["Transcript will show here"])
  
      function saveWsUrl(event) {

        event.preventDefault();
        const formData = new FormData(event.target);
        const query = formData.get("query");
        setWsUrl(query);

      } 

      function saveApiKey(event) {

        event.preventDefault();
        const formData = new FormData(event.target);
        const query = formData.get("query");
        setApiKey(query);

      } 

      function createLiveTranscription() {
        console.log("Creating live transcription")
        console.log(apiKey)
        const body = {
          encoding: "wav/pcm",
          //bit_depth: 16,
          sample_rate: 48000,
          channels: 1,
          // custom_metadata: {
          //   user: "John Doe"
          // },
          // endpointing: 0.3,
          // maximum_duration_without_endpointing: 30,
          language_config: {
            //languages: [],
            code_switching: codeSwitching
          },
           pre_processing: {
             audio_enhancer: audioEnhancer,
          //   speech_threshold: 0.8
           },
          // realtime_processing: {
          //   words_accurate_timestamps: false,
          //   custom_vocabulary: false,
          //   custom_vocabulary_config: {
          //     vocabulary: ["Gladia"]
          //   },
          //   named_entity_recognition: false,
          //   sentiment_analysis: false
          // },
          // post_processing: {
          //   summarization: false,
          //   summarization_config: {
          //     type: "general"
          //   },
          //   chapterization: false
          // },
          // messages_config: {
          //   receive_partial_transcripts: true,
          //   receive_final_transcripts: true,
          //   receive_speech_events: true,
          //   receive_pre_processing_events: true,
          //   receive_realtime_processing_events: true,
          //   receive_post_processing_events: true,
          //   receive_acknowledgments: true,
          //   receive_errors: true,
          //   receive_lifecycle_events: false
          // },
          // callback: false,
          // callback_config: {
          //   url: "https://callback.example",
          //   receive_partial_transcripts: false,
          //   receive_final_transcripts: true,
          //   receive_speech_events: false,
          //   receive_pre_processing_events: true,
          //   receive_realtime_processing_events: true,
          //   receive_post_processing_events: true,
          //   receive_acknowledgments: false,
          //   receive_errors: false,
          //   receive_lifecycle_events: true
          // }
        };
        const options = {
          method: 'POST',
          headers: {
            'x-gladia-key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        };
        
        fetch('https://api.gladia.io/v2/live', options)
          .then(response => response.json())
          .then(response => {
            console.log(response); 
            setWsUrl(response.url)})
          .catch(err => console.error(err));
      }


      function startTranscription() {

        console.log("Starting transcription"); 
        const socket = new WebSocket(wsUrl);
        setTranscript("")
        setIsRecording(true)
        socket.addEventListener("message", function(event) {
          const message = JSON.parse(event.data.toString());
          if (message.type === 'transcript' && message.data.is_final) {
            transcript = transcript + " " + message.data.utterance.text
            setTranscript(transcript)
          }
    
          console.log(message);
        });
      
        socket.onopen = () => {
          setSocket(socket)
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
                      socket?.send(modifiedBuffer);
                    },
                    sampleRate: 48000,
                    desiredSampRate: 48000,
                    numberOfAudioChannels: 1
                  });
                await recorder.startRecording();
  
                setRecorder(recorder)              
              });
        };
        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };


      }


      function closeWS() {
        setIsRecording(false)

        recorder.stopRecording(function() {
          let blob = recorder.getBlob();
          console.log("blob")
          console.log(blob)
          setAudioSrc(URL.createObjectURL(blob))
      });
        socket.close();

      }

  return (
    <>
      


      <div class="left-sidebar-grid">
          <header class="header"><h1>Gladia Live Transcription Demo</h1></header>
          <main class="main-content">

          <audio src={audioSrc} controls className={!audioSrc? 'hidden' : undefined}/>
          <p>{viewTranscript}
            <span className={!isRecording? 'hidden' : undefined}>
              <svg height="20" width="25" className="blinking" >
                <circle cx="15" cy="10" r="10" fill="#333" />
              </svg>
            </span>

            </p>
          </main>
          <section class="left-sidebar">
          <form onSubmit={saveApiKey}>
          <input name="query"  placeholder="API Key" />
          <button type="submit">Use this key</button>
        </form>
        <div className="limiter">
          <label className="checkbox">
              <input type="checkbox" checked={codeSwitching} onChange={() => setCodeSwitching(!codeSwitching)} />
              Code Switching
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={audioEnhancer} onChange={() => setAudioEnhancer(!audioEnhancer)} />
              Audio Enhancer
            </label>
            <button onClick={createLiveTranscription} disabled={!apiKey}>Create live transcription</button>

        </div>

        <div className="limiter">
          <button onClick={startTranscription} disabled={!wsUrl}>Open socket and start recording 🎤</button>
          <button onClick={closeWS} disabled={!socket}>Close Socket</button>

        </div>
          </section>
          <footer class="footer"><a href="https://github.com/abanctelchevrel/gladia-live-demo" style={{color: 'grey'}}>Github repo</a></footer>
      </div>
    </>
  )
}

export default App
