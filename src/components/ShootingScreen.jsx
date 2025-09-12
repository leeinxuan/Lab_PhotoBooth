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

	// 摄像头初始化函数
	const initializeCamera = useCallback(async () => {
		console.log('正在初始化摄像头...');
		
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			setCameraError('您的瀏覽器不支援攝影機功能。請使用現代瀏覽器如 Chrome、Firefox 或 Safari。');
			return;
		}

		try {
			console.log('请求摄像头权限...');
			const stream = await navigator.mediaDevices.getUserMedia({ 
				video: videoConstraints,
				audio: false 
			});
			
			console.log('摄像头流获取成功:', stream);
			
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				
				// 添加事件监听器来确保视频加载
				videoRef.current.onloadedmetadata = () => {
					console.log('视频元数据加载完成');
					console.log('视频尺寸:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
				};
				
				videoRef.current.oncanplay = () => {
					console.log('视频可以播放');
				};
				
				videoRef.current.onerror = (e) => {
					console.error('视频播放错误:', e);
					setCameraError('視頻播放出現錯誤。請檢查攝像頭是否被其他應用程序佔用。');
				};
			}
		} catch (err) {
			console.error('摄像头访问错误:', err);
			let errorMessage = '無法存取攝影機。';
			
			if (err.name === 'NotAllowedError') {
				errorMessage = '攝像頭權限被拒絕。請允許瀏覽器訪問攝像頭並重新整理頁面。';
			} else if (err.name === 'NotFoundError') {
				errorMessage = '未找到攝像頭設備。請檢查攝像頭是否已連接。';
			} else if (err.name === 'NotReadableError') {
				errorMessage = '攝像頭被其他應用程序佔用。請關閉其他使用攝像頭的應用程序。';
			} else if (err.name === 'OverconstrainedError') {
				errorMessage = '攝像頭不支持所需的設置。正在嘗試使用默認設置...';
				// 尝试使用更宽松的约束
				try {
					const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
						video: { facingMode: 'user' } 
					});
					if (videoRef.current) {
						videoRef.current.srcObject = fallbackStream;
					}
					return; // 成功获取备用流
				} catch (fallbackErr) {
					console.error('备用摄像头设置也失败:', fallbackErr);
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
					console.log('停止摄像头轨道:', track.kind);
					track.stop();
				});
			}
		};
	}, [initializeCamera]);

	// 检查摄像头状态
	const checkCameraStatus = useCallback(() => {
		if (!videoRef.current) {
			console.log('视频元素不存在');
			return false;
		}
		
		const video = videoRef.current;
		const stream = video.srcObject;
		
		if (!stream) {
			console.log('摄像头流不存在');
			return false;
		}
		
		const videoTrack = stream.getVideoTracks()[0];
		if (!videoTrack || videoTrack.readyState === 'ended') {
			console.log('视频轨道已结束');
			return false;
		}
		
		if (video.videoWidth === 0 || video.videoHeight === 0) {
			console.log('视频尺寸为0');
			return false;
		}
		
		console.log('摄像头状态正常');
		return true;
	}, []);

	const capture = useCallback(() => {
		if (!checkCameraStatus()) {
			console.log('摄像头状态异常，尝试重新初始化...');
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
			
			// 显示预览并询问是否重拍
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
			// 在开始下一张拍摄前检查摄像头状态
			if (!checkCameraStatus()) {
				console.log('摄像头状态异常，重新初始化...');
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
		
		// 确保摄像头流仍然活跃
		if (!checkCameraStatus()) {
			console.log('摄像头状态异常，重新初始化...');
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

	// 重置重拍状态
	useEffect(() => {
		if (isRetaking) {
			setIsRetaking(false);
		}
	}, [isRetaking]);

	// 如果显示预览，显示询问页面
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
					第 {captures.length + 1} 张照片拍摄完成！
				</Title>
				
				<div style={{ 
					display: 'flex', 
					justifyContent: 'center', 
					alignItems: 'center', 
					marginBottom: 32,
					gap: '24px',
					flexWrap: 'wrap'
				}}>
					{/* 拍摄的照片预览 */}
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
							alt="拍摄预览" 
							style={{ 
								width: '100%', 
								height: '100%', 
								objectFit: 'cover',
								transform: 'scaleX(-1)' // 镜像翻转
							}} 
						/>
					</div>
					
					{/* 询问内容 */}
					<div style={{ 
						flex: 1, 
						minWidth: '300px',
						textAlign: 'left',
						padding: '20px'
					}}>
						<Title level={3} style={{ marginBottom: 16, color: '#333' }}>
							您觉得这张照片怎么样？
						</Title>
						<Text style={{ 
							display: 'block', 
							marginBottom: 24, 
							color: '#666',
							fontSize: '16px',
							lineHeight: '1.6'
						}}>
							如果满意这张照片，请点击"保留照片"继续拍摄下一张。<br/>
							如果不满意，可以点击"重新拍摄"重新拍摄这张照片。
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
								重新拍摄
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
				
				{/* 拍摄进度 */}
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

	// 正常拍摄界面
	return (
		<div style={{ 
			display: 'flex', 
			gap: '16px', 
			width: '100%', 
			maxWidth: 1200,
			alignItems: 'flex-start'
		}}>
			{/* 主拍摄区域 */}
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
			
			{/* 已拍摄照片列表 */}
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
									alt={`拍摄照片 ${index + 1}`}
									style={{
										width: '100%',
										height: '120px',
										objectFit: 'cover',
										transform: 'scaleX(-1)' // 镜像翻转
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


