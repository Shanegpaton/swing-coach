import type { Keypoints } from '../../hooks/useSwingRecorder';

export type SwingAnalysis = {
  metadata: {
    durationMs: number;
    handedness: "right" | "left";
  };

  // Setup + posture characteristics
  posture: {
    spineAngle: number;        // torso lean at setup
    kneeFlex: {
      setup: number;
      min: number;
      atImpact: number;
    };
    reach: number;             // hands distance from body at setup
  };

  // Joint + rotation mechanics
  kinematics: {
    leadElbow: {
      min: number;
      atTop: number;
      atImpact: number;
    };

    trailElbow: {
      min: number;
      atTop: number;
      atImpact: number;
    };

    shoulderRotation: {
      max: number;
      atTop: number;
      atImpact: number;
    };

    hipRotation: {
      max: number;
      atTop: number;
      atImpact: number;
    };

    weightShift: {
      lateralHipMovement: number;
    }

  };

  // Motion sequencing (VERY important for coaching)
  sequencing: {
    hipLead: boolean;              // hips start before shoulders
    hipVsShoulderTiming: number;   // ms difference
    hipPeakFrame: number;
    shoulderPeakFrame: number;
  };

  // Swing path (club path approximation via wrists)
  swingPath: {
    pathType: "inside-out" | "outside-in" | "neutral";
  
    // Core geometry
    backswingVector: {
      x: number;
      y: number;
    };
  
    downswingVector: {
      x: number;
      y: number;
    };
  
    // Angle between backswing and downswing (KEY METRIC)
    transitionAngle: number;
  
    // Direction relative to target line (simplified horizontal axis)
    downswingAngle: number;
  
    // How extreme the path is
    pathSeverity: number;
  
    // How consistent the swing plane is over time
    planeConsistency: number;
  };
  // Speed + power
  speed: {
    handSpeedMax: number;
    handSpeedAtImpact: number;
  };

  // Stability + posture maintenance
  stability: {
    headMovement: number; // total movement over swing
    headRise: number;     // vertical change (top → impact)
    hipRise: number;      // detects early extension
  };
};

type context = {
  recordedFrames: Keypoints[];
  setupFrame: Keypoints;
  topFrame: Keypoints;
  impactFrame: Keypoints;
};

function calculateMetadata(recordedFrames: Keypoints[]) {
 return {
  durationMs: recordedFrames[recordedFrames.length - 1].timestamp - recordedFrames[0].timestamp,
  handedness: "right"
 };
}

function calculatePhases(recordedFrames: Keypoints[]) {
  let topframe = 0;
  let impactframe = 0;
  for (let i = 0; i < recordedFrames.length; i++) {
    if (recordedFrames[i].leftWrist && recordedFrames[i].leftWrist.y > recordedFrames[topframe].leftWrist.y) {
      topframe = i;
    }
    if (recordedFrames[i].leftWrist && recordedFrames[i].leftWrist.y < recordedFrames[impactframe].leftWrist.y && topframe < i) {
      impactframe = i;
    }
  }
  return {
    setupFrame: recordedFrames[0],
    topFrame: recordedFrames[topframe],
    impactFrame: recordedFrames[impactframe],
  };
}

function calculatePosture(context: context) {
  // angle between right shoulder and right hip
  const spineAngle = Math.atan2(context.setupFrame.rightShoulder.y - context.setupFrame.rightHip.y, context.setupFrame.rightShoulder.x - context.setupFrame.rightHip.x);
  return {
    spineAngle: 0,
    kneeFlex: {
      setup: 0,
      min: 0,
      atImpact: 0,
    },
    reach: 0,
  };
}

export function calculateSwingMetrics(recordedFrames: Keypoints[]): SwingAnalysis {
  if (!recordedFrames.length) {
    return null;
  }

  const metadata = calculateMetadata(recordedFrames);
  const phases = calculatePhases(recordedFrames);
  const context = {
    recordedFrames: recordedFrames,
    setupFrame: phases.setupFrame,
    topFrame: phases.topFrame,
    impactFrame: phases.impactFrame,
  };
  const posture = calculatePosture(context);

  return null;
}

// posture: {
//   spineAngle: number;        // torso lean at setup
//   stanceWidth: number;       // distance between feet
//   kneeFlex: {
//     setup: number;
//     min: number;
//     atImpact: number;
//   };
//   reach: number;             // hands distance from body at setup
// };