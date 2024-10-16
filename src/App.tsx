/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import { CompreFace } from '@exadel/compreface-js-sdk';
import styles from './App.module.scss'
import { Button } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react'
import Webcam from 'react-webcam'

const SERVER = 'http://localhost';
const PORT = 8000;
const KEY = '48074788-e0a7-40a0-b6c5-1aba5fbb21ad';

const core = new CompreFace(SERVER, PORT)
const recognition = core.initFaceRecognitionService(KEY)

type Box = {
    probability: number;
    x_min: number,
    x_max: number,
    y_min: number,
    y_max: number,
}

const App = () => {
    const webcamRef = useRef<Webcam>(null);
    const $canvas = useRef<HTMLCanvasElement>(document.createElement('canvas'));
    // const [screenshot, setScreenshot] = useState<string | null | undefined>('');
    const [a, setA] = useState<HTMLCanvasElement | null | undefined>(null);
    const [b, setB] = useState<Box | null | undefined>(null);
    const [paused, setPaused] = useState<boolean>(false);

    useEffect(() => {
        if (!paused) {
            const timerID = setInterval(() => timedFunction(), 150);
            return () => clearInterval(timerID);
        }
        return;
    });


    const drawRectangle = (context: CanvasRenderingContext2D, box: Box): void => {
        context.strokeStyle = 'green';
        context.lineWidth = 5;
        context.clearRect(0, 0, 500, 375);
        context.strokeRect(box.x_min, box.y_min, box.x_max - box.x_min, box.y_max - box.y_min);
        // context.scale(4, 3);
    }

    const timedFunction = () => {
        updateImage();
    };

    const updateImage = () => {
        // let box: Box | null | undefined;

        recognition.recognize(webcamRef.current?.getCanvas()?.toDataURL("image/jpeg", 1).split(',')[1] || '', { limit: 1, det_prob_threshold: 0.9 })
            .then((res: any) => {
                const box = res.result[0].box;
                const canvasContext: CanvasRenderingContext2D = $canvas.current.getContext('2d') || new CanvasRenderingContext2D
                drawRectangle(canvasContext, box);
                setA($canvas.current)
                setB(box)
                console.log(box);
            }).catch(() => drawRectangle($canvas.current.getContext('2d') || new CanvasRenderingContext2D, {
                probability: 0,
                x_min: 0,
                x_max: 0,
                y_min: 0,
                y_max: 0,
            }));
    };

    const renderCanvas = useMemo(() => {
        return (
            <div className={styles.imageContainer}>
                {/* <Image src={screenshot || undefined} preview={false} /> */}
                <canvas ref={$canvas} width={400} height={300} />
            </div>
        );
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.webcamContainer}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    onUserMedia={console.log}
                    onUserMediaError={console.log}
                >
                </Webcam>

                <div className={styles.canvas}>
                    <canvas ref={$canvas} width={500} height={375} />
                </div>

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
        </div >
    )
};

export default App;
