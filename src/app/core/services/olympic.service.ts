import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Olympic } from '../models/Olympic';

@Injectable({
  providedIn: 'root',
})
export class OlympicService {
  private olympicUrl = './assets/mock/olympic.json';
  private olympics$ = new BehaviorSubject<Olympic[] | null>(null);

  constructor(private http: HttpClient) {}

  loadInitialData(): Observable<Olympic[]> {
    return this.http.get<Olympic[]>(this.olympicUrl).pipe(
      tap((value) => this.olympics$.next(value)),
      catchError((error) => {
        this.olympics$.next(null);
        return throwError(() => new Error('Failed to load Olympic data'));
      })
    );
  }

  getOlympics(): Observable<Olympic[] | null> {
    return this.olympics$.asObservable();
  }

  getCountryById(id: number): Observable<Olympic> {
    return this.olympics$.asObservable().pipe(
      map((olympics) => {
        if (!olympics || olympics.length === 0) {
          throw new Error('Olympic data not available');
        }
        const country = olympics.find((c) => c.id === id);
        if (!country) {
          throw new Error(`Country with id ${id} not found`);
        }
        return country;
      })
    );
  }
}
