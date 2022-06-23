import {ChangeDetectorRef, Component, OnInit, ViewChild} from '@angular/core';
import {FormControl} from "@angular/forms";
import {MatDrawer} from '@angular/material/sidenav';
import {NgxDropzoneChangeEvent} from 'ngx-dropzone';
import {filter, interval, map, Observable, startWith, takeWhile, tap} from "rxjs";
import {DecibelMeterService} from "./decibel-meter.service";
import {IDecibelMeterOptions} from './options/options.component';
import {environment} from "../environments/environment";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private readonly DECIBEL_METER_RANK: string = 'DECIBEL_METER_RANK';

  @ViewChild('drawer', {read: MatDrawer})
  drawer?: MatDrawer;

  title = 'decibel-meter';
  decibelMeasure: number = 0;
  recording: boolean = false;
  alreadySavedMeasure: boolean = false;
  maxMeasureSaved: string = '';
  averageMeasureSaved: string = '';

  options: IDecibelMeterOptions = {
    autoEndCountdown: 10,
    autoEnd: true,
    showRank: true,
    sensibilty: 1,
  };

  remainingSeconds: number | undefined;
  teamNameFC: FormControl = new FormControl("");

  ranking: [string, string][] = this.loadRankLocalStorage();
  sortedRanking: [string, string][] = this.sortRank(this.ranking);
  file?: File;
  drawerState?: 'OPTIONS' | 'LEADERBOARD' | 'APPLAUSE_METER';
  drawerPosition: 'start' | 'end' = 'start';

  private currentRecordMeasures: number[] = [];
  private currentRecordMaxMeasure: number = 0;
  private timeoutId?: number = undefined;
  private drawerOpenBeforeRecord?: ['OPTIONS' | 'LEADERBOARD' | 'APPLAUSE_METER', 'start' | 'end'];
  image?: HTMLImageElement;
  teamNameOptions: string[] = environment.teamNamesAutocomplete;
  teamNameFilteredOptions?: Observable<string[]>;
  subtitle: string = environment.subtitle;

  constructor(
    private decibelMeterService: DecibelMeterService,
    private changeDectectorRef: ChangeDetectorRef,
  ) {


    // Record decibels everytime, to show user mic is working, but we save values only while whe are recording.
    this.decibelMeterService.getDecibels()
      .pipe(
        map((decibel: number) => decibel * (this.options?.sensibilty || 1)),
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

  ngOnInit(): void {
    this.teamNameFilteredOptions = this.teamNameFC.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }

  /**
   * Handle actions at user "Start record" interaction
   */
  onStartRecording() {
    // Save the state (open or not) of the options panel, to restore at the end of record
    this.drawerOpenBeforeRecord = this.drawer?.opened && this.drawerState ? [this.drawerState, this.drawerPosition] : undefined;
    // Close options to get max height of the chart
    this.drawer?.close();

    this.openApplauseMeterObservable().subscribe(
      () => {
        // If we use automatic ending, handle the countdown
        if (this.useAutoEnding()) {
          this.remainingSeconds = this.options?.autoEndCountdown;

          // End record at the end of the countdown
          this.timeoutId = setTimeout(() => {
            // Only if still recording (user can stop record with button before countdown finish)
            if (this.recording) {
              this.endRecord();
            }
          }, (this.options?.autoEndCountdown || 1) * 1000);

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
    )
  }

  /**
   * Handle actions at user "End Record" interaction
   */
  onEndRecording() {
    this.endRecord();
  }

  saveRank(maxMeasureSaved: string, averageMeasureSaved: string) {
    if (this.teamNameFC.value?.trim()) {
      const teamName: string = this.teamNameFC.value.trim();
      this.ranking.push([teamName, `${averageMeasureSaved}`]);
      this.sortedRanking = this.sortRank(this.ranking);
      this.teamNameFC.reset();
    }
    this.saveRankLocalStorage();
  }

  deleteRank(index: number): void {
    this.ranking.splice(index, 1);
    this.sortedRanking = this.sortRank(this.ranking);
    this.saveRankLocalStorage();
  }

  sortRank(ranking: [string, string][]): [string, string][] {
    return [...ranking].sort(
      ([rank1TeamName, rank1Scores]: [string, string], rank2: [string, string]) => {
        const rank1Average = parseFloat(rank1Scores);
        const rank2Average = parseFloat(rank2[1]);
        return rank1Average < rank2Average ? 1 : (rank1Average > rank2Average ? -1 : 0);
      }
    )
  }

  saveRankDebug([debugScoreTeamName, debugScore]: [string, string]): void {
    if (debugScoreTeamName?.trim() && !isNaN(parseFloat(debugScore))) {
      const teamName: string = debugScoreTeamName.trim();
      this.ranking.push([teamName, `${debugScore}`]);
      this.sortedRanking = this.sortRank(this.ranking);
    }
    this.saveRankLocalStorage();
  }

  setFile(dropzoneChangeEvent: NgxDropzoneChangeEvent): void {
    if (dropzoneChangeEvent.addedFiles.length > 0) {
      this.file = dropzoneChangeEvent.addedFiles[0];
      this.image = new Image();
      if (FileReader) {
        var fr = new FileReader();
        fr.onload = () => {
          if (this.image && typeof fr.result === 'string') {
            this.image.src = fr.result;
          }
        }
        fr.readAsDataURL(this.file);
      }
    }
  }

  get imageHigher(): boolean {
    return this.image
      ? (this.image.naturalWidth/this.image.naturalHeight) <= (16/9)
      : false
  }

  onRemoveFile() {
    this.file = undefined;
    this.image = undefined;
  }

  onOptionChanged(options: IDecibelMeterOptions): void {
    this.options = options;
  }

  openSettings(): void {
    this.openDrawer('OPTIONS', 'start', true).subscribe()
  }

  openApplauseMeter(): void {
    this.openDrawer('APPLAUSE_METER', 'end', true).subscribe()
  }

  openLeaderboard(): void {
    this.openDrawer('LEADERBOARD', 'end', true).subscribe()
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

    this.saveRank(this.maxMeasureSaved, this.averageMeasureSaved);

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
    if (this.drawerOpenBeforeRecord && this.drawerOpenBeforeRecord[0]) {
      this.openDrawer(this.drawerOpenBeforeRecord[0], this.drawerOpenBeforeRecord[1])
    }
  }

  /**
   * Is the user parameter auto ending
   * @return true if the user check auto end and set truthy value of seconds, false otherwise
   * @private
   */
  private useAutoEnding(): boolean {
    return !!this.options?.autoEnd && !!this.options?.autoEndCountdown;
  }

  private openDrawer(drawerState: 'OPTIONS' | 'LEADERBOARD' | 'APPLAUSE_METER', drawerPosition: 'start' | 'end', toggle: boolean = false): Observable<boolean> {
    return new Observable<boolean>(subscriber => {
      if (!this.drawer) {
        subscriber.next(false);
        subscriber.complete();
      } else {
        if (drawerState === this.drawerState && toggle) {
          this.drawerState = undefined;
            this.drawer?.close().then(
              () => {
                subscriber.next(true);
                subscriber.next(true);
              }
            );
        } else if (!this.drawer?.opened) {
            this.drawerPosition = drawerPosition;
            this.drawerState = drawerState;
            this.changeDectectorRef.detectChanges();
              this.drawer?.open().then(
                () => {
                  subscriber.next(true);
                }
              );
          } else {
          this.drawer.close().then(
            () => {
              this.drawerState = drawerState;
              this.drawerPosition = drawerPosition;
              this.changeDectectorRef.detectChanges();
              if (this.drawer) {
                this.drawer?.open().then(
                  () => {
                    subscriber.next(true);
                  }
                );
              } else {
                subscriber.next(false);
              }
            }
          )
        }
      }
    });
  }

  private openApplauseMeterObservable(): Observable<boolean> {
    return this.openDrawer('APPLAUSE_METER', 'end');
  }

  onImageRemovedClick(): void {
    this.file = undefined;
    this.image = undefined;
  }

  private saveRankLocalStorage(): void {
    localStorage.setItem(this.DECIBEL_METER_RANK, JSON.stringify(this.ranking));
  }

  private loadRankLocalStorage(): [string, string][] {
    const jsonDecibelRank: string | null = localStorage.getItem(this.DECIBEL_METER_RANK);
    if (!jsonDecibelRank) {
      return [];
    }
    return JSON.parse(jsonDecibelRank);
  }

  onClearRankClick() {
    this.ranking = [];
    this.sortedRanking = this.sortRank(this.ranking);
    this.saveRankLocalStorage();
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.teamNameOptions.filter(option => option.toLowerCase().includes(filterValue));
  }
}

export interface DecibelLevel {
  minDecibel: number;
  maxDecibel: number;
  color: string
}
