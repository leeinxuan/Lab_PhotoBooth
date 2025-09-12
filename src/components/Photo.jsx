import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Typography, Card, Row, Col, Spin, Alert, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

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

// --- Helper style utils ---
const centerFull = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	height: '100%',
};

// --- Helper Components ---

// 開始畫面的組件
const StartScreen = ({ onStart }) => (
	<Card
		style={{
			maxWidth: 960,
			width: '100%',
			borderRadius: 24,
			background: 'rgba(255,255,255,0.8)',
			backdropFilter: 'blur(6px)',
		}}
		bodyStyle={{ padding: 32, textAlign: 'center' }}
	>
		<Space direction="vertical" size={16} style={{ width: '100%' }}>
			<Title style={{ margin: 0 }} level={1}>拍貼機</Title>
			<Paragraph style={{ marginBottom: 0, fontSize: 18, color: '#4b5563' }}>
				準備好擺出最棒的姿勢了嗎？點擊下方按鈕，開始創造你的專屬回憶！
			</Paragraph>
			<Button type="primary" size="large" onClick={onStart}>
				開始體驗
			</Button>
		</Space>
	</Card>
);

// 選擇版型畫面的組件
const FrameSelectionScreen = ({ onSelectFrame }) => (
	<Card
		style={{
			maxWidth: 1024,
			width: '100%',
			borderRadius: 24,
			background: 'rgba(255,255,255,0.8)',
			backdropFilter: 'blur(6px)',
		}}
		bodyStyle={{ padding: 24 }}
	>
		<Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>選擇你喜歡的版型</Title>
		<Row gutter={[16, 16]}>
			{frames.map((frame) => (
				<Col key={frame.id} xs={24} md={8}>
					<Card
						hoverable
						style={{ borderRadius: 16 }}
						bodyStyle={{ padding: 12 }}
						onClick={() => onSelectFrame(frame)}
						cover={
							<img
								alt={frame.name}
								src={frame.preview}
								style={{ width: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 16, objectFit: 'cover' }}
							/>
						}
					>
						<Text strong style={{ display: 'block', textAlign: 'center' }}>{frame.name}</Text>
					</Card>
				</Col>
			))}
		</Row>
	</Card>
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
		<Card
			style={{
				position: 'relative',
				width: '100%',
				maxWidth: 1024,
				aspectRatio: '16 / 9',
				background: '#000',
				borderRadius: 24,
				overflow: 'hidden',
				boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
			}}
			bodyStyle={{ padding: 0 }}
		>
			<video
				ref={videoRef}
				autoPlay
				playsInline
				muted
				style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
			/>
			{cameraError && (
				<div style={{ position: 'absolute', inset: 0, ...centerFull, background: 'rgba(0,0,0,0.8)', flexDirection: 'column', color: '#fff', padding: 16, textAlign: 'center' }}>
					<Title level={3} style={{ color: '#fff' }}>攝影機錯誤</Title>
					<Alert type="error" message={cameraError} showIcon />
				</div>
			)}
			{!cameraError && isCountingDown && (
				<div style={{ position: 'absolute', inset: 0, ...centerFull, background: 'rgba(0,0,0,0.5)', flexDirection: 'column', color: '#fff' }}>
					{countdown > 0 ? (
						<Text style={{ fontSize: 96, fontWeight: 800, color: '#fff' }}>{countdown}</Text>
					) : (
						<Space direction="vertical" align="center">
							<Spin size="large" />
							<Title level={3} style={{ color: '#fff', margin: 0 }}>拍攝中！</Title>
						</Space>
					)}
				</div>
			)}
			<div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontWeight: 700 }}>
				拍攝進度： {captures.length} / {selectedFrame.photoCount}
			</div>
		</Card>
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
		<Card
			style={{
				maxWidth: 1024,
				width: '100%',
				borderRadius: 24,
				background: 'rgba(255,255,255,0.8)',
				backdropFilter: 'blur(6px)'
			}}
			bodyStyle={{ padding: 24, textAlign: 'center' }}
		>
			<Title level={2} style={{ marginBottom: 16 }}>你的專屬拍貼！</Title>
			<div style={{ position: 'relative', width: '100%', aspectRatio: '1000 / 825', background: '#e5e7eb', borderRadius: 12, marginBottom: 16, ...centerFull }}>
				{isLoading && (
					<Space direction="vertical" align="center" style={{ color: '#6b7280' }}>
						<Spin size="large" />
						<Text>正在合成照片...</Text>
					</Space>
				)}
				<canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
				{finalImage && !isLoading && (
					<img src={finalImage} alt="Final photobooth strip" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }} />
				)}
			</div>
			<Space>
				<Button onClick={onRetake}>重新拍攝</Button>
				<Button type="primary" onClick={handleDownload} disabled={isLoading}>
					{isLoading ? '處理中...' : '下載成品'}
				</Button>
			</Space>
		</Card>
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
		<div
			style={{
				width: '100%',
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				padding: 16,
				background: 'linear-gradient(135deg, #fbcfe8, #ddd6fe 40%, #c7d2fe)',
				fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, Apple Color Emoji, Segoe UI Emoji'
			}}
		>
			{renderStep()}
		</div>
	);
}