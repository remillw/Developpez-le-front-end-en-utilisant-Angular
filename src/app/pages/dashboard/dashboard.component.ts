import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OlympicService } from '../../core/services/olympic.service';
import { Olympic } from '../../core/models/Olympic';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  public olympics: Olympic[] = [];
  public chartData: any[] = [];
  public totalJOs: number = 0;
  public totalCountries: number = 0;
  public colorScheme: any = {
    domain: ['#956065', '#B8CBE7', '#89A1DB', '#793D52', '#9780A1']
  };
  public isLoading: boolean = true;
  public errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private olympicService: OlympicService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.olympicService.loadInitialData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => {
          console.error('Error loading Olympic data:', error);
          this.errorMessage = 'Unable to load Olympic data. Please check your internet connection and try again.';
          this.isLoading = false;
        }
      });

    this.olympicService.getOlympics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data && data.length > 0) {
            this.olympics = data;
            this.prepareChartData();
            this.calculateStatistics();
            this.isLoading = false;
          } else {
            this.errorMessage = 'No Olympic data available.';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error fetching Olympic data:', error);
          this.errorMessage = 'An error occurred while loading the data. Please try again later.';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private prepareChartData(): void {
    this.chartData = this.olympics.map(country => {
      const totalMedals = country.participations.reduce((sum, p) => sum + p.medalsCount, 0);
      return {
        name: country.country,
        value: totalMedals,
        extra: { country }
      };
    });
  }

  onSelect(event: any): void {
    const country = event.extra.country;
    this.router.navigate(['/country', country.id]);
  }

  private calculateStatistics(): void {
    this.totalCountries = this.olympics.length;
    
    // Calculer le nombre total de JOs (années uniques)
    const allYears = new Set<number>();
    this.olympics.forEach(country => {
      country.participations.forEach(participation => {
        allYears.add(participation.year);
      });
    });
    this.totalJOs = allYears.size;
  }

  formatLabel = (label: string): string => {
    return label;
  }

  tooltipText = (data: any): string => {
    const name = data.data?.name || data.name;
    const value = data.data?.value || data.value;
    return `${name}\n🏅 ${value}`;
  }
}