import React from 'react';
import { Button, Typography, Card, Space } from 'antd';

const { Title, Paragraph } = Typography;

export default function StartScreen({ onStart }) {
	return (
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
}


