import React, { useRef, useState, useEffect } from 'react';
import { Card, Typography, Space, Button, Spin } from 'antd';
import { centerFull } from './styles';

const { Title, Text } = Typography;

export default function ResultScreen({ captures, selectedFrame, onRetake }) {
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
			frameImg.crossOrigin = 'anonymous';
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
}


