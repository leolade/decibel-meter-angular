import { Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownComponent implements OnInit, OnChanges {

  @Input() maxCountdownValue?: number = 10;
  @Input() currentCountdownValue?: number = 0;

  value: number = this.calculateValue();
  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.value = this.calculateValue();
  }

  private calculateValue(): number {
    if(!this.currentCountdownValue || !this.maxCountdownValue) {
      return -1;
    }
    return (this.maxCountdownValue - this.currentCountdownValue) * 100 / this.maxCountdownValue
  }
}
