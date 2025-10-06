import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartType, registerables, Plugin } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';
import { OlympicService } from '../../core/services/olympic.service';
import { Olympic } from '../../core/models/Olympic';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas', { static: false }) chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  public olympics: Olympic[] = [];
  public chart: Chart | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private olympicService: OlympicService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.olympicService.loadInitialData()
      .pipe(takeUntil(this.destroy$))
      .subscribe();
      
    this.olympicService.getOlympics()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.olympics = data;
          setTimeout(() => this.createChart(), 0);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart(): void {
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const chartData = this.prepareChartData();
    
    // Plugin personnalisé pour dessiner les lignes et les labels
    const customPlugin: Plugin = {
      id: 'customPlugin',
      afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        const data = chart.data;
        const meta = chart.getDatasetMeta(0);
        
        ctx.save();
        
        meta.data.forEach((element: any, index: number) => {
          const model = element;
          const midAngle = (model.startAngle + model.endAngle) / 2;
          
          // Calculer les positions
          const x = model.x + Math.cos(midAngle) * (model.outerRadius + 15);
          const y = model.y + Math.sin(midAngle) * (model.outerRadius + 15);
          
          const x2 = model.x + Math.cos(midAngle) * (model.outerRadius + 60);
          const y2 = model.y + Math.sin(midAngle) * (model.outerRadius + 60);
          
          // Dessiner la ligne
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          
          // Ajouter une ligne horizontale
          const isLeft = midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2;
          const xEnd = isLeft ? x2 - 50 : x2 + 50;
          ctx.lineTo(xEnd, y2);
          ctx.stroke();
          
          // Dessiner la pointe de flèche
          ctx.fillStyle = '#666';
          ctx.beginPath();
          const arrowSize = 8;
          if (isLeft) {
            ctx.moveTo(xEnd - arrowSize, y2);
            ctx.lineTo(xEnd, y2 - arrowSize/2);
            ctx.lineTo(xEnd, y2 + arrowSize/2);
          } else {
            ctx.moveTo(xEnd + arrowSize, y2);
            ctx.lineTo(xEnd, y2 - arrowSize/2);
            ctx.lineTo(xEnd, y2 + arrowSize/2);
          }
          ctx.closePath();
          ctx.fill();
          
          // Dessiner le texte
          ctx.fillStyle = '#333';
          ctx.font = 'bold 18px Arial';
          ctx.textAlign = isLeft ? 'right' : 'left';
          ctx.textBaseline = 'middle';
          const textX = isLeft ? xEnd - arrowSize - 10 : xEnd + arrowSize + 10;
          ctx.fillText(data.labels![index] as string, textX, y2);
        });
        
        ctx.restore();
      }
    };
    
    const config: ChartConfiguration = {
      type: 'pie' as ChartType,
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.data,
          backgroundColor: [
            '#956065',
            '#B8CDE0',
            '#89A1DB',
            '#793D52',
            '#9780A1'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: 200
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#04838F',
            titleFont: {
              size: 14
            },
            bodyFont: {
              size: 14
            },
            padding: 10,
            callbacks: {
              label: (context) => {
                return context.label + ': ' + context.parsed + ' médailles';
              }
            }
          }
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            const country = this.olympics[index];
            this.router.navigate(['/country', country.id]);
          }
        }
      },
      plugins: [customPlugin]
    };

    this.chart = new Chart(ctx, config);
  }

  private prepareChartData(): { labels: string[], data: number[] } {
    const labels: string[] = [];
    const data: number[] = [];
    
    this.olympics.forEach(country => {
      labels.push(country.country);
      const totalMedals = country.participations.reduce((sum, p) => sum + p.medalsCount, 0);
      data.push(totalMedals);
    });
    
    return { labels, data };
  }
}