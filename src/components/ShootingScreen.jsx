import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, Typography, Alert, Space, Spin, Button } from 'antd';
import { centerFull } from './styles';

const { Title, Text } = Typography;

const videoConstraints = {
	width: { ideal: 1280, min: 640 },
	height: { ideal: 720, min: 480 },
	facingMode: 'user',
	aspectRatio: 16/9,
};

export default function ShootingScreen({ selectedFrame, onComplete }) {
	const [captures, setCaptures] = useState([]);
	const [countdown, setCountdown] = useState(5);
	const [isCountingDown, setIsCountingDown] = useState(true);
	const [cameraError, setCameraError] = useState(null);
	const [showPreview, setShowPreview] = useState(false);
	const [currentPreview, setCurrentPreview] = useState(null);
	const [isRetaking, setIsRetaking] = useState(false);
	const videoRef = useRef(null);

	// 攝影機初始化函數
	const initializeCamera = useCallback(async () => {
		console.log('正在初始化攝影機...');
		
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			setCameraError('您的瀏覽器不支援攝影機功能。請使用現代瀏覽器如 Chrome、Firefox 或 Safari。');
			return;
		}

		try {
			console.log('請求攝影機權限...');
			const stream = await navigator.mediaDevices.getUserMedia({ 
				video: videoConstraints,
				audio: false 
			});
			
			console.log('攝影機串流獲取成功:', stream);
			
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				
				// 添加事件監聽器來確保影片載入
				videoRef.current.onloadedmetadata = () => {
					console.log('影片元數據載入完成');
					console.log('影片尺寸:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
				};
				
				videoRef.current.oncanplay = () => {
					console.log('影片可以播放');
				};
				
				videoRef.current.onerror = (e) => {
					console.error('影片播放錯誤:', e);
					setCameraError('影片播放出現錯誤。請檢查攝影機是否被其他應用程式佔用。');
				};
			}
		} catch (err) {
			console.error('攝影機存取錯誤:', err);
			let errorMessage = '無法存取攝影機。';
			
			if (err.name === 'NotAllowedError') {
				errorMessage = '攝影機權限被拒絕。請允許瀏覽器存取攝影機並重新整理頁面。';
			} else if (err.name === 'NotFoundError') {
				errorMessage = '未找到攝影機裝置。請檢查攝影機是否已連接。';
			} else if (err.name === 'NotReadableError') {
				errorMessage = '攝影機被其他應用程式佔用。請關閉其他使用攝影機的應用程式。';
			} else if (err.name === 'OverconstrainedError') {
				errorMessage = '攝影機不支援所需的設定。正在嘗試使用預設設定...';
				// 嘗試使用更寬鬆的約束
				try {
					const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
						video: { facingMode: 'user' } 
					});
					if (videoRef.current) {
						videoRef.current.srcObject = fallbackStream;
					}
					return; // 成功獲取備用串流
				} catch (fallbackErr) {
					console.error('備用攝影機設定也失敗:', fallbackErr);
				}
			}
			
			setCameraError(errorMessage);
		}
	}, []);

	useEffect(() => {
		initializeCamera();
		
		return () => {
			if (videoRef.current && videoRef.current.srcObject) {
				const stream = videoRef.current.srcObject;
				const tracks = stream.getTracks();
				tracks.forEach((track) => {
					console.log('停止攝影機軌道:', track.kind);
					track.stop();
				});
			}
		};
	}, [initializeCamera]);

	// 檢查攝影機狀態
	const checkCameraStatus = useCallback(() => {
		if (!videoRef.current) {
			console.log('影片元素不存在');
			return false;
		}
		
		const video = videoRef.current;
		const stream = video.srcObject;
		
		if (!stream) {
			console.log('攝影機串流不存在');
			return false;
		}
		
		const videoTrack = stream.getVideoTracks()[0];
		if (!videoTrack || videoTrack.readyState === 'ended') {
			console.log('影片軌道已結束');
			return false;
		}
		
		if (video.videoWidth === 0 || video.videoHeight === 0) {
			console.log('影片尺寸為0');
			return false;
		}
		
		console.log('攝影機狀態正常');
		return true;
	}, []);

	const capture = useCallback(() => {
		if (!checkCameraStatus()) {
			console.log('攝影機狀態異常，嘗試重新初始化...');
			initializeCamera();
			return;
		}
		
		if (videoRef.current) {
			const video = videoRef.current;
			const canvas = document.createElement('canvas');
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
			const ctx = canvas.getContext('2d');
			ctx.translate(canvas.width, 0);
			ctx.scale(-1, 1);
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
			const imageSrc = canvas.toDataURL('image/jpeg');
			
			// 顯示預覽並詢問是否重拍
			setCurrentPreview(imageSrc);
			setShowPreview(true);
			setIsCountingDown(false);
		}
	}, [checkCameraStatus, initializeCamera]);

	const handleKeepPhoto = useCallback(() => {
		const newCaptures = [...captures, currentPreview];
		setCaptures(newCaptures);
		setShowPreview(false);
		setCurrentPreview(null);
		
		if (newCaptures.length < selectedFrame.photoCount) {
			// 在開始下一張拍攝前檢查攝影機狀態
			if (!checkCameraStatus()) {
				console.log('攝影機狀態異常，重新初始化...');
				initializeCamera();
			}
			setCountdown(3);
			setIsCountingDown(true);
		} else {
			onComplete(newCaptures);
		}
	}, [captures, currentPreview, selectedFrame.photoCount, checkCameraStatus, initializeCamera, onComplete]);

	const handleRetakePhoto = useCallback(() => {
		setShowPreview(false);
		setCurrentPreview(null);
		setIsRetaking(true);
		
		// 確保攝影機串流仍然活躍
		if (!checkCameraStatus()) {
			console.log('攝影機狀態異常，重新初始化...');
			initializeCamera();
		}
		
		setCountdown(3);
		setIsCountingDown(true);
	}, [checkCameraStatus, initializeCamera]);

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

	// 重置重拍狀態
	useEffect(() => {
		if (isRetaking) {
			setIsRetaking(false);
		}
	}, [isRetaking]);

	// 如果顯示預覽，顯示詢問頁面
	if (showPreview) {
		return (
			<Card
				style={{
					maxWidth: 1024,
					width: '100%',
					borderRadius: 24,
					background: 'rgba(255,255,255,0.9)',
					backdropFilter: 'blur(6px)',
					boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
				}}
				bodyStyle={{ padding: 24, textAlign: 'center' }}
			>
				<Title level={2} style={{ marginBottom: 24, color: '#1890ff' }}>
					第 {captures.length + 1} 張照片拍攝完成！
				</Title>
				
				<div style={{ 
					display: 'flex', 
					justifyContent: 'center', 
					alignItems: 'center', 
					marginBottom: 32,
					gap: '24px',
					flexWrap: 'wrap'
				}}>
					{/* 拍攝的照片預覽 */}
					<div style={{ 
						width: '300px', 
						height: '225px', 
						borderRadius: '16px',
						overflow: 'hidden',
						boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
						border: '3px solid #1890ff'
					}}>
						<img 
							src={currentPreview} 
							alt="拍攝預覽" 
							style={{ 
								width: '100%', 
								height: '100%', 
								objectFit: 'cover',
								transform: 'scaleX(-1)' // 鏡像翻轉
							}} 
						/>
					</div>
					
					{/* 詢問內容 */}
					<div style={{ 
						flex: 1, 
						minWidth: '300px',
						textAlign: 'left',
						padding: '20px'
					}}>
						<Title level={3} style={{ marginBottom: 16, color: '#333' }}>
							您覺得這張照片怎麼樣？
						</Title>
						<Text style={{ 
							display: 'block', 
							marginBottom: 24, 
							color: '#666',
							fontSize: '16px',
							lineHeight: '1.6'
						}}>
							如果滿意這張照片，請點擊"保留照片"繼續拍攝下一張。<br/>
							如果不滿意，可以點擊"重新拍攝"重新拍攝這張照片。
						</Text>
						
						<div style={{ 
							display: 'flex', 
							gap: '16px', 
							justifyContent: 'center',
							flexWrap: 'wrap'
						}}>
							<Button 
								size="large" 
								onClick={handleRetakePhoto}
								style={{ 
									minWidth: '120px',
									height: '48px',
									fontSize: '16px',
									fontWeight: '600'
								}}
							>
								重新拍攝
							</Button>
							<Button 
								type="primary" 
								size="large" 
								onClick={handleKeepPhoto}
								style={{ 
									minWidth: '120px',
									height: '48px',
									fontSize: '16px',
									fontWeight: '600'
								}}
							>
								保留照片
							</Button>
						</div>
					</div>
				</div>
				
				{/* 拍攝進度 */}
				<div style={{ 
					background: 'rgba(24, 144, 255, 0.1)', 
					padding: '12px 24px', 
					borderRadius: '8px',
					display: 'inline-block',
					fontWeight: '600',
					color: '#1890ff'
				}}>
					拍攝進度： {captures.length + 1} / {selectedFrame.photoCount}
				</div>
			</Card>
		);
	}

	// 正常拍攝界面
	return (
		<div style={{ 
			display: 'flex', 
			gap: '16px', 
			width: '100%', 
			maxWidth: 1200,
			alignItems: 'flex-start'
		}}>
			{/* 主拍攝區域 */}
			<Card
				style={{
					position: 'relative',
					width: '100%',
					maxWidth: 1024,
					aspectRatio: '16 / 9',
					background: '#000',
					borderRadius: 24,
					overflow: 'hidden',
					boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
					flex: 1
				}}
				bodyStyle={{ padding: 0 }}
			>
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted
					style={{ 
						width: '100%', 
						height: '100%', 
						objectFit: 'cover', 
						transform: 'scaleX(-1)',
						backgroundColor: '#000'
					}}
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
			
			{/* 已拍攝照片列表 */}
			{captures.length > 0 && (
				<Card
					style={{
						width: '200px',
						background: 'rgba(255,255,255,0.9)',
						backdropFilter: 'blur(6px)',
						borderRadius: 16,
						boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
						flexShrink: 0
					}}
					bodyStyle={{ padding: '16px 12px' }}
				>
					
					<div style={{ 
						display: 'flex', 
						flexDirection: 'column', 
						gap: '12px',
						maxHeight: '500px',
						overflowY: 'auto'
					}}>
						{captures.map((capture, index) => (
							<div
								key={index}
								style={{
									position: 'relative',
									borderRadius: '8px',
									overflow: 'hidden',
									boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
									border: '2px solid #e8f4fd',
									transition: 'all 0.3s ease'
								}}
							>
								<img
									src={capture}
									alt={`拍攝照片 ${index + 1}`}
									style={{
										width: '100%',
										height: '120px',
										objectFit: 'cover',
										transform: 'scaleX(-1)' // 鏡像翻轉
									}}
								/>
								<div style={{
									position: 'absolute',
									top: '4px',
									right: '4px',
									background: 'rgba(24, 144, 255, 0.9)',
									color: '#fff',
									padding: '2px 6px',
									borderRadius: '4px',
									fontSize: '12px',
									fontWeight: '600'
								}}>
									{index + 1}
								</div>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}


