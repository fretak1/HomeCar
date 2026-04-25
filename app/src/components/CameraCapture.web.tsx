import React, { useEffect, useRef, useState } from 'react';

export type CameraCaptureAsset = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  file?: File;
};

type CameraCaptureProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (asset: CameraCaptureAsset) => void;
};

export default function CameraCapture({
  visible,
  onClose,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    if (!visible || capturedImage) {
      return;
    }

    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        const nextStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        activeStream = nextStream;
        setStream(nextStream);
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = nextStream;
        }
      } catch {
        setError('Could not access the camera. Please allow camera permissions and try again.');
      }
    };

    startCamera();

    return () => {
      activeStream?.getTracks().forEach((track) => track.stop());
      setStream(null);
    };
  }, [visible, facingMode, capturedImage]);

  useEffect(() => {
    if (!visible && stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream, visible]);

  if (!visible) {
    return null;
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const nextImage = canvas.toDataURL('image/jpeg', 0.92);
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCapturedImage(nextImage);
  };

  const handleConfirm = async () => {
    if (!capturedImage) {
      return;
    }

    const response = await fetch(capturedImage);
    const blob = await response.blob();
    const file = new File([blob], `owner-photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });

    onCapture({
      uri: capturedImage,
      mimeType: file.type,
      fileName: file.name,
      file,
    });

    setCapturedImage(null);
    setError(null);
    onClose();
  };

  const handleReset = () => {
    setCapturedImage(null);
    setError(null);
  };

  const handleClose = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCapturedImage(null);
    setError(null);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          overflow: 'hidden',
          borderRadius: 24,
          background: '#FFFFFF',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.24)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #E2E8F0',
            padding: '18px 20px',
          }}
        >
          <div>
            <div
              style={{
                color: '#065F46',
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              Take Photo
            </div>
            <div
              style={{
                color: '#64748B',
                fontSize: 14,
                marginTop: 4,
              }}
            >
              Capture a clear owner identification selfie
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              border: 'none',
              background: '#F8FAFC',
              color: '#0F172A',
              borderRadius: 999,
              minWidth: 72,
              height: 40,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              paddingInline: 14,
            }}
          >
            Close
          </button>
        </div>

        <div
          style={{
            background: '#020617',
            aspectRatio: '4 / 3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured owner identification"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : error ? (
            <div
              style={{
                color: 'white',
                textAlign: 'center',
                padding: 24,
                lineHeight: 1.7,
              }}
            >
              {error}
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            padding: 20,
            flexWrap: 'wrap',
          }}
        >
          {capturedImage ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  borderRadius: 14,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  color: '#0F172A',
                  padding: '12px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  borderRadius: 14,
                  border: 'none',
                  background: '#065F46',
                  color: 'white',
                  padding: '12px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() =>
                  setFacingMode((current) =>
                    current === 'user' ? 'environment' : 'user',
                  )
                }
                style={{
                  borderRadius: 14,
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  color: '#0F172A',
                  padding: '12px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Switch Camera
              </button>
              <button
                type="button"
                onClick={handleCapture}
                disabled={!!error}
                style={{
                  borderRadius: 999,
                  border: '4px solid #065F46',
                  background: '#FFFFFF',
                  width: 70,
                  height: 70,
                  padding: 6,
                  cursor: error ? 'not-allowed' : 'pointer',
                  opacity: error ? 0.5 : 1,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 999,
                    background: '#065F46',
                  }}
                />
              </button>
              <div style={{ width: 132 }} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
