"use client";

import { useState, useCallback, useRef } from "react";

export function useVoiceAnalysis() {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(0); // リアルタイムの音量 (0-100)
  const [maxVolume, setMaxVolume] = useState(0); // 録音中の最大音量
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsRecording(true);
      setMaxVolume(0);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // 平均音量を算出
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalizedVolume = Math.min(100, (average / 128) * 100);
        
        setVolume(normalizedVolume);
        setMaxVolume((prev) => Math.max(prev, normalizedVolume));
        
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error("マイクの起動に失敗しました:", err);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) audioContextRef.current.close();
    
    setIsRecording(false);
    setVolume(0);
    return maxVolume; // 最終的な「声のハリ（最大音量）」を返す
  }, [maxVolume]);

  return { isRecording, volume, startRecording, stopRecording };
}