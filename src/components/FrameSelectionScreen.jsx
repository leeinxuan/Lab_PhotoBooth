import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { frames } from './frames';

const { Title } = Typography;

export default function FrameSelectionScreen({ onSelectFrame }) {
	return (
		<Card
			style={{
				maxWidth: 1000,
				width: '100%',
				borderRadius: 16,
				background: 'rgba(255,255,255,0.95)',
				backdropFilter: 'blur(10px)',
				boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
				border: '1px solid rgba(255,255,255,0.2)',
			}}
			bodyStyle={{ padding: 32 }}
		>
			<Title level={2} style={{ 
				textAlign: 'center', 
				marginBottom: 32,
				fontSize: '2rem',
				fontWeight: 600,
				color: '#1e293b'
			}}>選擇你喜歡的版型</Title>
			<Row gutter={[24, 24]}>
				{frames.map((frame) => (
					<Col key={frame.id} xs={24} md={8}>
						<Card
							hoverable
							style={{ 
								borderRadius: 12,
								overflow: 'hidden',
								transition: 'all 0.3s ease',
								border: '2px solid transparent'
							}}
							bodyStyle={{ padding: 16 }}
							onClick={() => onSelectFrame(frame)}
							cover={
								<img
									alt={frame.name}
									src={frame.preview}
									style={{ 
										width: '100%', 
										height: 200,
										borderTopLeftRadius: 12, 
										borderTopRightRadius: 12, 
										objectFit: 'cover',
										transition: 'transform 0.3s ease'
									}}
								/>
							}
						>
							<span style={{ 
								display: 'block', 
								textAlign: 'center', 
								fontWeight: 600,
								fontSize: 16,
								color: '#475569'
							}}>{frame.name}</span>
						</Card>
					</Col>
				))}
			</Row>
		</Card>
	);
}


