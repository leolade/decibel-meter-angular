import { Component, OnInit, ChangeDetectionStrategy, Input } from '@angular/core';
import { DecibelLevel } from '../app.component';
import { IDecibelMeterOptions } from '../options/options.component';

@Component({
  selector: 'app-applause-meter',
  templateUrl: './applause-meter.component.html',
  styleUrls: ['./applause-meter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ApplauseMeterComponent implements OnInit {

  NB_DECIBEL_LEVELS: number = 20;
  NB_MAX_DECIBELS: number = 120;

  decibelsLevels: DecibelLevel[] = []
  @Input() options?: IDecibelMeterOptions;
  @Input() decibelMeasure: number = 0;
  @Input() recording: boolean = false;
  @Input() remainingSeconds?: number;

  constructor() {
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
  }

  ngOnInit(): void {
  }

}
