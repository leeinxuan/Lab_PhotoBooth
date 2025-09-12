import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { frames } from './frames';

const { Title } = Typography;

export default function FrameSelectionScreen({ onSelectFrame }) {
	return (
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
							<span style={{ display: 'block', textAlign: 'center', fontWeight: 600 }}>{frame.name}</span>
						</Card>
					</Col>
				))}
			</Row>
		</Card>
	);
}


