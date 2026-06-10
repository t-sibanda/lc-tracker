import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, SwitchCamera, Circle, Image } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface CameraCaptureProps {
  onClose: () => void;
  entityType: 'task' | 'equipment' | 'issue' | 'checklist' | 'inventory' | 'general';
  entityId: string;
  entityName: string;
  zone: string;
}

export default function CameraCapture({ onClose, entityType, entityId, entityName, zone }: CameraCaptureProps) {
  const { addPhoto } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');
  const [fileInput, setFileInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError('Camera access denied or not available. Use file upload instead.');
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  function takePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
  }

  function savePhoto() {
    if (!capturedImage) return;
    addPhoto({
      url: capturedImage,
      caption: caption || `${entityName} - Evidence`,
      zone: zone || 'All',
      uploadedBy: 'User',
      entityType,
      entityId,
      entityName,
    });
    onClose();
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCapturedImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-md mx-4 rounded-xl overflow-hidden flex flex-col" style={{ background: '#0f172a', border: '1px solid rgba(34,211,238,0.2)', maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
          <div className="flex items-center gap-2">
            <Camera size={14} style={{ color: '#22d3ee' }} />
            <span className="text-xs font-bold" style={{ color: '#e2e8f0' }}>Capture Evidence</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/5"><X size={14} style={{ color: '#94a3b8' }} /></button>
        </div>

        <div className="p-3 space-y-3 overflow-y-auto">
          {/* Entity label */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>{entityType}</span>
            <span className="text-[10px] truncate" style={{ color: '#94a3b8' }}>{entityName}</span>
          </div>

          {/* Error or camera preview */}
          {error ? (
            <div className="text-center py-4">
              <p className="text-[11px] mb-3" style={{ color: '#f59e0b' }}>{error}</p>
              <button
                onClick={() => setFileInput(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium mx-auto"
                style={{ background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}
              >
                <Image size={12} /> Upload from Device
              </button>
            </div>
          ) : capturedImage ? (
            <div className="space-y-2">
              <img src={capturedImage} alt="Captured" className="w-full rounded-lg" style={{ maxHeight: '250px', objectFit: 'contain' }} />
              <input
                className="input w-full px-2 py-1.5 text-xs rounded-lg"
                placeholder="Add a caption..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={savePhoto} className="flex-1 py-1.5 rounded text-[11px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Save Evidence</button>
                <button onClick={() => setCapturedImage(null)} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#94a3b8' }}>Retake</button>
              </div>
            </div>
          ) : fileInput ? (
            <div className="space-y-2">
              <input type="file" accept="image/*" ref={fileRef} onChange={handleFileSelect} className="text-[11px]" style={{ color: '#94a3b8' }} />
              <button onClick={() => setFileInput(false)} className="text-[10px]" style={{ color: '#22d3ee' }}>Switch to camera</button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden" style={{ background: '#0b1120' }}>
                <video ref={videoRef} autoPlay playsInline muted className="w-full" style={{ maxHeight: '280px', objectFit: 'cover' }} />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="flex items-center justify-center gap-4">
                <button onClick={toggleCamera} className="p-2 rounded-full hover:bg-white/5" title="Switch camera">
                  <SwitchCamera size={16} style={{ color: '#94a3b8' }} />
                </button>
                <button
                  onClick={takePhoto}
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ border: '3px solid #22d3ee' }}
                >
                  <Circle size={28} style={{ color: '#22d3ee' }} />
                </button>
                <button onClick={() => setFileInput(true)} className="p-2 rounded-full hover:bg-white/5" title="Upload file">
                  <Image size={16} style={{ color: '#94a3b8' }} />
                </button>
              </div>
            </div>
          )}

          {/* Caption for file uploads */}
          {(fileInput && capturedImage) && (
            <div className="space-y-2">
              <img src={capturedImage} alt="Selected" className="w-full rounded-lg" style={{ maxHeight: '200px', objectFit: 'contain' }} />
              <input
                className="input w-full px-2 py-1.5 text-xs rounded-lg"
                placeholder="Add a caption..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <div className="flex gap-2">
                <button onClick={savePhoto} className="flex-1 py-1.5 rounded text-[11px] font-medium" style={{ background: '#22d3ee', color: '#0f172a' }}>Save Evidence</button>
                <button onClick={() => setCapturedImage(null)} className="px-3 py-1.5 rounded text-[11px]" style={{ color: '#94a3b8' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
