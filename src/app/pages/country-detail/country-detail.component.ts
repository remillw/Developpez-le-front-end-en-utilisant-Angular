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

    // Charger les données d'abord si elles ne sont pas disponibles
    this.olympicService.loadInitialData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Ensuite récupérer le pays spécifique
          this.olympicService.getCountryById(Number(countryId))
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (country) => {
                this.country = country;
                this.prepareChartData();
                this.calculateStatistics();
                this.isLoading = false;
              },
              error: (err) => {
                this.errorMessage = err.message;
                this.isLoading = false;
              }
            });
        },
        error: () => {
          this.errorMessage = 'Unable to load Olympic data. Please check your internet connection and try again.';
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
