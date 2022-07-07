import { useState, useRef, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import './App.css'

function App() {
  const [count, setCount] = useState<Number>(0)
  const [modelsLoaded, setModelsLoaded] = useState<boolean>(false)
  const [captureVideo, setCaptureVideo] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const videoHeight = 480
  const videoWidth = 640
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]).then(() => {
        setModelsLoaded(true)
        console.log('Models loaded')
      })
    }
    loadModels()
  }, [])

  const startVideo = () => {
    setCaptureVideo(true)
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then(stream => {
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          video.play()
        }
      })
      .catch(err => {
        console.error("error:", err)
      })
  }

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (canvasRef && canvasRef.current && videoRef && videoRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current)
        const displaySize = {
          width: videoWidth,
          height: videoHeight
        }

        faceapi.matchDimensions(canvasRef.current, displaySize)

        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        ).withFaceLandmarks()

        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        console.log(resizedDetections)
        setCount(detections.length)
        canvasRef.current.getContext('2d')?.clearRect(0, 0, videoWidth, videoHeight)
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections)
      }
    }, 100)
  }

  const closeWebcam = () => {
    videoRef?.current?.pause()
    videoRef?.current?.srcObject?.getTracks()[0].stop()
    setCaptureVideo(false)
  }

  return (
    <div>
      <div style={{ textAlign: 'center', padding: '10px' }}>
        {
          captureVideo && modelsLoaded ?
            <button onClick={closeWebcam} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Close Webcam
            </button>
            :
            <button onClick={startVideo} style={{ cursor: 'pointer', backgroundColor: 'green', color: 'white', padding: '15px', fontSize: '25px', border: 'none', borderRadius: '10px' }}>
              Open Webcam
            </button>
        }
      </div>
      {
        captureVideo ?
          modelsLoaded ?
            <div>
              <p>Face count: {count}</p>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
                <video ref={videoRef} height={videoHeight} width={videoWidth} onPlay={handleVideoOnPlay} style={{ borderRadius: '10px' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute' }} />
              </div>
            </div>
            :
            <div>loading...</div>
          :
          <>
          </>
      }
    </div>
  )
}

export default App
