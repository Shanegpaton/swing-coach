import { useCallback, useEffect, useState } from 'react';
import type { FrameData } from './usePoseDetection';

type UseSwingRecorderResult = {
  recordedFrames: FrameData[];
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
};

type Keypoints = {
  leftShoulder: number;
  rightShoulder: number;
  leftElbow: number;
  rightElbow: number;
  leftWrist: number;
  rightWrist: number;
  leftHip: number;
  rightHip: number;
};

function extractKeypoints(landmarks) {
  return {
    leftShoulder: landmarks[11],
    rightShoulder: landmarks[12],
    leftElbow: landmarks[13],
    rightElbow: landmarks[14],
    leftWrist: landmarks[15],
    rightWrist: landmarks[16],
    leftHip: landmarks[23],
    rightHip: landmarks[24],
  };
}

export function useSwingRecorder(frameData: FrameData | null): UseSwingRecorderResult {
  const [recordedFrames, setRecordedFrames] = useState<Keypoints[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (!isRecording || !frameData) return;
    const keyPoints = extractKeypoints(frameData.joints);
    setRecordedFrames((prev) => [...prev, keyPoints]);
    console.log(recordedFrames);
  }, [frameData, isRecording]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
  }, []);

  const resetRecording = useCallback(() => {
    setRecordedFrames([]);
    setIsRecording(false);
  }, []);

  return {
    recordedFrames,
    isRecording,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
