import { Injectable } from '@angular/core';
import { filter, from, map, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DecibelMeterService {

  private scriptProcessor?: ScriptProcessorNode;
  private mediaStream?: MediaStream;

  constructor() {
  }

  getDecibels(interval?: number): Observable<number> {
    if (this.scriptProcessor) {
      this.endRecord();
    }
    let decibelStored: number[] = []
    return this.startRecord()
      .pipe(
        filter((value: number) => {
          if (!interval || interval === 1) {
            return true;
          }
          decibelStored.push(value);
          return decibelStored.length == interval;
        }),
        map((value: number) => {
          if (!interval || interval === 1) {
            return value;
          }
          const averageDecibel = decibelStored.reduce((a, b) => a + b, 0) / decibelStored.length;
          decibelStored = [];
          return averageDecibel;
        })
      )
  }

  private startRecord(): Observable<number> {
    return new Observable<number>(
      subscriber => {
        from(navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        })).subscribe({
          next: (stream: MediaStream) => {
            this.mediaStream = stream;
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(this.scriptProcessor);
            this.scriptProcessor.connect(audioContext.destination);
            this.scriptProcessor.onaudioprocess = function () {
              const array = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(array);
              const arraySum = array.reduce((a, value) => a + value, 0);
              const average = arraySum / array.length;
              subscriber.next(average);
              // colorPids(average);
            };
          },
          error: () => {
            const errorMessage = `Impossible d'accéder au microphone.`;
            console.log(errorMessage);
            subscriber.error(errorMessage);
          }
        });
      });
  }

  endRecord(): void {
    this.scriptProcessor?.disconnect();
    this.mediaStream?.getTracks().forEach(function(track: MediaStreamTrack) { track.stop(); })
    this.scriptProcessor = undefined;
  }
}
