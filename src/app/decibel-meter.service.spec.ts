import { TestBed } from '@angular/core/testing';

import { DecibelMeterService } from './decibel-meter.service';

describe('DecibelMeterService', () => {
  let service: DecibelMeterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DecibelMeterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
