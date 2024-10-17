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

type Subject = {
    subject: string,
    similarity: number,
}

type Face = {
    box: Box,
    subjects: Array<Subject>
}

const SERVER = 'http://localhost';
const PORT = 8000;
const KEY = import.meta.env.VITE_RECOGNITION_API_KEY;
const VIDEO_WIDTH = 500;
const VIDEO_HEIGHT = 375;
const SAMPLE_RATE = 150;

const MainPage = () => {
    const $canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const $camRef = useRef<Webcam>(null);
    const [paused, setPaused] = useState<boolean>(true);

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
    const updateImage = () => {
        const cameraCanvas = $camRef.current?.getCanvas();
        const imagePath = cameraCanvas?.toDataURL("image/jpeg", 1).split(',')[1] || '';
        const canvasContext: CanvasRenderingContext2D = $canvasRef.current.getContext('2d') || new CanvasRenderingContext2D;

        const recognitionParams = {
            limit: 1,
            det_prob_threshold: 0.9,
        };

        const boxes: Array<Box> = [];

        recognition.recognize(imagePath, recognitionParams).then((result: any) => {
            result.result.forEach((face: Face) => {
                boxes.push(face.box);
            });

            drawRectangles(canvasContext, boxes)
        }).catch((error: any) => {
            clearRectangle(canvasContext);
            console.log(error);
        });

    };

    // Update Frequency Logic
    useEffect(() => {
        if (!paused) {
            const timerID = setInterval(() => updateImage(), SAMPLE_RATE);
            return () => clearInterval(timerID);
        }
        return;
    });


    return (
        <div className={styles.container}>
            <div className={styles.webcamContainer}>
                <Webcam
                    audio={false}
                    ref={$camRef}
                    onUserMedia={console.log}
                    onUserMediaError={console.log}
                >
                </Webcam>
                {paused ? null : (
                    <div className={styles.canvas}>
                        <canvas ref={$canvasRef} width={500} height={375} />
                    </div>)
                }

            </div>
            <Button
                type="primary"
                onClick={updateImage}
            >
                Generate Image
            </Button>
            <Button
                type="primary"
                onClick={() => setPaused(!paused)}
            >
                {paused ? 'Play' : 'Pause'}
            </Button>
            {/* {renderCanvas} */}
            {/* <MainPage /> */}
        </div >
    );
};

export default MainPage;
