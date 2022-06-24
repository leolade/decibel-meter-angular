import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss']
})
export class OptionsComponent implements OnInit {

  optionsForm: FormGroup

  sensibiltyFC: FormControl = new FormControl(1);
  autoEndFC: FormControl = new FormControl(true);
  autoEndCountdownFC: FormControl = new FormControl(10);
  showRankFC: FormControl = new FormControl(true);
  debugFC: FormControl = new FormControl(false);
  teamNameDebugFC: FormControl = new FormControl("");
  teamScoreDebugFC: FormControl = new FormControl("");

  @Input() defaultOptions?: IDecibelMeterOptions;
  @Input() recording = false;
  @Input() hasFile = false;
  @Output() optionsChanged: EventEmitter<IDecibelMeterOptions> = new EventEmitter<IDecibelMeterOptions>();
  @Output() debugScoreTyped: EventEmitter<[string, string]> = new EventEmitter<[string, string]>();
  @Output() imageRemovedClick: EventEmitter<void> = new EventEmitter<void>();
  @Output() clearRankClick: EventEmitter<void> = new EventEmitter<void>();

  constructor() {
    this.optionsForm = new FormGroup(
      {
        sensibilty: this.sensibiltyFC,
        autoEnd: this.autoEndFC,
        autoEndCountdown: this.autoEndCountdownFC,
        showRank: this.showRankFC,
      }
    );
  }

  ngOnInit(): void {

    if (this.defaultOptions) {
      this.optionsForm.setValue(this.defaultOptions);
    }

    this.optionsForm.valueChanges
      .pipe(startWith(() => {
        return this.optionsForm.value;
      }))
      .subscribe(
        (options: IDecibelMeterOptions) => {
          this.optionsChanged.emit(options);
        }
      );
  }

  saveRankDebug(): void {
    if (this.teamNameDebugFC.value?.trim() && !isNaN(this.teamScoreDebugFC.value)) {
      this.debugScoreTyped.emit([this.teamNameDebugFC.value.trim(), this.teamScoreDebugFC.value])
      this.teamNameDebugFC.reset();
      this.teamScoreDebugFC.reset();
      this.debugFC.reset();
    }
  }

  onRemoveImageClickHandler(): void {
    this.imageRemovedClick.emit();
  }

  onClearRankClickHandler(): void {
    this.clearRankClick.emit();
  }
}

export interface IDecibelMeterOptions {
  sensibilty: number;
  autoEnd: boolean;
  autoEndCountdown: number;
  showRank: boolean;
}
