import React from 'react';
import { Button, Typography, Card, Space } from 'antd';

const { Title, Paragraph } = Typography;

export default function StartScreen({ onStart }) {
	return (
		<Card
			style={{
				maxWidth: 800,
				width: '100%',
				borderRadius: 16,
				background: 'rgba(255,255,255,0.95)',
				backdropFilter: 'blur(10px)',
				boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
				border: '1px solid rgba(255,255,255,0.2)',
			}}
			bodyStyle={{ padding: 48, textAlign: 'center' }}
		>
			<Space direction="vertical" size={24} style={{ width: '100%' }}>
				<Title style={{ 
					margin: 0, 
					fontSize: '3rem',
					fontWeight: 700,
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text'
				}} level={1}>拍貼機</Title>
				<Paragraph style={{ 
					marginBottom: 0, 
					fontSize: 20, 
					color: '#64748b',
					lineHeight: 1.6,
					maxWidth: 500,
					margin: '0 auto'
				}}>
					準備好擺出最棒的姿勢了嗎？點擊下方按鈕，開始創造你的專屬回憶！
				</Paragraph>
				<Button 
					type="primary" 
					size="large" 
					onClick={onStart}
					style={{
						height: 56,
						fontSize: 18,
						fontWeight: 600,
						padding: '0 48px',
						borderRadius: 28,
						background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
						border: 'none',
						boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
						transition: 'all 0.3s ease'
					}}
				>
					開始體驗
				</Button>
			</Space>
		</Card>
	);
}


