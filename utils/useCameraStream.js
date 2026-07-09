import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Safe camera stream hook for iOS Safari / PWA.
 * Tries once per active session; does not retry in a loop on failure.
 */
export function useCameraStream({ active, facingMode, videoRef, includeAudio = false }) {
  const streamRef = useRef(null);
  const generationRef = useRef(0);
  const failedKeyRef = useRef(null);
  const videoRefStable = useRef(videoRef);
  videoRefStable.current = videoRef;

  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    const video = videoRefStable.current?.current;
    if (video) {
      video.srcObject = null;
    }
  };

  useEffect(() => {
    if (!active) {
      generationRef.current += 1;
      failedKeyRef.current = null;
      stopTracks();
      setReady(false);
      setError(null);
      return;
    }

    const attemptKey = `${facingMode}-${includeAudio}`;
    if (failedKeyRef.current === attemptKey) {
      return;
    }

    const gen = ++generationRef.current;
    let cancelled = false;

    setReady(false);
    setError(null);
    stopTracks();

    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (cancelled || gen !== generationRef.current) return;

      if (!navigator.mediaDevices?.getUserMedia) {
        failedKeyRef.current = attemptKey;
        setError(new DOMException('Camera API not available', 'NotSupportedError'));
        return;
      }

      const constraints = [
        { video: { facingMode: { ideal: facingMode } }, audio: includeAudio },
        { video: { facingMode }, audio: includeAudio },
        { video: true, audio: includeAudio },
      ];

      let lastError = null;

      for (const constraint of constraints) {
        if (cancelled || gen !== generationRef.current) return;
        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraint);
          if (cancelled || gen !== generationRef.current) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }
          streamRef.current = stream;
          const video = videoRefStable.current?.current;
          if (video) {
            video.srcObject = stream;
            try {
              await video.play();
            } catch {
              // autoplay blocked is fine
            }
          }
          failedKeyRef.current = null;
          setError(null);
          setReady(true);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      if (!cancelled && gen === generationRef.current) {
        failedKeyRef.current = attemptKey;
        setError(lastError || new DOMException('All camera constraints failed', 'NotFoundError'));
        setReady(false);
      }
    })();

    return () => {
      cancelled = true;
      generationRef.current += 1;
      stopTracks();
    };
  }, [active, facingMode, includeAudio, retryToken]);

  const stopCamera = useCallback(() => {
    generationRef.current += 1;
    failedKeyRef.current = null;
    stopTracks();
    setReady(false);
    setError(null);
  }, []);

  const retryCamera = useCallback(() => {
    failedKeyRef.current = null;
    setRetryToken((t) => t + 1);
  }, []);

  return { streamRef, stopCamera, retryCamera, error, ready };
}
