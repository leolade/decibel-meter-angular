import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from "@angular/material/slider";
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgxDropzoneModule } from 'ngx-dropzone';

import { AppComponent } from './app.component';
import {MatListModule} from "@angular/material/list";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatIconModule} from "@angular/material/icon";
import {MatInputModule} from "@angular/material/input";
import { OptionsComponent } from './options/options.component';
import { ApplauseMeterComponent } from './applause-meter/applause-meter.component';
import { LeaderboardComponent } from './leaderboard/leaderboard.component';
import { CountdownComponent } from './countdown/countdown.component';
import {MatAutocompleteModule} from "@angular/material/autocomplete";

@NgModule({
  declarations: [
    AppComponent,
    OptionsComponent,
    ApplauseMeterComponent,
    LeaderboardComponent,
    CountdownComponent
  ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        MatButtonModule,
        MatSliderModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatExpansionModule,
        MatCheckboxModule,
        MatListModule,
        MatSlideToggleModule,
        MatIconModule,
        MatInputModule,
        NgxDropzoneModule,
        MatSidenavModule,
        MatProgressSpinnerModule,
        MatAutocompleteModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
