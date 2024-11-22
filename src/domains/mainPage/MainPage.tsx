/* eslint-disable react-hooks/exhaustive-deps */
import { CompreFace } from "@exadel/compreface-js-sdk";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import styles from './MainPage.module.scss'
import { Button } from "antd";

type Box = {
    probability: number;
    x_min: number,
    x_max: number,
    y_min: number,
    y_max: number,
}

const SERVER = import.meta.env.VITE_RECOGNITION_BASE_URL;
const PORT = import.meta.env.VITE_RECOGNITION_PORT;
const KEY = import.meta.env.VITE_RECOGNITION_API_KEY;

const VIDEO_SCALING = 120;
const VIDEO_WIDTH = 16 * VIDEO_SCALING;
const VIDEO_HEIGHT = 9 * VIDEO_SCALING;

const MainPage = () => {
    const $canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const $camRef = useRef<Webcam>(null);
    const [paused, setPaused] = useState<boolean>(true);
    const [cycleReady, setCycleReady] = useState<boolean>(true);
    const [recognitionText, setRecognitionText] = useState<string>('');

    // Service Configuration
    const core = new CompreFace(SERVER, PORT);
    const recognition = core.initFaceRecognitionService(KEY);


    // Face Tracking Functions
    const clearRectangle = (context: CanvasRenderingContext2D): void => {
        context.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    };

    const drawRectangles = (context: CanvasRenderingContext2D, boxes: Array<Box>): void => {
        context.strokeStyle = 'green';
        context.lineWidth = 5;
        clearRectangle(context);
        boxes.forEach(box => {
            context.strokeRect(box.x_min, box.y_min, box.x_max - box.x_min, box.y_max - box.y_min);
        });
    }

    // Recognition Function
    const updateImage = async () => {
        const cameraCanvas = $camRef.current?.getCanvas();
        const imagePath = cameraCanvas?.toDataURL("image/jpeg", 1).split(',')[1] || '';
        const canvasContext: CanvasRenderingContext2D = $canvasRef.current.getContext('2d') || new CanvasRenderingContext2D;

        const boxes: Array<Box> = [];
        console.log(recognition);

        recognition.recognize(imagePath, { limit: 0 }).then((face: any) => {
            boxes.push(face.box);
            setRecognitionText(`${face.subject.subject} reconhecido com ${(face.subject.similarity * 100).toFixed(2)}% de similaridade`);
            drawRectangles(canvasContext, boxes)
            setCycleReady(true);

        }).catch((error: any) => {
            clearRectangle(canvasContext);
            console.log(error);
            setCycleReady(true);
        });

    };

    // Update Frequency Logic
    useEffect(() => {
        if (cycleReady && !paused) {
            setCycleReady(false);
            updateImage();
        }
    }, [cycleReady, paused]);

    return (
        <div className={styles.container}>
            <div className={styles.webcamContainer}>
                <Webcam
                    audio={false}
                    ref={$camRef}
                    onUserMedia={console.log}
                    onUserMediaError={console.log}
                    videoConstraints={{ width: 1600, height: 900 }}
                >
                </Webcam>
                {paused ? null : (
                    <div className={styles.canvas}>
                        <canvas ref={$canvasRef} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} />
                    </div>)
                }

            </div>
            <Button
                type="primary"
                onClick={() => setPaused(!paused)}
            >
                {paused ? 'Start' : 'Pause'}
            </Button>
            <div>
                {recognitionText}
            </div>
        </div >
    );
};

export default MainPage;
