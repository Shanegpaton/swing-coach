import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from '@mediapipe/tasks-vision';

type JointCoordinate = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type FrameData = {
  timestamp: number;
  joints: JointCoordinate[];
};

type UsePoseDetectionResult = {
  landmarks: NormalizedLandmark[][];
  frameData: FrameData | null;
  isReady: boolean;
};

export function usePoseDetection(
  videoRef: RefObject<HTMLVideoElement | null>
): UsePoseDetectionResult {
  const detectorRef = useRef<PoseLandmarker | null>(null);
  const [landmarks, setLandmarks] = useState<NormalizedLandmark[][]>([]);
  const [frameData, setFrameData] = useState<FrameData | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId = 0;
    let isMounted = true;

    const detectFrame = () => {
      if (!videoRef.current || !detectorRef.current || !isMounted) return;
      const timestamp = performance.now();
      const result = detectorRef.current.detectForVideo(videoRef.current, timestamp);
      setLandmarks(result.landmarks ?? []);
      const firstPose = result.landmarks?.[0] ?? [];
      const joints = firstPose.map((joint) => ({
        x: joint.x,
        y: joint.y,
        z: joint.z,
        visibility: joint.visibility,
      }));
      setFrameData({ timestamp, joints });
      animationFrameId = requestAnimationFrame(detectFrame);
    };

    const start = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        detectorRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });

        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (!isMounted) return;
            setIsReady(true);
            detectFrame();
          };
        }
      } catch (error) {
        console.error('Error starting pose detection:', error);
      }
    };

    start();

    return () => {
      isMounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (detectorRef.current) {
        detectorRef.current.close();
        detectorRef.current = null;
      }
      setFrameData(null);
      setIsReady(false);
    };
  }, [videoRef]);

  return { landmarks, frameData, isReady };
}
