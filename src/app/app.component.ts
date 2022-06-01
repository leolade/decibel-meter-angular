import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormControl } from "@angular/forms";
import { MatExpansionPanel } from '@angular/material/expansion';
import { interval, map, Subscription, takeWhile } from "rxjs";
import { DecibelMeterService } from "./decibel-meter.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  @ViewChild('optionsPanel', {read: MatExpansionPanel})
  optionsPanel?: MatExpansionPanel;
  optionsOpenBeforeRecord: boolean = true;

  title = 'decibel-meter';
  decibelMeasure: number = 0;

  decibelsLevels: DecibelLevel[] = []
  NB_DECIBEL_LEVELS: number = 20;
  NB_MAX_DECIBELS: number = 120;
  recording: boolean = false;
  alreadySavedMeasure: boolean = false;
  maxMeasureSaved: string = '';
  averageMeasureSaved: string = '';

  remainingSeconds: number | undefined;

  sensibiltyFC: FormControl = new FormControl(1);
  finAutoFC: FormControl = new FormControl(true);
  finAutoSecondesFC: FormControl = new FormControl(10);

  private currentRecordMeasures: number[] = [];
  private currentRecordMaxMeasure: number = 0;

  private recordSubscription?: Subscription;
  private timeoutId?: number = undefined;

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
    this.optionsOpenBeforeRecord = !!this.optionsPanel?.expanded;
    this.optionsPanel?.close();

    if (this.finAutoFC.value && this.finAutoSecondesFC.value) {
      this.remainingSeconds = this.finAutoSecondesFC.value;
      this.timeoutId = setTimeout(() => {
        if (this.recording) {
          this.endRecord();
        }
      },  this.finAutoSecondesFC.value * 1000);
      interval(1000)
        .pipe(takeWhile(() => this.timeoutId !== undefined && this.remainingSeconds !== undefined && this.remainingSeconds >= 0))
        .subscribe(
          () => {
            if (!!this.remainingSeconds) {
              this.remainingSeconds -= 1;
            }
          }
        )
    }

    this.maxMeasureSaved = '';
    this.recordSubscription = this.decibelMeterService.getDecibels()
      .pipe(
        map((decibel: number) => decibel * (this.sensibiltyFC.value || 1))
      )
      .subscribe(
      (decibel: number) => {
        this.decibelMeasure = decibel;
        this.currentRecordMeasures.push(decibel);
        if (this.currentRecordMaxMeasure < decibel) {
          this.currentRecordMaxMeasure = decibel;
        }
        this.changeDectectorRef.detectChanges();
      }
    );
    this.recording = true;
  }

  onEndRecording() {
    this.endRecord();
  }

  private endRecord(): void {
    this.maxMeasureSaved = this.currentRecordMaxMeasure.toFixed(2);
    this.averageMeasureSaved = (this.currentRecordMeasures.reduce((a, b) => a + b, 0) / this.currentRecordMeasures.length).toFixed(2);

    if (!this.alreadySavedMeasure) {
        this.alreadySavedMeasure = true;
    }

    // Reset values used for each record
    this.decibelMeterService.endRecord();
    this.recordSubscription?.unsubscribe()
    this.recording = false;
    this.currentRecordMeasures = [];
    this.currentRecordMaxMeasure = 0;
    this.decibelMeasure = 0;
    if(this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.remainingSeconds = undefined;

    if (this.optionsOpenBeforeRecord) {
      this.optionsPanel?.open();
    }
  }
}

export interface DecibelLevel {
  minDecibel: number;
  maxDecibel: number;
  color: string
}
