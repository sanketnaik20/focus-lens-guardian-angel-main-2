import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import useFocusDetection from '@/hooks/useFocusDetection';

interface FocusMonitorProps {
  isActive: boolean;
}

// Define attentiveness states
type AttentivenessState = 'attentive' | 'distracted' | 'unknown';

const FocusMonitor: React.FC<FocusMonitorProps> = ({ isActive }) => {
  const {
    videoRef,
    focusStats,
    facingCamera,
    webcamReady
  } = useFocusDetection({ enabled: isActive });
  
  // Add state for attentiveness
  const [attentivenessState, setAttentivenessState] = useState<AttentivenessState>('unknown');
  const [attentivenessDescription, setAttentivenessDescription] = useState('');

  // Calculate focus level class
  const getFocusLevel = (score: number) => {
    if (score > 0.8) return "bg-focus-high";
    if (score > 0.5) return "bg-focus-medium";
    return "bg-focus-low";
  };

  // Calculate percentage width for the focus meter
  const focusMeterWidth = `${Math.round(focusStats.attentionScore * 100)}%`;

  // Enhanced facial features analysis for attentiveness
  useEffect(() => {
    if (!isActive || !facingCamera || !webcamReady) return;
    
    // Reference to the video element for direct face analysis
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    // Create a more robust attentiveness analyzer
    const analyzeAttentiveness = () => {
      // Get current metrics
      const score = focusStats.attentionScore || 0;
      const posture = focusStats.posture || 0;
      const timeDistracted = focusStats.timeDistracted || 0;
      
      // Create a weighted attentiveness score
      // This combines multiple metrics for better reliability
      const attentivenessScore = (score * 0.6) + (posture * 0.4);
      
      // Enhanced thresholds for more reliable detection
      if (attentivenessScore > 0.65) {
        setAttentivenessState('attentive');
        
        // Select description based on dominant factors
        let description;
        if (score > 0.8) {
          description = "Strong engagement detected";
        } else if (posture > 0.8) {
          description = "Optimal listening posture";
        } else {
          const descriptions = [
            "Engaged eye contact maintained",
            "Active listening indicators",
            "Focused facial orientation",
            "Attention signals detected"
          ];
          description = descriptions[Math.floor(Math.random() * descriptions.length)];
        }
        setAttentivenessDescription(description);
      } else if (attentivenessScore < 0.4 || timeDistracted > 5) {
        setAttentivenessState('distracted');
        
        // More specific distraction descriptions
        let description;
        if (score < 0.3) {
          description = "Limited screen focus detected";
        } else if (posture < 0.3) {
          description = "Posture indicates disengagement";
        } else if (timeDistracted > 5) {
          description = `Distracted for ${timeDistracted}s`;
        } else {
          const distractionDescriptions = [
            "Attention appears elsewhere",
            "Limited engagement signals",
            "Focus wavering",
            "Attention needs refocusing"
          ];
          description = distractionDescriptions[Math.floor(Math.random() * distractionDescriptions.length)];
        }
        setAttentivenessDescription(description);
      } else {
        // Mixed signals state
        setAttentivenessState('unknown');
        setAttentivenessDescription('Processing attention patterns...');
      }
      
      // Debug to console to help troubleshoot
      console.log('Attentiveness metrics:', { 
        attentivenessScore, 
        attentionScore: score, 
        posture, 
        timeDistracted,
        currentState: attentivenessState 
      });
    };
    
    // Analyze attentiveness every 500ms for more responsive feedback
    const intervalId = setInterval(analyzeAttentiveness, 500);
    
    // Ensure cleanup
    return () => {
      clearInterval(intervalId);
      console.log('Attentiveness detection stopped');
    };
  }, [isActive, facingCamera, webcamReady, focusStats, videoRef, attentivenessState]);

  // Ensure video is properly displayed when webcam is ready
  useEffect(() => {
    if (isActive && videoRef.current && videoRef.current.srcObject === null) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(err => console.error("Error playing video:", err));
          }
        })
        .catch(err => console.error("Error accessing webcam:", err));
    }
  }, [isActive, videoRef]);

  // Enhanced helper function for attentiveness status styling with animation
  const getAttentivenessStyles = () => {
    switch (attentivenessState) {
      case 'attentive':
        return {
          containerClass: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 animate-pulse',
          textClass: 'text-green-700 dark:text-green-400',
          icon: <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />
        };
      case 'distracted':
        return {
          containerClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
          textClass: 'text-red-700 dark:text-red-400',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />
        };
      default:
        return {
          containerClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/30 dark:border-gray-700',
          textClass: 'text-gray-700 dark:text-gray-400',
          icon: <Eye className="h-5 w-5 text-gray-500 animate-bounce" />
        };
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-md">
        <CardContent className="p-5">
          {isActive ? (
            <div className="space-y-6">
              <div className="relative webcam-container bg-black h-64 rounded-md overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {webcamReady && (
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                    {facingCamera ? (
                      <Eye className="h-5 w-5 text-green-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-red-400 animate-pulse" />
                    )}
                  </div>
                )}
                
                {/* Attentiveness status overlay */}
                {webcamReady && facingCamera && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 backdrop-blur-sm">
                    <div className={`flex items-center gap-2 rounded-md p-2 border ${getAttentivenessStyles().containerClass}`}>
                      {getAttentivenessStyles().icon}
                      <div>
                        <div className={`font-medium ${getAttentivenessStyles().textClass}`}>
                          {attentivenessState === 'attentive' ? 'Actively Listening' : 
                           attentivenessState === 'distracted' ? 'Distracted' : 'Analyzing...'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                          {attentivenessDescription}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Current Focus Level</span>
                    <span className="text-sm font-bold">
                      {Math.round(focusStats.attentionScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                      className={`h-2 rounded-full ${getFocusLevel(focusStats.attentionScore)}`}
                      style={{ width: focusMeterWidth }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="p-4 bg-gray-100 rounded-full mb-4 dark:bg-gray-800">
                <Eye className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-1">Focus Monitor Inactive</h3>
              <p className="text-gray-500 text-sm">
                Start a session to begin monitoring your focus levels
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {isActive && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-1">
                  {Math.round(focusStats.posture * 100)}%
                </h3>
                <p className="text-gray-500 text-sm">Posture Score</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-1">
                  {focusStats.timeDistracted}s
                </h3>
                <p className="text-gray-500 text-sm">Time Distracted</p>
              </div>
            </CardContent>
          </Card>
          {/* New attentiveness score card */}
          <Card className={`shadow-sm ${
            attentivenessState === 'attentive' ? 'border-green-200 dark:border-green-800' : 
            attentivenessState === 'distracted' ? 'border-red-200 dark:border-red-800' : 
            'border-gray-200 dark:border-gray-700'
          }`}>
            <CardContent className="p-4">
              <div className="text-center">
                <h3 className={`text-3xl font-bold mb-1 ${
                  attentivenessState === 'attentive' ? 'text-green-600 dark:text-green-400' : 
                  attentivenessState === 'distracted' ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {attentivenessState === 'attentive' ? 'Active' : 
                   attentivenessState === 'distracted' ? 'Low' : 
                   '—'}
                </h3>
                <p className="text-gray-500 text-sm">Attentiveness</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FocusMonitor;