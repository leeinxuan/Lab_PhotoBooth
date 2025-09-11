import React, { useState, useRef, useEffect, useCallback } from 'react';

// --- Assets: Frames ---
// In a real application, these would likely come from a CMS or an API.
const frames = [
    {
        id: 1,
        name: '簡約白框',
        src: 'https://i.imgur.com/7lGvS36.png',
        preview: 'https://i.imgur.com/5O26r2m.png',
        photoCount: 4,
        positions: [ // x, y, width, height for each photo
            { x: 60, y: 80, width: 420, height: 315 },
            { x: 520, y: 80, width: 420, height: 315 },
            { x: 60, y: 430, width: 420, height: 315 },
            { x: 520, y: 430, width: 420, height: 315 },
        ]
    },
    {
        id: 2,
        name: '復古電影',
        src: 'https://i.imgur.com/sT5a0sT.png',
        preview: 'https://i.imgur.com/2A633iW.png',
        photoCount: 4,
        positions: [
            { x: 85, y: 100, width: 380, height: 285 },
            { x: 535, y: 100, width: 380, height: 285 },
            { x: 85, y: 450, width: 380, height: 285 },
            { x: 535, y: 450, width: 380, height: 285 },
        ]
    },
    {
        id: 3,
        name: '可愛塗鴉',
        src: 'https://i.imgur.com/39sB2zD.png',
        preview: 'https://i.imgur.com/OXTJ8eK.png',
        photoCount: 4,
        positions: [
            { x: 75, y: 90, width: 400, height: 300 },
            { x: 525, y: 90, width: 400, height: 300 },
            { x: 75, y: 440, width: 400, height: 300 },
            { x: 525, y: 440, width: 400, height: 300 },
        ]
    },
];

// --- Helper Components ---

// 開始畫面的組件
const StartScreen = ({ onStart }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/80 rounded-3xl shadow-2xl backdrop-blur-sm">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-4 tracking-tight">拍貼機</h1>
        <p className="text-lg md:text-2xl text-gray-600 mb-8 max-w-md">準備好擺出最棒的姿勢了嗎？點擊下方按鈕，開始創造你的專屬回憶！</p>
        <button
            onClick={onStart}
            className="px-10 py-5 bg-pink-500 text-white font-bold text-2xl rounded-full shadow-lg hover:bg-pink-600 transform hover:scale-105 transition-all duration-300 ease-in-out"
        >
            開始體驗
        </button>
    </div>
);

// 選擇版型畫面的組件
const FrameSelectionScreen = ({ onSelectFrame }) => (
    <div className="w-full max-w-4xl p-8 bg-white/80 rounded-3xl shadow-2xl backdrop-blur-sm">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-8">選擇你喜歡的版型</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {frames.map((frame) => (
                <div
                    key={frame.id}
                    className="cursor-pointer group border-4 border-transparent hover:border-pink-400 rounded-2xl p-2 transition-all duration-300"
                    onClick={() => onSelectFrame(frame)}
                >
                    <img src={frame.preview} alt={frame.name} className="w-full rounded-xl shadow-lg group-hover:shadow-2xl transform group-hover:scale-105 transition-transform duration-300" />
                    <p className="text-center font-semibold text-gray-700 mt-4 text-lg">{frame.name}</p>
                </div>
            ))}
        </div>
    </div>
);

// 拍照畫面的組件
const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
};

const ShootingScreen = ({ selectedFrame, onComplete }) => {
    const [captures, setCaptures] = useState([]);
    const [countdown, setCountdown] = useState(5);
    const [isCountingDown, setIsCountingDown] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const videoRef = useRef(null);

    useEffect(() => {
        async function getCameraStream() {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                } catch (err) {
                    console.error("Error accessing webcam: ", err);
                    setCameraError("無法存取攝影機。請檢查權限設定並重新整理頁面。");
                }
            } else {
                setCameraError("您的瀏覽器不支援攝影機功能。");
            }
        }
        getCameraStream();
        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject;
                const tracks = stream.getTracks();
                tracks.forEach(track => track.stop());
            }
        };
    }, []);

    const capture = useCallback(() => {
        if (videoRef.current) {
            const video = videoRef.current;
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageSrc = canvas.toDataURL('image/jpeg');
            const newCaptures = [...captures, imageSrc];
            setCaptures(newCaptures);

            if (newCaptures.length < selectedFrame.photoCount) {
                setCountdown(3);
            } else {
                setIsCountingDown(false);
                onComplete(newCaptures);
            }
        }
    }, [captures, selectedFrame, onComplete]);

    useEffect(() => {
        if (isCountingDown && !cameraError) {
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                capture();
            }
        }
    }, [countdown, isCountingDown, capture, cameraError]);

    return (
        <div className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
            {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center p-4">
                     <h3 className="text-2xl font-bold mb-4">攝影機錯誤</h3>
                     <p>{cameraError}</p>
                </div>
            )}
            {!cameraError && isCountingDown && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                    {countdown > 0 ? (
                        <p className="text-9xl font-bold animate-ping">{countdown}</p>
                    ) : (
                         <div className="flex flex-col items-center">
                             <div className="w-24 h-24 border-8 border-white rounded-full animate-spin mb-4"></div>
                             <p className="text-4xl font-bold">拍攝中！</p>
                        </div>
                    )}
                </div>
            )}
             <div className="absolute bottom-4 left-4 bg-black/50 text-white text-lg font-bold px-4 py-2 rounded-lg">
                拍攝進度： {captures.length} / {selectedFrame.photoCount}
            </div>
        </div>
    );
};


