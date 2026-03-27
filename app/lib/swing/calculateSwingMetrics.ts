import type { Keypoints } from '../../hooks/useSwingRecorder';

export type SwingAnalysis = {
  metadata: {
    durationMs: number;
    handedness: "right" | "left";
  };

  // Setup + posture characteristics
  posture: {
    spineAngle: {
      setup: number;
      top: number;
      impact: number;
    }      // torso lean at setup
    kneeFlex: {
      min: number;
      setup: number;
      top: number;
      atImpact: number;
    };
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

function kneeAngle(hip, knee, ankle) {
  if (!hip || !knee || !ankle) return null;

  const v1 = {
    x: hip.x - knee.x,
    y: hip.y - knee.y,
  };

  const v2 = {
    x: ankle.x - knee.x,
    y: ankle.y - knee.y,
  };

  const dot = v1.x * v2.x + v1.y * v2.y;

  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);

  if (mag1 === 0 || mag2 === 0) return null;

  let cosAngle = dot / (mag1 * mag2);

  cosAngle = Math.max(-1, Math.min(1, cosAngle));

   return Math.acos(cosAngle) * (180 / Math.PI);

}

function calculatePosture(context: context) {
  // angle between right shoulder and right hip
  let  spineAngleStart = null
  if (context.setupFrame.rightShoulder && context.setupFrame.rightHip) {
    spineAngleStart = Math.atan2(context.setupFrame.rightShoulder.x - context.setupFrame.rightHip.x, context.setupFrame.rightShoulder.y - context.setupFrame.rightHip.y);
    spineAngleStart = spineAngleStart * (180 / Math.PI);
  }
  let spineAngleTop = null
  if (context.topFrame.rightShoulder && context.topFrame.rightHip) {
    spineAngleTop = Math.atan2(context.topFrame.rightShoulder.x - context.topFrame.rightHip.x, context.topFrame.rightShoulder.y - context.topFrame.rightHip.y);
    spineAngleTop = spineAngleTop * (180 / Math.PI);
  }``
  let spineAngleImpact = null
  if (context.impactFrame.rightShoulder && context.impactFrame.rightHip) {
    spineAngleImpact = Math.atan2(context.impactFrame.rightShoulder.x - context.impactFrame.rightHip.x, context.impactFrame.rightShoulder.y - context.impactFrame.rightHip.y);
    spineAngleImpact = spineAngleImpact * (180 / Math.PI);
  }
  let kneeFlexStart = null
  if (context.setupFrame.rightKnee && context.setupFrame.rightAnkle && context.setupFrame.rightHip) {
    kneeFlexStart = kneeAngle(context.setupFrame.rightHip, context.setupFrame.rightKnee, context.setupFrame.rightAnkle);
  }
  let kneeFlexImpact: number | null = null;
  if (context.impactFrame.rightKnee && context.impactFrame.rightAnkle && context.impactFrame.rightHip) {
    kneeFlexImpact = kneeAngle(context.impactFrame.rightHip, context.impactFrame.rightKnee, context.impactFrame.rightAnkle);
  }
  let kneeFlexTop = null
  if (context.topFrame.rightKnee && context.topFrame.rightAnkle && context.topFrame.rightHip) {
    kneeFlexTop = kneeAngle(context.topFrame.rightHip, context.topFrame.rightKnee, context.topFrame.rightAnkle);
  }
  let kneeFlexMin = Infinity;
  for (let i = 0; i < context.recordedFrames.length; i++) {
    if (context.recordedFrames[i].rightKnee && context.recordedFrames[i].rightAnkle && context.recordedFrames[i].rightHip) {
      const kneeFlex = kneeAngle(context.recordedFrames[i].rightHip, context.recordedFrames[i].rightKnee, context.recordedFrames[i].rightAnkle);
      if (kneeFlex !== null && kneeFlex < kneeFlexMin) {
        kneeFlexMin = kneeFlex;
      }
    }
  }

  return {
    spineAngle: {
      setup: spineAngleStart,
      top: spineAngleTop,
      impact: spineAngleImpact,
    },
    kneeFlex: {
      min: kneeFlexMin,
      setup: kneeFlexStart,
      top: kneeFlexTop,
      atImpact: kneeFlexImpact,
    },
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
