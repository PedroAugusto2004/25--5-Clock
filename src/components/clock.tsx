"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PlayIcon, PauseIcon, RotateCcwIcon, PlusIcon, MinusIcon } from "lucide-react";

const DEFAULT_BREAK_LENGTH = 5;
const DEFAULT_SESSION_LENGTH = 25;
const MIN_LENGTH = 1;
const MAX_LENGTH = 60;

export default function Clock() {
  const [breakLength, setBreakLength] = useState(DEFAULT_BREAK_LENGTH);
  const [sessionLength, setSessionLength] = useState(DEFAULT_SESSION_LENGTH);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SESSION_LENGTH * 60);
  const [timerLabel, setTimerLabel] = useState<'Session' | 'Break'>('Session');
  const [isRunning, setIsRunning] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(error => console.error("Error playing sound:", error));
    }
  }, []);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handleReset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setBreakLength(DEFAULT_BREAK_LENGTH);
    setSessionLength(DEFAULT_SESSION_LENGTH);
    setTimeLeft(DEFAULT_SESSION_LENGTH * 60);
    setTimerLabel('Session');
    stopSound();
  }, [stopSound]);

  const decrementTimeLeft = () => {
    setTimeLeft(prevTime => prevTime - 1);
  };

  useEffect(() => {
    if (isRunning) {
      if (timeLeft === 0) {
        playSound();
        if (timerLabel === 'Session') {
          setTimerLabel('Break');
          setTimeLeft(breakLength * 60);
        } else {
          setTimerLabel('Session');
          setTimeLeft(sessionLength * 60);
        }
      } else {
        intervalRef.current = setInterval(decrementTimeLeft, 1000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, timerLabel, breakLength, sessionLength, playSound]);

  const handleStartStop = () => {
    setIsRunning(prev => !prev);
  };

  const changeLength = (type: 'break' | 'session', delta: number) => {
    if (isRunning) return;

    if (type === 'break') {
      setBreakLength(prev => {
        const newLength = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, prev + delta));
        if (timerLabel === 'Break') {
          setTimeLeft(newLength * 60);
        }
        return newLength;
      });
    } else {
      setSessionLength(prev => {
        const newLength = Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, prev + delta));
        if (timerLabel === 'Session') {
          setTimeLeft(newLength * 60);
        }
        return newLength;
      });
    }
  };
  
  useEffect(() => {
    if (!isRunning) {
      if (timerLabel === 'Session') {
        setTimeLeft(sessionLength * 60);
      } else {
        setTimeLeft(breakLength * 60);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when lengths change if not running
  }, [sessionLength, breakLength, isRunning]); // Removed timerLabel to prevent loop during switch

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <Card className="w-full max-w-lg mx-auto shadow-2xl rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-4xl text-center font-headline text-primary-foreground bg-primary py-3 rounded-t-xl -mx-6 -mt-6 px-6">
            FocusFriend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-around items-center space-y-6 sm:space-y-0 sm:space-x-4">
            <div className="text-center">
              <Label id="break-label" className="text-xl font-headline block mb-2">Break Length</Label>
              <div className="flex items-center justify-center gap-3">
                <Button id="break-decrement" onClick={() => changeLength('break', -1)} variant="secondary" size="icon" aria-label="Decrement break length">
                  <MinusIcon className="w-6 h-6" />
                </Button>
                <span id="break-length" className="text-3xl font-bold font-body w-12 text-center">{breakLength}</span>
                <Button id="break-increment" onClick={() => changeLength('break', 1)} variant="secondary" size="icon" aria-label="Increment break length">
                  <PlusIcon className="w-6 h-6" />
                </Button>
              </div>
            </div>
            <div className="text-center">
              <Label id="session-label" className="text-xl font-headline block mb-2">Session Length</Label>
              <div className="flex items-center justify-center gap-3">
                <Button id="session-decrement" onClick={() => changeLength('session', -1)} variant="secondary" size="icon" aria-label="Decrement session length">
                  <MinusIcon className="w-6 h-6" />
                </Button>
                <span id="session-length" className="text-3xl font-bold font-body w-12 text-center">{sessionLength}</span>
                <Button id="session-increment" onClick={() => changeLength('session', 1)} variant="secondary" size="icon" aria-label="Increment session length">
                  <PlusIcon className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center space-y-3 p-6 border-2 border-dashed border-secondary rounded-lg bg-card">
            <Label id="timer-label" className="text-3xl font-headline block">{timerLabel}</Label>
            <div className={`inline-block p-2 rounded-lg ${isRunning ? 'timer-pulsating-wrapper' : ''}`}>
              <div id="time-left" className="text-7xl font-extrabold font-body text-primary-foreground tabular-nums">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button id="start_stop" onClick={handleStartStop} size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-md shadow-md hover:shadow-lg transition-shadow">
              {isRunning ? <PauseIcon className="mr-2 w-6 h-6" /> : <PlayIcon className="mr-2 w-6 h-6" />}
              {isRunning ? 'Pause' : 'Start'}
            </Button>
            <Button id="reset" onClick={handleReset} variant="destructive" size="lg" className="w-full sm:w-auto px-8 py-6 text-lg rounded-md shadow-md hover:shadow-lg transition-shadow">
              <RotateCcwIcon className="mr-2 w-6 h-6" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>
      <audio id="beep" ref={audioRef} src="https://raw.githubusercontent.com/freeCodeCamp/cdn/master/build/testable-projects-fcc/audio/BeepSound.wav" preload="auto" />
    </div>
  );
}
