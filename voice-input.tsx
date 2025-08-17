import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSpeech } from "@/hooks/use-speech";
import { Mic, MicOff, X, Check } from "lucide-react";

interface VoiceInputProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
}

export default function VoiceInput({ isOpen, onClose, onConfirm }: VoiceInputProps) {
  const { isListening, result, error, startListening, stopListening, reset } = useSpeech();

  const handleStart = () => {
    reset();
    startListening();
  };

  const handleConfirm = () => {
    if (result?.text) {
      onConfirm(result.text);
      reset();
      onClose();
    }
  };

  const handleCancel = () => {
    stopListening();
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto rounded-3xl p-8">
        <div className="text-center">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isListening ? 'bg-secondary animate-pulse-gentle' : 'bg-primary'
          }`}>
            {isListening ? (
              <Mic className="text-white text-3xl" />
            ) : (
              <MicOff className="text-white text-3xl" />
            )}
          </div>

          <h3 className="text-xl font-semibold text-neutral-800 mb-2">
            {isListening ? 'Listening...' : 'Voice Input'}
          </h3>

          <p className="text-neutral-500 mb-6">
            {isListening 
              ? 'Say something like "Spent 200 rupees on lunch"'
              : 'Tap the microphone to start voice input'
            }
          </p>

          {/* Voice input result */}
          <div className="bg-neutral-50 rounded-2xl p-4 mb-6 min-h-[60px] flex items-center justify-center">
            {error ? (
              <p className="text-red-600 text-sm">{error}</p>
            ) : result?.text ? (
              <p className="text-neutral-800 italic">"{result.text}"</p>
            ) : isListening ? (
              <p className="text-neutral-600 italic">Listening for speech...</p>
            ) : (
              <p className="text-neutral-400 italic">Tap microphone to start</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>

            {!result?.text ? (
              <Button 
                className="flex-1" 
                onClick={isListening ? stopListening : handleStart}
                disabled={!!error}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Start
                  </>
                )}
              </Button>
            ) : (
              <Button 
                className="flex-1" 
                onClick={handleConfirm}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirm
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
