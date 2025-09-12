import React, { useState } from 'react';
import StartScreen from './StartScreen';
import FrameSelectionScreen from './FrameSelectionScreen';
import ShootingScreen from './ShootingScreen';
import ResultScreen from './ResultScreen';
import { gradientBackground } from './styles';

export default function App() {
    const [step, setStep] = useState('start'); 
    const [selectedFrame, setSelectedFrame] = useState(null);
    const [capturedImages, setCapturedImages] = useState([]);

	const handleStart = () => setStep('selecting');
	const handleSelectFrame = (frame) => { setSelectedFrame(frame); setStep('shooting'); };
	const handleShootingComplete = (images) => { setCapturedImages(images); setStep('result'); };
	const handleRetake = () => { setStep('selecting'); setSelectedFrame(null); setCapturedImages([]); };
    
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
		<div style={gradientBackground}>
            {renderStep()}
		</div>
    );
}