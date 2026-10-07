import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateReadingRequest, MeasurementMoment, Reading } from './models';

@Injectable({ providedIn: 'root' })
export class ReadingService {
  private readonly http = inject(HttpClient);

  create(request: CreateReadingRequest): Observable<Reading> {
    return this.http.post<Reading>('/api/readings', request);
  }

  list(moment?: MeasurementMoment | null): Observable<Reading[]> {
    const params = moment ? new HttpParams().set('moment', moment) : undefined;
    return this.http.get<Reading[]>('/api/readings', { params });
  }

  get(id: string): Observable<Reading> {
    return this.http.get<Reading>(`/api/readings/${encodeURIComponent(id)}`);
  }
}
