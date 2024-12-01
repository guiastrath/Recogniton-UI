/* eslint-disable react-hooks/exhaustive-deps */
import { CompreFace } from "@exadel/compreface-js-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import styles from './MainPage.module.scss'
import { Button } from "antd";
import classNames from "../../helpers/classNames";

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

const VIDEO_SCALING = 50;
const VIDEO_WIDTH = 10 * VIDEO_SCALING;
const VIDEO_HEIGHT = 16 * VIDEO_SCALING;

const MainPage = () => {
    const $canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    const $camRef = useRef<Webcam>(null);
    const [paused, setPaused] = useState<any>(true);
    const [recognized, setRecognized] = useState<any>(false);
    const [cycleReady, setCycleReady] = useState<boolean>(true);

    // Service Configuration
    const core = new CompreFace(SERVER, PORT);
    const recognition = core.initFaceRecognitionService(KEY);


    // Face Tracking Functions
    const clearRectangle = useCallback((context: CanvasRenderingContext2D): void => {
        context.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    }, [VIDEO_WIDTH, VIDEO_HEIGHT]);

    const drawRectangles = useCallback((boxes: Array<Box>): void => {
        const canvas = $canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        context.strokeStyle = 'green';
        context.lineWidth = 5;
        clearRectangle(context);
        boxes.forEach(box => {
            context.strokeRect(box.x_min, box.y_min, box.x_max - box.x_min, box.y_max - box.y_min);
        });
    }, []);


    // Recognition Function
    const updateImage = (): void => {
        const cameraCanvas = $camRef.current?.getCanvas();
        const imagePath = cameraCanvas?.toDataURL("image/jpeg", 1).split(',')[1] || '';
        const boxes: Array<Box> = [];

        recognition.recognize(imagePath, { limit: 0 }).then((face: any) => {
            console.log(face);
            if (face === 'access denied') {
                drawRectangles(boxes);
                setRecognized(false);
                setCycleReady(true);
                return null;
            }

            boxes.push(face.box);
            drawRectangles(boxes);
            setRecognized(true);
            setCycleReady(true);

        }).catch((error: any) => {
            console.log(error)
            drawRectangles(boxes);
            setRecognized(false);
            setCycleReady(true);
        });
    };

    // Update Frequency Logic
    useEffect(() => {
        if (cycleReady && !paused) {
            setCycleReady(false);
            updateImage();
        }
        if (paused) {
            setRecognized(null);
        }
    }, [cycleReady, paused]);

    // Camera and Face Tracking Canvas
    const renderVideo = useCallback(() => {
        return (
            <div className={styles.webcamContainer}>
                <Webcam
                    audio={false}
                    ref={$camRef}
                    onUserMedia={console.log}
                    onUserMediaError={console.log}
                    videoConstraints={{ width: VIDEO_WIDTH, height: VIDEO_HEIGHT }}
                >
                </Webcam>
                {paused ? null : (
                    <div className={styles.canvas}>
                        <canvas ref={$canvasRef} width={VIDEO_WIDTH} height={VIDEO_HEIGHT} />
                    </div>)
                }
            </div>
        );
    }, [paused]);

    // Render Recognition Card
    const renderRecognitionCard = useCallback(() => {
        let text: string;
        let style: string;

        switch (recognized) {
            case true:
                text = `Acesso Concedido`;
                style = styles.recognized;
                break;
            case false:
                text = 'Acesso Negado';
                style = styles.notRecognized;
                break;
            default:
                text = 'Aproxime-se para Reconhecer';
                style = styles.default;
                break;
        }

        return (
            <div
                className={classNames([styles.recognitionContainer, style])}
                data-status={text}
            >
                {renderVideo()}
            </div >
        );
    }, [recognized]);

    return (
        <div className={styles.mainContainer}>
            {renderRecognitionCard()}
            <Button
                type="primary"
                onClick={() => setPaused(!paused)}
            >
                {paused ? 'Start' : 'Pause'}
            </Button>
        </div>
    );
};

export default MainPage;
