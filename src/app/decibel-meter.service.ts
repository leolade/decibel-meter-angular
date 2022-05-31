import { Injectable } from '@angular/core';
import {filter, from, map, Observable, switchAll, switchMap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DecibelMeterService {

  constructor() {
  }

  getDecibels(interval: number = 10, options?: DecibelMeterOptions): Observable<number> {
    let decibelStored: number[] = []
    return this.startRecord(options)
      .pipe(
        filter((value: number) => {
          decibelStored.push(value);
          return decibelStored.length == interval;
        }),
        map((value) => {
          const averageDecibel = decibelStored.reduce((a, b) => a + b, 0) / decibelStored.length;
          decibelStored = [];
          return averageDecibel;
        })
      )
  }

  private startRecord(options?: DecibelMeterOptions): Observable<number> {
    return new Observable<number>(
      subscriber => {
        navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        })
          .then(function(stream) {
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const microphone = audioContext.createMediaStreamSource(stream);
            const scriptProcessor = audioContext.createScriptProcessor(2048, 1, 1);

            analyser.smoothingTimeConstant = 0.8;
            analyser.fftSize = 1024;

            microphone.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);
            scriptProcessor.onaudioprocess = function() {
              const array = new Uint8Array(analyser.frequencyBinCount);
              analyser.getByteFrequencyData(array);
              const arraySum = array.reduce((a, value) => a + value, 0);
              const average = (arraySum * (options?.sensibility || 1)) / array.length;
              subscriber.next(average);
              // colorPids(average);
            };
          })
          .catch(function(err) {
            /* handle the error */
            console.error(err);
          });
        }
    );
  }
}

export interface DecibelMeterOptions {
 sensibility?: number
}