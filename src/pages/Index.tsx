import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import WebcamConsent from '../components/WebcamConsent';
import FocusMonitor from '../components/FocusMonitor';
import Transcription from '../components/Transcription';
import FocusSummary from '../components/FocusSummary';
import PrivacyStatement from '../components/PrivacyStatement';
import { useToast } from '@/hooks/use-toast';
import useFocusDetection from '@/hooks/useFocusDetection';
import useTranscription from '@/hooks/useTranscription';
import generateSessionSummary from '@/utils/reportGenerator';

const Index = () => {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const { toast } = useToast();
  
  // Get focus data and transcription
  const { focusStats, requestWebcamAccess, stopWebcamAccess } = useFocusDetection({ 
    enabled: isRecording && hasConsent === true 
  });
  const { transcription } = useTranscription({ isRecording });

  // Handle consent approval
  const handleConsentApproved = async () => {
    const success = await requestWebcamAccess();
    if (success) {
      setHasConsent(true);
      toast({
        title: "Ready to start",
        description: "Click 'Start Session' when you're ready to begin",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Camera access required",
        description: "Please grant camera access to use FocusLens",
      });
    }
  };

  // Handle consent declined
  const handleConsentDeclined = () => {
    setHasConsent(false);
    toast({
      title: "Camera access declined",
      description: "You can still use the transcription features without camera access.",
    });
  };

  // Start recording session
  const handleStartSession = () => {
    setIsRecording(true);
    setSessionStartTime(new Date());
    setSessionComplete(false);
    toast({
      title: "Session started",
      description: "Focus monitoring and transcription are now active.",
    });
  };

  // End recording session
  const handleEndSession = () => {
    if (!isRecording) return;
    
    // Calculate session duration
    const duration = sessionStartTime 
      ? Math.floor((Date.now() - sessionStartTime.getTime()) / 1000) 
      : 0;
    
    // Generate summary
    const summary = generateSessionSummary({
      duration,
      averageFocus: focusStats.attentionScore,
      timeDistracted: focusStats.timeDistracted,
      transcription,
    });
    
    setSessionSummary(summary);
    setIsRecording(false);
    setSessionComplete(true);
    stopWebcamAccess();
    
    toast({
      title: "Session complete",
      description: `Your ${duration} second session has been analyzed.`,
    });
  };

  // Reset session
  const handleResetSession = () => {
    setSessionComplete(false);
    setSessionSummary(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcamAccess();
    };
  }, []);

  // Render based on state
  const renderContent = () => {
    // If consent hasn't been decided
    if (hasConsent === null) {
      return <WebcamConsent onConsent={handleConsentApproved} onDecline={handleConsentDeclined} />;
    }
    
    // If session is complete, show summary
    if (sessionComplete && sessionSummary) {
      return <FocusSummary sessionData={sessionSummary} onReset={handleResetSession} />;
    }
    
    // Otherwise show the main app
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FocusMonitor isActive={isRecording && hasConsent === true} />
          <div className="mt-6 hidden md:block">
            <PrivacyStatement />
          </div>
        </div>
        <div className="lg:col-span-2 flex flex-col">
          <Transcription isRecording={isRecording} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        isRecording={isRecording} 
        onStartSession={handleStartSession}
        onEndSession={handleEndSession}
      />
      
      <main className="flex-1 container py-8">
        {renderContent()}
      </main>
      
      {/* Mobile Privacy Statement */}
      <div className="mt-6 md:hidden px-4 pb-8">
        <PrivacyStatement />
      </div>
    </div>
  );
};

export default Index;
