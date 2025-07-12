import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";

const isRecordingSupported = 
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function'
    typeof window.MediaRecorder === 'function';

export function RecordRoomAudio() {
    const [isRecording, setIsRecording] = useState(false);
    const recorder = useRef<MediaRecorder | null>(null);

    function uploadAudio(audio: Blob) {
        const formData = new FormData();

        formData.append('file', audio, 'audio.webm');
    }
    
    function stopRecording() {
        setIsRecording(false);

        if (recorder.current && recorder.current.state !== 'inactive') {
            recorder.current.stop();
        }
    }

    async function startRecording() {
        if (!isRecordingSupported) {
            alert('O seu navegador não suporta gravação!');
            return;
        }

        setIsRecording(true);

        const audio = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44_100,
            },
        });

        recorder.current = new MediaRecorder(audio, {
            mimeType: 'audio/webm',
            audioBitsPerSecond: 64_000,
        });

        recorder.current.ondataavailable = event => {
            if (event.data.size > 0) {
                uploadAudio(event.data);
            }
        }

        recorder.current.onstart = () => {
            console.log('Gravação iniciada!');
        }

        recorder.current.onstop = () => {
            console.log('Gravação encerrada/pausada');
        }

        recorder.current.start();
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center">
            {isRecording ? 
                <Button onClick={stopRecording}>Pausar gravação</Button> :
                <Button onClick={startRecording}>Gravar áudio</Button>}
            
            

            {isRecording ? <p>Gravando...</p> : <p>Pausado</p>}
        </div>
    )
}