import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { OlympicService } from '../../core/services/olympic.service';
import { Olympic } from '../../core/models/Olympic';
import { LineChartData } from '../../core/models/ChartData';

@Component({
  selector: 'app-country-detail',
  templateUrl: './country-detail.component.html',
  styleUrls: ['./country-detail.component.scss']
})
export class CountryDetailComponent implements OnInit, OnDestroy {
  public country: Olympic | null = null;
  public chartData: LineChartData[] = [];
  public numberOfEntries: number = 0;
  public totalMedals: number = 0;
  public totalAthletes: number = 0;
  public isLoading: boolean = true;
  public errorMessage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private olympicService: OlympicService
  ) {}

  ngOnInit(): void {
    const countryId = this.route.snapshot.paramMap.get('id');

    if (!countryId || isNaN(Number(countryId))) {
      this.errorMessage = 'Invalid country ID provided.';
      this.isLoading = false;
      return;
    }

    this.olympicService.getOlympics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (olympics) => {
          if (olympics && olympics.length > 0) {
            this.country = olympics.find(o => o.id === Number(countryId)) || null;

            if (this.country) {
              this.prepareChartData();
              this.calculateStatistics();
              this.isLoading = false;
            } else {
              this.errorMessage = 'Country not found.';
              this.isLoading = false;
            }
          } else {
            this.errorMessage = 'No Olympic data available.';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Error fetching country data:', error);
          this.errorMessage = 'An error occurred while loading the country data. Please try again later.';
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private prepareChartData(): void {
    if (!this.country) return;

    this.chartData = [{
      name: this.country.country,
      series: this.country.participations.map(p => ({
        name: p.year.toString(),
        value: p.medalsCount
      }))
    }];
  }

  private calculateStatistics(): void {
    if (!this.country) return;

    this.numberOfEntries = this.country.participations.length;
    this.totalMedals = this.country.participations.reduce((sum, p) => sum + p.medalsCount, 0);
    this.totalAthletes = this.country.participations.reduce((sum, p) => sum + p.athleteCount, 0);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
