import {ChangeDetectorRef, Component} from '@angular/core';
import {DecibelMeterService} from "./decibel-meter.service";
import {Subscription} from "rxjs";
import {FormControl} from "@angular/forms";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'decibel-meter';
  decibel: number = 0;

  decibelsLevels: DecibelLevel[] = [
    {
      minDecibel: 60,
      maxDecibel: 1000,
      color: 'red'
    },
    {
      minDecibel: 50,
      maxDecibel: 60,
      color: 'red'
    },
    {
      minDecibel: 40,
      maxDecibel: 50,
      color: 'yellow'
    },
    {
      minDecibel: 30,
      maxDecibel: 40,
      color: 'yellow'
    },
    {
      minDecibel: 20,
      maxDecibel: 30,
      color: 'yellow'
    },
    {
      minDecibel: 10,
      maxDecibel: 20,
      color: 'green'
    },
    {
      minDecibel: 2,
      maxDecibel: 10,
      color: 'green'
    },
  ]
  recording: boolean = false;

  private maxRecordDecibel: number = 0;
  maxRecordDecibelSaved: string = '';
  private recordDecibelSubscription?: Subscription;
  sensibiltyFC: FormControl = new FormControl();

  constructor(
    private decibelMeterService: DecibelMeterService,
    private changeDectectorRef: ChangeDetectorRef,
  ) {
  }

  onStartRecording() {
    this.maxRecordDecibelSaved = '';
    this.recordDecibelSubscription = this.decibelMeterService.getDecibels(20, {sensibility: this.sensibiltyFC.value}).subscribe(
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
