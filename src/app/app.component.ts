import {ChangeDetectorRef, Component} from '@angular/core';
import {DecibelMeterService} from "./decibel-meter.service";
import { map, Subscription } from "rxjs";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'decibel-meter';
  decibel: number = 0;

  decibelsLevels: DecibelLevel[] = []
  NB_DECIBEL_LEVELS: number = 20;
  NB_MAX_DECIBELS: number = 120;
  recording: boolean = false;

  private maxRecordDecibel: number = 0;
  maxRecordDecibelSaved: string = '';
  private recordDecibelSubscription?: Subscription;
  sensibiltyFC: FormControl = new FormControl(1);

  constructor(
    private decibelMeterService: DecibelMeterService,
    private changeDectectorRef: ChangeDetectorRef,
  ) {
    for(let i = 0; i < this.NB_DECIBEL_LEVELS; i++) {
      this.decibelsLevels.push(
        {
          color: i < (this.NB_DECIBEL_LEVELS/3) ? 'green' : (i < (this.NB_DECIBEL_LEVELS/3*2) ? 'yellow' : 'red'),
          minDecibel: i * (this.NB_MAX_DECIBELS / this.NB_DECIBEL_LEVELS),
          maxDecibel: (i === this.NB_MAX_DECIBELS) ? Infinity : ((i+1) * (this.NB_MAX_DECIBELS / this.NB_DECIBEL_LEVELS)),
        }
      );
    }
    this.decibelsLevels = this.decibelsLevels.slice().reverse();
  }

  onStartRecording() {
    this.maxRecordDecibelSaved = '';
    this.recordDecibelSubscription = this.decibelMeterService.getDecibels()
      .pipe(
        map((decibel: number) => decibel * (this.sensibiltyFC.value || 1))
      )
      .subscribe(
      (decibel: number) => {
        this.decibel = decibel;
        if (this.maxRecordDecibel < decibel) {
          this.maxRecordDecibel = decibel;
        }
        this.changeDectectorRef.detectChanges();
      }
    );
    this.recording = true;
  }

  onEndRecording() {
    this.recordDecibelSubscription?.unsubscribe()
    this.recording = false;
    this.maxRecordDecibelSaved = this.maxRecordDecibel.toFixed(2);
    this.maxRecordDecibel = 0;
    this.decibel = 0;
  }
}

export interface DecibelLevel {
  minDecibel: number;
  maxDecibel: number;
  color: string
}
