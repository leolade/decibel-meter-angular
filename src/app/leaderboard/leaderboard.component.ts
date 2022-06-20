import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';
import { IDecibelMeterOptions } from '../options/options.component';

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeaderboardComponent implements OnInit {

  @Input() sortedRanking: [string, string][] = [];
  @Input() options?: IDecibelMeterOptions;
  @Output() deleteRank: EventEmitter<number> = new EventEmitter<number>();

  constructor() { }

  ngOnInit(): void {
  }

  onDeleteRank(i: number): void {
    this.deleteRank.emit(i);
  }
}
