import React, { useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import useFocusDetection from '@/hooks/useFocusDetection';

interface FocusMonitorProps {
  isActive: boolean;
}

const FocusMonitor: React.FC<FocusMonitorProps> = ({ isActive }) => {
  const {
    videoRef,
    focusStats,
    facingCamera,
    webcamReady
  } = useFocusDetection({ enabled: isActive });

  // Calculate focus level class
  const getFocusLevel = (score: number) => {
    if (score > 0.8) return "bg-focus-high";
    if (score > 0.5) return "bg-focus-medium";
    return "bg-focus-low";
  };

  // Calculate percentage width for the focus meter
  const focusMeterWidth = `${Math.round(focusStats.attentionScore * 100)}%`;

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
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      )}
    </div>
  );
};

export default FocusMonitor;