import {ChangeDetectorRef, Component, ViewChild} from '@angular/core';
import {FormControl} from "@angular/forms";
import {MatExpansionPanel} from '@angular/material/expansion';
import {filter, interval, map, takeWhile, tap} from "rxjs";
import {DecibelMeterService} from "./decibel-meter.service";

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
  autoEndFC: FormControl = new FormControl(true);
  autoEndCountdownFC: FormControl = new FormControl(10);

  private currentRecordMeasures: number[] = [];
  private currentRecordMaxMeasure: number = 0;
  private timeoutId?: number = undefined;

  constructor(
    private decibelMeterService: DecibelMeterService,
    private changeDectectorRef: ChangeDetectorRef,
  ) {

    // Fill the levels using constants.
    for (let i = 0; i < this.NB_DECIBEL_LEVELS; i++) {
      this.decibelsLevels.push(
        {
          color: i < (this.NB_DECIBEL_LEVELS / 3) ? 'green' : (i < (this.NB_DECIBEL_LEVELS / 3 * 2) ? 'yellow' : 'red'),
          minDecibel: i * (this.NB_MAX_DECIBELS / this.NB_DECIBEL_LEVELS),
          maxDecibel: (i === this.NB_MAX_DECIBELS) ? Infinity : ((i + 1) * (this.NB_MAX_DECIBELS / this.NB_DECIBEL_LEVELS)),
        }
      );
    }
    // Reverse list to have lowest values at the bottom of chart
    this.decibelsLevels = this.decibelsLevels.slice().reverse();


    // Record decibels everytime, to show user mic is working, but we save values only while whe are recording.
    this.decibelMeterService.getDecibels()
      .pipe(
        map((decibel: number) => decibel * (this.sensibiltyFC.value || 1)),
        tap((decibel: number) => {
          this.decibelMeasure = decibel;
          this.changeDectectorRef.detectChanges();
        }),
        filter(() => this.recording)
      )
      .subscribe(
        (decibel: number) => {
          // Push all values in temporary array to make average after.
          this.currentRecordMeasures.push(decibel);
          // If the value is higher than the previous higher, replace it.
          if (this.currentRecordMaxMeasure < decibel) {
            this.currentRecordMaxMeasure = decibel;
          }
        }
      );
  }

  /**
   * Handle actions at user "Start record" interaction
   */
  onStartRecording() {
    // Save the state (open or not) of the options panel, to restore at the end of record
    this.optionsOpenBeforeRecord = !!this.optionsPanel?.expanded;
    // Close options to get max height of the chart
    this.optionsPanel?.close();

    // If we use automatic ending, handle the countdown
    if (this.useAutoEnding()) {
      this.remainingSeconds = this.autoEndCountdownFC.value;

      // End record at the end of the countdown
      this.timeoutId = setTimeout(() => {
        // Only if still recording (user can stop record with button before countdown finish)
        if (this.recording) {
          this.endRecord();
        }
      }, this.autoEndCountdownFC.value * 1000);

      // Remove 1 second every second.
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

    // Reset max measure and average measure
    this.maxMeasureSaved = '';
    this.averageMeasureSaved = '';

    // Set recording state
    this.recording = true;
  }

  /**
   * Handle actions at user "End Record" interaction
   */
  onEndRecording() {
    this.endRecord();
  }

  /**
   * End Record of measure to be saved.
   * Microphone is still open after this method because we want decibel on chart even if not recording them.
   * @private
   */
  private endRecord(): void {

    /*
    Save best and average measure
    todo: refactor using "number" pipe in template (currently not working due IntelliJ don't support Angular 13)
     */
    this.maxMeasureSaved = this.currentRecordMaxMeasure.toFixed(2);
    this.averageMeasureSaved = (this.currentRecordMeasures.reduce((a, b) => a + b, 0) / this.currentRecordMeasures.length).toFixed(2);

    // The first time we navigate here, we set indicator at 'true'
    if (!this.alreadySavedMeasure) {
      this.alreadySavedMeasure = true;
    }

    // Reset values used for each record
    this.recording = false;
    this.currentRecordMeasures = [];
    this.currentRecordMaxMeasure = 0;
    this.decibelMeasure = 0;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.remainingSeconds = undefined;

    // Open options if there was opened before record
    if (this.optionsOpenBeforeRecord) {
      this.optionsPanel?.open();
    }
  }

  /**
   * Is the user parameter auto ending
   * @return true if the user check auto end and set truthy value of seconds, false otherwise
   * @private
   */
  private useAutoEnding(): boolean {
    return this.autoEndFC.value && this.autoEndCountdownFC.value;
  }
}

export interface DecibelLevel {
  minDecibel: number;
  maxDecibel: number;
  color: string
}