// 結果畫面的組件
const ResultScreen = ({ captures, selectedFrame, onRetake }) => {
    const [finalImage, setFinalImage] = useState(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const generateImage = async () => {
            setIsLoading(true);
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            canvas.width = 1000;
            canvas.height = 825;

            const frameImg = new Image();
            frameImg.crossOrigin = "anonymous";
            frameImg.src = selectedFrame.src;

            frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
                
                let loadedImages = 0;
                captures.forEach((capture, index) => {
                    const img = new Image();
                    img.src = capture;
                    img.onload = () => {
                        const pos = selectedFrame.positions[index];
                        const tempCanvas = document.createElement('canvas');
                        const tempCtx = tempCanvas.getContext('2d');
                        tempCanvas.width = img.width;
                        tempCanvas.height = img.height;
                        
                        tempCtx.translate(tempCanvas.width, 0);
                        tempCtx.scale(-1, 1);
                        tempCtx.drawImage(img, 0, 0);
                        
                        ctx.drawImage(tempCanvas, pos.x, pos.y, pos.width, pos.height);
                        loadedImages++;
                        if (loadedImages === captures.length) {
                           setFinalImage(canvas.toDataURL('image/png'));
                           setIsLoading(false);
                        }
                    };
                });
            };
        };

        generateImage();
    }, [captures, selectedFrame]);

    const handleDownload = () => {
        if (finalImage) {
            const link = document.createElement('a');
            link.href = finalImage;
            link.download = `react-photobooth-${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="w-full max-w-4xl p-8 bg-white/80 rounded-3xl shadow-2xl backdrop-blur-sm text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">你的專屬拍貼！</h2>
            <div className="relative w-full aspect-[1000/825] bg-gray-200 rounded-xl mb-6 flex items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center text-gray-500">
                        <svg className="animate-spin h-10 w-10 text-pink-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p>正在合成照片...</p>
                    </div>
                )}
                <canvas ref={canvasRef} className="hidden"></canvas>
                {finalImage && !isLoading && <img src={finalImage} alt="Final photobooth strip" className="w-full h-full object-contain rounded-xl shadow-lg" />}
            </div>
             <div className="flex justify-center space-x-4">
                <button
                    onClick={onRetake}
                    className="px-8 py-4 bg-gray-500 text-white font-bold text-xl rounded-full shadow-lg hover:bg-gray-600 transform hover:scale-105 transition-all duration-300 ease-in-out"
                >
                    重新拍攝
                </button>
                <button
                    onClick={handleDownload}
                    disabled={isLoading}
                    className="px-8 py-4 bg-pink-500 text-white font-bold text-xl rounded-full shadow-lg hover:bg-pink-600 transform hover:scale-105 transition-all duration-300 ease-in-out disabled:bg-pink-300 disabled:cursor-not-allowed"
                >
                    {isLoading ? '處理中...' : '下載成品'}
                </button>
            </div>
        </div>
    );
};


// --- Main App Component ---

export default function App() {
    // 'start', 'selecting', 'shooting', 'result'
    const [step, setStep] = useState('start'); 
    const [selectedFrame, setSelectedFrame] = useState(null);
    const [capturedImages, setCapturedImages] = useState([]);

    const handleStart = () => {
        setStep('selecting');
    };

    const handleSelectFrame = (frame) => {
        setSelectedFrame(frame);
        setStep('shooting');
    };

    const handleShootingComplete = (images) => {
        setCapturedImages(images);
        setStep('result');
    };

    const handleRetake = () => {
        setStep('selecting');
        setSelectedFrame(null);
        setCapturedImages([]);
    };
    
    const renderStep = () => {
        switch (step) {
            case 'start':
                return <StartScreen onStart={handleStart} />;
            case 'selecting':
                return <FrameSelectionScreen onSelectFrame={handleSelectFrame} />;
            case 'shooting':
                return <ShootingScreen selectedFrame={selectedFrame} onComplete={handleShootingComplete} />;
            case 'result':
                return <ResultScreen captures={capturedImages} selectedFrame={selectedFrame} onRetake={handleRetake} />;
            default:
                return <StartScreen onStart={handleStart} />;
        }
    };

    return (
        <main className="w-full min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-300 font-sans">
            {renderStep()}
        </main>
    );
}